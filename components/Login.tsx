
import React, { useState } from 'react';
import { ShammariLogo } from './Icons';
import { User, Lock, LogIn, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

const ADMIN_ID = 'admin';
const ADMIN_PASS = '0770';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (userId.trim().toLowerCase() === ADMIN_ID && password === ADMIN_PASS) {
        onLoginSuccess();
      } else {
        setError('بيانات الدخول غير صحيحة. يرجى التأكد من المعرف وكلمة المرور.');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-cairo p-6 relative overflow-hidden">
      {/* Red accent shapes */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-shammari-red/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-shammari-red/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto bg-shammari-red rounded-3xl flex items-center justify-center shadow-2xl transform -rotate-6 transition hover:rotate-0 duration-500">
            <ShammariLogo className="w-14 h-14" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mt-6">شمر <span className="text-shammari-red">تنتخب</span></h1>
          <p className="text-gray-400 text-xs mt-2 font-bold tracking-widest uppercase">Election System Pro</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(139,0,0,0.15)] p-10 border border-gray-100">
          <div className="mb-8">
            <h2 className="text-xl font-black text-gray-900">دخول المسؤول</h2>
            <p className="text-gray-400 text-sm mt-1">يرجى إدخال بيانات الاعتماد المخصصة.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">المعرف</label>
              <div className="relative group">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-shammari-red transition-colors" />
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                  placeholder="admin"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 pr-12 focus:outline-none focus:ring-4 focus:ring-shammari-red/5 focus:bg-white focus:border-shammari-red transition-all text-gray-900 font-bold"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">كلمة المرور</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-shammari-red transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 pr-12 focus:outline-none focus:ring-4 focus:ring-shammari-red/5 focus:bg-white focus:border-shammari-red transition-all text-gray-900 font-bold tracking-widest"
                  dir="ltr"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-[11px] p-4 rounded-2xl flex items-center gap-3 border border-red-100 animate-shake font-bold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-shammari-red hover:bg-red-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-900/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              <span>دخول النظام</span>
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted</span>
          </div>
        </div>

        <p className="text-center text-gray-300 text-[10px] mt-10 font-bold uppercase tracking-[0.2em]">
          Design & Security by Shammari Tech
        </p>
      </div>
    </div>
  );
};

export default Login;
