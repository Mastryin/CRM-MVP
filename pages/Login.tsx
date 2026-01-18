import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');
      setSuccessMsg('');
      
      // Simulate API call
      setTimeout(() => {
          if (email) {
              setSuccessMsg(`If an account exists for ${email}, a reset link has been sent.`);
              setIsLoading(false);
          } else {
              setError('Please enter your email address.');
              setIsLoading(false);
          }
      }, 1000);
  };

  const fillDemoCreds = () => {
      setEmail('rohanmishra.design@gmail.com');
      setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
        <div className="bg-slate-900 dark:bg-black p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
          <h2 className="text-3xl font-bold text-white mb-2">{isForgotPasswordMode ? 'Reset Password' : 'Welcome Back'}</h2>
          <p className="text-slate-400">{isForgotPasswordMode ? 'Enter your email to receive a reset link' : 'Sign in to Mastry Cohort CRM'}</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded text-sm">
              {error}
            </div>
          )}
          
          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300 rounded text-sm">
              {successMsg}
            </div>
          )}

          {!isForgotPasswordMode ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900 dark:text-white"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                      <button type="button" onClick={() => { setIsForgotPasswordMode(true); setError(''); setSuccessMsg(''); }} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900 dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-blue-500/30"
                >
                  {isLoading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
          ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900 dark:text-white"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-blue-500/30"
                >
                  {isLoading ? (
                    <span>Sending...</span>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
                
                <button 
                    type="button" 
                    onClick={() => { setIsForgotPasswordMode(false); setError(''); setSuccessMsg(''); }} 
                    className="w-full text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 flex items-center justify-center gap-2"
                >
                    <ArrowLeft size={16} /> Back to Login
                </button>
              </form>
          )}

          {!isForgotPasswordMode && (
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                 <button onClick={fillDemoCreds} className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-2">
                     <CheckCircle2 size={14} /> Fill Demo Credentials
                 </button>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;