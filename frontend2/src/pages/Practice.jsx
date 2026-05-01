import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Board from '../components/Board/Board';
import MoveList from '../components/MoveList';
import GameControls from '../components/GameControls';
import { motion } from 'framer-motion';
import { selectGame, makeMove } from '../store/gameSlice';

const Practice = () => {
    const dispatch = useDispatch();
    const game = useSelector(selectGame);
    const [aiThinking, setAiThinking] = useState(false);
    const [difficulty, setDifficulty] = useState('medium');

    const getRandomAIMove = () => {
        const moves = game.getAllValidMoves();
        if (moves.length > 0) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            const from = `${String.fromCharCode(97 + randomMove.from.col)}${8 - randomMove.from.row}`;
            const to = `${String.fromCharCode(97 + randomMove.to.col)}${8 - randomMove.to.row}`;
            dispatch(makeMove({ from, to }));
        }
        setAiThinking(false);
    };

    const makeMoveWithAI = (from, to) => {
        dispatch(makeMove({ from, to }));

        setTimeout(() => {
            if (!game.isGameOver() && game.getTurn() !== 'w') {
                setAiThinking(true);
                setTimeout(() => getRandomAIMove(), 500);
            }
        }, 100);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col lg:flex-row gap-6 justify-center items-start"
        >
            <div className="flex-1 flex justify-center">
                <div className="relative">
                    <Board />
                    {aiThinking && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 z-10">
                            <span className="text-accent">AI is thinking...</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full lg:w-80">
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold mb-2">AI Difficulty</h3>
                    <div className="flex gap-2">
                        {['easy', 'medium', 'hard'].map((level) => (
                            <button
                                key={level}
                                onClick={() => setDifficulty(level)}
                                className={`flex-1 py-2 rounded-lg capitalize transition-colors cursor-pointer ${difficulty === level
                                        ? 'bg-accent text-white'
                                        : 'bg-white/10 hover:bg-white/20'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
                <GameControls />
                <div className="mt-4">
                    <MoveList />
                </div>
            </div>
        </motion.div>
    );
};

export default Practice;