import React, { ReactNode, useEffect, useState } from "react";
import Piece from "./Piece";
import {
  Position,
  PieceType,
  SwitchPlayer,
  RenderPiece,
  IsInsideBoard,
  IsSamePosition,
  GetPieceAtPosition,
  IsPathClear,
  ValidateMove,
  ToAlgebraic,
  FromAlgebraic,
  MakeMove,
  MakeAlgebraicMove,
  CapturePiece,
  GetPieceTypeFromLetter,
} from "./types";
import Margin from "./Margin";
import InitializeChessboard from "./InitializeChessboard";

const Chessboard = () => {
  const chessBoard = Array.from({ length: 8 }, (_, rank) =>
    Array.from({ length: 8 }, (_, file) => ({
      rank: rank,
      file: file,
    }))
  );
  const allowedPieces = new Set(["P", "R", "N", "B", "Q", "K"]);
  const [playerColor] = useState("black");
  const [currentPlayer, setCurrentPlayer] = useState("white");
  const [pieces, updatePieces] = useState<PieceType[]>(
    InitializeChessboard(playerColor)
  );

  const [promptMessages, setPromptMessages] = useState([
    {
      role: "system",
      content:
        "We are going to play a game of chess using algebraic notation. I will be playing as White, and you will be playing as Black. The Black King is positioned on e8. I will make the first move, and you will respond accordingly. Please announce your moves in standard algebraic notation and remember that I am controlling the White pieces while you control the Black pieces. To any message that's not a chess algebraic notation move you should reply with 'Provide a valid move! Reason:<short explanation on why the move isn't valid'. Let's begin!",
    },
  ]);

  useEffect(() => {
    if (currentPlayer === "black") {
      setInput("");
      setLoader(true);
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Authorization", process.env.REACT_APP_CLIENT_KEY || "");

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
          setPromptMessages((prev) => [...prev, botMessage]);
          console.log("Making bot move: ", botMessage.content);
          makeAlgebraicMove(botMessage.content);
          setLoader(false);
        })
        .catch((error) => console.error("Error:", error));
    }
  }, [currentPlayer, promptMessages]);

  const [input, setInput] = useState("");

  const [loader, setLoader] = useState(false);

  // Handle the change event for the input field
  const handleChange = (event: any) => {
    setInput(event.target.value);
  };

  function getAdjacentFiles(letter: string) {
    // Ensure the letter is a single character and valid
    if (letter.length !== 1 || letter < "a" || letter > "z") {
      throw new Error("Invalid letter");
    }

    // Get the ASCII code of the letter
    const code = letter.charCodeAt(0);

    // Calculate the previous and next letters
    const prevLetter = String.fromCharCode(code - 1);
    const nextLetter = String.fromCharCode(code + 1);

    // Check if the letters are within the valid range
    const isValidLetter = (ch: string) => ch >= "a" && ch <= "z";

    return [
      isValidLetter(prevLetter) ? prevLetter : null,
      isValidLetter(nextLetter) ? nextLetter : null,
    ];
  }

  // const isAdjacent = (fileA: string, fileB: string) => {
  //   if ((fileA.length !== 1 || fileA < "a" || fileA > "z") || fileB.length !== 1 || fileB < "a" || fileB > "z") {
  //     throw new Error("Invalid letter");
  //   }
  //   if (Math.abs(fileA.charCodeAt(0) - fileB.charCodeAt(0)) !== 1) return false;
  //   else return true;
  // }

  // // Game initialization
  // const switchPlayer: SwitchPlayer = () => {
  //   currentPlayer === "white"
  //     ? setCurrentPlayer("black")
  //     : setCurrentPlayer("white");
  // };
  const isAdjacent = (fileA: number, fileB: number) => {
    if (fileA < 0 || fileA > 7 || fileB < 0 || fileB > 7) {
      throw new Error("Invalid file");
    }
    if (Math.abs(fileA - fileB) !== 1) return false;
    else return true;
  };

  // Game initialization
  const switchPlayer: SwitchPlayer = () => {
    currentPlayer === "white"
      ? setCurrentPlayer("black")
      : setCurrentPlayer("white");
  };

  const renderPiece: RenderPiece = (position) => {
    let piece = pieces.find(
      (piece) =>
        piece.position[0] === position[0] && piece.position[1] === position[1]
    );
    if (piece) return <Piece {...piece!} />;
    else return <></>;
  };

  // Validity checks
  const isInsideBoard: IsInsideBoard = (position) => {
    const [x, y] = position;
    return x >= 0 && x <= 7 && y >= 0 && y <= 7;
  };

  const isSamePosition: IsSamePosition = (pos1, pos2) => {
    return pos1[0] === pos2[0] && pos1[1] === pos2[1];
  };

  const determineIncrement = (
    coordinate: number,
    newCoordinate: number
  ): number => {
    // Determine the move direction
    if (coordinate < newCoordinate) {
      // moving upwards
      return 1;
    } else if (coordinate > newCoordinate) {
      // moving downwards
      return -1;
    } else {
      // same square, no movement
      throw new Error("coordinate and newCoordinate are the same");
    }
  };

  const isPathClear: IsPathClear = (piece, newPosition) => {
    //check if move is vertical, horizontal or diagonal
    const [x, y] = piece.position;
    const [newX, newY] = newPosition;
    const deltaX = newX - x;
    const deltaY = newY - y;

    //check every square except of start and end squares accordingly

    if (deltaX === 0 && deltaY !== 0) {
      //vertical move, stepping along y axis
      const yIncrement = determineIncrement(y, newY);
      for (let i = y + yIncrement; i < newY; i += yIncrement) {
        if (getPieceAtPosition(pieces, [x, i])) return false;
      }
    } else if (deltaX !== 0 && deltaY === 0) {
      //horizontal move, stepping along x axis
      const xIncrement = determineIncrement(x, newX);
      for (let i = x + xIncrement; i < newX; i += xIncrement) {
        if (getPieceAtPosition(pieces, [i, y])) return false;
      }
    } else if (Math.abs(deltaX / deltaY) === 1) {
      //diagonal move, stepping along both axes
      const xIncrement = determineIncrement(x, newX);
      const yIncrement = determineIncrement(y, newY);
      for (
        let i = x + xIncrement, j = y + yIncrement;
        i < newX && j < newY;
        i += xIncrement, j += yIncrement
      ) {
        if (getPieceAtPosition(pieces, [i, j])) return false;
      }
    }

    // path is clear if no colliding pieces found
    return true;
  };

  const validateMove: ValidateMove = (piece, newPosition) => {
    if (!isInsideBoard(newPosition)) {
      return false;
    }

    const targetPiece = getPieceAtPosition(pieces, newPosition);

    const castling =
      targetPiece?.color === piece.color &&
      targetPiece?.type === "rook" &&
      piece.type === "king";

    // Prevent moving to a position occupied by a piece of the same color
    if (targetPiece && targetPiece.color === piece.color && !castling) {
      return false;
    }

    const [x, y] = piece.position;
    const [newX, newY] = newPosition;
    const deltaX = newX - x;
    const deltaY = newY - y;

    switch (piece.type) {
      case "pawn":
        const direction = piece.color === "white" ? 1 : -1;
        const startRank = piece.color === "white" ? 1 : 6;

        // Pawn's initial double move
        if (y === startRank && deltaY === 2 * direction && deltaX === 0) {
          if (!getPieceAtPosition(pieces, [x, y + direction]) && !targetPiece) {
            return true;
          }
        }

        // Regular move
        if (deltaY === direction && deltaX === 0 && !targetPiece) {
          return true;
        }

        // Capture move
        if (
          deltaY === direction &&
          Math.abs(deltaX) === 1 &&
          targetPiece &&
          targetPiece.color !== piece.color
        ) {
          return true;
        }

        // En Passant

        break;

      case "rook":
        if (
          (deltaX === 0 || deltaY === 0) &&
          !(deltaX === 0 && deltaY === 0) &&
          isPathClear(piece, newPosition)
        ) {
          return true;
        }
        break;

      case "knight":
        if (
          (Math.abs(deltaX) === 2 && Math.abs(deltaY) === 1) ||
          (Math.abs(deltaX) === 1 && Math.abs(deltaY) === 2)
        ) {
          return true;
        }
        break;

      case "bishop":
        if (
          Math.abs(deltaX) === Math.abs(deltaY) &&
          isPathClear(piece, newPosition)
        ) {
          return true;
        }
        break;

      case "queen":
        if (
          (Math.abs(deltaX) === Math.abs(deltaY) ||
            deltaX === 0 ||
            deltaY === 0) &&
          isPathClear(piece, newPosition)
        ) {
          return true;
        }
        break;

      case "king":
        if (castling) {
          const isCastlingMove =
            (y === 0 || y === 7) &&
            deltaY === 0 &&
            (deltaX === 3 || deltaX === -4);
          if (isCastlingMove) {
            const isKingside = deltaX === 3;
            const rookX = isKingside ? 7 : 0;

            // Check if path is clear
            const pathIsClear = isPathClear(piece, newPosition);

            // Check if the rook is in the correct position and hasn't moved
            const rook = getPieceAtPosition(pieces, [rookX, y]);
            const rookNotMoved =
              rook &&
              rook.type === "rook" &&
              rook.color === piece.color &&
              !rook.hasMoved;

            // Check if the king hasn't moved
            const kingNotMoved = !piece.hasMoved;

            if (pathIsClear && rookNotMoved && kingNotMoved) {
              return true;
            }
          }
        } else if (Math.abs(deltaX) <= 1 && Math.abs(deltaY) <= 1) {
          return true;
        }

        break;

      default:
        return false;
    }

    return false;
  };

  const getPieceAtPosition: GetPieceAtPosition = (pieces, position) => {
    return pieces.find((piece) => isSamePosition(piece.position, position));
  };

  const getPieceTypeFromLetter: GetPieceTypeFromLetter = (letter) => {
    switch (letter) {
      case "K":
        return "king";
      case "Q":
        return "queen";
      case "R":
        return "rook";
      case "B":
        return "bishop";
      case "N":
        return "knight";
      case "P":
        return "pawn";
      default:
        return undefined;
    }
  };

  // Algebraic translations
  const toAlgebraic: ToAlgebraic = (
    piece,
    newPosition,
    capture = false,
    promotion = ""
  ) => {
    const [startX, startY] = piece.position;
    const [endX, endY] = newPosition;

    let pieceType;
    switch (piece.type) {
      case "pawn":
        pieceType = "";
        break;
      case "knight":
        pieceType = "N";
        break;
      default:
        piece.type.charAt(0).toUpperCase();
        break;
    }
    const startFile = String.fromCharCode(97 + startX);
    const startRank = (startY - 1).toString();
    const endFile = String.fromCharCode(97 + endX);
    const endRank = (endY + 1).toString();

    const captureNotation = capture ? "x" : "";
    const promotionNotation = promotion ? `=${promotion.toUpperCase()}` : "";

    // Handle castling
    if (piece.type === "king" && Math.abs(startX - endX) === 2) {
      if (endX === 6) return "O-O"; // Kingside castling
      if (endX === 2) return "O-O-O"; // Queenside castling
    }

    // Pawn move with capture
    if (piece.type === "pawn" && capture) {
      return `${startFile}x${endFile}${endRank}${promotionNotation}`;
    }

    // Regular move
    return `${pieceType}${captureNotation}${endFile}${endRank}${promotionNotation}`;
  };

  const fromAlgebraic: FromAlgebraic = (notation, options) => {
    const isCheck = options?.isCheck || notation.includes("+");
    const isCheckmate = options?.isCheckmate || notation.includes("#");
    const isCapture = options?.isCapture || notation.includes("x");
    const isPromotion = options?.isPromotion || notation.includes("=");
    const isCastling =
      options?.isCastling || notation === "O-O" || notation === "O-O-O";
    const cleanNotation = notation.replace(/[\+#x=]/g, "");
    const promotionPiece = isPromotion
      ? cleanNotation.match(/([A-Z])[^A-Z]*$/)?.[0]
      : null;
    const moveParts = cleanNotation.split("");

    let newPosition: Position;
    let pieceType = "pawn";
    let startFile: number | null = null;
    let startRank: number | null = null;

    if (isCastling) {
      const [kingFile, rookFile] = notation === "O-O" ? [7, 5] : [0, 3];
      const king = pieces.find(
        (p) => p.type === "king" && p.color === currentPlayer
      );
      const rook = pieces.find(
        (p) => p.type === "rook" && p.color === currentPlayer
      );
      if (!king || !rook || king.hasMoved || rook.hasMoved) {
        throw new Error("Invalid castling");
      }
      return { piece: king, newPosition: [kingFile, king.position[1]] };
    } else if (getPieceTypeFromLetter(moveParts[0]) !== undefined) {
      pieceType = getPieceTypeFromLetter(moveParts.shift()!)!;
    }
    const potentialPieces = pieces.filter(
      (p) => p.type === pieceType && p.color === currentPlayer
    );
    let matchingPieces: PieceType[] = [];

    if (moveParts.length >= 2 && moveParts.length <= 4) {
      const endFile = cleanNotation.slice(-2, -1).charCodeAt(0) - 97;
      const endRank = parseInt(cleanNotation.slice(-1)) - 1;
      newPosition = [endFile, endRank];

      switch (moveParts.length) {
        case 2:
          if (!isCapture || (isCapture && pieceType !== "pawn")) {
            matchingPieces = potentialPieces.filter((p) => {
              const deltaX = Math.abs(endFile - p.position[0]);
              const deltaY = Math.abs(endRank - p.position[1]);
              switch (pieceType) {
                case "pawn":
                  const isSingleMove = deltaY === 1;
                  const isDoubleMove = deltaY === 2 && !p.hasMoved;
                  const isSameFile = deltaX === 0;
                  return isSameFile && (isSingleMove || isDoubleMove);
                case "rook":
                  return (
                    isPathClear(p, newPosition) &&
                    (deltaX === 0 || deltaY === 0)
                  );
                case "knight":
                  return (
                    (deltaX === 2 && deltaY === 1) ||
                    (deltaX === 1 && deltaY === 2)
                  );
                case "bishop":
                  return isPathClear(p, newPosition) && deltaX === deltaY;
                case "queen":
                  return (
                    isPathClear(p, newPosition) &&
                    (deltaX === 0 || deltaY === 0 || deltaX === deltaY)
                  );
                default:
              }
            });
          } else {
            throw new Error("Incorrect moveParts length");
          }
          break;
        case 3:
          if (isCapture) {
            // file/rank + newPosition, capture
            // if pawn, it's sth like exd5
            matchingPieces = potentialPieces.filter((p) => {
              let startRank, startFile;
              if (!isNaN(parseInt(moveParts[0]))) {
                // it's a rank
                startRank = parseInt(moveParts[0]);
              } else {
                //it's a file
                startFile = moveParts[0].charCodeAt(0) - 97;
              }
              const deltaX = Math.abs(endFile - p.position[0]);
              const deltaY = Math.abs(endRank - p.position[1]);
              switch (p.type) {
                case "pawn":
                  if (
                    startFile &&
                    p.position[0] === startFile &&
                    isAdjacent(startFile, endFile)
                  )
                    return true;
                  else return false;
                case "rook":
                  return (
                    isPathClear(p, newPosition) &&
                    (deltaX === 0 || deltaY === 0) &&
                    (startFile === p.position[0] || startRank === p.position[1])
                  );
                case "knight":
                  return (
                    (deltaX === 2 && deltaY === 1) ||
                    (deltaX === 1 &&
                      deltaY === 2 &&
                      (startFile === p.position[0] ||
                        startRank === p.position[1]))
                  );
                case "bishop":
                  return (
                    isPathClear(p, newPosition) &&
                    deltaX === deltaY &&
                    (startFile === p.position[0] || startRank === p.position[1])
                  );
                case "queen":
                  return (
                    isPathClear(p, newPosition) &&
                    (deltaX === 0 || deltaY === 0 || deltaX === deltaY) &&
                    (startFile === p.position[0] || startRank === p.position[1])
                  );
                default:
              }
            });
          } else {
            // file/rank + newPosition
            // sth like Qed5 or Q4d5
            matchingPieces = potentialPieces.filter((p) => {
              let startRank, startFile;
              if (!isNaN(parseInt(moveParts[0]))) {
                // it's a rank
                startRank = parseInt(moveParts[0]);
              } else {
                //it's a file
                startFile = moveParts[0].charCodeAt(0) - 97;
              }
              const deltaX = Math.abs(endFile - p.position[0]);
              const deltaY = Math.abs(endRank - p.position[1]);
              switch (p.type) {
                case "pawn":
                  if (
                    startFile &&
                    p.position[0] === startFile &&
                    startFile === endFile
                  )
                    return true;
                  else return false;
                case "rook":
                  return (
                    isPathClear(p, newPosition) &&
                    (deltaX === 0 || deltaY === 0) &&
                    (startFile === p.position[0] || startRank === p.position[1])
                  );
                case "knight":
                  return (
                    (deltaX === 2 && deltaY === 1) ||
                    (deltaX === 1 &&
                      deltaY === 2 &&
                      (startFile === p.position[0] ||
                        startRank === p.position[1]))
                  );
                case "bishop":
                  return (
                    isPathClear(p, newPosition) &&
                    deltaX === deltaY &&
                    (startFile === p.position[0] || startRank === p.position[1])
                  );
                case "queen":
                  return (
                    isPathClear(p, newPosition) &&
                    (deltaX === 0 || deltaY === 0 || deltaX === deltaY) &&
                    (startFile === p.position[0] || startRank === p.position[1])
                  );
                default:
              }
            });
          }
          break;
        case 4:
          matchingPieces = potentialPieces.filter((p) => {
            const startFile = moveParts[0].charCodeAt(0) - 97;
            const startRank = parseInt(moveParts[0]);
            return isSamePosition(p.position, [startFile, startRank]);
          });
          break;
        default:
          throw new Error("Incorrect moveParts length");
      }
    } else {
      throw new Error("Incorrect move parts notation");
    }
    if (matchingPieces.length > 1 && startFile === null && startRank === null) {
      throw new Error("Ambiguous notation");
    }
    if (matchingPieces.length === 0) {
      throw new Error("Piece not found");
    }

    return {
      piece: matchingPieces[0],
      newPosition,
      promotionPiece: promotionPiece || undefined,
      isCastling,
      isCapture,
      isCheck,
      isCheckmate,
    };
  };

  const makeMove: MakeMove = (move) => {
    // let piece: PieceType, newPosition: Position;
    const { piece, newPosition } = move;

    if (!validateMove(piece, newPosition))
      throw new Error(
        `move not allowed: ${JSON.stringify({ piece, newPosition })}`
      );

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
    piece.hasMoved = true;
    switchPlayer();
  };

  const makeAlgebraicMove: MakeAlgebraicMove = (notation) => {
    const translatedMove = fromAlgebraic(notation);
    makeMove(translatedMove);
    setPromptMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: notation,
      },
    ]);
  };
  const capturePiece: CapturePiece = (capturedPiece) => {
    console.log("capturing piece:", capturedPiece);
    updatePieces((pieces) => [
      ...pieces.filter((prevPiece) => prevPiece.id !== capturedPiece.id),
    ]);
  };

  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "production"
  ) {
    (window as any).pieces = pieces;
    (window as any).makeMove = makeMove;
    (window as any).capturePiece = capturePiece;
    (window as any).validateMove = validateMove;
    (window as any).fromAlgebraic = fromAlgebraic;
    (window as any).makeAlgebraicMove = makeAlgebraicMove;
  }

  return (
    <>
      <div className="vertical">
        <h3>Current player: {currentPlayer}</h3>
        <div className="horizontal">
          <input
            id="inputMove"
            type="text"
            value={input}
            onChange={handleChange}
            disabled={loader}
            placeholder="Enter move"
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
    </>
  );
};

export default Chessboard;
