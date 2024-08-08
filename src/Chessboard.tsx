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
  TranslateToAlgebraic,
  TranslateFromAlgebraic,
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

  const [playerColor, setPlayerColor] = useState("black");
  const [currentPlayer, setCurrentPlayer] = useState("white");
  const [pieces, updatePieces] = useState<PieceType[]>(
    InitializeChessboard(playerColor)
  );

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
    if (piece) return <Piece {...piece!} makeMove={makeMove} />;
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

  const isPathClear: IsPathClear = (pieces, start, end) => {
    // Add appropriate check
    return true;
  };

  const validateMove: ValidateMove = (piece, newPosition) => {
    if (!isInsideBoard(newPosition)) {
      return false;
    }

    const targetPiece = getPieceAtPosition(pieces, newPosition);

    // Prevent moving to a position occupied by a piece of the same color
    if (targetPiece && targetPiece.color === piece.color) {
      return false;
    }

    const [x, y] = piece.position;
    const [newX, newY] = newPosition;
    const deltaX = newX - x;
    const deltaY = newY - y;

    switch (piece.type) {
      case "pawn":
        const direction = piece.color === "white" ? 1 : -1;
        const startRow = piece.color === "white" ? 1 : 6;

        // Pawn's initial double move
        if (y === startRow && deltaY === 2 * direction && deltaX === 0) {
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
          isPathClear(pieces, piece.position, newPosition)
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
          isPathClear(pieces, piece.position, newPosition)
        ) {
          return true;
        }
        break;

      case "queen":
        if (
          (Math.abs(deltaX) === Math.abs(deltaY) ||
            deltaX === 0 ||
            deltaY === 0) &&
          isPathClear(pieces, piece.position, newPosition)
        ) {
          return true;
        }
        break;

      case "king":
        if (Math.abs(deltaX) <= 1 && Math.abs(deltaY) <= 1) {
          return true;
        }

        // Castling

        break;

      default:
        return false;
    }

    return false;
  };

  // Piece getters
  const getPieceAtPosition: GetPieceAtPosition = (pieces, position) => {
    return pieces.find((piece) => isSamePosition(piece.position, position));
  };

  const getPieceTypeFromLetter: GetPieceTypeFromLetter = (letter) => {
    switch (letter.toUpperCase()) {
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
      default:
        return "pawn";
    }
  };

  // Algebraic translations
  const translateToAlgebraic: TranslateToAlgebraic = (
    piece,
    newPosition,
    capture = false,
    promotion = ""
  ) => {
    const [startX, startY] = piece.position;
    const [endX, endY] = newPosition;

    const pieceType =
      piece.type === "pawn" ? "" : piece.type.charAt(0).toUpperCase();
    const startColumn = String.fromCharCode(97 + startX);
    const startRow = (startY - 1).toString();
    const endColumn = String.fromCharCode(97 + endX);
    const endRow = (endY + 1).toString();

    const captureNotation = capture ? "x" : "";
    const promotionNotation = promotion ? `=${promotion.toUpperCase()}` : "";

    // Handle castling
    if (piece.type === "king" && Math.abs(startX - endX) === 2) {
      if (endX === 6) return "O-O"; // Kingside castling
      if (endX === 2) return "O-O-O"; // Queenside castling
    }

    // Pawn move with capture
    if (piece.type === "pawn" && capture) {
      return `${startColumn}x${endColumn}${endRow}${promotionNotation}`;
    }

    // Regular move
    return `${pieceType}${captureNotation}${endColumn}${endRow}${promotionNotation}`;
  };

  const translateFromAlgebraic: TranslateFromAlgebraic = (notation) => {
    // Remove any unnecessary characters
    let cleanNotation = notation.replace(/[+#]/g, "");

    // Handle castling
    if (cleanNotation === "O-O") {
      // Kingside castling
      const king = pieces.find(
        (p) => p.type === "king" && p.color === currentPlayer
      );
      if (king) return { piece: king, newPosition: [6, 7] }; // e1 to g1 for white
    } else if (cleanNotation === "O-O-O") {
      // Queenside castling
      const king = pieces.find(
        (p) => p.type === "king" && p.color === currentPlayer
      );
      if (king) return { piece: king, newPosition: [2, 7] }; // e1 to c1 for white
    }

    // Extract promotion information if exists
    let promotion = "";
    if (cleanNotation.includes("=")) {
      const parts = cleanNotation.split("=");
      cleanNotation = parts[0];
      promotion = parts[1];
    }

    // Capture move or regular move
    const capture = cleanNotation.includes("x");
    const moveParts = cleanNotation.replace(/x/g, "");

    // Determine the destination position
    const destination = moveParts.slice(-2); // Last two characters for the destination
    const endColumn = destination[0];
    const endRow = parseInt(destination[1], 10);

    const newPosition: Position = [
      endColumn.charCodeAt(0) - 97, // Column to index (a=0, b=1, ..., h=7)
      endRow - 1, // Row to index (1=7, 2=6, ..., 8=0)
    ];

    // Determine the piece type and start position
    let pieceType = "pawn"; // Default to pawn for moves like 'e4'
    let startFile = "";
    let startRank = -1;

    // Adjust the parsing logic for moveParts
    if (moveParts.length === 2) {
      pieceType = "pawn"; // Simple pawn move like "e4" or "c4"
      startFile = moveParts[0]; // Start file for the pawn
    } else if (moveParts.length > 2) {
      const firstChar = moveParts[0];
      if (firstChar >= "A" && firstChar <= "Z") {
        pieceType = getPieceTypeFromLetter(firstChar);
        if (moveParts.length === 4) {
          startFile = moveParts[1];
          startRank = parseInt(moveParts[2], 10);
        } else if (moveParts.length === 3) {
          if (isNaN(parseInt(moveParts[1], 10))) {
            startFile = moveParts[1];
          } else {
            startRank = parseInt(moveParts[1], 10);
          }
        }
      } else {
        startFile = moveParts[0];
      }
    }

    // Find the piece to move
    const potentialPieces = pieces.filter(
      (p) => p.type === pieceType && p.color === currentPlayer
    );

    console.log(potentialPieces);

    let piece: PieceType | undefined;
    const matchingPieces = potentialPieces.filter((p) => {
      const pieceFile = String.fromCharCode(97 + p.position[0]);
      const pieceRank = p.position[1] + 1;

      if (
        (startFile && pieceFile === startFile) ||
        (startRank !== -1 && pieceRank === startRank) ||
        (!startFile && startRank === -1)
      ) {
        if (pieceType === "pawn" && capture) {
          return pieceFile === moveParts[0];
        }
        return true;
      }
      return false;
    });

    if (matchingPieces.length > 1) {
      throw new Error("Ambiguous notation!");
    }

    piece = matchingPieces[0];

    if (!piece) throw new Error("Piece not found!");

    return { piece, newPosition };
  };

  // Move-related functions
  const makeMove: MakeMove = (piece, newPosition) => {
    if (!validateMove(piece, newPosition)) throw new Error("move not allowed!");
    console.log(
      "Algebraic notation:",
      translateToAlgebraic(piece, newPosition)
    );

    const updatedPiece = pieces.find((prevPiece) => prevPiece.id === piece.id);

    if (!updatedPiece) return;
    updatedPiece.position = newPosition;

    const capturedPiece = pieces.find((piece) =>
      isSamePosition(piece.position, newPosition)
    );
    if (capturedPiece) capturePiece(capturedPiece);

    updatePieces((pieces) =>
      pieces.map((prevPiece) => {
        if (prevPiece.id === piece.id) {
          return piece;
        } else return prevPiece;
      })
    );
    switchPlayer();
  };

  const makeAlgebraicMove: MakeAlgebraicMove = (notation) => {
    const { piece, newPosition } = translateFromAlgebraic(notation);
    makeMove(piece, newPosition);
  };

  const capturePiece: CapturePiece = (capturedPiece) => {
    console.log("capturing!", capturedPiece);
    updatePieces((pieces) => [
      ...pieces.filter((prevPiece) => prevPiece.id !== capturedPiece.id),
    ]);
  };

  if (process.env.NODE_ENV === "development") {
    (window as any).pieces = pieces;
    (window as any).makeMove = makeMove;
    (window as any).capturePiece = capturePiece;
    (window as any).validateMove = validateMove;
    (window as any).translateFromAlgebraic = translateFromAlgebraic;
    (window as any).makeAlgebraicMove = makeAlgebraicMove;
  }

  return (
    <>
      <h1>Current player: {currentPlayer}</h1>
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
