import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiMapPin, FiEye, FiStar } from 'react-icons/fi';
import { HiHeart } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { favoritesAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';

function formatPrice(price, t) {
  if (!price && price !== 0) return t('negotiable');
  if (price === 0) return t('free');
  return new Intl.NumberFormat('ru-RU').format(price) + ' ' + t('currency');
}

function formatDate(dateStr, t) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return t('today');
  if (days === 1) return t('yesterday');
  if (days < 7) return `${days} д. ${t('ago')}`;
  if (days < 30) return `${Math.floor(days / 7)} нед. ${t('ago')}`;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function ListingCard({ listing, onFavoriteChange }) {
  const { user } = useAuth();
  const { t, getCatName } = useLang();
  const [favorited, setFavorited] = useState(listing.is_favorited || false);
  const [favLoading, setFavLoading] = useState(false);

  const mainImage = listing.images?.[0] ||
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400';

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Войдите для добавления в избранное');
      return;
    }
    if (favLoading) return;
    setFavLoading(true);
    try {
      if (favorited) {
        await favoritesAPI.remove(listing.id);
        setFavorited(false);
        toast.success(t('removedFromFavorites'));
      } else {
        await favoritesAPI.add(listing.id);
        setFavorited(true);
        toast.success(t('addedToFavorites'));
      }
      onFavoriteChange && onFavoriteChange(listing.id, !favorited);
    } catch (err) {
      toast.error(t('somethingWrong'));
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <Link to={`/listings/${listing.id}`} className="block group">
      <div className="card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        {/* Image */}
        <div className="relative overflow-hidden aspect-[4/3] bg-gray-100">
          <img
            src={mainImage}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400';
            }}
            loading="lazy"
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            {listing.is_premium === 1 && (
              <span className="badge-premium flex items-center gap-1 shadow-sm">
                <FiStar size={10} className="fill-yellow-600" />
                {t('premium')}
              </span>
            )}
          </div>
          {/* Favorite button */}
          <button
            onClick={handleFavorite}
            disabled={favLoading}
            className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition-all duration-200 ${
              favorited
                ? 'bg-red-500 text-white'
                : 'bg-white/90 text-gray-500 hover:bg-white hover:text-red-500'
            }`}
            title={favorited ? t('removeFromFavorites') : t('addToFavorites')}
          >
            {favorited ? <HiHeart size={16} /> : <FiHeart size={16} />}
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5">
          {/* Price */}
          <div className="text-lg font-bold text-primary-600 mb-1">
            {formatPrice(listing.price, t)}
          </div>

          {/* Title */}
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 leading-snug group-hover:text-primary-600 transition-colors">
            {listing.title}
          </h3>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <FiMapPin size={11} />
              <span className="truncate max-w-[100px]">{listing.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5">
                <FiEye size={11} />
                {listing.views || 0}
              </span>
              <span>{formatDate(listing.created_at, t)}</span>
            </div>
          </div>

          {/* Category tag */}
          {listing.category_icon && (
            <div className="mt-2 flex items-center gap-1">
              <span className="text-xs">{listing.category_icon}</span>
              <span className="text-xs text-gray-400 truncate">
                {getCatName(listing)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[4/3]" />
      <div className="p-3.5 space-y-2">
        <div className="skeleton h-5 w-24 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}
