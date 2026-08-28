import React, { useState } from 'react';
import { seedMenuIfNeeded } from '../data/seed';
import { useNavigate } from 'react-router-dom';

export default function StaffLogin() {
  const [email, setEmail] = useState('staff@tableorder.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (email === 'staff@tableorder.com' && password === 'password123') {
        localStorage.setItem('staff_auth', 'true');
        await seedMenuIfNeeded();
        navigate('/staff');
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/50 p-10 border border-zinc-800/60">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif text-amber-500 tracking-wide mb-3">TableOrder</h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">Staff Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder:text-zinc-600"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder:text-zinc-600"
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-white py-3.5 rounded-xl font-bold tracking-wide hover:from-amber-500 hover:to-amber-400 transition-all shadow-lg shadow-amber-900/30 active:scale-[0.98] border border-amber-400/30 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
