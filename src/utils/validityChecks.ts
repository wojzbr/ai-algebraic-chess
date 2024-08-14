import { GetPieceAtPosition, GetPieceTypeFromLetter, IsInsideBoard, IsPathClear, IsSamePosition, PieceType, ValidateMove } from "../types";

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

const getPieceAtPosition: GetPieceAtPosition = (pieces, position) => {
    return pieces.find((piece: PieceType) => isSamePosition(piece.position, position));
  };

const isInsideBoard: IsInsideBoard = (position) => {
    const [x, y] = position;
    return x >= 0 && x <= 7 && y >= 0 && y <= 7;
  };

  const isSamePosition: IsSamePosition = (pos1, pos2) => {
    return pos1[0] === pos2[0] && pos1[1] === pos2[1];
  };

  const isAdjacent = (fileA: number, fileB: number) => {
    if (fileA < 0 || fileA > 7 || fileB < 0 || fileB > 7) {
      throw new Error("Invalid file");
    }
    if (Math.abs(fileA - fileB) !== 1) return false;
    else return true;
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

  const isPathClear: IsPathClear = (pieces, piece, newPosition) => {
    //check if move is vertical, horizontal or diagonal
    const [x, y] = piece.position;
    const [newX, newY] = newPosition;
    const deltaX = newX - x;
    const deltaY = newY - y;

    //check every square except of start and end squares accordingly

    if (deltaX === 0 && deltaY !== 0) {
      //vertical move, stepping along y axis
      const yIncrement = determineIncrement(y, newY);
      for (let i = y + yIncrement; Math.abs(newY-i) !== 0; i += yIncrement) {
        if (getPieceAtPosition(pieces, [x, i])) {
          return false;
        }
      }
    } else if (deltaX !== 0 && deltaY === 0) {
      //horizontal move, stepping along x axis
      const xIncrement = determineIncrement(x, newX);
      for (let i = x + xIncrement; Math.abs(newX-i) !== 0; i += xIncrement) {
        if (getPieceAtPosition(pieces, [i, y])) {
          return false;
        }
      }
    } else if (Math.abs(deltaX / deltaY) === 1) {
      //diagonal move, stepping along both axes
      const xIncrement = determineIncrement(x, newX);
      const yIncrement = determineIncrement(y, newY);
      for (
        let i = x + xIncrement, j = y + yIncrement;
        Math.abs(newX-i) !== 0 && Math.abs(newY-j) !== 0;
        i += xIncrement, j += yIncrement
      ) {
        if (getPieceAtPosition(pieces, [i, j])) {
          return false;
        }
      }
    }

    // path is clear if no colliding pieces found
    return true;
  };

  const validateMove: ValidateMove = (pieces, piece, newPosition) => {
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
          isPathClear(pieces, piece, newPosition)
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
          isPathClear(pieces, piece, newPosition)
        ) {
          return true;
        }
        break;

      case "queen":
        if (
          (Math.abs(deltaX) === Math.abs(deltaY) ||
            deltaX === 0 ||
            deltaY === 0) &&
          isPathClear(pieces, piece, newPosition)
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
            const pathIsClear = isPathClear(pieces, piece, newPosition);

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

  export {isPathClear, isSamePosition, isAdjacent, validateMove, getPieceAtPosition, getPieceTypeFromLetter}