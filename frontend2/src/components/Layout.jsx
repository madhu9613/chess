import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Cpu, Users, ChevronLeft, ChevronRight, Eye, LogIn, LogOut, Sparkles, Radar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationToaster from './NotificationToaster';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const { user, isAuthenticated, logout } = useAuth();

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/local', icon: User, label: 'Local Play' },
        { path: '/practice', icon: Cpu, label: 'Practice vs AI' },
        { path: '/analysis', icon: Radar, label: 'Analysis' },
        { path: '/multiplayer', icon: Users, label: 'Multiplayer' },
        { path: '/watch', icon: Eye, label: 'Watch Live' },
    ];

    return (
        <div className="app-shell min-h-screen text-[#f4efe6]">
            <NotificationToaster />
            <div className="pointer-events-none fixed inset-0 subtle-grid opacity-25" />

            <div className={`fixed left-0 top-0 z-50 h-full transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-24'}`}>
                <div className="surface-panel h-full border-r border-white/10 px-4 py-5">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="absolute -right-3 top-6 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 gold-gradient text-[#120f08] shadow-lg shadow-black/40 transition-transform hover:scale-110"
                    >
                        {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>

                    <div className="mt-6 flex h-full min-h-0 flex-col">
                        <div className="mb-8 text-center">
                            {sidebarOpen ? (
                                <h1 className="text-2xl font-bold tracking-[0.35em] text-gradient uppercase">
                                    Grandmaster
                                </h1>
                            ) : (
                                <div className="text-3xl text-gradient">♜</div>
                            )}
                            {sidebarOpen && <p className="mt-2 text-xs uppercase tracking-[0.4em] text-white/45">Arcade</p>}
                        </div>

                        <nav className="space-y-2">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 ${isActive
                                                ? 'surface-panel-soft border border-amber-300/30 text-white shadow-lg shadow-amber-500/10'
                                                : 'text-white/68 hover:bg-white/6 hover:text-white'
                                            }`}
                                    >
                                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${isActive ? 'gold-gradient text-[#130f08]' : 'bg-white/6 text-white/75 group-hover:bg-white/10'}`}>
                                            <Icon size={18} />
                                        </span>
                                        {sidebarOpen && <span className="font-medium tracking-wide">{item.label}</span>}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/72">
                            {sidebarOpen ? (
                                <>
                                    <div className="text-xs uppercase tracking-[0.35em] text-white/40">Mode</div>
                                    <div className="mt-2 font-semibold text-white">Sharp positions, clean interface.</div>
                                    <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
                                        <Sparkles size={14} className="text-amber-300" />
                                        {isAuthenticated ? user?.name : 'Guest spectator mode'}
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        {isAuthenticated ? (
                                            <button
                                                onClick={logout}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10"
                                            >
                                                <LogOut size={14} />
                                                Logout
                                            </button>
                                        ) : (
                                            <Link to="/auth" className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/15 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-300/25">
                                                <LogIn size={14} />
                                                Sign in
                                            </Link>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-center">
                                    {isAuthenticated ? (
                                        <button
                                            onClick={logout}
                                            title="Logout"
                                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/85 transition-colors hover:bg-white/10"
                                        >
                                            <LogOut size={16} />
                                        </button>
                                    ) : (
                                        <Link
                                            to="/auth"
                                            title="Sign in"
                                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-300/15 text-white transition-colors hover:bg-amber-300/25"
                                        >
                                            <LogIn size={16} />
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-24'}`}>
                <main className="min-h-screen px-4 py-5 md:px-6 lg:px-8">
                    <div className="surface-panel mb-6 flex items-center justify-between gap-4 rounded-3xl px-5 py-4">
                        <div>
                            <div className="text-xs uppercase tracking-[0.4em] text-white/40">Current Arena</div>
                            <div className="mt-1 text-lg font-semibold text-white/90">
                                {navItems.find((item) => item.path === location.pathname)?.label || 'Home'}
                            </div>
                        </div>
                        <div className="hidden text-right text-sm text-white/55 md:block">
                            Choose a mode, make a move, keep the board clean.
                        </div>
                    </div>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;