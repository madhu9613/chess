import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Cpu, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/local', icon: User, label: 'Local Play' },
        { path: '/practice', icon: Cpu, label: 'Practice vs AI' },
    ];

    return (
        <div className="min-h-screen">
            {/* Sidebar */}
            <div className={`fixed left-0 top-0 h-full bg-gradient-to-b from-black/90 via-black/85 to-black/80 backdrop-blur-xl border-r border-accent/20 transition-all duration-300 z-50 ${sidebarOpen ? 'w-64' : 'w-20'
                }`}>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute -right-3 top-6 bg-accent rounded-full p-1 text-white hover:scale-110 transition-transform"
                >
                    {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>

                <div className="p-4 mt-8">
                    <div className="mb-8 text-center">
                        {sidebarOpen ? (
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-accent via-orange-400 to-yellow-500 bg-clip-text text-transparent animate-pulse">
                                ♜ Chess
                            </h1>
                        ) : (
                            <div className="text-3xl text-accent">♜</div>
                        )}
                    </div>

                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-accent/20 text-accent border-l-4 border-accent'
                                            : 'hover:bg-white/10 text-gray-300'
                                        }`}
                                >
                                    <Icon size={20} />
                                    {sidebarOpen && <span>{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
                <main className="p-4 md:p-6 min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;