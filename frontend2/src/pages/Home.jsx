import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Cpu, Users, ArrowRight, Shield, Sparkles, Sword, Radar } from 'lucide-react';

const Home = () => {
    const gameModes = [
        { path: '/local', icon: User, title: 'Local Play', description: 'Pass the board and play head-to-head on one device.', accent: 'from-sky-400 to-cyan-300' },
        { path: '/practice', icon: Cpu, title: 'Practice vs AI', description: 'Train against a quick computer opponent and sharpen tactics.', accent: 'from-emerald-400 to-teal-300' },
        { path: '/analysis', icon: Radar, title: 'Analysis', description: 'Review positions, move lists, and recent games from this app.', accent: 'from-violet-400 to-fuchsia-300' },
        { path: '/multiplayer', icon: Users, title: 'Multiplayer', description: 'Create a room, share the code, and play live online.', accent: 'from-amber-400 to-orange-300' },
    ];

    const stats = [
        { label: 'Modes', value: '4' },
        { label: 'Board States', value: 'Live' },
        { label: 'Match Feel', value: 'Cinematic' },
    ];

    return (
        <div className="space-y-8 lg:space-y-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center"
            >
                <div className="surface-panel relative overflow-hidden rounded-[2rem] p-8 md:p-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(242,178,51,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(231,111,81,0.1),transparent_30%)]" />
                    <div className="relative space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/60">
                            <Sparkles size={14} className="text-amber-300" />
                            Tactical chess, redesigned
                        </div>
                        <div>
                            <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
                                A sharper board for faster decisions.
                            </h1>
                            <p className="mt-5 max-w-xl text-base leading-7 text-white/68 md:text-lg">
                                Grandmaster Arcade brings local play, practice, and multiplayer into a cleaner interface with a board-focused layout and stronger match feedback.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {stats.map((stat) => (
                                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                    <div className="text-xs uppercase tracking-[0.35em] text-white/35">{stat.label}</div>
                                    <div className="mt-1 text-lg font-semibold text-white">{stat.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    {[
                        { icon: Shield, title: 'Focused layout', copy: 'Less chrome, more board.' },
                        { icon: Sword, title: 'Match-ready panels', copy: 'Move history and controls stay readable.' },
                        { icon: Sparkles, title: 'Premium contrast', copy: 'Warm highlights over a deep, cinematic base.' },
                    ].map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.title} className="surface-panel-soft rounded-3xl p-5">
                                <Icon className="text-amber-300" size={20} />
                                <div className="mt-4 text-lg font-semibold text-white">{item.title}</div>
                                <div className="mt-2 text-sm leading-6 text-white/62">{item.copy}</div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {gameModes.map((mode, index) => {
                    const Icon = mode.icon;
                    return (
                        <motion.div
                            key={mode.path}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 }}
                        >
                            <Link to={mode.path} className="group block h-full">
                                <div className="surface-panel-soft relative h-full overflow-hidden rounded-[1.75rem] p-6 transition-transform duration-300 group-hover:-translate-y-1">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${mode.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-12`} />
                                    <div className="relative flex h-full flex-col">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl gold-gradient text-[#150f08] shadow-lg shadow-black/20">
                                                <Icon size={28} />
                                            </div>
                                            <ArrowRight className="mt-1 text-white/30 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white" size={20} />
                                        </div>
                                        <h3 className="mt-6 text-2xl font-semibold text-white">{mode.title}</h3>
                                        <p className="mt-3 flex-1 text-sm leading-6 text-white/62">{mode.description}</p>
                                        <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-amber-200">
                                            Enter mode
                                            <ArrowRight size={16} />
                                        </div>
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