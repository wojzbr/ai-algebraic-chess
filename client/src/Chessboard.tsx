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
  const allowedPieces = new Set(['P', 'R', 'N', 'B', 'Q', 'K']);
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
      myHeaders.append("Authorization", process.env.CLIENT_KEY || "");

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
        throw new Error(`such piece type does not exist: ${letter}`);
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
    // Step 1: Initial cleaning
    let isCheck = options?.isCheck || notation.includes("+");
    let isCheckmate = options?.isCheckmate || notation.includes("#");
    let isCapture = options?.isCapture || notation.includes("x");
    let isPromotion = options?.isPromotion || notation.includes("=");
    let isCastling = options?.isCastling || notation === "O-O" || notation === "O-O-O";
    let promotionPiece = null;

    let pieceType = "pawn"; // Default to pawn
    let startFile: number | null = null;
    let startRank: number | null = null;
    let endFile = null;
    let endRank = null;

    let cleanNotation = notation.replace(/[\+#x=]/g, "");

    // Step 2: Check for castling
    if (isCastling) {
      let rookFile, kingFile, castlingRank;
      // Kingside castling O-O
      if (notation === "O-O") {
        // kingFile = 6;
        kingFile = 7;
        rookFile = 5;
      }
      // Queenside castling O-O-O
      else {
        // kingFile = 2;
        kingFile = 0;
        rookFile = 3;
      }
      const king = pieces.find(
        (p) => p.type === "king" && p.color === currentPlayer
      );
      const rook = pieces.find(
        (p) => p.type === "rook" && p.color === currentPlayer
      );
      if (!king || !rook)
        throw new Error("King or Rook not found for castling!");
      castlingRank = king.position[1];
      if (king.hasMoved || rook.hasMoved)
        throw new Error("Cannot castle already moved pieces");
      return { piece: king, newPosition: [kingFile, castlingRank] };
    }

    // Step 3: Handle promotion
    if (isPromotion) {
      // take last capital letter of the string
      const promotionPieceMatch = cleanNotation.match(/([A-Z])[^A-Z]*$/);
      promotionPiece = promotionPieceMatch && promotionPieceMatch[0]; // e.g., "Q" for Queen
    }

    // Step 4: Determine the piece type and destination
    const moveParts = cleanNotation.split("");

    if (moveParts.length === 2) {
      // Pawn move like 'e4'
      pieceType = "pawn";
      // startFile = moveParts[0];
    } else if (moveParts.length >= 3 && moveParts.length <= 5) {
      // e.g. Qd5, Rdf8, Qh4e1
      // check if piece capital letter is specified
      if (allowedPieces.has(moveParts[0])) {
        pieceType = getPieceTypeFromLetter(moveParts.shift()!);
      }
      // if piece letter is not specified but move parts are at least of length 3,
      // it might be a piece capture such as exd5
      else if (isCapture) {
        pieceType = "pawn"
      }
      if (cleanNotation.length === 4) {
        // Q | h4e1, double-disambiguated move
        startFile = cleanNotation[0].charCodeAt(0) - 97;
        startRank = parseInt(cleanNotation[1]);
      } else if (cleanNotation.length === 3) {
        // R | df8, disambiguated move
        const disambiguatedSquare = parseInt(cleanNotation[0]);
        if (isNaN(disambiguatedSquare)) {
          startFile = cleanNotation[0].charCodeAt(0) - 97;
        } else {
          startRank = disambiguatedSquare;
        }
      } else if (cleanNotation.length === 2) {
        // Q | d5, regular move
      }
    }

    const destination = cleanNotation.slice(-2);
    endFile = destination[0];
    endRank = parseInt(destination[1]);

    const newPosition: Position = [
      endFile.charCodeAt(0) - 97, // Column to index (a=0, b=1, ..., h=7)
      endRank - 1, //
    ];

    // Step 5: Find the piece to move
    const potentialPieces = pieces.filter(
      (potentialPiece) =>
        potentialPiece.type === pieceType &&
        potentialPiece.color === currentPlayer
    );

    let piece: PieceType | undefined;
    const matchingPieces =
      potentialPieces.length === 1
        ? potentialPieces
        : potentialPieces.filter((potentialPiece) => {
            const pieceFile = String.fromCharCode(
              97 + potentialPiece.position[0]
            );
            const pieceRank = potentialPiece.position[1] + 1;

            let deltaX = Math.abs(
              destination[0].charCodeAt(0) - 97 - potentialPiece.position[0]
            );
            let deltaY = Math.abs(
              parseInt(destination[1]) - 1 - potentialPiece.position[1]
            );
            switch (pieceType) {
              case "pawn":
                if (isCapture) {
                  const files = getAdjacentFiles(pieceFile);
                  if (
                    files.includes(moveParts[0]) &&
                    Math.abs(pieceRank - parseInt(moveParts[1])) === 1
                  ) {
                    return true;
                  }
                } else return pieceFile === moveParts[0];
                break;
              case "rook":
                return (
                  (deltaX === 0 || deltaY === 0) &&
                  !(deltaX === 0 && deltaY === 0)
                );
              case "knight":
                if (
                  (deltaX === 2 && deltaY === 1) ||
                  (deltaX === 1 && deltaY === 2)
                ) {
                  return true;
                }
                break;
              case "bishop":
                if (
                  Math.abs(deltaX) === Math.abs(deltaY) &&
                  isPathClear(potentialPiece, newPosition)
                ) {
                  return true;
                }
                break;
              default:
                return false;
            }
          });

    // Step 6: Return the result with all conditions
    if (matchingPieces.length > 1) {
      throw new Error("Ambiguous notation!");
    } else if (matchingPieces.length === 0) {
      throw new Error("Piece not found!");
    } else {
      piece = matchingPieces[0];
      return {
        piece,
        newPosition,
        promotionPiece: promotionPiece || undefined,
        isCastling,
        isCapture,
        isCheck,
        isCheckmate,
      };
    }
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
              <div className="rank">
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
