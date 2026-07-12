import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Globe2, Mail, Lock, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnTo = searchParams.get('returnTo') || '/multiplayer';
    const { login, register, startGoogleLogin } = useAuth();
    const [mode, setMode] = useState('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        if (mode === 'register' && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            if (mode === 'register') {
                await register(name, email, password);
            } else {
                await login(email, password);
            }
            navigate(returnTo, { replace: true });
        } catch (submitError) {
            setError(submitError.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center px-4 py-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]"
            >
                <div className="surface-panel overflow-hidden rounded-[2rem] p-8 md:p-10">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/60">
                        Grandmaster Access
                    </div>
                    <h1 className="mt-6 max-w-xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                        Sign in to play. Watch without an account.
                    </h1>
                    <p className="mt-4 max-w-xl text-base leading-7 text-white/65">
                        Email and password unlock live play. Google login is available as a one-click path. Guests can still watch live rooms and leave up to five chat messages per room.
                    </p>
                    <div className="mt-8 grid gap-3 sm:grid-cols-3">
                        {[
                            { label: 'Play', value: 'Auth required' },
                            { label: 'Watch', value: 'Open access' },
                            { label: 'Chat', value: 'Guest-limited' },
                        ].map((item) => (
                            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                                <div className="text-xs uppercase tracking-[0.35em] text-white/35">{item.label}</div>
                                <div className="mt-2 text-lg font-semibold text-white">{item.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="surface-panel-soft rounded-[2rem] p-6 md:p-8">
                    <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
                        <button
                            onClick={() => setMode('login')}
                            className={`flex-1 rounded-xl px-4 py-2 font-semibold ${mode === 'login' ? 'gold-gradient text-[#130f08]' : 'text-white/70'}`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setMode('register')}
                            className={`flex-1 rounded-xl px-4 py-2 font-semibold ${mode === 'register' ? 'gold-gradient text-[#130f08]' : 'text-white/70'}`}
                        >
                            Register
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        {mode === 'register' && (
                            <label className="block">
                                <span className="mb-2 block text-sm text-white/70">Name</span>
                                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                                    <UserRound size={18} className="text-amber-200" />
                                    <input
                                        value={name}
                                        onChange={(event) => setName(event.target.value)}
                                        className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                                        placeholder="Your name"
                                    />
                                </div>
                            </label>
                        )}

                        <label className="block">
                            <span className="mb-2 block text-sm text-white/70">Email</span>
                            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                                <Mail size={18} className="text-amber-200" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm text-white/70">Password</span>
                            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                                <Lock size={18} className="text-amber-200" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                                    placeholder="At least 8 characters"
                                />
                            </div>
                        </label>

                        {mode === 'register' && (
                            <label className="block">
                                <span className="mb-2 block text-sm text-white/70">Confirm Password</span>
                                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                                    <Lock size={18} className="text-amber-200" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(event) => setConfirmPassword(event.target.value)}
                                        className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                                        placeholder="Confirm password"
                                    />
                                </div>
                            </label>
                        )}

                        {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/15 px-4 py-3 font-semibold text-white transition-colors hover:bg-amber-300/25 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Sign in'}
                            <ArrowRight size={18} />
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/35">
                        <span className="h-px flex-1 bg-white/10" />
                        or
                        <span className="h-px flex-1 bg-white/10" />
                    </div>

                    <button
                        onClick={() => startGoogleLogin(returnTo)}
                        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                    >
                        <Globe2 size={18} />
                        Continue with Google
                    </button>

                    <button
                        onClick={() => navigate('/watch')}
                        className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/10"
                    >
                        Watch as guest instead
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthPage;
