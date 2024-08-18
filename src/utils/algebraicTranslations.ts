import { FromAlgebraic, PieceType, Position, ToAlgebraic } from "../types";
import { getPieceTypeFromLetter, isAdjacent, isPathClear, isSamePosition } from "./validityChecks";

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

const fromAlgebraic: FromAlgebraic = (pieces, notation, currentPlayer, options) => {
    const isCheck = options?.isCheck || notation.includes("+");
    const isCheckmate = options?.isCheckmate || notation.includes("#");
    const isCapture = options?.isCapture || notation.includes("x");
    const isPromotion = options?.isPromotion || notation.includes("=");
    const isCastling =
      options?.isCastling || notation === "O-O" || notation === "O-O-O";
    const cleanNotation = notation.replace(/[\+#x=]/g, "");
    const promotionPiece = isPromotion
      ? cleanNotation.match(/([A-Z])[^A-Z]*$/)?.[0]
      : undefined;
    const moveParts = cleanNotation.split("");

    let newPosition: Position;
    let pieceType = "pawn";
    let startFile: number | undefined;
    let startRank: number | undefined;

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
                    isPathClear(pieces, p, newPosition) &&
                    (deltaX === 0 || deltaY === 0)
                  );
                case "knight":
                  const isLmove =
                    (deltaX === 2 && deltaY === 1) ||
                    (deltaX === 1 && deltaY === 2);
                  return isLmove;
                case "bishop":
                  return isPathClear(pieces, p, newPosition) && deltaX === deltaY;
                case "queen":
                  return (
                    isPathClear(pieces, p, newPosition) &&
                    (deltaX === 0 || deltaY === 0 || deltaX === deltaY)
                  );
                case "king":
                  return (
                    isPathClear(pieces, p, newPosition) &&
                    deltaX <= 1 &&
                    deltaY <= 1 &&
                    deltaX >= 0 &&
                    deltaY >= 0
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
                    startFile !== undefined &&
                    p.position[0] === startFile &&
                    isAdjacent(startFile, endFile)
                  )
                    return true;
                  else return false;
                case "rook":
                  return (
                    isPathClear(pieces, p, newPosition) &&
                    (deltaX === 0 || deltaY === 0) &&
                    (startFile === p.position[0] || startRank === p.position[1])
                  );
                case "knight":
                  const isLmove =
                    (deltaX === 2 && deltaY === 1) ||
                    (deltaX === 1 && deltaY === 2);
                  return (
                    isLmove &&
                    (startFile === p.position[0] || startRank === p.position[1])
                  );
                case "bishop":
                  return (
                    isPathClear(pieces, p, newPosition) &&
                    deltaX === deltaY &&
                    (startFile === p.position[0] || startRank === p.position[1])
                  );
                case "queen":
                  return (
                    isPathClear(pieces,p, newPosition) &&
                    (deltaX === 0 || deltaY === 0 || deltaX === deltaY) &&
                    (startFile === p.position[0] || startRank === p.position[1])
                  );
                case "king":
                  return (
                    isPathClear(pieces,p, newPosition) &&
                    deltaX <= 1 &&
                    deltaY <= 1 &&
                    deltaX >= 0 &&
                    deltaY >= 0 &&
                    (startFile === p.position[0] || startRank === p.position[1])
                  );
                default:
              }
            });
          } else {
            // file/rank + newPosition
            // sth like Qed5 or Q4d5
            matchingPieces = potentialPieces.filter((p) => {
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
                    startFile !== undefined &&
                    p.position[0] === startFile &&
                    startFile === endFile
                  )
                    return true;
                  else return false;
                case "rook":
                  return (
                    isPathClear(pieces,p, newPosition) &&
                    (deltaX === 0 || deltaY === 0) &&
                    (startFile === p.position[0] || startRank === p.position[1])
                  );
                case "knight":
                  const isLmove =
                    (deltaX === 2 && deltaY === 1) ||
                    (deltaX === 1 && deltaY === 2);
                  return (
                    isLmove &&
                    (startFile === p.position[0] || startRank === p.position[1])
                  );
                case "bishop":
                  return (
                    isPathClear(pieces,p, newPosition) &&
                    deltaX === deltaY &&
                    (startFile === p.position[0] || startRank === p.position[1])
                  );
                case "queen":
                  return (
                    isPathClear(pieces,p, newPosition) &&
                    (deltaX === 0 || deltaY === 0 || deltaX === deltaY) &&
                    (startFile === p.position[0] || startRank === p.position[1])
                  );
                case "king":
                  return (
                    isPathClear(pieces,p, newPosition) &&
                    deltaX <= 1 &&
                    deltaY <= 1 &&
                    deltaX >= 0 &&
                    deltaY >= 0 &&
                    (startFile === p.position[0] || startRank === p.position[1])
                  );
                default:
              }
            });
          }
          break;
        case 4:
          matchingPieces = potentialPieces.filter((p) => {
            startFile = moveParts[0].charCodeAt(0) - 97;
            startRank = parseInt(moveParts[0]);
            return isSamePosition(p.position, [startFile, startRank]);
          });
          break;
        default:
          throw new Error("Incorrect moveParts length");
      }
    } else {
      throw new Error("Incorrect move parts notation");
    }
    if (matchingPieces.length > 1 && startFile === undefined && startRank === undefined) {
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

  export {toAlgebraic, fromAlgebraic}