import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiPlus, FiX, FiImage, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { listingsAPI } from '../api/index.js';

const CITIES = ['Ташкент', 'Самарканд', 'Бухара', 'Наманган', 'Андижан', 'Фергана', 'Нукус', 'Термез', 'Коканд', 'Карши'];

export default function CreateListingPage({ categories }) {
  const { user } = useAuth();
  const { t, getCatName } = useLang();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    city: '',
    is_premium: false,
  });
  const [images, setImages] = useState(['']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = (idx, value) => {
    setImages(prev => prev.map((img, i) => i === idx ? value : img));
  };

  const addImageField = () => {
    if (images.length < 6) setImages(prev => [...prev, '']);
  };

  const removeImageField = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error(t('titleRequired'));
    if (!form.description.trim()) return toast.error(t('descriptionRequired'));
    if (!form.price) return toast.error(t('priceRequired'));
    if (!form.category_id) return toast.error(t('categoryRequired'));
    if (!form.city.trim()) return toast.error(t('cityRequired'));

    const validImages = images.filter(url => url.trim());
    setLoading(true);
    try {
      const res = await listingsAPI.create({
        ...form,
        price: parseFloat(form.price),
        category_id: parseInt(form.category_id),
        images: validImages,
      });
      toast.success(t('listingCreated'));
      navigate(`/listings/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || t('somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-primary-600 transition-colors">{t('home')}</Link>
        <span>/</span>
        <span className="text-gray-600">{t('createListing')}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5">
          <h1 className="text-xl font-bold text-white">{t('createListing')}</h1>
          <p className="text-primary-200 text-sm mt-1">Заполните все поля для лучшего результата</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('listingTitle')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Например: iPhone 15 Pro Max 256GB"
              className="input-field"
              maxLength={120}
            />
            <p className="text-xs text-gray-400 mt-1">{form.title.length}/120</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('listingDescription')} <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Опишите товар подробно: состояние, комплектация, причина продажи..."
              rows={5}
              className="input-field resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-gray-400 mt-1">{form.description.length}/2000</p>
          </div>

          {/* Price + Category row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('listingPrice')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0"
                  className="input-field pr-14"
                  min="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">сум</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('listingCategory')} <span className="text-red-500">*</span>
              </label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">{t('selectCategory')}</option>
                {categories?.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {getCatName(cat)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('listingCity')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="Например: Ташкент"
              className="input-field"
              list="cities-list"
            />
            <datalist id="cities-list">
              {CITIES.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('listingImages')} <span className="text-gray-400 font-normal">(необязательно)</span>
            </label>
            <div className="space-y-2">
              {images.map((url, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="relative flex-1">
                    <FiImage className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="url"
                      value={url}
                      onChange={e => handleImageChange(idx, e.target.value)}
                      placeholder={t('imageUrlPlaceholder')}
                      className="input-field pl-9"
                    />
                  </div>
                  {images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageField(idx)}
                      className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>
              ))}
              {/* Preview */}
              {images.some(url => url.trim()) && (
                <div className="flex gap-2 mt-2">
                  {images.filter(url => url.trim()).map((url, i) => (
                    <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            {images.length < 6 && (
              <button
                type="button"
                onClick={addImageField}
                className="mt-2 flex items-center gap-1.5 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
              >
                <FiPlus size={16} /> {t('addImageUrl')}
              </button>
            )}
          </div>

          {/* Premium */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_premium"
                checked={form.is_premium}
                onChange={handleChange}
                className="mt-1 w-4 h-4 accent-yellow-500 rounded"
              />
              <div>
                <div className="flex items-center gap-2 font-semibold text-gray-800">
                  <FiStar className="text-yellow-500 fill-yellow-500" size={16} />
                  {t('isPremium')}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{t('premiumHint')}</p>
              </div>
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Link to="/" className="btn-secondary flex-1 text-center py-3">
              {t('cancel')}
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-3 text-base"
            >
              {loading ? t('loading') : t('publishListing')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
