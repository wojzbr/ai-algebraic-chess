export interface PieceType {
    type: string;
    position: Position;
    color: string;
    id: string;
    hasMoved: boolean;
  }

export type Position = [number, number];

export type SwitchPlayer = () => void;

export type RenderPiece = (position: Position) => React.ReactNode;

export type IsInsideBoard = (position: Position) => boolean;

export type IsSamePosition = (pos1: Position, pos2: Position) => boolean;

export type GetPieceAtPosition = (
  pieces: PieceType[],
  position: Position
) => PieceType | undefined;

export type IsPathClear = (
  piece: PieceType,
  newPosition: Position
) => boolean;

export type ValidateMove = (piece: PieceType, newPosition: Position) => boolean;

export type TranslateToAlgebraic = (
  piece: PieceType,
  newPosition: Position,
  capture?: boolean,
  promotion?: string
) => string;

export type TranslateFromAlgebraic = (
  notation: string
) => Move;

export type MakeMove = (moves: Move) => void;

export type Move = { piece: PieceType; newPosition: Position };

export type MakeAlgebraicMove = (notation: string) => void;

export type CapturePiece = (capturedPiece: PieceType) => void;

export type GetPieceTypeFromLetter = (letter: string) => string;
