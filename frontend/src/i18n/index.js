import ru from './ru.js';
import uz from './uz.js';
import en from './en.js';

export const translations = { ru, uz, en };

export const languages = [
  { code: 'ru', label: 'RU', name: 'Русский', flag: '🇷🇺' },
  { code: 'uz', label: 'UZ', name: "O'zbek", flag: '🇺🇿' },
  { code: 'en', label: 'EN', name: 'English', flag: '🇬🇧' },
];

export function getTranslation(lang, key) {
  const t = translations[lang] || translations.ru;
  return t[key] || translations.ru[key] || key;
}

export function getCategoryName(category, lang) {
  if (!category) return '';
  switch (lang) {
    case 'uz': return category.name_uz || category.name_ru;
    case 'en': return category.name_en || category.name_ru;
    default: return category.name_ru;
  }
}

export default translations;
