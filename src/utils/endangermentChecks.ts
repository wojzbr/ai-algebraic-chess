import { GetPieceAtPosition, PieceType, PlayerColor, Position } from "../types";
import { getPieceAtPosition } from "./validityChecks";

const isMoveWithoutCheck = (
    pieces: PieceType[],
    piece: PieceType,
    newPosition: Position,
): boolean => {
    // Step 1: Simulate the move
    const originalPosition = piece.position;
    piece.position = newPosition;

    // Step 2: Check if the move leaves the King in check
    const king = pieces.find(p => p.type === "king" && p.color === piece.color);
    if (!king) {
        throw new Error("King not found on the board");
    }

    const moveLeavesKingInCheck = isCheck(king, pieces);

    // Step 3: Revert the simulated move
    piece.position = originalPosition;

    // The move is legal if it does not leave the King in check
    return !moveLeavesKingInCheck;
};


const isCheck = (king: PieceType, pieces: PieceType[]): boolean => {
    if (king.type !== "king") throw new Error("cannot check a piece that's not a king");

    const kingFile = king.position[0];
    const kingRank = king.position[1];

    const opponentPieces = pieces.filter(piece => piece.color !== king.color);

    // Check for threats from rooks or queens (up, down, left, right)
    const isRookOrQueenThreat = (fileDelta: number, rankDelta: number) => {
        let file = kingFile + fileDelta;
        let rank = kingRank + rankDelta;

        while (file >= 1 && file <= 8 && rank >= 1 && rank <= 8) {
            const piece = pieces.find(p => p.position[0] === file && p.position[1] === rank);
            if (piece) {
                if (piece.color !== king.color && (piece.type === "rook" || piece.type === "queen")) {
                    return true;
                }
                break;
            }
            file += fileDelta;
            rank += rankDelta;
        }
        return false;
    };

    if (isRookOrQueenThreat(1, 0) || isRookOrQueenThreat(-1, 0) ||
        isRookOrQueenThreat(0, 1) || isRookOrQueenThreat(0, -1)) {
        return true;
    }

    // Check for threats from bishops or queens (diagonals)
    const isBishopOrQueenThreat = (fileDelta: number, rankDelta: number) => {
        let file = kingFile + fileDelta;
        let rank = kingRank + rankDelta;

        while (file >= 1 && file <= 8 && rank >= 1 && rank <= 8) {
            const piece = pieces.find(p => p.position[0] === file && p.position[1] === rank);
            if (piece) {
                if (piece.color !== king.color && (piece.type === "bishop" || piece.type === "queen")) {
                    return true;
                }
                break;
            }
            file += fileDelta;
            rank += rankDelta;
        }
        return false;
    };

    if (isBishopOrQueenThreat(1, 1) || isBishopOrQueenThreat(-1, -1) ||
        isBishopOrQueenThreat(1, -1) || isBishopOrQueenThreat(-1, 1)) {
        return true;
    }

    // Check for threats from knights (L-shape)
    const knightMoves: Position[] = [
        [kingFile + 2, kingRank + 1], [kingFile + 2, kingRank - 1],
        [kingFile - 2, kingRank + 1], [kingFile - 2, kingRank - 1],
        [kingFile + 1, kingRank + 2], [kingFile + 1, kingRank - 2],
        [kingFile - 1, kingRank + 2], [kingFile - 1, kingRank - 2]
    ];

    for (const move of knightMoves) {
        const piece = pieces.find(p => p.position[0] === move[0] && p.position[1] === move[1]);
        if (piece && piece.color !== king.color && piece.type === "knight") {
            return true;
        }
    }

    // Check for threats from pawns (diagonally one square)
    const pawnAttackMoves = king.color === PlayerColor.w
        ? [[kingFile + 1, kingRank + 1], [kingFile - 1, kingRank + 1]]
        : [[kingFile + 1, kingRank - 1], [kingFile - 1, kingRank - 1]];

    for (const move of pawnAttackMoves) {
        const piece = pieces.find(p => p.position[0] === move[0] && p.position[1] === move[1]);
        if (piece && piece.color !== king.color && piece.type === "pawn") {
            return true;
        }
    }

    return false;
};

