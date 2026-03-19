import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiPhone, FiMapPin, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';

export default function LoginPage() {
  const { t } = useLang();
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', city: '' });

  useEffect(() => {
    if (user) navigate('/');
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email) return toast.error(t('emailRequired'));
    if (!loginForm.password) return toast.error(t('passwordRequired'));
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success(t('loginSuccess'));
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.name) return toast.error(t('nameRequired'));
    if (!registerForm.email) return toast.error(t('emailRequired'));
    if (!registerForm.password) return toast.error(t('passwordRequired'));
    if (registerForm.password.length < 6) return toast.error(t('passwordTooShort'));
    if (registerForm.password !== registerForm.confirmPassword) return toast.error(t('passwordMismatch'));
    setLoading(true);
    try {
      await register(registerForm);
      toast.success(t('registerSuccess'));
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || t('somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-11 h-11 bg-gradient-to-br from-primary-600 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="text-2xl font-extrabold text-primary-700">Bozor.uz</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${tab === 'login' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t('login')}
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${tab === 'register' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t('register')}
            </button>
          </div>

          <div className="p-8">
            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('loginTitle')}</h2>

                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={e => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={t('email')}
                    className="input-field pl-11"
                    autoComplete="email"
                  />
                </div>

                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={t('password')}
                    className="input-field pl-11 pr-11"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-base"
                >
                  {loading ? t('loading') : t('loginBtn')}
                </button>

                <div className="text-center">
                  <p className="text-xs text-gray-400 mt-4 bg-gray-50 rounded-xl p-3">
                    💡 {t('demoHint')}
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('registerTitle')}</h2>

                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={registerForm.name}
                    onChange={e => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('fullName')}
                    className="input-field pl-11"
                    autoComplete="name"
                  />
                </div>

                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={e => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={t('email')}
                    className="input-field pl-11"
                    autoComplete="email"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="tel"
                      value={registerForm.phone}
                      onChange={e => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder={t('phone')}
                      className="input-field pl-10 text-sm"
                    />
                  </div>
                  <div className="relative">
                    <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={registerForm.city}
                      onChange={e => setRegisterForm(prev => ({ ...prev, city: e.target.value }))}
                      placeholder={t('city')}
                      className="input-field pl-10 text-sm"
                    />
                  </div>
                </div>

                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerForm.password}
                    onChange={e => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={t('password')}
                    className="input-field pl-11 pr-11"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>

                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerForm.confirmPassword}
                    onChange={e => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder={t('confirmPassword')}
                    className="input-field pl-11"
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-base"
                >
                  {loading ? t('loading') : t('registerBtn')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
