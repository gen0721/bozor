import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiShield, FiZap, FiStar } from 'react-icons/fi';
import { useLang } from '../context/LangContext.jsx';
import SearchBar from '../components/SearchBar.jsx';
import CategoryGrid from '../components/CategoryGrid.jsx';
import ListingCard, { ListingCardSkeleton } from '../components/ListingCard.jsx';
import { listingsAPI, statsAPI } from '../api/index.js';

export default function HomePage({ categories }) {
  const { t } = useLang();
  const [featuredListings, setFeaturedListings] = useState([]);
  const [latestListings, setLatestListings] = useState([]);
  const [stats, setStats] = useState({ listings: 0, users: 0, cities: 0 });
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingLatest, setLoadingLatest] = useState(true);

  useEffect(() => {
    listingsAPI.getAll({ premium: true, limit: 4, sort: 'premium' })
      .then(res => setFeaturedListings(res.data.listings))
      .catch(() => {})
      .finally(() => setLoadingFeatured(false));

    listingsAPI.getAll({ limit: 8, sort: 'newest' })
      .then(res => setLatestListings(res.data.listings))
      .catch(() => {})
      .finally(() => setLoadingLatest(false));

    statsAPI.get()
      .then(res => setStats(res.data))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white/5 rounded-full" />
        </div>
        <div className="relative container mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-white/20">
            <FiZap size={14} className="fill-yellow-300 text-yellow-300" />
            <span>Bozor.uz — лучший маркетплейс Узбекистана</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-5 leading-tight">
            {t('heroTitle')}
          </h1>
          <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>
          <SearchBar large />

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-white/90">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.listings.toLocaleString()}+</div>
              <div className="text-sm text-white/70">{t('activeListings')}</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.users.toLocaleString()}+</div>
              <div className="text-sm text-white/70">{t('registeredUsers')}</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.cities}+</div>
              <div className="text-sm text-white/70">{t('cities')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('popularCategories')}</h2>
          <Link to="/listings" className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 text-sm font-semibold transition-colors">
            {t('viewAll')} <FiArrowRight size={16} />
          </Link>
        </div>
        <CategoryGrid categories={categories} />
      </section>

      {/* Featured / Premium Listings */}
      {(loadingFeatured || featuredListings.length > 0) && (
        <section className="bg-gradient-to-b from-yellow-50/60 to-white py-14">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <FiStar className="text-yellow-500 fill-yellow-500" size={16} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('featuredListings')}</h2>
              </div>
              <Link to="/listings?sort=premium" className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 text-sm font-semibold transition-colors">
                {t('viewAll')} <FiArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {loadingFeatured
                ? Array(4).fill(0).map((_, i) => <ListingCardSkeleton key={i} />)
                : featuredListings.map(l => <ListingCard key={l.id} listing={l} />)
              }
            </div>
          </div>
        </section>
      )}

      {/* Latest Listings */}
      <section className="container mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('latestListings')}</h2>
          <Link to="/listings" className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 text-sm font-semibold transition-colors">
            {t('viewAll')} <FiArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {loadingLatest
            ? Array(8).fill(0).map((_, i) => <ListingCardSkeleton key={i} />)
            : latestListings.map(l => <ListingCard key={l.id} listing={l} />)
          }
        </div>
        <div className="text-center mt-10">
          <Link to="/listings" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
            {t('viewAll')} <FiArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Why Us / Feature Banners */}
      <section className="bg-gray-50 py-14">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">Почему выбирают Bozor.uz?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mb-5">
                <FiShield size={24} className="text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Безопасные сделки</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Все пользователи проходят верификацию. Система рейтингов и отзывов защищает вас от мошенников.</p>
            </div>
            <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-accent-50 rounded-2xl flex items-center justify-center mb-5">
                <FiZap size={24} className="text-accent-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Быстро и удобно</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Подайте объявление за 2 минуты. Удобный поиск и фильтры помогут найти нужное мгновенно.</p>
            </div>
            <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-5">
                <FiStar size={24} className="text-green-500 fill-green-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Миллионы товаров</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Электроника, авто, недвижимость, одежда и тысячи других категорий в одном месте.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-primary-600 to-accent-500 py-14">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Хотите продать что-то?</h2>
          <p className="text-white/80 mb-8 text-lg">Подайте бесплатное объявление прямо сейчас</p>
          <Link
            to="/create-listing"
            className="inline-flex items-center gap-2 bg-white text-primary-700 hover:bg-gray-50 font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            Подать объявление <FiArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
