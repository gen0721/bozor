import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiFilter, FiX, FiChevronDown, FiSliders } from 'react-icons/fi';
import { useLang } from '../context/LangContext.jsx';
import ListingCard, { ListingCardSkeleton } from '../components/ListingCard.jsx';
import { listingsAPI } from '../api/index.js';

const CITIES = ['Ташкент', 'Самарканд', 'Бухара', 'Наманган', 'Андижан', 'Фергана', 'Нукус', 'Термез', 'Коканд', 'Карши'];

export default function ListingsPage({ categories }) {
  const { t, getCatName } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
  });
  const [pendingFilters, setPendingFilters] = useState({ ...filters });

  const fetchListings = useCallback(async (params, pageNum = 1) => {
    setLoading(true);
    try {
      const res = await listingsAPI.getAll({ ...params, page: pageNum, limit: 20 });
      if (pageNum === 1) {
        setListings(res.data.listings);
      } else {
        setListings(prev => [...prev, ...res.data.listings]);
      }
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const newFilters = {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      city: searchParams.get('city') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      sort: searchParams.get('sort') || 'newest',
    };
    setFilters(newFilters);
    setPendingFilters(newFilters);
    setPage(1);
    fetchListings(newFilters, 1);
  }, [searchParams]);

  const applyFilters = () => {
    const params = {};
    Object.entries(pendingFilters).forEach(([k, v]) => { if (v) params[k] = v; });
    setSearchParams(params);
    setShowFilters(false);
  };

  const resetFilters = () => {
    const reset = { search: filters.search, category: '', city: '', minPrice: '', maxPrice: '', sort: 'newest' };
    setPendingFilters(reset);
    const params = {};
    if (filters.search) params.search = filters.search;
    setSearchParams(params);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchListings(filters, nextPage);
  };

  const activeFilterCount = [filters.category, filters.city, filters.minPrice, filters.maxPrice]
    .filter(Boolean).length;

  const currentCategory = categories?.find(c => c.slug === filters.category || String(c.id) === filters.category);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentCategory ? getCatName(currentCategory) : t('allListings')}
            {filters.search && <span className="text-gray-500 font-normal ml-2">«{filters.search}»</span>}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('found')} <span className="font-semibold text-gray-800">{total}</span> {t('results')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="relative">
            <select
              value={filters.sort}
              onChange={e => {
                const params = { ...Object.fromEntries(searchParams), sort: e.target.value };
                setSearchParams(params);
              }}
              className="appearance-none pl-4 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-700 cursor-pointer"
            >
              <option value="newest">{t('sortNewest')}</option>
              <option value="price_asc">{t('sortPriceAsc')}</option>
              <option value="price_desc">{t('sortPriceDesc')}</option>
              <option value="popular">{t('sortPopular')}</option>
              <option value="premium">{t('premium')}</option>
            </select>
            <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>

          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-gray-200 text-gray-700 hover:border-primary-300 bg-white'
            }`}
          >
            <FiSliders size={16} />
            {t('filters')}
            {activeFilterCount > 0 && (
              <span className="bg-white text-primary-600 rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters (desktop) */}
        <aside className={`hidden lg:block w-64 shrink-0`}>
          <FiltersPanel
            categories={categories}
            pendingFilters={pendingFilters}
            setPendingFilters={setPendingFilters}
            onApply={applyFilters}
            onReset={resetFilters}
            t={t}
            getCatName={getCatName}
          />
        </aside>

        {/* Listings grid */}
        <div className="flex-1 min-w-0">
          {/* Mobile filter panel */}
          {showFilters && (
            <div className="lg:hidden mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{t('filters')}</h3>
                <button onClick={() => setShowFilters(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <FiX size={18} />
                </button>
              </div>
              <FiltersPanel
                categories={categories}
                pendingFilters={pendingFilters}
                setPendingFilters={setPendingFilters}
                onApply={applyFilters}
                onReset={resetFilters}
                t={t}
                getCatName={getCatName}
                inline
              />
            </div>
          )}

          {/* Active filters chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {filters.category && currentCategory && (
                <FilterChip label={getCatName(currentCategory)} onRemove={() => {
                  const p = { ...Object.fromEntries(searchParams) };
                  delete p.category;
                  setSearchParams(p);
                }} />
              )}
              {filters.city && (
                <FilterChip label={filters.city} onRemove={() => {
                  const p = { ...Object.fromEntries(searchParams) };
                  delete p.city;
                  setSearchParams(p);
                }} />
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <FilterChip
                  label={`${filters.minPrice || '0'} — ${filters.maxPrice || '∞'} ${t('currency')}`}
                  onRemove={() => {
                    const p = { ...Object.fromEntries(searchParams) };
                    delete p.minPrice; delete p.maxPrice;
                    setSearchParams(p);
                  }}
                />
              )}
              <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2">
                {t('resetFilters')}
              </button>
            </div>
          )}

          {loading && page === 1 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array(12).fill(0).map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : listings.length === 0 ? (
            <EmptyState t={t} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {listings.map(l => <ListingCard key={l.id} listing={l} />)}
              </div>

              {/* Load more */}
              {page < totalPages && (
                <div className="text-center mt-10">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="btn-secondary px-8 py-3"
                  >
                    {loading ? t('loading') : t('loadMore')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FiltersPanel({ categories, pendingFilters, setPendingFilters, onApply, onReset, t, getCatName, inline }) {
  return (
    <div className={`space-y-5 ${!inline && 'bg-white rounded-2xl border border-gray-100 shadow-sm p-5'}`}>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">{t('category')}</label>
        <select
          value={pendingFilters.category}
          onChange={e => setPendingFilters(prev => ({ ...prev, category: e.target.value }))}
          className="input-field text-sm"
        >
          <option value="">{t('selectCategory')}</option>
          {categories?.map(cat => (
            <option key={cat.id} value={cat.slug}>{cat.icon} {getCatName(cat)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">{t('location')}</label>
        <input
          type="text"
          value={pendingFilters.city}
          onChange={e => setPendingFilters(prev => ({ ...prev, city: e.target.value }))}
          placeholder={t('enterCity')}
          className="input-field text-sm"
          list="cities-list"
        />
        <datalist id="cities-list">
          {['Ташкент', 'Самарканд', 'Бухара', 'Наманган', 'Андижан', 'Фергана', 'Нукус'].map(c => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">{t('price')}</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={pendingFilters.minPrice}
            onChange={e => setPendingFilters(prev => ({ ...prev, minPrice: e.target.value }))}
            placeholder={t('priceFrom')}
            className="input-field text-sm"
            min="0"
          />
          <input
            type="number"
            value={pendingFilters.maxPrice}
            onChange={e => setPendingFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
            placeholder={t('priceTo')}
            className="input-field text-sm"
            min="0"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={onApply} className="btn-primary flex-1 text-sm py-2.5">
          {t('applyFilters')}
        </button>
        <button onClick={onReset} className="btn-secondary text-sm py-2.5 px-4">
          <FiX size={16} />
        </button>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1.5 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-full border border-primary-100">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors">
        <FiX size={12} />
      </button>
    </span>
  );
}

function EmptyState({ t }) {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{t('noResults')}</h3>
      <p className="text-gray-500 mb-6">{t('noResultsHint')}</p>
      <Link to="/listings" className="btn-primary inline-flex px-6 py-2.5">
        {t('allListings')}
      </Link>
    </div>
  );
}
