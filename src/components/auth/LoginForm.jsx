import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function LoginForm({ onSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const nextUrl = window.location.origin + createPageUrl('Home');
      base44.auth.redirectToLogin(nextUrl);
    } catch (err) {
      console.error('Auth error:', err);
      setError('Redirecting to authentication...');
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md mx-auto"
    >
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shadow-lg shadow-purple-500/50 border-2 border-purple-500/50">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698d8f79de41b00a2a2dd6e3/60edcef10_d5e77535-5a3b-4139-8a3f-6489d39444dc.jpg" 
            alt="Bot or Not Logo" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <h1 className="text-3xl font-black text-center mb-2 tracking-wide">
        <span className="bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
          Bot or Not
        </span>
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-zinc-900/50 p-1 rounded-lg border border-purple-500/30">
        <button
          onClick={() => {
            setIsSignUp(false);
            setError('');
          }}
          className={`flex-1 py-2 px-4 rounded transition-all font-medium ${
            !isSignUp
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => {
            setIsSignUp(true);
            setError('');
          }}
          className={`flex-1 py-2 px-4 rounded transition-all font-medium ${
            isSignUp
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username (Sign Up only) */}
        {isSignUp && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose your username"
              className="w-full bg-zinc-900/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
              disabled={isLoading}
            />
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full bg-zinc-900/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
            disabled={isLoading}
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-zinc-900/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-500 hover:to-green-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-purple-500/50 transition-all mt-6"
        >
          {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>
    </motion.div>
  );
}