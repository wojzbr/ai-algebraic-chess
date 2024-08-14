import { PieceType } from "../types";
import { v4 as uuidv4 } from "uuid";

const InitializeChessboard = (playerColor: string): PieceType[] => {
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
      color: playerColor === "white" ? "black" : "white",
      id: uuidv4(),
      hasMoved: false
    });
  }

  // initiate opponent pawns
  for (let i = 0; i < 8; i++) {
    temp_pieces.push({
      type: "pawn",
      position: [i, 1],
      color: playerColor === "white" ? "black" : "white",
      id: uuidv4(),
      hasMoved: false
    });
  }

  // initiate player pawns
  for (let i = 0; i < 8; i++) {
    temp_pieces.push({
      type: "pawn",
      position: [i, 6],
      color: playerColor,
      id: uuidv4(),
      hasMoved: false
    });
  }

  // initiate player pieces
  for (let i = 0; i < 8; i++) {
    temp_pieces.push({
      type: detectType(i),
      position: [i, 7],
      color: playerColor,
      id: uuidv4(),
      hasMoved: false
    });
  }

  return temp_pieces;
};

export default InitializeChessboard;
