import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiMapPin, FiEye, FiHeart, FiShare2, FiFlag, FiEdit2, FiTrash2,
  FiPhone, FiMessageCircle, FiStar, FiCalendar, FiChevronLeft, FiChevronRight, FiCheck
} from 'react-icons/fi';
import { HiHeart } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { listingsAPI, favoritesAPI, messagesAPI } from '../api/index.js';
import ListingCard from '../components/ListingCard.jsx';
import Modal from '../components/Modal.jsx';

function formatPrice(price) {
  if (!price && price !== 0) return 'Договорная';
  return new Intl.NumberFormat('ru-RU').format(price) + ' сум';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, getCatName } = useLang();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [phoneVisible, setPhoneVisible] = useState(false);

  useEffect(() => {
    setLoading(true);
    listingsAPI.getById(id)
      .then(res => {
        setListing(res.data);
        setFavorited(res.data.is_favorited || false);
        setCurrentImg(0);
      })
      .catch(() => navigate('/not-found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFavorite = async () => {
    if (!user) { toast.error('Войдите для добавления в избранное'); return; }
    try {
      if (favorited) {
        await favoritesAPI.remove(id);
        setFavorited(false);
        toast.success(t('removedFromFavorites'));
      } else {
        await favoritesAPI.add(id);
        setFavorited(true);
        toast.success(t('addedToFavorites'));
      }
    } catch {
      toast.error(t('somethingWrong'));
    }
  };

  const handleDelete = async () => {
    try {
      await listingsAPI.delete(id);
      toast.success(t('listingDeleted'));
      navigate('/my-listings');
    } catch {
      toast.error(t('somethingWrong'));
    }
  };

  const handleSendMessage = async () => {
    if (!user) { toast.error('Войдите для отправки сообщений'); return; }
    if (!messageText.trim()) return;
    setSendingMsg(true);
    try {
      await messagesAPI.send({
        receiver_id: listing.user_id,
        listing_id: listing.id,
        text: messageText.trim(),
      });
      toast.success(t('messageSent'));
      setShowMessageModal(false);
      setMessageText('');
      navigate(`/messages/${listing.user_id}`);
    } catch {
      toast.error(t('somethingWrong'));
    } finally {
      setSendingMsg(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: listing.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Ссылка скопирована!');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="skeleton h-96 rounded-2xl" />
            <div className="skeleton h-8 w-3/4 rounded" />
            <div className="skeleton h-6 w-1/2 rounded" />
            <div className="skeleton h-32 rounded-xl" />
          </div>
          <div className="space-y-4">
            <div className="skeleton h-48 rounded-2xl" />
            <div className="skeleton h-32 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const images = listing.images?.length > 0
    ? listing.images
    : ['https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800'];

  const isOwner = user && user.id === listing.user_id;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-primary-600 transition-colors">{t('home')}</Link>
        <span>/</span>
        <Link to="/listings" className="hover:text-primary-600 transition-colors">{t('listings')}</Link>
        {listing.category_slug && (
          <>
            <span>/</span>
            <Link to={`/listings?category=${listing.category_slug}`} className="hover:text-primary-600 transition-colors">
              {getCatName(listing)}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-600 truncate max-w-xs">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image gallery */}
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
              <img
                src={images[currentImg]}
                alt={listing.title}
                className="w-full h-full object-cover"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800'; }}
              />
              {listing.is_premium === 1 && (
                <div className="absolute top-4 left-4">
                  <span className="badge-premium flex items-center gap-1 shadow">
                    <FiStar size={11} className="fill-yellow-600" /> {t('premium')}
                  </span>
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImg(i => Math.max(0, i - 1))}
                    disabled={currentImg === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors disabled:opacity-30"
                  >
                    <FiChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentImg(i => Math.min(images.length - 1, i + 1))}
                    disabled={currentImg === images.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors disabled:opacity-30"
                  >
                    <FiChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImg(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === currentImg ? 'bg-white w-5' : 'bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImg(i)}
                    className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === currentImg ? 'border-primary-500' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" onError={e => { e.target.src = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400'; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title and price */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{listing.title}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <FiMapPin size={14} className="text-gray-400" /> {listing.city}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiCalendar size={14} /> {formatDate(listing.created_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiEye size={14} /> {listing.views} {t('views')}
                  </span>
                </div>
              </div>
              {isOwner && (
                <div className="flex gap-2">
                  <Link
                    to={`/edit-listing/${listing.id}`}
                    className="p-2.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                    title={t('editListing')}
                  >
                    <FiEdit2 size={18} />
                  </Link>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title={t('deleteListing')}
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-3xl font-extrabold text-primary-600">{formatPrice(listing.price)}</div>
              <div className="flex gap-2">
                <button
                  onClick={handleFavorite}
                  className={`p-2.5 rounded-xl border transition-all ${favorited ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500'}`}
                  title={favorited ? t('removeFromFavorites') : t('addToFavorites')}
                >
                  {favorited ? <HiHeart size={20} /> : <FiHeart size={20} />}
                </button>
                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-all"
                  title={t('sharelisting')}
                >
                  <FiShare2 size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('description')}</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{listing.description}</p>
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('characteristics')}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">{t('category')}</span>
                <span className="font-medium text-gray-800">{listing.category_icon} {getCatName(listing)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">{t('location')}</span>
                <span className="font-medium text-gray-800">{listing.city}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">{t('postedOn')}</span>
                <span className="font-medium text-gray-800">{formatDate(listing.created_at)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">{t('viewsCount')}</span>
                <span className="font-medium text-gray-800">{listing.views}</span>
              </div>
            </div>
          </div>

          {/* Similar listings */}
          {listing.similar?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-5">{t('similarListings')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {listing.similar.map(l => <ListingCard key={l.id} listing={l} />)}
              </div>
            </div>
          )}
        </div>

        {/* Right column - Seller card */}
        <div className="space-y-5">
          {/* Price and contact (sticky) */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-24">
            <div className="text-2xl font-extrabold text-primary-600 mb-5">{formatPrice(listing.price)}</div>

            {!isOwner && (
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => {
                    if (!user) { toast.error('Войдите для отправки сообщений'); return; }
                    setShowMessageModal(true);
                    setMessageText(`Здравствуйте! Интересует ваше объявление "${listing.title}". Расскажите подробнее.`);
                  }}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                  <FiMessageCircle size={18} /> {t('contactSeller')}
                </button>
                <button
                  onClick={() => setPhoneVisible(true)}
                  className="btn-secondary w-full flex items-center justify-center gap-2 py-3"
                >
                  <FiPhone size={18} />
                  {phoneVisible
                    ? (listing.seller_phone || t('noPhone'))
                    : t('callSeller')
                  }
                </button>
              </div>
            )}

            {/* Seller info */}
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('sellerInfo')}</p>
              <Link to={`/profile/${listing.user_id}`} className="flex items-center gap-3 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-xl transition-colors">
                <img
                  src={listing.seller_avatar || `https://i.pravatar.cc/48?u=${listing.user_id}`}
                  alt={listing.seller_name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                />
                <div>
                  <div className="font-semibold text-gray-900">{listing.seller_name}</div>
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <FiStar size={13} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-medium text-gray-700">{listing.seller_rating?.toFixed(1) || '—'}</span>
                    <span>·</span>
                    <span>{listing.seller_review_count || 0} {t('reviews')}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {t('memberSince')} {new Date(listing.seller_since).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Safety tips */}
          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <FiCheck size={16} /> Советы безопасности
            </h3>
            <ul className="text-xs text-blue-700 space-y-1.5">
              <li>• Встречайтесь в общественных местах</li>
              <li>• Проверяйте товар перед оплатой</li>
              <li>• Не делайте предоплату</li>
              <li>• Проверяйте документы на товар</li>
            </ul>
          </div>

          {/* Report */}
          <button className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors py-2">
            <FiFlag size={14} /> {t('reportListing')}
          </button>
        </div>
      </div>

      {/* Message Modal */}
      <Modal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title={t('contactSeller')}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{t('regarding')}: <span className="font-medium text-gray-700">{listing.title}</span></p>
          <textarea
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            placeholder={t('typeMessage')}
            rows={4}
            className="input-field resize-none"
          />
          <div className="flex gap-3">
            <button onClick={() => setShowMessageModal(false)} className="btn-secondary flex-1">
              {t('cancel')}
            </button>
            <button
              onClick={handleSendMessage}
              disabled={sendingMsg || !messageText.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {sendingMsg ? t('loading') : <><FiMessageCircle size={16} /> {t('send')}</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('deleteListing')}
        size="sm"
      >
        <div className="text-center space-y-5">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <FiTrash2 size={28} className="text-red-500" />
          </div>
          <p className="text-gray-600">{t('confirmDelete')}</p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteModal(false)} className="btn-secondary flex-1">
              {t('cancel')}
            </button>
            <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors">
              {t('delete')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
