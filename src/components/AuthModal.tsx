import React, { useState } from 'react';
import { User } from '../types';
import { apiService } from '../services/apiService';
import { X, Lock, User as UserIcon, Check, ShieldAlert, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  defaultRoleHint?: 'admin' | 'juri' | 'voter';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Login form states (only Juri & Admin login)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const result = await apiService.login(username, password);
      if (result.success && result.user) {
        setSuccessMsg(`Selamat datang, ${result.user.nama}!`);
        setTimeout(() => {
          onSuccess(result.user!);
          onClose();
        }, 600);
      } else {
        setErrorMsg(result.message || 'Username atau password salah.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-800 bg-emerald-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-700">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Masuk Dewan Juri & Admin</h3>
              <p className="text-xs text-emerald-200">DutEv · SMPIT Pondok Duta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Note: Only Juri & Admin need to login, public voters use device fingerprinting */}
        <div className="p-4 mx-6 mt-5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
          <p className="text-xs text-emerald-900 leading-relaxed">
            Portal ini khusus untuk <strong>Dewan Juri</strong> dan <strong>Administrator</strong> lomba.
            Pengunjung/pemilih bebas tidak perlu mendaftar akun — Anda dapat langsung memberikan vote favorit di menu <strong>Vote</strong> (dibatasi 1 perangkat 1 suara).
          </p>
        </div>

        {/* Notifications */}
        <div className="px-6 pt-3">
          {errorMsg && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="px-6 pt-2 pb-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Username Juri / Admin
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda"
                className="w-full px-3.5 py-2.5 pl-10 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent bg-slate-50/40"
              />
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full px-3.5 py-2.5 pl-10 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent bg-slate-50/40"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="w-full py-2.5 px-4 text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Memverifikasi Akun...</span>
            ) : (
              <span>Masuk Sebagai Juri / Admin</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
