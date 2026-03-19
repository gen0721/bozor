import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHeart } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { favoritesAPI } from '../api/index.js';
import ListingCard from '../components/ListingCard.jsx';

export default function FavoritesPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    favoritesAPI.getAll()
      .then(res => setFavorites(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleFavoriteChange = (listingId, isFavorited) => {
    if (!isFavorited) {
      setFavorites(prev => prev.filter(l => l.id !== listingId));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
          <FiHeart className="text-red-500 fill-red-500" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('favoritesTitle')}</h1>
          {!loading && <p className="text-sm text-gray-500">{favorites.length} объявлений</p>}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="skeleton aspect-[4/3] rounded-2xl" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-6xl mb-4">💔</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{t('noFavorites')}</h3>
          <p className="text-gray-500 mb-6">{t('noFavoritesHint')}</p>
          <Link to="/listings" className="btn-primary inline-flex px-6 py-3">{t('allListings')}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {favorites.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onFavoriteChange={handleFavoriteChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
