import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiMapPin, FiPhone, FiEdit2, FiStar, FiCalendar,
  FiPackage, FiCheck, FiUser
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { usersAPI, listingsAPI } from '../api/index.js';
import ListingCard from '../components/ListingCard.jsx';
import Modal from '../components/Modal.jsx';

export default function ProfilePage() {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const { t } = useLang();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [saving, setSaving] = useState(false);

  const isOwn = user && user.id === parseInt(id);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      usersAPI.getById(id),
      listingsAPI.getByUser(id),
    ])
      .then(([userRes, listingsRes]) => {
        setProfile(userRes.data);
        setListings(listingsRes.data);
        setEditForm({
          name: userRes.data.name,
          phone: userRes.data.phone || '',
          city: userRes.data.city || '',
          bio: userRes.data.bio || '',
          avatar: userRes.data.avatar || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await usersAPI.update(id, editForm);
      setProfile(res.data);
      updateUser(res.data);
      toast.success(t('profileUpdated'));
      setEditModal(false);
    } catch {
      toast.error(t('somethingWrong'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddReview = async () => {
    if (!user) { toast.error('Войдите для написания отзыва'); return; }
    setSaving(true);
    try {
      await usersAPI.addReview({ reviewed_id: parseInt(id), ...reviewForm });
      toast.success(t('reviewPosted'));
      setReviewModal(false);
      // Refresh profile
      const res = await usersAPI.getById(id);
      setProfile(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || t('somethingWrong'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="skeleton h-48 rounded-2xl mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!profile) return <div className="text-center py-20 text-gray-500">{t('pageNotFound')}</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        {/* Cover */}
        <div className="h-28 bg-gradient-to-r from-primary-500 to-accent-500" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-6">
            <img
              src={profile.avatar || `https://i.pravatar.cc/96?u=${profile.id}`}
              alt={profile.name}
              className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                    {profile.city && (
                      <span className="flex items-center gap-1">
                        <FiMapPin size={13} /> {profile.city}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FiCalendar size={13} />
                      {t('memberSince')} {new Date(profile.created_at).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                {isOwn ? (
                  <button
                    onClick={() => setEditModal(true)}
                    className="flex items-center gap-2 btn-secondary text-sm"
                  >
                    <FiEdit2 size={15} /> {t('editProfile')}
                  </button>
                ) : user && (
                  <button
                    onClick={() => setReviewModal(true)}
                    className="flex items-center gap-2 btn-secondary text-sm"
                  >
                    <FiStar size={15} /> {t('leaveReview')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="text-center bg-gray-50 rounded-xl p-3">
              <div className="text-xl font-bold text-gray-900">{listings.length}</div>
              <div className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-1">
                <FiPackage size={12} /> {t('myListings')}
              </div>
            </div>
            <div className="text-center bg-gray-50 rounded-xl p-3">
              <div className="text-xl font-bold text-gray-900 flex items-center justify-center gap-1">
                <FiStar className="text-yellow-500 fill-yellow-500" size={16} />
                {profile.rating?.toFixed(1) || '—'}
              </div>
              <div className="text-xs text-gray-500 mt-1">{t('rating')}</div>
            </div>
            <div className="text-center bg-gray-50 rounded-xl p-3">
              <div className="text-xl font-bold text-gray-900">{profile.review_count || 0}</div>
              <div className="text-xs text-gray-500 mt-1">{t('reviews')}</div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-gray-600 text-sm leading-relaxed mb-4">{profile.bio}</p>
          )}

          {/* Contact */}
          <div className="flex flex-wrap gap-3 text-sm">
            {profile.phone && (
              <a href={`tel:${profile.phone}`} className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-700 transition-colors">
                <FiPhone size={15} className="text-primary-500" /> {profile.phone}
              </a>
            )}
            {!isOwn && user && (
              <Link
                to={`/messages/${profile.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-primary-50 hover:bg-primary-100 rounded-xl text-primary-700 transition-colors font-medium"
              >
                {t('sendMessage')}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Reviews */}
      {profile.reviews?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiStar className="text-yellow-500 fill-yellow-500" size={20} />
            {t('reviews')} ({profile.review_count})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.reviews.map((review, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={review.reviewer_avatar || `https://i.pravatar.cc/40?u=${review.reviewer_id}`}
                    alt={review.reviewer_name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{review.reviewer_name}</div>
                    <div className="flex gap-0.5 mt-0.5">
                      {Array(5).fill(0).map((_, j) => (
                        <FiStar key={j} size={12} className={j < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200'} />
                      ))}
                    </div>
                  </div>
                </div>
                {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(review.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listings */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-5">
          {isOwn ? t('myListings') : `${t('sellerListings')} (${listings.length})`}
        </h2>
        {listings.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">📦</div>
            <p className="text-gray-500">{t('noMyListings')}</p>
            {isOwn && (
              <Link to="/create-listing" className="btn-primary inline-flex mt-4">{t('createFirstListing')}</Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title={t('editProfile')} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('fullName')}</label>
            <input
              type="text"
              value={editForm.name || ''}
              onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('phone')}</label>
            <input
              type="tel"
              value={editForm.phone || ''}
              onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('city')}</label>
            <input
              type="text"
              value={editForm.city || ''}
              onChange={e => setEditForm(prev => ({ ...prev, city: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('avatarUrl')}</label>
            <input
              type="url"
              value={editForm.avatar || ''}
              onChange={e => setEditForm(prev => ({ ...prev, avatar: e.target.value }))}
              className="input-field"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('bio')}</label>
            <textarea
              value={editForm.bio || ''}
              onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
              rows={3}
              className="input-field resize-none"
              placeholder={t('bioPlaceholder')}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditModal(false)} className="btn-secondary flex-1">{t('cancel')}</button>
            <button onClick={handleSaveProfile} disabled={saving} className="btn-primary flex-1">
              {saving ? t('loading') : t('saveProfile')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={reviewModal} onClose={() => setReviewModal(false)} title={t('leaveReview')} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('rating')}</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                  className="p-1"
                >
                  <FiStar
                    size={28}
                    className={star <= reviewForm.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('reviewComment')}</label>
            <textarea
              value={reviewForm.comment}
              onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
              rows={3}
              className="input-field resize-none"
              placeholder="Поделитесь своим опытом..."
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setReviewModal(false)} className="btn-secondary flex-1">{t('cancel')}</button>
            <button onClick={handleAddReview} disabled={saving} className="btn-primary flex-1">
              {saving ? t('loading') : t('submit')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
