import { useRef, useEffect, useState, ChangeEvent } from "react";
import Piece from "./Piece";
import {
  PieceType,
  SwitchPlayer,
  RenderPiece,
  MakeMove,
  MakeAlgebraicMove,
  CapturePiece,
  Message,
  PlayerColor,
} from "./types";
import Margin from "./Margin";
import InitializeChessboard from "./utils/InitializeChessboard";
// import gameData from "./test_games/Kasparov_Topalov_1999.json";
import gameData from "./test_games/Byrne_Fischer_1956.json";
import { isCheck } from "./utils/endangermentChecks";
import { isSamePosition, validateMove } from "./utils/validityChecks";
import { fromAlgebraic } from "./utils/algebraicTranslations";
import { Layout, Input, Button, List, Avatar, Card, Row, Col } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { toFEN } from "./utils/fenTranslations";
import Sider from "antd/es/layout/Sider";
const { Content } = Layout;
const { TextArea } = Input;

const systemPrompt = JSON.stringify({
  objective:
    "We are going to play a game of chess using algebraic notation.\
    I'll be sending moves in input_example form. You should reply according to outpt_example.\
    I will play as white and you will play as black. Your Black King is positioned on e8.\
    Please announce your moves in standard algebraic notation and remember that each move must be valid.\
    To any move that's not valid chess algebraic notation move you should reply with 'Invalid move!'.\
    Let's begin!",
  input_example: {
    move: "e4",
    FEN: "RNBQKBNR/PPPP1PPP/8/4P3/8/8/pppppppp/rnbqkbnr w KQkq - 0 1",
  },
  output_example: {
    move: "e6",
  },
});

const dev_env = process.env.NODE_ENV === "development";

