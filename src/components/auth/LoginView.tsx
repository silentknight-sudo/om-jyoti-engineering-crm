import React, { useState } from 'react';
import {
  Droplets,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Shield,
  ArrowRight,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('admin@omjyotiengg.com');
  const [password, setPassword] = useState('pass@123');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'super_admin' | 'admin' | 'team_lead' | 'telecaller' | 'data_entry_operator'>('super_admin');
  
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (isRegisterMode) {
        const res = await api.register({
          email,
          password,
          firstName,
          lastName,
          phone,
          role
        });
        setSuccessMessage('Account registered successfully! Signing you in...');
        setTimeout(async () => {
          await login(email, password);
        }, 800);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setForgotModalOpen(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#f0f3ff] to-blue-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00288e] via-blue-600 to-indigo-700"></div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-[#00288e] to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/20 mb-3">
            <Droplets className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">OM JYOTI ENGINEERING</h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Enterprise Industrial CRM & Cloud Portal
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="flex bg-gray-100/80 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              !isRegisterMode
                ? 'bg-white text-[#00288e] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              isRegisterMode
                ? 'bg-white text-[#00288e] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2.5 text-xs text-red-700 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Notice: </span>
              {error}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2.5 text-xs text-emerald-700 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>{successMessage}</div>
          </div>
        )}

        {/* Login / Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegisterMode && (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    id="register-firstname-input"
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="e.g. Ramesh"
                    className="w-full px-3 py-2 bg-gray-50/50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-[#00288e] rounded-xl text-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#00288e]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    id="register-lastname-input"
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="e.g. Sharma"
                    className="w-full px-3 py-2 bg-gray-50/50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-[#00288e] rounded-xl text-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#00288e]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mobile / Phone Number
                </label>
                <input
                  id="register-phone-input"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98110 00000"
                  className="w-full px-3 py-2 bg-gray-50/50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-[#00288e] rounded-xl text-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#00288e]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  System Role
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50/50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-[#00288e] rounded-xl text-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#00288e]/20 font-medium"
                >
                  <option value="super_admin">Super Administrator (Full System Control)</option>
                  <option value="admin">System Administrator</option>
                  <option value="team_lead">Team Lead / Sales Head</option>
                  <option value="telecaller">Telecaller / Sales Executive</option>
                  <option value="data_entry_operator">Data Entry Operator</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-email-input"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@omjyotiengg.com"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-[#00288e] rounded-xl text-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#00288e]/20"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                Password
              </label>
              {!isRegisterMode && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotModalOpen(true);
                    setForgotEmail(email);
                  }}
                  className="text-[11px] font-semibold text-[#00288e] hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-2.5 bg-gray-50/50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-[#00288e] rounded-xl text-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#00288e]/20"
              />
              <button
                type="button"
                id="toggle-password-visibility-btn"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center space-x-2 text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded text-[#00288e] focus:ring-[#00288e] h-3.5 w-3.5"
              />
              <span className="text-[11px]">Remember workstation</span>
            </label>
            <span className="text-[10px] text-gray-400 font-medium">JWT 256-bit Cloud Security</span>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-[#00288e] hover:bg-blue-800 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-900/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-3"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{isRegisterMode ? 'Create & Activate Account' : 'Sign In to CRM Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Initial Credentials Note */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-500">
            Initial Administrator Access: <span className="font-semibold text-gray-800">admin@omjyotiengg.com</span> / <span className="font-mono text-gray-700">pass@123</span>
          </p>
        </div>

        {/* Security badge */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-gray-400 flex items-center justify-center space-x-1">
            <Shield className="w-3 h-3 text-emerald-600" />
            <span>Om Jyoti Engineering • Production Cloud Environment</span>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm mb-1">Reset Account Password</h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter your registered work email to receive password reset instructions.
            </p>

            {forgotSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Reset instructions sent to {forgotEmail}!</span>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="name@omjyotiengg.com"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00288e]"
                />
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs bg-[#00288e] text-white rounded-lg font-semibold hover:bg-blue-800"
                  >
                    Send Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
