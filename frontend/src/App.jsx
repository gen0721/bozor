import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import ListingsPage from './pages/ListingsPage.jsx';
import ListingDetailPage from './pages/ListingDetailPage.jsx';
import CreateListingPage from './pages/CreateListingPage.jsx';
import EditListingPage from './pages/EditListingPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import MyListingsPage from './pages/MyListingsPage.jsx';
import FavoritesPage from './pages/FavoritesPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import { categoriesAPI } from './api/index.js';

export default function App() {
  const [categories, setCategories] = useState([]);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  useEffect(() => {
    categoriesAPI.getAll()
      .then(res => setCategories(res.data))
      .catch(() => {});
  }, []);

  // Pages without footer/header
  const noFooter = ['/messages', '/admin'];
  const noHeader = ['/admin'];
  const showFooter = !noFooter.some(p => pathname.startsWith(p));
  const showHeader = !noHeader.some(p => pathname.startsWith(p));

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header categories={categories} />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage categories={categories} />} />
          <Route path="/listings" element={<ListingsPage categories={categories} />} />
          <Route path="/listings/:id" element={<ListingDetailPage />} />
          <Route path="/create-listing" element={<CreateListingPage categories={categories} />} />
          <Route path="/edit-listing/:id" element={<EditListingPage categories={categories} />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/my-listings" element={<MyListingsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:userId" element={<MessagesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