const Chessboard = () => {
  const [botPlayerColor] = useState(PlayerColor.b);
  const [pieces, updatePieces] = useState<PieceType[]>(
    InitializeChessboard(botPlayerColor)
  );
  const [input, setInput] = useState("");
  const [loader, setLoader] = useState(false);

  const [fenPositions, setFenPositions] = useState<string>(
    "RNBQKBNR/PPPPPPPP/8/8/8/8/pppppppp/rnbqkbnr"
  );
  const [currentPlayer, setCurrentPlayer] = useState<PlayerColor>(
    PlayerColor.w
  );
  const [fenCastlings, setFenCastlings] = useState<string>("KQkq");
  const [enPassantTarget, setEnPassantTarget] = useState<string>("-");
  const [halfmoveClock, setHalfmoveClock] = useState<number>(0);
  const [fullmoveClock, setFullmoveClock] = useState<number>(1);

  const [promptMessages, setPromptMessages] = useState([
    {
      role: "system",
      content: systemPrompt,
    },
  ]);
  const chessBoard = Array.from({ length: 8 }, (_, rank) =>
    Array.from({ length: 8 }, (_, file) => ({
      rank: rank,
      file: file,
    }))
  );

  const makeBotMove = async () => {
    dev_env && console.log("MAKING BOT MOVE");
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append(
      "Authorization",
      window.localStorage.getItem("REACT_APP_CLIENT_KEY") ||
        process.env.REACT_APP_CLIENT_KEY ||
        ""
    );

    const raw = JSON.stringify({
      promptMessages: promptMessages,
    });

    const requestOptions: any = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };
    fetch(process.env.REACT_APP_API_URL || "", requestOptions)
      .then((response) => response.json()) // Parse the JSON from the response
      .then((botMessage) => {
        dev_env &&
          console.log("Making bot move: ", JSON.parse(botMessage.content).move);
        makeAlgebraicMove(JSON.parse(botMessage.content).move);
        setLoader(false);
      })
      .catch((err) => dev_env && console.log(err));
  };

  useEffect(() => {
    if (currentPlayer === "b") {
      setInput("");
      setLoader(true);
      makeBotMove();
    }
  }, [currentPlayer]);

  // Handle the change event for the input field
  const handleChange = (event: any) => {
    setInput(event.target.value);
  };

  // Game initialization
  const switchPlayer: SwitchPlayer = () => {
    currentPlayer === "w"
      ? setCurrentPlayer(PlayerColor.b)
      : setCurrentPlayer(PlayerColor.w);
  };

  const renderPiece: RenderPiece = (position) => {
    let piece = pieces.find(
      (piece) =>
        piece.position[0] === position[0] && piece.position[1] === position[1]
    );
    if (piece) return <Piece {...piece!} />;
    else return <></>;
  };

  const makeMove: MakeMove = (move) => {
    // let piece: PieceType, newPosition: Position;
    const { piece, newPosition } = move;

    const movedPiece = pieces.find((prevPiece) => prevPiece.id === piece.id);
    if (!movedPiece) return;

    const capturedPiece = pieces.find(
      (piece) =>
        isSamePosition(piece.position, newPosition) &&
        movedPiece.color !== piece.color
    );

    const castlingRook = pieces.find(
      (piece) =>
        piece.type === "rook" &&
        piece.hasMoved === false &&
        isSamePosition(piece.position, newPosition) &&
        movedPiece.color === piece.color
    );

    if (capturedPiece) {
      capturePiece(capturedPiece);
    }
    if (castlingRook) {
      if (piece.position[0] > castlingRook.position[0]) {
        // O-O-O
        movedPiece.position[0] = 2;
        castlingRook.position[0] = 3;
      } else if (piece.position[0] < castlingRook.position[0]) {
        // O-O
        movedPiece.position[0] = 6;
        castlingRook.position[0] = 5;
      }
      updatePieces((pieces) =>
        pieces.map((prevPiece) => {
          if (prevPiece.id === movedPiece.id) {
            return movedPiece;
          } else if (prevPiece.id === castlingRook.id) {
            return castlingRook;
          } else return prevPiece;
        })
      );
      castlingRook.hasMoved = true;
    } else {
      movedPiece.position = newPosition;
      updatePieces((pieces) =>
        pieces.map((prevPiece) => {
          if (prevPiece.id === movedPiece.id) {
            return movedPiece;
          } else return prevPiece;
        })
      );
    }
    if (
      isCheck(
        pieces.find(
          (piece) => piece.color !== currentPlayer && piece.type === "king"
        )!,
        pieces
      )
    ) {
      // isEndangered()
      dev_env &&
        console.log(
          `=== ${currentPlayer === "w" ? "BLACK" : "WHITE"} IN CHECK ===`
        );
    }
    piece.hasMoved = true;
    switchPlayer();
  };

  const makeAlgebraicMove: MakeAlgebraicMove = (notation) => {
    if (notation === "1-0") {
      alert("white won!");
      return;
    } else if (notation === "0-1") {
      alert("black won!");
      return;
    } else if (notation === "0-0") {
      alert("draw");
      return;
    }
    try {
      const translatedMove = fromAlgebraic(pieces, notation, currentPlayer);
      validateMove(pieces, translatedMove.piece, translatedMove.newPosition);
      if (translatedMove.isCheckmate) {
        dev_env && console.log("=== CHECKMATE ===");
      } else {
        makeMove(translatedMove);
        setPromptMessages((prev) => [
          ...prev,
          {
            role: currentPlayer === botPlayerColor ? "assistant" : "user",
            content: JSON.stringify({ move: notation, FEN: toFEN(pieces) }),
          },
        ]);
      }
    } catch (err) {
      console.log(`move not allowed, reason: ${err}`);
      if (botPlayerColor === currentPlayer) {
        console.log("retrying");
        makeBotMove();
      }
    }
  };
  const capturePiece: CapturePiece = (capturedPiece) => {
    dev_env && console.log("capturing piece:", capturedPiece);
    updatePieces((pieces) => [
      ...pieces.filter((prevPiece) => prevPiece.id !== capturedPiece.id),
    ]);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (input.trim()) {
      makeAlgebraicMove(input);
    }
  };

  // Handle key down event
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent default form submission behavior
      handleSubmit();
    }
  };

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (loader === false && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loader]);

  const simulateGame = async () => {
    function delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    for (let move of gameData.moves) {
      dev_env && console.log(currentPlayer, move);
      makeAlgebraicMove(move);
      await delay(1000);
    }
  };

  const getPromptMessages = () => {
    return promptMessages;
  };

  if (dev_env) {
    (window as any).pieces = pieces;
    (window as any).makeMove = makeMove;
    (window as any).capturePiece = capturePiece;
    (window as any).validateMove = validateMove;
    (window as any).fromAlgebraic = fromAlgebraic;
    (window as any).makeAlgebraicMove = makeAlgebraicMove;
    (window as any).simulateGame = simulateGame;
    (window as any).simulatedMoves = gameData.moves;
    (window as any).getPromptMessages = getPromptMessages;
    (window as any).getFen = () => {
      return [
        fenPositions,
        currentPlayer,
        fenCastlings,
        enPassantTarget,
        halfmoveClock,
        fullmoveClock,
      ].join(" ");
    };
  }

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setInput(e.target.value);
  };

  useEffect(()=>{
    console.log(promptMessages)
  },[promptMessages])

  return (
    <>
      <Row>
        <Col flex={4}>
          <div
            style={{
              background: "#fff",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              borderRadius: "8px",
              padding: "70px",
              margin: "5px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <div id="chessBoard">
              <Margin direction="horizontal" />
              <div className="horizontal">
                <Margin direction="vertical" />
                <div id="checkerBoard">
                  {chessBoard.map((rank, rankIndex) => (
                    <div key={rankIndex} className="rank">
                      {rank.map((checker, fileIndex) => (
                        <div
                          key={`${rankIndex}-${fileIndex}`}
                          className={`checker ${
                            (rankIndex + fileIndex) % 2 === 0 ? "white" : "gray"
                          }`}
                        >
                          {renderPiece([fileIndex, rankIndex])}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <Margin direction="vertical" />
              </div>
              <Margin direction="horizontal" />
            </div>
          </div>
        </Col>
        <Col flex={2}>
          <Card
            style={{
              display: "flex",
              flexDirection: "column",
              // justifyContent: "space-between",
              height: "600px",
              margin: "5px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              // overflowY: "scroll",
            }}
          >
            <div style={{ flexGrow: 1,
               overflowY: "scroll",
              //   padding: "16px"
              height: "450px"
                }}>
              <List
                dataSource={promptMessages.slice(1).map((message) => ({
                  text: JSON.parse(message.content).move,
                  sender: message.role,
                }))}
                renderItem={(item: Message) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={item.sender}
                      description={item.text}
                    />
                  </List.Item>
                )}
              />
            </div>

            {/* Input Area */}
            <div style={{ borderTop: "1px solid #f0f0f0", padding: "16px", alignSelf: "flex-end" }}>
              <TextArea
                value={input}
                onChange={handleInputChange}
                rows={2}
                placeholder="Input your move..."
                style={{ marginBottom: "8px", borderRadius: "4px", resize: "none", height: "28px" }}
              />
              <Button type="primary" block onClick={handleSubmit}>
                Send
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Chessboard;

/*
<div className="vertical" id="chat">
<div className="vertical" id="chat">
  <h3>Current player: {currentPlayer}</h3>

  <div
    className="messages-container"
    style={{
      height: "300px",
      overflowY: "auto",
      border: "1px solid #ccc",
      padding: "10px",
      marginBottom: "10px",
    }}
  >
    {promptMessages.slice(1).map((message, index) => (
      <div
        key={index}
        className="message"
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "5px",
        }}
      >
        <div
          className="player-circle"
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "gray",
            marginRight: "10px",
          }}
        />
        <span>{message.content}</span>
      </div>
    ))}
    <div />
  </div>

  <div className="horizontal">
    <input
      id="inputMove"
      type="text"
      value={input}
      onChange={handleChange}
      onKeyDown={handleKeyDown} // Add the key down handler
      disabled={loader}
      placeholder="Enter move"
      ref={inputRef}
    />
    <button
      id="submitMove"
      disabled={loader}
      onClick={() => makeAlgebraicMove(input)}
    >
      {loader ? "awaiting..." : "submit"}
    </button>
  </div>
</div>
</div> */
