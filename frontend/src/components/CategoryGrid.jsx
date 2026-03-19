import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext.jsx';

export default function CategoryGrid({ categories, compact = false }) {
  const { getCatName } = useLang();

  if (!categories || categories.length === 0) {
    return (
      <div className={`grid ${compact ? 'grid-cols-4 gap-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'}`}>
        {Array(12).fill(0).map((_, i) => (
          <div key={i} className="skeleton rounded-2xl h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${compact ? 'grid-cols-4 sm:grid-cols-6 gap-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'}`}>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          to={`/listings?category=${cat.slug}`}
          className="group flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1 text-center"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform duration-200"
            style={{ backgroundColor: cat.color + '20' }}
          >
            {cat.icon}
          </div>
          <span className="text-xs font-medium text-gray-700 group-hover:text-primary-600 transition-colors leading-tight">
            {getCatName(cat)}
          </span>
          {cat.listing_count !== undefined && (
            <span className="text-xs text-gray-400 mt-0.5">{cat.listing_count}</span>
          )}
        </Link>
      ))}
    </div>
  );
}
