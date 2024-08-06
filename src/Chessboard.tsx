import React, { useEffect, useState } from "react";

const Chessboard = () => {
  interface Piece {
    type: string;
    position: [string, number];
    color: string;
  }

  const player_color = "white";
  const opponent_color = "black";

  const chessBoard = Array.from({ length: 8 }, (_, rank) =>
    Array.from({ length: 8 }, (_, file) => ({
      rank: rank,
      // file: String.fromCharCode(97 + file),
      file: file,
    }))
  );
  const [pieces, updatePieces] = useState<Piece[]>(() => {
    let temp_pieces: Piece[] = [];

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
        position: [String.fromCharCode(97 + i), 1],
        color: opponent_color,
      });
    }

    // initiate opponent pawns
    for (let i = 0; i < 8; i++) {
      temp_pieces.push({
        type: "pawn",
        position: [String.fromCharCode(97 + i), 2],
        color: opponent_color,
      });
    }

    // initiate player pawns
    for (let i = 0; i < 8; i++) {
      temp_pieces.push({
        type: "pawn",
        position: [String.fromCharCode(97 + i), 7],
        color: player_color,
      });
    }

    // initiate player pieces
    for (let i = 0; i < 8; i++) {
      temp_pieces.push({
        type: detectType(i),
        position: [String.fromCharCode(97 + i), 8],
        color: player_color,
      });
    }

    return temp_pieces;
  });

  return (
    <div id="checkerBoard">
      {chessBoard.map((rank, rankIndex) => (
        <div className="rank">
          {rank.map((checker, fileIndex) => (
            <div
              key={`${rankIndex}-${fileIndex}`}
              className={`checker ${
                (rankIndex + fileIndex) % 2 === 0 ? "white" : "black"
              }`}
            >
              {(String.fromCharCode(97 + fileIndex)).toUpperCase()}
              {(rankIndex + 1).toString().toUpperCase()}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Chessboard;
