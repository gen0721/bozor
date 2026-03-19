const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'marketplace.db'));

// Enable WAL mode for better performance
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

function initializeDatabase() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT DEFAULT NULL,
      phone TEXT DEFAULT NULL,
      city TEXT DEFAULT NULL,
      bio TEXT DEFAULT NULL,
      rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      is_admin INTEGER DEFAULT 0,
      is_banned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_ru TEXT NOT NULL,
      name_uz TEXT NOT NULL,
      name_en TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      category_id INTEGER NOT NULL,
      city TEXT NOT NULL,
      images TEXT DEFAULT '[]',
      status TEXT DEFAULT 'active',
      is_premium INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, listing_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      listing_id INTEGER,
      text TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reviewer_id INTEGER NOT NULL,
      reviewed_id INTEGER NOT NULL,
      listing_id INTEGER,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migrate: add new columns if missing
  try { db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0'); } catch(e) {}
  try { db.exec('ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0'); } catch(e) {}

  // Check if already seeded
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (categoryCount.count > 0) {
    // Ensure first user (alex) is admin
    db.prepare("UPDATE users SET is_admin = 1 WHERE email = 'alex@example.com'").run();
    console.log('Database already seeded, skipping...');
    return;
  }

  console.log('Seeding database...');

  // Seed categories
  const insertCategory = db.prepare(`
    INSERT INTO categories (name_ru, name_uz, name_en, icon, color, slug)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const categories = [
    ['Электроника', 'Elektronika', 'Electronics', '📱', '#3B82F6', 'electronics'],
    ['Автомобили', 'Avtomobillar', 'Cars', '🚗', '#EF4444', 'cars'],
    ['Недвижимость', 'Ko\'chmas mulk', 'Real Estate', '🏠', '#10B981', 'real-estate'],
    ['Одежда', 'Kiyim-kechak', 'Clothing', '👗', '#8B5CF6', 'clothing'],
    ['Услуги', 'Xizmatlar', 'Services', '🔧', '#F59E0B', 'services'],
    ['Работа', 'Ish', 'Jobs', '💼', '#06B6D4', 'jobs'],
    ['Мебель', 'Mebel', 'Furniture', '🪑', '#84CC16', 'furniture'],
    ['Спорт', 'Sport', 'Sports', '⚽', '#F97316', 'sports'],
    ['Животные', 'Hayvonlar', 'Animals', '🐾', '#EC4899', 'animals'],
    ['Детские товары', 'Bolalar uchun', 'Kids', '🧸', '#6366F1', 'kids'],
    ['Красота', 'Go\'zallik', 'Beauty', '💄', '#DB2777', 'beauty'],
    ['Книги', 'Kitoblar', 'Books', '📚', '#7C3AED', 'books'],
  ];

  for (const cat of categories) {
    insertCategory.run(...cat);
  }

  // Seed demo users
  const hashedPassword = bcrypt.hashSync('password123', 10);
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, phone, city, rating, review_count, avatar, is_admin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [
    ['Алексей Петров', 'alex@example.com', hashedPassword, '+998901234567', 'Ташкент', 4.8, 24, 'https://i.pravatar.cc/150?img=1', 1],
    ['Мария Иванова', 'maria@example.com', hashedPassword, '+998902345678', 'Самарканд', 4.5, 12, 'https://i.pravatar.cc/150?img=5', 0],
    ['Рустам Хасанов', 'rustam@example.com', hashedPassword, '+998903456789', 'Ташкент', 4.9, 38, 'https://i.pravatar.cc/150?img=3', 0],
    ['Нилуфар Юсупова', 'nilufar@example.com', hashedPassword, '+998904567890', 'Бухара', 4.7, 15, 'https://i.pravatar.cc/150?img=9', 0],
    ['Дмитрий Козлов', 'dmitry@example.com', hashedPassword, '+998905678901', 'Ташкент', 4.6, 20, 'https://i.pravatar.cc/150?img=7', 0],
  ];

  for (const user of users) {
    insertUser.run(...user);
  }

  // Seed listings
  const insertListing = db.prepare(`
    INSERT INTO listings (user_id, title, description, price, category_id, city, images, is_premium, views, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ? || ' days'))
  `);

  const listings = [
    // Electronics (cat 1)
    [1, 'iPhone 15 Pro Max 256GB', 'Продаю iPhone 15 Pro Max в отличном состоянии. Куплен 3 месяца назад, есть все документы и коробка. Цвет — Titanium Black. Без царапин и трещин.', 12500000, 1, 'Ташкент', JSON.stringify(['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800']), 1, 342, '-2'],
    [2, 'Samsung Galaxy S24 Ultra', 'Samsung Galaxy S24 Ultra 512GB, цвет Titanium Yellow. В идеальном состоянии, полный комплект. Продаю в связи с переходом на другой телефон.', 10800000, 1, 'Самарканд', JSON.stringify(['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800']), 0, 215, '-5'],
    [3, 'MacBook Pro 14" M3', 'MacBook Pro 14 дюймов с чипом M3. 16GB RAM, 512GB SSD. Состояние как новый. Продаю из-за смены работы. Есть AppleCare до 2026 года.', 18900000, 1, 'Ташкент', JSON.stringify(['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', 'https://images.unsplash.com/photo-1611186871525-9c5f9d5ee6e8?w=800']), 1, 178, '-1'],
    [4, 'Sony PlayStation 5', 'PS5 с двумя джойстиками и играми: Spider-Man 2, FIFA 24, God of War Ragnarok. Состояние отличное. Продаю комплектом.', 5500000, 1, 'Бухара', JSON.stringify(['https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800']), 0, 289, '-3'],
    [5, 'Dell XPS 15 ноутбук', 'Мощный ноутбук Dell XPS 15. Intel Core i7, 32GB RAM, 1TB SSD, RTX 3050. Отличен для работы и игр. Гарантия до конца года.', 9200000, 1, 'Ташкент', JSON.stringify(['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800']), 0, 134, '-7'],

    // Cars (cat 2)
    [1, 'Chevrolet Nexia 3 2021', 'Продаю Chevrolet Nexia 3, 2021 года. Пробег 45,000 км. Цвет белый. В отличном состоянии, один хозяин. Все техобслуживания пройдены у официального дилера.', 98000000, 2, 'Ташкент', JSON.stringify(['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800']), 1, 567, '-4'],
    [2, 'Hyundai Tucson 2022', 'Hyundai Tucson 2022 года, полный привод. Пробег 28,000 км. Цвет серебристый металлик. Все опции, панорамная крыша.', 195000000, 2, 'Самарканд', JSON.stringify(['https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800']), 0, 423, '-6'],
    [3, 'Cobalt 2020', 'Chevrolet Cobalt 2020 года. Пробег 62,000 км. Цвет синий. Один хозяин, не бит, не крашен. Все документы в порядке.', 65000000, 2, 'Ташкент', JSON.stringify(['https://images.unsplash.com/photo-1580414057403-c5f451f30e1c?w=800']), 0, 312, '-10'],

    // Real Estate (cat 3)
    [4, '3-комнатная квартира в центре', 'Продается просторная 3-комнатная квартира площадью 85 кв.м. в центре города. Новый ремонт, встроенная кухня. Развитая инфраструктура. 3 этаж из 9.', 285000000, 3, 'Ташкент', JSON.stringify(['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800']), 1, 734, '-8'],
    [5, 'Дом 200 кв.м. с участком', 'Продается двухэтажный дом 200 кв.м. с участком 8 соток. 5 спален, 3 ванные, гараж, бассейн. Тихий район, охраняемый поселок.', 890000000, 3, 'Ташкент', JSON.stringify(['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800']), 1, 521, '-12'],
    [1, '1-комнатная квартира, студия', 'Уютная квартира-студия 42 кв.м. Евроремонт, новая мебель. Отличный вид из окна. Рядом метро и торговые центры. Идеально для молодой пары.', 145000000, 3, 'Самарканд', JSON.stringify(['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800']), 0, 298, '-15'],

    // Clothing (cat 4)
    [2, 'Куртка Nike зимняя, размер L', 'Продаю зимнюю куртку Nike, размер L. Состояние отличное, надевал 2 раза. Цвет черный. Оригинал, есть чек.', 350000, 4, 'Ташкент', JSON.stringify(['https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800']), 0, 89, '-3'],
    [3, 'Платье вечернее, размер M', 'Вечернее платье в пол, цвет изумрудный. Размер M. Надевалось один раз на свадьбу. Отличное состояние.', 450000, 4, 'Бухара', JSON.stringify(['https://images.unsplash.com/photo-1566479179817-b78e14dbd9da?w=800']), 0, 112, '-5'],

    // Services (cat 5)
    [4, 'Ремонт квартир и офисов', 'Выполняю все виды ремонтных работ: штукатурка, шпаклевка, покраска, укладка плитки, установка сантехники. Опыт 10 лет. Гарантия качества. Выезд на осмотр бесплатно.', 150000, 5, 'Ташкент', JSON.stringify(['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800']), 1, 456, '-2'],
    [5, 'Фотограф на мероприятия', 'Профессиональный фотограф. Свадьбы, юбилеи, корпоративы. Опыт 7 лет. Современное оборудование. Быстрая обработка фото. Портфолио предоставлю.', 500000, 5, 'Ташкент', JSON.stringify(['https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800']), 0, 234, '-4'],

    // Jobs (cat 6)
    [1, 'Требуется программист React/Node.js', 'Ищем опытного full-stack разработчика. Требования: React 2+ года, Node.js, PostgreSQL. Условия: удаленная работа, достойная зарплата, ДМС, обучение за счет компании.', 8000000, 6, 'Ташкент', JSON.stringify(['https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800']), 1, 678, '-1'],
    [2, 'Менеджер по продажам', 'Крупная торговая компания ищет менеджера по продажам. Опыт от 1 года. Оклад + % от продаж. Соцпакет, корпоративная связь.', 3500000, 6, 'Самарканд', JSON.stringify(['https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800']), 0, 345, '-7'],

    // Furniture (cat 7)
    [3, 'Диван угловой кожаный', 'Угловой диван из натуральной кожи. Цвет коричневый. Размер 280x180 см. В отличном состоянии, без повреждений. Самовывоз из Ташкента.', 2800000, 7, 'Ташкент', JSON.stringify(['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800']), 0, 167, '-9'],
    [4, 'Кухонный гарнитур новый', 'Продаю новый кухонный гарнитур белого цвета. Длина 2.4 метра. В коробке, не устанавливался. Продаем из-за смены планировки.', 4500000, 7, 'Бухара', JSON.stringify(['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800']), 0, 203, '-11'],

    // Sports (cat 8)
    [5, 'Велосипед горный Trek', 'Горный велосипед Trek Marlin 7, 2022 года. Размер рамы M. Состояние хорошее, все работает исправно. Новые покрышки.', 3200000, 8, 'Ташкент', JSON.stringify(['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800']), 0, 178, '-6'],

    // Animals (cat 9)
    [1, 'Щенки лабрадора', 'Продаются щенки лабрадора-ретривера. Возраст 2 месяца. Родители с документами. Привиты, обработаны от паразитов. Есть ветпаспорт.', 2500000, 9, 'Ташкент', JSON.stringify(['https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800']), 1, 445, '-3'],

    // Kids (cat 10)
    [2, 'Детская коляска Bugaboo', 'Продаю детскую коляску Bugaboo Cameleon 3. Полная комплектация: люлька, прогулочный блок, дождевик. Состояние отличное.', 1800000, 10, 'Самарканд', JSON.stringify(['https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800']), 0, 134, '-14'],

    // Beauty (cat 11)
    [3, 'Набор профессиональной косметики', 'Продаю набор профессиональной косметики MAC. Тени, помады, хайлайтеры. Все новое, использовалось как тестер. Отличный подарок.', 750000, 11, 'Ташкент', JSON.stringify(['https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800']), 0, 98, '-8'],
  ];

  for (const listing of listings) {
    insertListing.run(...listing);
  }

  // Add some sample messages
  const insertMessage = db.prepare(`
    INSERT INTO messages (sender_id, receiver_id, listing_id, text, read, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', ? || ' hours'))
  `);

  const messages = [
    [2, 1, 1, 'Здравствуйте! Интересует ваш iPhone. Возможен торг?', 1, '-48'],
    [1, 2, 1, 'Здравствуйте! Да, небольшой торг возможен. Что вас интересует?', 1, '-47'],
    [2, 1, 1, 'Готов взять за 12 миллионов, как вам?', 1, '-46'],
    [1, 2, 1, 'Договоримся на 12.2 млн. Когда можете посмотреть?', 0, '-45'],
    [3, 1, 3, 'Привет! MacBook еще в продаже?', 1, '-24'],
    [1, 3, 3, 'Да, еще в продаже!', 0, '-23'],
    [4, 5, 14, 'Добрый день! Свободны ли вы на следующей неделе для съемки корпоратива?', 0, '-5'],
  ];

  for (const msg of messages) {
    insertMessage.run(...msg);
  }

  // Add some reviews
  const insertReview = db.prepare(`
    INSERT INTO reviews (reviewer_id, reviewed_id, rating, comment)
    VALUES (?, ?, ?, ?)
  `);

  const reviews = [
    [2, 1, 5, 'Отличный продавец! Всё как описано, быстро ответил.'],
    [3, 1, 5, 'Очень доволен покупкой. Рекомендую!'],
    [4, 1, 4, 'Хороший продавец, небольшая задержка но всё ок.'],
    [1, 2, 5, 'Надежный покупатель, всё прошло гладко.'],
    [5, 3, 5, 'Профессионал! Товар в идеальном состоянии.'],
  ];

  for (const review of reviews) {
    insertReview.run(...review);
  }

  console.log('Database seeded successfully!');
}

initializeDatabase();

module.exports = db;
