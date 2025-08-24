import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "react-hot-toast"
import { AuthContext } from "../Context/AuthContext";

const Login = () => {
    const { setUser } = useContext(AuthContext);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showForgot, setShowForgot] = useState(false);
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: "include",
                body: JSON.stringify({
                    username,
                    password
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            toast.success('Login Successful!');
            setUser(data.user);
            if (data.user.accesstype_id.name === "Engineer") {
                setUser({
                    user: data.user,
                    role: data.role,
                    engineerData: data.engineer || null,
                });
                navigate('/engineer/dashboard');
            } else {
                return navigate('/dashboard');
            }

        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Password reset request failed');
            }

            // Success handling
            console.log('Reset link sent:', data);
            alert('Password reset link has been sent to your email');
            setShowForgot(false);

        } catch (err) {
            console.error('Forgot password error:', err);
            setError(err.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center lg:justify-start lg:px-28 p-4"
            style={{
                backgroundSize: 'cover',
                backgroundImage: 'url(./loginbg.jpg)',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
            }}
        >
            <div className="bg-white/70 p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md transition-all duration-700 ease-in-out animate-fade-in">
                <img src="./logo.png" alt="Logo" className="w-32 sm:w-40 mx-auto mb-4 sm:mb-6" />

                {/* Error Message Display */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                        {error}
                    </div>
                )}

                {!showForgot ? (
                    <>
                        <h2 className="text-lg sm:text-xl font-semibold text-center mb-2">Sign In</h2>
                        <p className="text-center text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
                            Welcome to Krisha Fire & Security
                        </p>

                        <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                            <div>
                                <label className="block mb-1 text-sm sm:text-base font-medium">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 text-sm sm:text-base border rounded focus:outline-none focus:ring focus:ring-blue-300"
                                    placeholder="Enter your username"
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm sm:text-base font-medium">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 text-sm sm:text-base border rounded focus:outline-none focus:ring focus:ring-blue-300"
                                    placeholder="Enter your password"
                                />
                            </div>

                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => setShowForgot(true)}
                                    className="text-blue-600 text-xs sm:text-sm hover:underline"
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full bg-blue-600 text-white py-2 text-sm sm:text-base rounded hover:bg-blue-700 transition ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Logging in...
                                    </span>
                                ) : 'Login'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="animate-slide-down transition-all duration-700 ease-in-out">
                        <h2 className="text-lg sm:text-xl font-semibold text-center mb-2">Forgot Password</h2>
                        <p className="text-center text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
                            Enter your email to reset password
                        </p>

                        <form onSubmit={handleForgotSubmit} className="space-y-3 sm:space-y-4">
                            <div>
                                <label className="block mb-1 text-sm sm:text-base font-medium">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 text-sm sm:text-base border rounded focus:outline-none focus:ring focus:ring-blue-300"
                                    placeholder="Enter your email"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full bg-green-600 text-white py-2 text-sm sm:text-base rounded hover:bg-green-700 transition ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? 'Sending...' : 'Send Reset Link'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowForgot(false)}
                                disabled={isLoading}
                                className={`w-full bg-gray-300 text-black py-2 text-sm sm:text-base rounded hover:bg-gray-400 transition ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                Back to Login
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Custom Animations */}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }

                @keyframes slide-down {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .animate-fade-in {
                    animation: fade-in 0.7s ease-out forwards;
                }

                .animate-slide-down {
                    animation: slide-down 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Login;