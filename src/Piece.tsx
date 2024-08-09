import React, { useState, useEffect } from "react";
import { Move, PieceType, Position } from "./types";

const getSvgPath = async (type: string, color: string): Promise<string> => {
  const colorInitial = color.charAt(0).toLowerCase();
  try {
    const svg = await import(`./svg_pieces/${colorInitial}_${type}.svg`);
    return svg.default;
  } catch (error) {
    console.error(`SVG for ${color} ${type} not found.`);
    return "";
  }
};

interface PieceProps extends PieceType {
  movePiece?: (move: Move)=> void;
}

const Piece: React.FC<PieceProps> = ({ type, position, color, id, movePiece }) => {
  const [svgPath, setSvgPath] = useState<string>("");

  useEffect(() => {
    const fetchSvg = async () => {
      const path = await getSvgPath(type, color);
      setSvgPath(path);
    };

    fetchSvg();
  }, [type, color]);

  return (
    <div className="piece">
      {svgPath ? (
        <img src={svgPath} alt={`${color} ${type}`} />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

export default Piece;
