import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMapPin } from 'react-icons/fi';
import { useLang } from '../context/LangContext.jsx';

const CITIES = ['Ташкент', 'Самарканд', 'Бухара', 'Наманган', 'Андижан', 'Фергана', 'Нукус', 'Термез', 'Коканд', 'Карши'];

export default function SearchBar({ large = false, initialQuery = '', initialCity = '' }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    if (city) params.set('city', city);
    navigate(`/listings?${params.toString()}`);
  };

  if (large) {
    return (
      <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-2 p-2 bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="flex-1 flex items-center gap-3 px-4">
            <FiSearch className="text-gray-400 shrink-0" size={20} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full py-3 text-gray-800 placeholder-gray-400 focus:outline-none text-base"
            />
          </div>
          <div className="hidden sm:flex items-center border-l border-gray-200 px-4 min-w-[160px]">
            <FiMapPin className="text-gray-400 shrink-0 mr-2" size={16} />
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full py-3 text-gray-600 focus:outline-none text-sm bg-transparent"
            >
              <option value="">{t('allCities')}</option>
              {CITIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="btn-primary px-8 py-3 text-base rounded-xl shrink-0"
          >
            {t('searchBtn')}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <div className="flex-1 relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        />
      </div>
      <button type="submit" className="btn-primary px-4 py-2 text-sm rounded-xl">
        {t('searchBtn')}
      </button>
    </form>
  );
}
