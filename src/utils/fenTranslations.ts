import { PieceType, PlayerColor, Position } from "../types";

// add: validity checks, translating piece type letter into full piece type
export function fromFEN(fen: string): PieceType[] {
  const pieces: PieceType[] = [];
  const rows = fen.split("/");
  const pieceIdCounter = { id: 1 };

  rows.forEach((row, rankIndex) => {
    let fileIndex = 0;

    for (const char of row) {
      if (!isNaN(parseInt(char))) {
        fileIndex += parseInt(char);
      } else {
        const color = char === char.toUpperCase() ? PlayerColor.w : PlayerColor.b;
        const type = char.toLowerCase();
        const position: Position = [fileIndex, rankIndex];
        const id = `${color}_${type}_${pieceIdCounter.id++}`;

        pieces.push({ type, position, color, id, hasMoved: false });
        fileIndex++;
      }
    }
  });

  return pieces;
}

export function toFEN(pieces: PieceType[]): string {
  const board: (string | null)[][] = Array.from({ length: 8 }, () =>
    Array(8).fill(null)
  );

  pieces.forEach((piece) => {
    const [file, rank] = piece.position;
    const pieceChar =
      (piece.color === PlayerColor.w
        ? piece.type.charAt(0).toUpperCase()
        : piece.type.charAt(0).toLowerCase());
    board[rank][file] = pieceChar;
  });

  return board
    .map((row) => {
      let fenRow = "";
      let emptyCount = 0;

      row.forEach((cell) => {
        if (cell) {
          if (emptyCount > 0) {
            fenRow += emptyCount;
            emptyCount = 0;
          }
          fenRow += cell;
        } else {
          emptyCount++;
        }
      });

      if (emptyCount > 0) fenRow += emptyCount;

      return fenRow;
    })
    .join("/");
}
