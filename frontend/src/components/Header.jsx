import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FiSearch, FiHeart, FiMessageCircle, FiUser, FiLogOut,
  FiPlus, FiMenu, FiX, FiChevronDown, FiList, FiShield
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { languages } from '../i18n/index.js';

export default function Header({ categories = [] }) {
  const { user, logout } = useAuth();
  const { t, lang, changeLang, getCatName } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catDropdown, setCatDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [langDropdown, setLangDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const catRef = useRef(null);
  const userRef = useRef(null);
  const langRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handler(e) {
      if (catRef.current && !catRef.current.contains(e.target)) setCatDropdown(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserDropdown(false);
      if (langRef.current && !langRef.current.contains(e.target)) setLangDropdown(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
    setCatDropdown(false);
    setUserDropdown(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/listings?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const currentLang = languages.find(l => l.code === lang);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      {/* Top bar */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent hidden sm:block">
              Bozor.uz
            </span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex">
            <div className="flex w-full border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="flex-1 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 bg-primary-600 hover:bg-primary-700 text-white transition-colors"
              >
                <FiSearch size={18} />
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Language switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangDropdown(!langDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-2 text-sm font-semibold text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <span>{currentLang?.flag}</span>
                <span className="hidden sm:block">{currentLang?.label}</span>
                <FiChevronDown size={14} className={`transition-transform ${langDropdown ? 'rotate-180' : ''}`} />
              </button>
              {langDropdown && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-fade-in">
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { changeLang(l.code); setLangDropdown(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${lang === l.code ? 'text-primary-600 font-semibold bg-primary-50' : 'text-gray-700'}`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <>
                {/* Favorites */}
                <Link
                  to="/favorites"
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-50 rounded-xl transition-colors hidden sm:flex"
                  title={t('favorites')}
                >
                  <FiHeart size={20} />
                </Link>

                {/* Messages */}
                <Link
                  to="/messages"
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-50 rounded-xl transition-colors hidden sm:flex"
                  title={t('messages')}
                >
                  <FiMessageCircle size={20} />
                </Link>

                {/* Post Ad button */}
                <Link
                  to="/create-listing"
                  className="btn-accent flex items-center gap-1.5 py-2 px-3 text-sm hidden sm:flex"
                >
                  <FiPlus size={16} />
                  <span>{t('postAd')}</span>
                </Link>

                {/* User menu */}
                <div className="relative" ref={userRef}>
                  <button
                    onClick={() => setUserDropdown(!userDropdown)}
                    className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <img
                      src={user.avatar || `https://i.pravatar.cc/32?u=${user.id}`}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-100"
                    />
                    <span className="text-sm font-medium text-gray-700 hidden lg:block max-w-[100px] truncate">{user.name}</span>
                    <FiChevronDown size={14} className={`text-gray-400 transition-transform ${userDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {userDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <Link to={`/profile/${user.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <FiUser size={16} /> {t('profile')}
                      </Link>
                      <Link to="/my-listings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <FiList size={16} /> {t('myListings')}
                      </Link>
                      <Link to="/favorites" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 sm:hidden transition-colors">
                        <FiHeart size={16} /> {t('favorites')}
                      </Link>
                      <Link to="/messages" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 sm:hidden transition-colors">
                        <FiMessageCircle size={16} /> {t('messages')}
                      </Link>
                      {user.is_admin ? (
                        <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-600 hover:bg-purple-50 transition-colors font-medium">
                          <FiShield size={16} /> Панель администратора
                        </Link>
                      ) : null}
                      <div className="border-t border-gray-100">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <FiLogOut size={16} /> {t('logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary py-2 px-4 text-sm hidden sm:flex">
                  {t('login')}
                </Link>
                <Link to="/login?tab=register" className="btn-primary py-2 px-4 text-sm">
                  {t('register')}
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors md:hidden"
            >
              {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden mt-3">
          <form onSubmit={handleSearch} className="flex">
            <div className="flex w-full border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 transition-all">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="flex-1 px-4 py-2.5 text-sm focus:outline-none"
              />
              <button type="submit" className="px-4 bg-primary-600 text-white">
                <FiSearch size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Categories bar */}
      <div className="border-t border-gray-50 bg-gray-50/80">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
            <Link
              to="/listings"
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 hover:bg-white rounded-lg transition-colors font-medium"
            >
              {t('allCategories')}
            </Link>
            {categories.slice(0, 10).map(cat => (
              <Link
                key={cat.id}
                to={`/listings?category=${cat.slug}`}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 hover:bg-white rounded-lg transition-colors"
              >
                <span>{cat.icon}</span>
                <span className="hidden md:block">{getCatName(cat)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg animate-fade-in">
          <nav className="container mx-auto px-4 py-4 space-y-1">
            {user ? (
              <>
                <Link to={`/profile/${user.id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">
                  <FiUser size={18} /> {t('profile')}
                </Link>
                <Link to="/my-listings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">
                  <FiList size={18} /> {t('myListings')}
                </Link>
                <Link to="/favorites" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">
                  <FiHeart size={18} /> {t('favorites')}
                </Link>
                <Link to="/messages" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">
                  <FiMessageCircle size={18} /> {t('messages')}
                </Link>
                <Link to="/create-listing" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-accent-500 text-white font-medium mt-2">
                  <FiPlus size={18} /> {t('postAd')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 font-medium mt-1"
                >
                  <FiLogOut size={18} /> {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">{t('login')}</Link>
                <Link to="/login?tab=register" className="block px-3 py-2.5 rounded-xl bg-primary-600 text-white font-medium">{t('register')}</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
