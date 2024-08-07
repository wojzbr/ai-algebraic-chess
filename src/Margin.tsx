import React from 'react';

type Direction = 'horizontal' | 'vertical';

interface MarginProps {
  direction: Direction;
}

const Margin: React.FC<MarginProps> = ({ direction }) => {
  return (
    <div className={`${direction} margin`}>
      {Array.from({ length: 8 }, (_, index) => {
        return direction === 'horizontal' ? (
          <div key={index} className="file">
            {String.fromCharCode(97 + index)}
          </div>
        ) : (
          <div key={index} className="rank">
            {index + 1}
          </div>
        );
      })}
    </div>
  );
};

export default Margin;
