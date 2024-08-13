// ChessContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PieceType, Position } from './types';
import InitializeChessboard from './InitializeChessboard';

interface ChessContextType {
  pieces: PieceType[];
  currentPlayer: string;
  playerColor: string;
  input: string;
  loader: boolean;
  promptMessages: { role: string; content: string }[];
  setInput: React.Dispatch<React.SetStateAction<string>>;
  setLoader: React.Dispatch<React.SetStateAction<boolean>>;
  setPromptMessages: React.Dispatch<React.SetStateAction<{ role: string; content: string }[]>>;
  switchPlayer: () => void;
  makeAlgebraicMove: (notation: string) => void;
}

const ChessContext = createContext<ChessContextType | undefined>(undefined);

export const ChessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [playerColor] = useState("black");
  const [currentPlayer, setCurrentPlayer] = useState("white");
  const [pieces, setPieces] = useState<PieceType[]>(InitializeChessboard(playerColor));
  const [promptMessages, setPromptMessages] = useState([
    {
      role: "system",
      content:
        "We are going to play a game of chess using algebraic notation. I will be playing as White, and you will be playing as Black. The Black King is positioned on e8. I will make the first move, and you will respond accordingly. Please announce your moves in standard algebraic notation and remember that I am controlling the White pieces while you control the Black pieces. To any message that's not a chess algebraic notation move you should reply with 'Provide a valid move! Reason:<short explanation on why the move isn't valid'. Let's begin!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loader, setLoader] = useState(false);

  const switchPlayer = () => {
    setCurrentPlayer(currentPlayer === "white" ? "black" : "white");
  };

  const makeAlgebraicMove = (notation: string) => {
    // Implementation of makeAlgebraicMove function
  };

  return (
    <ChessContext.Provider value={{
      pieces,
      currentPlayer,
      playerColor,
      input,
      loader,
      promptMessages,
      setInput,
      setLoader,
      setPromptMessages,
      switchPlayer,
      makeAlgebraicMove
    }}>
      {children}
    </ChessContext.Provider>
  );
};

export const useChess = () => {
  const context = useContext(ChessContext);
  if (!context) {
    throw new Error('useChess must be used within a ChessProvider');
  }
  return context;
};
