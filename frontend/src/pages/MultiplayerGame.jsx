// ✅ First: Fix MultiplayerGame.jsx
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Board from '../components/Board/Board';
import MoveList from '../components/MoveList';
import PlayerCard from '../components/PlayerCard.jsx';
import GameControls from '../components/GameControls.jsx';
import GameChat from '../components/GameChat.jsx';
import socket from '../socket/socket';
import {
  makeNewMove,
  setCandidateMoves,
  setCheckStatus,
  setCheckmate,
  setStalemate
} from '../reducer/actions/move.js';

const MultiplayerGame = () => {
  const { appstate, dispatch } = useContext(AppContext);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [showSidePanel, setShowSidePanel] = useState(true);
  const roomId = 'room1sssasa';

  useEffect(() => {
    socket.emit("joinRoom", roomId);

    const onWaiting = () => setGameStatus("waiting");
    const onOpponentJoined = () => setGameStatus("playing");

    socket.on("waiting", onWaiting);
    socket.on("opponent-joined", onOpponentJoined);

    socket.on("assign-color", (color) => {
      dispatch({ type: 'SET_PLAYER_COLOR', payload: color });
    });

   socket.on("opponent-move", ({ newPosition, newMove }) => {
  const isValidPosition = Array.isArray(newPosition) && 
                         newPosition.length === 8 &&
                         Array.isArray(newPosition[0]);
  
  if (!isValidPosition) {
    console.error("Invalid position received from opponent:", newPosition);
    return;
  }
  
  dispatch(makeNewMove({ newPosition, newMove }));
  dispatch(setCandidateMoves([]));
});


    socket.on("opponent-disconnected", () => {
      setGameStatus("opponent-disconnected");
    });

    return () => {
      socket.off("waiting", onWaiting);
      socket.off("opponent-joined", onOpponentJoined);
      socket.off("assign-color");
      socket.off("opponent-move");
      socket.off("opponent-disconnected");
    };
  }, [dispatch]);

  if (gameStatus === 'opponent-disconnected') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <h2 className="text-2xl text-amber-400 mb-4">Opponent Disconnected!</h2>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-amber-500 rounded-lg hover:bg-amber-600 transition"
        >
          Start New Game
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-stone-100 p-3 md:p-6">
      <div className="md:hidden flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-amber-400">Chess Match</h1>
        <button
          onClick={() => setShowSidePanel(!showSidePanel)}
          className="bg-stone-700 hover:bg-stone-600 p-2 rounded-lg"
        >
          {showSidePanel ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {gameStatus === 'waiting' ? (
        <div className="flex items-center justify-center h-full text-center text-2xl text-amber-400 mt-24">
          ⏳ Waiting for opponent to join...
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="md:col-span-3 lg:col-span-2 flex flex-col gap-4 md:gap-6">
            <div className="flex flex-col gap-3 md:gap-4">
              <div className={`md:block ${showSidePanel ? 'hidden md:block' : ''}`}>
                <PlayerCard
                  name="Opponent"
                  rating={1850}
                  color={appstate.playerColor === 'w' ? 'b' : 'w'}
                  isActive={!isMyTurn}
                  timeLeft="12:45"
                  isOpponent={true}
                />
              </div>

              <div className="w-full max-w-[600px] mx-auto">
                {/* ✅ Pass roomId to Board */}
                <Board
                  reversed={appstate.playerColor === 'b'}
                  roomId={roomId}
                  isMyTurn={isMyTurn}
                  setIsMyTurn={setIsMyTurn}
                  myColor={appstate.playerColor}
                />
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                <div className={`md:block ${showSidePanel ? 'hidden md:block' : ''}`}>
                  <PlayerCard
                    name="You"
                    rating={1920}
                    color={appstate.playerColor}
                    isActive={isMyTurn}
                    timeLeft="15:30"
                  />
                </div>
                <GameControls className="flex-grow" />
              </div>
            </div>
          </div>

          <div className={`flex flex-col gap-4 md:gap-6 ${showSidePanel ? 'block' : 'hidden md:block'}`}>
            <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-4 border border-white/10">
              <h3 className="text-lg font-bold text-amber-300 mb-3">Move History</h3>
              <MoveList />
            </div>
            <GameChat />
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiplayerGame;