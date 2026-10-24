import React, { useState } from 'react';
import { User } from '../types';
import { apiService } from '../services/apiService';
import { X, Lock, User as UserIcon, Phone, Check, ShieldAlert, Sparkles } from 'lucide-react';

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
  defaultRoleHint
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register form
  const [regNama, setRegNama] = useState('');
  const [regEmailOrWa, setRegEmailOrWa] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

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
        onSuccess(result.user);
        onClose();
      } else {
        setErrorMsg(result.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem login.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok');
      return;
    }
    if (regPassword.length < 4) {
      setErrorMsg('Password minimal 4 karakter');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.registerVoter(regNama, regEmailOrWa, regUsername, regPassword);
      if (result.success && result.user) {
        setSuccessMsg('Akun pemilih berhasil dibuat!');
        setTimeout(() => {
          onSuccess(result.user!);
          onClose();
        }, 1200);
      } else {
        setErrorMsg(result.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mendaftar');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-900 text-white">
          <div>
            <h3 className="text-base font-bold">Autentikasi Akun</h3>
            <p className="text-xs text-emerald-200">DutEv · SMPIT Pondok Duta</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 m-4 bg-slate-100 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
            className={`py-2 rounded-md transition-all ${
              activeTab === 'login'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Masuk (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
            }}
            className={`py-2 rounded-md transition-all ${
              activeTab === 'register'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daftar Pemilih Bebas
          </button>
        </div>

        {/* Notifications */}
        <div className="px-6">
          {errorMsg && (
            <div className="p-3 mb-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 mb-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="px-6 pb-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  className="w-full px-3.5 py-2 pl-9 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full px-3.5 py-2 pl-9 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-60"
            >
              {loading ? 'Memverifikasi...' : 'Masuk Sekarang'}
            </button>

          </form>
        )}

        {/* Register Form for Voters */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="px-6 pb-6 space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                required
                value={regNama}
                onChange={(e) => setRegNama(e.target.value)}
                placeholder="Contoh: Muhammad Farhan"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                No. WhatsApp / Email Aktif
              </label>
              <input
                type="text"
                value={regEmailOrWa}
                onChange={(e) => setRegEmailOrWa(e.target.value)}
                placeholder="Contoh: 08123456789 atau email"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="hurufkecil"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Ulangi Password *
              </label>
              <input
                type="password"
                required
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                placeholder="Ketik ulang password"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Catatan: Setiap akun pemilih bebas berhak memberikan 1 (satu) suara pada tiap kategori lomba di Duta Camp.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-60"
            >
              {loading ? 'Mendaftarkan...' : 'Daftar & Langsung Memilih'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
