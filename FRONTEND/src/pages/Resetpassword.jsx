import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || 'Password reset successful!');
        setTimeout(() => navigate('/'), 2500);
      } else {
        setError(data.message || 'Reset link expired or invalid');
      }
    } catch (err) {
      setError('Something went wrong, please try again.' + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center lg:px-28 p-4"
      style={{
        backgroundSize: 'cover',
        backgroundImage: 'url(../loginbg.jpg)',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="bg-white/70 p-8 rounded-lg shadow-xl w-full max-w-md animate-fade-in transition-all duration-700 ease-in-out">
        <img src="../logo.png" alt="Logo" className="w-40 mx-auto mb-6" />
        <h2 className="text-xl font-semibold text-center mb-2">Reset Password</h2>
        <p className="text-center text-gray-600 mb-6">Set a new password for your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">New Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
              placeholder="Enter new password"
              minLength={6}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Confirm Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
              placeholder="Re-enter new password"
              minLength={6}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPass}
                onChange={() => setShowPass(!showPass)}
                disabled={loading}
              />
              Show Password
            </label>
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => navigate('/')}
              tabIndex={-1}
            >
              Back to Login
            </button>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 text-sm rounded p-2">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 text-green-700 text-sm rounded p-2">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.7s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ResetPassword;
