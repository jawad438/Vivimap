
import React, { useState, useEffect } from 'react';
import { validateEmail, validatePassword, PasswordValidationResult, validateName, validateUsername, validateVerificationCode } from '../lib/validation';
import type { Session, User } from '../types';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onViewLegal: () => void;
    onAuthSuccess: (user: User) => void;
}

const API_BASE_URL = '/api';

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onViewLegal, onAuthSuccess }) => {
    const [authMode, setAuthMode] = useState<'signIn' | 'signUp' | 'verify'>('signIn');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    
    const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult>({ isValid: false, messages: [] });
    const [isTermsChecked, setIsTermsChecked] = useState(false);
    const [isHumanChecked, setIsHumanChecked] = useState(false);
    
    useEffect(() => {
        if (authMode === 'signUp') {
            const validation = validatePassword(password, email);
            setPasswordValidation(validation);
        }
    }, [password, email, authMode]);

    const handleApiResponse = async (response: Response) => {
        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (error) {
            throw new Error(`The server returned an invalid response (${response.status} ${response.statusText}). Response: "${responseText.substring(0, 150)}..."`);
        }
    
        if (!response.ok) {
            if (response.status === 403 && data.requiresVerification) {
                return data;
            }
            throw new Error(data.message || `Request failed with status ${response.status}`);
        }
        
        return data;
    };


    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            if (authMode === 'signUp') {
                const emailError = validateEmail(email);
                if (emailError) throw new Error(emailError);
                const nameError = validateName(fullName);
                if (nameError) throw new Error(nameError);
                const usernameError = validateUsername(username);
                if (usernameError) throw new Error(usernameError);
                if (!passwordValidation.isValid) throw new Error(passwordValidation.messages.join(' '));
                if (!isTermsChecked) throw new Error("You must agree to the terms and conditions.");
                if (!isHumanChecked) throw new Error("Please confirm you are not a robot.");

                const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email, password, fullName, username }),
                });

                const data = await handleApiResponse(response);
                setMessage(data.message);
                setAuthMode('verify');

            } else if (authMode === 'verify') {
                const codeError = validateVerificationCode(verificationCode);
                if (codeError) throw new Error(codeError);

                const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email, code: verificationCode }),
                });
                
                const data = await handleApiResponse(response);
                onAuthSuccess(data.user as User);

            } else { // signIn mode
                const emailError = validateEmail(email);
                if (emailError) throw new Error(emailError);

                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email, password }),
                });

                const data = await handleApiResponse(response);
                
                if (data.requiresVerification) {
                    setMessage(data.message);
                    setEmail(data.email);
                    setAuthMode('verify');
                    return;
                }

                onAuthSuccess(data.user as User);
            }
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleResendCode = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        try {
             const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email }),
            });
            const data = await handleApiResponse(response);
            setMessage(data.message);
        } catch (err: any) {
             setError(err.message || 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setAuthMode('signIn');
                setEmail('');
                setPassword('');
                setFullName('');
                setUsername('');
                setVerificationCode('');
                setLoading(false);
                setMessage('');
                setError('');
                setIsTermsChecked(false);
                setIsHumanChecked(false);
            }, 300);
        }
    }, [isOpen]);

     const toggleMode = (mode: 'signIn' | 'signUp') => {
        setAuthMode(mode);
        setError('');
        setMessage('');
        setPassword('');
        setFullName('');
        setUsername('');
        setVerificationCode('');
        setIsHumanChecked(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-sm m-4" onClick={(e) => e.stopPropagation()}>
                <div className="p-8 space-y-6">

                    {authMode === 'verify' ? (
                         <div>
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verify Your Email</h2>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">
                                   Enter the 5-digit code sent to <span className="font-medium text-emerald-500">{email}</span>.
                                </p>
                            </div>
                            <form onSubmit={handleAuthAction} className="space-y-4 pt-6">
                                <div>
                                    <label htmlFor="code" className="sr-only">Verification Code</label>
                                    <input
                                        type="text"
                                        id="code"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-3 text-center text-2xl tracking-[0.5em] text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="•••••"
                                        maxLength={5}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                {message && <p className="text-sm text-center text-emerald-500">{message}</p>}
                                {error && <p className="text-sm text-center text-red-500">{error}</p>}
                                <button type="submit" className="w-full px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition-colors disabled:bg-gray-400" disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify Account'}
                                </button>
                            </form>
                             <p className="text-sm text-center text-gray-500 dark:text-gray-400 pt-4">
                                Didn't receive a code?{' '}
                                <button onClick={handleResendCode} className="font-medium text-emerald-600 hover:underline" disabled={loading}>
                                    Resend
                                </button>
                            </p>
                         </div>
                    ) : (
                        <>
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {authMode === 'signIn' ? 'Welcome Back' : 'Create an Account'}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">
                                   {authMode === 'signIn' ? 'Sign in to continue to Vivimap' : 'Join the community of explorers.'}
                                </p>
                            </div>
                            <form onSubmit={handleAuthAction} className="space-y-4">
                                {authMode === 'signUp' && (
                                     <>
                                        <div>
                                            <label htmlFor="fullName" className="sr-only">Full Name</label>
                                            <input
                                                type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                placeholder="Your Full Name" required disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="username" className="sr-only">Username</label>
                                            <input
                                                type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                placeholder="Choose a Username" required disabled={loading}
                                            />
                                        </div>
                                     </>
                                )}
                                <div>
                                    <label htmlFor="email" className="sr-only">Email</label>
                                    <input
                                        type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="your@email.com" required disabled={loading}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password_field" className="sr-only">Password</label>
                                    <input
                                        type="password" id="password_field" value={password} onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="••••••••••••" required disabled={loading}
                                    />
                                </div>
                                {authMode === 'signUp' && (
                                    <div className="space-y-4">
                                        <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pl-1">
                                            {passwordValidation.messages.map((msg, i) => <li key={i}>{msg}</li>)}
                                        </ul>
                                        <div className="flex items-center gap-3">
                                            <input
                                                id="human_check"
                                                type="checkbox"
                                                checked={isHumanChecked}
                                                onChange={(e) => setIsHumanChecked(e.target.checked)}
                                                className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <label htmlFor="human_check" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                I am not a robot
                                            </label>
                                        </div>
                                        <div className="flex items-start">
                                            <input id="terms" type="checkbox" checked={isTermsChecked} onChange={(e) => setIsTermsChecked(e.target.checked)} className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mt-0.5" />
                                            <label htmlFor="terms" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                                I have read and agree to the <button type="button" onClick={onViewLegal} className="font-medium text-emerald-600 hover:underline">Terms and Conditions</button>.
                                            </label>
                                        </div>
                                    </div>
                                )}
                                {message && <p className="text-sm text-center text-emerald-500">{message}</p>}
                                {error && <p className="text-sm text-center text-red-500">{error}</p>}
                                <button type="submit" className="w-full px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-emerald-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={loading}>
                                    {loading ? 'Processing...' : (authMode === 'signIn' ? 'Sign In' : 'Create Account')}
                                </button>
                            </form>
                             <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                                {authMode === 'signIn' ? "Don't have an account?" : "Already have an account?"}{' '}
                                <button onClick={() => toggleMode(authMode === 'signIn' ? 'signUp' : 'signIn')} className="font-medium text-emerald-600 hover:underline">
                                    {authMode === 'signIn' ? 'Sign Up' : 'Sign In'}
                                </button>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
