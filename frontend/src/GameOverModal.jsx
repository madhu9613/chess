import React from 'react';

// Icon components
const CrownIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
  </svg>
);

const ScaleIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 3c-.5 0-.9.4-1 .9L9.1 9H2c-.6 0-1 .4-1 1s.4 1 1 1h6.5l-1.8 5H2c-.6 0-1 .4-1 1s.4 1 1 1h4.3l-1.3 3.9c-.2.5.1 1.1.7 1.2.5.2 1.1-.1 1.2-.7l.1-.4h8.2l.1.4c.1.6.6.9 1.2.7.6-.1.9-.7.7-1.2L17.7 18H22c.6 0 1-.4 1-1s-.4-1-1-1h-4.7l-1.8-5H22c.6 0 1-.4 1-1s-.4-1-1-1h-7.1L13 3.9c-.1-.5-.5-.9-1-.9zm-1.7 6l1.7-5 1.7 5h-3.4zm-3.4 8l1.8-5h3.2l1.8 5H7.9z"/>
  </svg>
);

const ReplayIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 5V1L7 6l5 5V7c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6H4c0 4.4 3.6 8 8 8s8-3.6 8-8-3.6-8-8-8z"/>
  </svg>
);

const NewGameIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
);

// Main Modal Component
const GameOverModal = ({ type, loser, onNewGame, onReplay }) => {
  const winner = loser === 'w' ? 'Black' : 'White';
  const isCheckmate = type === 'checkmate';

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-amber-400 rounded-2xl max-w-md w-full p-8 text-center animate-fade-in">
        
        <div className="mb-6 flex justify-center">
          <div className="bg-amber-500 w-24 h-24 rounded-full flex items-center justify-center shadow-lg">
            {isCheckmate ? (
              <CrownIcon className="text-white w-16 h-16" />
            ) : (
              <ScaleIcon className="text-white w-16 h-16" />
            )}
          </div>
        </div>

        <h2 className="text-4xl font-bold text-amber-400 mb-2">
          {isCheckmate ? 'Checkmate!' : 'Stalemate!'}
        </h2>

        <p className="text-xl text-white mb-8">
          {isCheckmate ? `${winner} wins the game!` : 'Game ends in a draw.'}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onReplay}
            className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all hover:scale-[1.03] flex items-center justify-center gap-2"
          >
            <ReplayIcon className="w-5 h-5" />
            Replay
          </button>

          <button
            onClick={onNewGame}
            className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all hover:scale-[1.03] flex items-center justify-center gap-2"
          >
            <NewGameIcon className="w-5 h-5" />
            New Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;