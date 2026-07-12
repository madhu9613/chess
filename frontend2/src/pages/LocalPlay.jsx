import Board from '../components/Board/Board';
import MoveList from '../components/MoveList';
import GameControls from '../components/GameControls';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

const LocalPlay = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-start"
        >
            <div className="flex-1 space-y-4">
                <div className="surface-panel rounded-[1.75rem] p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl gold-gradient text-[#140f08]">
                            <Crown size={20} />
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-[0.35em] text-white/40">Local Match</div>
                            <h2 className="text-xl font-semibold text-white">Same device, cleaner board.</h2>
                        </div>
                    </div>
                </div>
                <Board />
            </div>

            <div className="w-full space-y-4 lg:w-96">
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