import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Cpu, ArrowRight } from 'lucide-react';

const Home = () => {
    const gameModes = [
        { path: '/local', icon: User, title: 'Local Play', description: 'Play with a friend on the same device', color: 'from-blue-500 to-cyan-500' },
        { path: '/practice', icon: Cpu, title: 'Practice vs AI', description: 'Improve your skills against computer', color: 'from-green-500 to-emerald-500' },
    ];

    return (
        <div className="min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-accent to-purple-500 bg-clip-text text-transparent">
                    Chess Master
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Experience the ultimate chess game with stunning visuals and powerful AI opponent
                </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {gameModes.map((mode, index) => {
                    const Icon = mode.icon;
                    return (
                        <motion.div
                            key={mode.path}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link to={mode.path}>
                                <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-accent/50 transition-all duration-300 hover:scale-105">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`} />
                                    <Icon size={48} className="mb-4 text-accent" />
                                    <h3 className="text-xl font-semibold mb-2">{mode.title}</h3>
                                    <p className="text-gray-400 text-sm mb-4">{mode.description}</p>
                                    <div className="flex items-center text-accent text-sm group-hover:gap-2 transition-all">
                                        Play Now <ArrowRight size={16} className="ml-1" />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default Home;