const getPossibleMoves = (
    piece: PieceType,
    pieces: PieceType[],
    getPieceAtPosition: GetPieceAtPosition
): Position[] => {
    const moves: Position[] = [];
    const { type, position, color } = piece;
    const [file, rank] = position;

    // Function to check if a position is within the board
    const isValidPosition = (file: number, rank: number): boolean =>
        file >= 1 && file <= 8 && rank >= 1 && rank <= 8;

    // Function to add a move if it’s valid and not blocked
    const addMove = (file: number, rank: number) => {
        if (isValidPosition(file, rank)) {
            const targetPiece = getPieceAtPosition(pieces, [file, rank]);
            if (!targetPiece || targetPiece.color !== color) {
                moves.push([file, rank]);
                if (targetPiece) {
                    // Stop further moves in this direction if there's an enemy piece
                    return false;
                }
            }
        }
        return true;
    };

    switch (type) {
        case "pawn":
            const direction = color === PlayerColor.w ? 1 : -1;
            // Regular moves
            if (isValidPosition(file, rank + direction) && !getPieceAtPosition(pieces, [file, rank + direction])) {
                moves.push([file, rank + direction]);
                if ((color === PlayerColor.w && rank === 2) || (color === PlayerColor.b && rank === 7)) {
                    // Double move from the starting position
                    if (isValidPosition(file, rank + 2 * direction) && !getPieceAtPosition(pieces, [file, rank + 2 * direction])) {
                        moves.push([file, rank + 2 * direction]);
                    }
                }
            }
            // Captures
            if (isValidPosition(file + 1, rank + direction) && getPieceAtPosition(pieces, [file + 1, rank + direction])?.color !== color) {
                moves.push([file + 1, rank + direction]);
            }
            if (isValidPosition(file - 1, rank + direction) && getPieceAtPosition(pieces, [file - 1, rank + direction])?.color !== color) {
                moves.push([file - 1, rank + direction]);
            }
            break;

        case "rook":
            for (let i = 1; i <= 8; i++) {
                if (!addMove(file + i, rank)) break;
                if (!addMove(file - i, rank)) break;
                if (!addMove(file, rank + i)) break;
                if (!addMove(file, rank - i)) break;
            }
            break;

        case "bishop":
            for (let i = 1; i <= 8; i++) {
                if (!addMove(file + i, rank + i)) break;
                if (!addMove(file - i, rank - i)) break;
                if (!addMove(file + i, rank - i)) break;
                if (!addMove(file - i, rank + i)) break;
            }
            break;

        case "queen":
            // Combine rook and bishop moves
            for (let i = 1; i <= 8; i++) {
                if (!addMove(file + i, rank)) break;
                if (!addMove(file - i, rank)) break;
                if (!addMove(file, rank + i)) break;
                if (!addMove(file, rank - i)) break;
                if (!addMove(file + i, rank + i)) break;
                if (!addMove(file - i, rank - i)) break;
                if (!addMove(file + i, rank - i)) break;
                if (!addMove(file - i, rank + i)) break;
            }
            break;

        case "knight":
            const knightMoves: Position[] = [
                [file + 2, rank + 1], [file + 2, rank - 1],
                [file - 2, rank + 1], [file - 2, rank - 1],
                [file + 1, rank + 2], [file + 1, rank - 2],
                [file - 1, rank + 2], [file - 1, rank - 2]
            ];
            for (const [f, r] of knightMoves) {
                if (isValidPosition(f, r)) {
                    const targetPiece = getPieceAtPosition(pieces, [f, r]);
                    if (!targetPiece || targetPiece.color !== color) {
                        moves.push([f, r]);
                    }
                }
            }
            break;

        case "king":
            const kingMoves: Position[] = [
                [file + 1, rank], [file - 1, rank],
                [file, rank + 1], [file, rank - 1],
                [file + 1, rank + 1], [file + 1, rank - 1],
                [file - 1, rank + 1], [file - 1, rank - 1]
            ];
            for (const [f, r] of kingMoves) {
                if (isValidPosition(f, r)) {
                    const targetPiece = getPieceAtPosition(pieces, [f, r]);
                    if (!targetPiece || targetPiece.color !== color) {
                        moves.push([f, r]);
                    }
                }
            }
            break;
    }

    return moves;
};

const isEndangered = (
    pieces: PieceType[],
    piece: PieceType,
  ): boolean => {
    const isKing = piece.type === "king";

    // Step 1: Check if the piece is in check or endangered
    if (isKing) {
      if (!isCheck(piece, pieces)) {
        return false; // The king is not in check, so it's not endangered
      }
    } else {
      // For other pieces, we need to check if this piece can be captured or if the king is still protected
      const isThreatened = (pos: Position): boolean => {
        const threats = pieces.filter(p => p.color !== piece.color);
        return threats.some(threat => {
          const threatMoves = getPossibleMoves(threat, pieces, getPieceAtPosition);
          return threatMoves.some(move => move[0] === pos[0] && move[1] === pos[1]);
        });
      };

      return isThreatened(piece.position);
    }

    // Step 2: Determine if the king is protected by other pieces
    const isKingProtected = (king: PieceType): boolean => {
      const threats = pieces.filter(p => p.color !== king.color);
      const blockingPieces = pieces.filter(p => p.color === king.color && p.type !== "king");

      // Check if any of the king's own pieces can block the check
      return blockingPieces.some(piece => {
        const possibleMoves = getPossibleMoves(piece, pieces, getPieceAtPosition);
        return threats.every(threat => {
          const threatMoves = getPossibleMoves(threat, pieces, getPieceAtPosition);
          return !possibleMoves.some(move => threatMoves.some(tMove => tMove[0] === move[0] && tMove[1] === move[1]));
        });
      });
    };

    if (isKing) {
      return isKingProtected(piece);
    }

    return false; // For non-king pieces, return false if not in immediate threat
  };

export {isMoveWithoutCheck, isCheck, isEndangered}