// src/components/Auth.js
import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Make sure this path is correct

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false); // State to toggle between login/signup
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setMessageType('');

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setMessage(error.message);
            setMessageType('error');
        } else {
            setMessage('Logged in successfully!');
            setMessageType('success');
            // Supabase's onAuthStateChange listener in App.js will handle redirect
        }
        setLoading(false);
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setMessageType('');

        const { error } = await supabase.auth.signUp({ email, password });

        if (error) {
            setMessage(error.message);
            setMessageType('error');
        } else {
            setMessage('Registration successful! Please check your email for a confirmation link.');
            setMessageType('success');
            setEmail('');
            setPassword('');
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        setLoading(true);
        setMessage('');
        setMessageType('');
        const { error } = await supabase.auth.signOut();
        if (error) {
            setMessage(error.message);
            setMessageType('error');
        } else {
            setMessage('Logged out successfully!');
            setMessageType('success');
        }
        setLoading(false);
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed"
            style={{ backgroundImage: `url('https://itywlbigsmahjxekhrcw.supabase.co/storage/v1/object/public/chauffeur-media/photo_couverture/3409297.jpg')` }}
        >
            {/* Overlay to make text more readable */}
            <div className="absolute inset-0 bg-black opacity-50"></div>

            <div className="relative z-10 p-8 rounded-lg shadow-lg bg-white bg-opacity-90 max-w-md w-full">
                <h1 className="text-3xl font-bold mb-6 text-gray-900 text-center">
                    {isSignUp ? 'Créer un compte' : 'Connexion'}
                </h1>

                {message && (
                    <div
                        className={`mb-4 p-3 rounded-md w-full text-center text-sm ${
                            messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                    >
                        {message}
                    </div>
                )}

                <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="w-full">
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                            Email:
                        </label>
                        <input
                            id="email"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="email"
                            placeholder="Votre adresse email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                            Mot de passe:
                        </label>
                        <input
                            id="password"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            type="password"
                            placeholder="Votre mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Chargement...' : (isSignUp ? 'S\'inscrire' : 'Se connecter')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800"
                        >
                            {isSignUp ? 'Déjà un compte? Connectez-vous' : 'Pas de compte? Inscrivez-vous'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}