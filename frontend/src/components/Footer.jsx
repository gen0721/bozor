import React from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiInstagram, FiTwitter, FiFacebook } from 'react-icons/fi';
import { useLang } from '../context/LangContext.jsx';

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">B</span>
              </div>
              <span className="text-xl font-extrabold text-white">Bozor.uz</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              {t('tagline')}. Покупайте и продавайте быстро и безопасно.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 bg-gray-800 hover:bg-primary-600 rounded-lg transition-colors">
                <FiInstagram size={16} />
              </a>
              <a href="#" className="p-2 bg-gray-800 hover:bg-primary-600 rounded-lg transition-colors">
                <FiFacebook size={16} />
              </a>
              <a href="#" className="p-2 bg-gray-800 hover:bg-primary-600 rounded-lg transition-colors">
                <FiTwitter size={16} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-4">Навигация</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">{t('home')}</Link></li>
              <li><Link to="/listings" className="hover:text-white transition-colors">{t('listings')}</Link></li>
              <li><Link to="/create-listing" className="hover:text-white transition-colors">{t('postAd')}</Link></li>
              <li><Link to="/favorites" className="hover:text-white transition-colors">{t('favorites')}</Link></li>
              <li><Link to="/messages" className="hover:text-white transition-colors">{t('messages')}</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('categories')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/listings?category=electronics" className="hover:text-white transition-colors">📱 Электроника</Link></li>
              <li><Link to="/listings?category=cars" className="hover:text-white transition-colors">🚗 Автомобили</Link></li>
              <li><Link to="/listings?category=real-estate" className="hover:text-white transition-colors">🏠 Недвижимость</Link></li>
              <li><Link to="/listings?category=clothing" className="hover:text-white transition-colors">👗 Одежда</Link></li>
              <li><Link to="/listings?category=services" className="hover:text-white transition-colors">🔧 Услуги</Link></li>
              <li><Link to="/listings?category=jobs" className="hover:text-white transition-colors">💼 Работа</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Контакты</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <FiMapPin size={15} className="text-primary-400 shrink-0" />
                <span>Ташкент, Узбекистан</span>
              </li>
              <li className="flex items-center gap-2.5">
                <FiPhone size={15} className="text-primary-400 shrink-0" />
                <a href="tel:+998781234567" className="hover:text-white transition-colors">+998 78 123-45-67</a>
              </li>
              <li className="flex items-center gap-2.5">
                <FiMail size={15} className="text-primary-400 shrink-0" />
                <a href="mailto:info@bozor.uz" className="hover:text-white transition-colors">info@bozor.uz</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2024 Bozor.uz. Все права защищены.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-300 transition-colors">Политика конфиденциальности</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Условия использования</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
