import React, { ReactNode, useState } from "react";
import Piece, { Position, PieceType } from "./Piece";
import { v4 as uuidv4 } from "uuid";
import Margin from "./Margin";

const Chessboard = () => {
  const player_color = "black";
  const opponent_color = "white";

  const chessBoard = Array.from({ length: 8 }, (_, rank) =>
    Array.from({ length: 8 }, (_, file) => ({
      rank: rank,
      file: file,
    }))
  );

  const [pieces, updatePieces] = useState<PieceType[]>(() => {
    let temp_pieces: PieceType[] = [];

    const detectType = (file: number): string => {
      switch (file) {
        case 0:
        case 7:
          return "rook";
        case 1:
        case 6:
          return "knight";
        case 2:
        case 5:
          return "bishop";
        case 3:
          return "queen";
        case 4:
          return "king";
        default:
          return ""; // This should never be reached
      }
    };

    // initiate opponent pieces
    for (let i = 0; i < 8; i++) {
      temp_pieces.push({
        type: detectType(i),
        position: [i, 0],
        color: opponent_color,
        id: uuidv4(),
      });
    }

    // initiate opponent pawns
    for (let i = 0; i < 8; i++) {
      temp_pieces.push({
        type: "pawn",
        position: [i, 1],
        color: opponent_color,
        id: uuidv4(),
      });
    }

    // initiate player pawns
    for (let i = 0; i < 8; i++) {
      temp_pieces.push({
        type: "pawn",
        position: [i, 6],
        color: player_color,
        id: uuidv4(),
      });
    }

    // initiate player pieces
    for (let i = 0; i < 8; i++) {
      temp_pieces.push({
        type: detectType(i),
        position: [i, 7],
        color: player_color,
        id: uuidv4(),
      });
    }

    return temp_pieces;
  });

  const renderPiece = (position: Position): ReactNode => {
    let piece = pieces.find(
      (piece) =>
        piece.position[0] === position[0] && piece.position[1] === position[1]
    );
    if (piece) return <Piece {...piece!} movePiece={movePiece} />;
    else return <></>;
  };

  const isInsideBoard = (position: Position): boolean => {
    const [x, y] = position;
    return x >= 0 && x <= 7 && y >= 0 && y <= 7;
  };

  const isSamePosition = (pos1: Position, pos2: Position): boolean => {
    return pos1[0] === pos2[0] && pos1[1] === pos2[1];
  };

  const getPieceAtPosition = (
    pieces: PieceType[],
    position: Position
  ): PieceType | undefined => {
    return pieces.find((piece) => isSamePosition(piece.position, position));
  };

  const isPathClear = (
    pieces: PieceType[],
    start: Position,
    end: Position
  ): boolean => {
    // Add appropriate check
    return true;
  };

  // Validate Move Function
  const validateMove = (piece: PieceType, newPosition: Position): boolean => {
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

  const movePiece = (piece: PieceType, newPosition: Position) => {
    if (!validateMove(piece, newPosition)) throw new Error("move not allowed!");
    const from = piece.position;
    const to = newPosition;
    const updatedPiece = pieces.find((prevPiece) => prevPiece.id === piece.id);

    if (!updatedPiece) return;
    updatedPiece.position = to;
    updatePieces((pieces) => [...pieces, updatedPiece]);
  };

  const capturePiece = (piece: PieceType) => {
    updatePieces((pieces) => [
      ...pieces.filter((prevPiece) => prevPiece.id !== piece.id),
    ]);
  };

  if (process.env.NODE_ENV === "development") {
    (window as any).pieces = pieces;
    (window as any).movePiece = movePiece;
    (window as any).capturePiece = capturePiece;
    (window as any).validateMove = validateMove;
  }

  return (
    <>
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
