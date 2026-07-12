import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { completeGoogleLogin } = useAuth();
    const [message, setMessage] = useState('Finalizing sign in...');

    useEffect(() => {
        const token = searchParams.get('token');
        const returnTo = searchParams.get('returnTo') || '/multiplayer';

        if (!token) {
            setMessage('Authentication failed. Redirecting...');
            const timer = setTimeout(() => navigate('/auth', { replace: true }), 1500);
            return () => clearTimeout(timer);
        }

        completeGoogleLogin(token);
        setMessage('Authentication complete. Redirecting...');
        const timer = setTimeout(() => navigate(returnTo, { replace: true }), 800);
        return () => clearTimeout(timer);
    }, [completeGoogleLogin, navigate, searchParams]);

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
            <div className="surface-panel rounded-[2rem] px-8 py-10 text-center">
                <div className="text-xs uppercase tracking-[0.35em] text-white/35">Google auth</div>
                <div className="mt-3 text-2xl font-semibold text-white">{message}</div>
            </div>
        </div>
    );
};

export default AuthCallback;
