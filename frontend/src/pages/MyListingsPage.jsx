import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { listingsAPI } from '../api/index.js';
import Modal from '../components/Modal.jsx';

function formatPrice(price) {
  if (!price && price !== 0) return 'Договорная';
  return new Intl.NumberFormat('ru-RU').format(price) + ' сум';
}

export default function MyListingsPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    listingsAPI.getByUser(user.id)
      .then(res => setListings(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async () => {
    try {
      await listingsAPI.delete(deleteId);
      setListings(prev => prev.filter(l => l.id !== deleteId));
      toast.success(t('listingDeleted'));
      setDeleteId(null);
    } catch {
      toast.error(t('somethingWrong'));
    }
  };

  const handleToggleStatus = async (listing) => {
    const newStatus = listing.status === 'active' ? 'inactive' : 'active';
    try {
      await listingsAPI.update(listing.id, { ...listing, status: newStatus });
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: newStatus } : l));
      toast.success(newStatus === 'active' ? 'Объявление активировано' : 'Объявление снято с публикации');
    } catch {
      toast.error(t('somethingWrong'));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('myListingsTitle')}</h1>
          <p className="text-gray-500 text-sm mt-1">{listings.length} объявлений</p>
        </div>
        <Link to="/create-listing" className="btn-accent flex items-center gap-2">
          <FiPlus size={18} /> {t('postAd')}
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{t('noMyListings')}</h3>
          <p className="text-gray-500 mb-6">Разместите ваше первое объявление бесплатно</p>
          <Link to="/create-listing" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
            <FiPlus size={18} /> {t('createFirstListing')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map(listing => {
            const mainImage = listing.images?.[0] || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200';
            return (
              <div
                key={listing.id}
                className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
                  listing.status === 'inactive' ? 'border-gray-200 opacity-75' : 'border-gray-100'
                }`}
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Image */}
                  <Link to={`/listings/${listing.id}`} className="shrink-0">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={mainImage}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200'; }}
                      />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/listings/${listing.id}`}>
                        <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-1">{listing.title}</h3>
                      </Link>
                      <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        listing.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {listing.status === 'active' ? t('active') : t('inactive')}
                      </span>
                    </div>
                    <div className="text-primary-600 font-bold mt-1">{formatPrice(listing.price)}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{listing.city}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <FiEye size={11} /> {listing.views || 0}
                      </span>
                      <span>·</span>
                      <span>{new Date(listing.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleStatus(listing)}
                      title={listing.status === 'active' ? t('deactivate') : t('activate')}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                    >
                      {listing.status === 'active' ? <FiToggleRight size={20} className="text-green-500" /> : <FiToggleLeft size={20} />}
                    </button>
                    <Link
                      to={`/edit-listing/${listing.id}`}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                      title={t('editListing')}
                    >
                      <FiEdit2 size={18} />
                    </Link>
                    <button
                      onClick={() => setDeleteId(listing.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title={t('deleteListing')}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t('deleteListing')}
        size="sm"
      >
        <div className="text-center space-y-5">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <FiTrash2 size={24} className="text-red-500" />
          </div>
          <p className="text-gray-600">{t('confirmDelete')}</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">{t('cancel')}</button>
            <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors">
              {t('delete')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
