import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await api.post('/auth/register/', { username, email, password });
      }
      const res = await api.post('/auth/login/', { username, password });
      localStorage.setItem('access_token', res.data.access);
      navigate('/app');
    } catch (err) {
      setError(isRegister ? 'Registration failed. Try a different username.' : 'Invalid username or password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="w-full max-w-sm bg-neutral-900 rounded-2xl p-8 border border-neutral-800">
        <h1 className="text-2xl font-semibold text-white mb-1">Tufy</h1>
        <p className="text-neutral-400 text-sm mb-6">AI code review and documentation</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-neutral-800 text-white text-sm border border-neutral-700 focus:outline-none focus:border-neutral-500"
          />
          {isRegister && (
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 text-white text-sm border border-neutral-700 focus:outline-none focus:border-neutral-500"
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-neutral-800 text-white text-sm border border-neutral-700 focus:outline-none focus:border-neutral-500"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" className="w-full py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200">
            {isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="w-full text-center text-xs text-neutral-400 mt-4 hover:text-white"
        >
          {isRegister ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}