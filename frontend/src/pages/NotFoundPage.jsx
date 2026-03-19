import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiArrowLeft } from 'react-icons/fi';
import { useLang } from '../context/LangContext.jsx';

export default function NotFoundPage() {
  const { t } = useLang();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 visual */}
        <div className="relative inline-block mb-8">
          <div className="text-[10rem] font-extrabold text-gray-100 leading-none select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl">🔍</div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('pageNotFound')}</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">{t('pageNotFoundHint')}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="btn-primary flex items-center justify-center gap-2 px-6 py-3"
          >
            <FiHome size={18} /> {t('goHome')}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary flex items-center justify-center gap-2 px-6 py-3"
          >
            <FiArrowLeft size={18} /> {t('back')}
          </button>
        </div>
      </div>
    </div>
  );
}
