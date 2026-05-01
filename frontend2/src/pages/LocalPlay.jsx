import React from 'react';
import Board from '../components/Board/Board';
import MoveList from '../components/MoveList';
import GameControls from '../components/GameControls';
import { motion } from 'framer-motion';

const LocalPlay = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col lg:flex-row gap-8 justify-center items-start max-w-7xl mx-auto"
        >
            <div className="flex-1 flex justify-center">
                <Board />
            </div>

            <div className="w-full lg:w-96 space-y-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <GameControls />
                </motion.div>
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <MoveList />
                </motion.div>
            </div>
        </motion.div>
    );
};

export default LocalPlay;