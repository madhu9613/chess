// src/components/PromoteModal.jsx
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const pieces = import.meta.glob('../assets/pieces/*.png', {
  eager: true,
  import: 'default'
});

const pieceImages = {};
for (const path in pieces) {
  const fileName = path.split('/').pop().replace('.png', '');
  pieceImages[fileName] = pieces[path];
}

const PromoteModal = () => {
  const { appstate, dispatch } = useContext(AppContext);
  const promotion = appstate.promotion;
  if (!promotion) return null;

  const turn = promotion.piece[0];
  const options = ['q', 'r', 'b', 'n'];

  const handleSelect = (type) => {
    dispatch({
      type: 'COMPLETE_PROMOTION',
      payload: {
        to: promotion.to,
        from: promotion.from,
        promotedPiece: `${turn}${type}`,
        captured: promotion.captured,
        originalPiece: promotion.piece
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-xl shadow-md grid grid-cols-4 gap-4">
        {options.map(type => {
          const pieceCode = `${turn}${type}`;
          return (
            <img
              key={type}
              src={pieceImages[pieceCode]}
              alt={pieceCode}
              className="w-14 h-14 cursor-pointer hover:scale-110 transition-transform"
              onClick={() => handleSelect(type)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PromoteModal;
