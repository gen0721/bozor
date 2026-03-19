# Bozor.uz — Modern Marketplace

A full-stack marketplace web application similar to Avito, built with React + Vite + Tailwind CSS (frontend) and Node.js + Express + SQLite (backend).

## Quick Start

### Option 1: Double-click `start.bat`
Just run `start.bat` in the root folder. It will install dependencies and start both servers automatically.

### Option 2: Manual Start

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend** (in a separate terminal):
```bash
cd frontend
npm install
npm run dev
```

Then open: **http://localhost:5173**

## Demo Accounts

| Email | Password | Name |
|-------|----------|------|
| alex@example.com | password123 | Алексей Петров |
| maria@example.com | password123 | Мария Иванова |
| rustam@example.com | password123 | Рустам Хасанов |
| nilufar@example.com | password123 | Нилуфар Юсупова |

## Features

- **3 Languages**: Russian 🇷🇺, Uzbek 🇺🇿, English 🇬🇧 with live switcher
- **JWT Authentication**: Register/Login with persistent sessions
- **Listings**: Create, edit, delete listings with photo URLs
- **12 Categories**: Electronics, Cars, Real Estate, Clothing, Services, Jobs, Furniture, Sports, Animals, Kids, Beauty, Books
- **Search & Filters**: By keyword, category, city, price range, sort order
- **Favorites**: Save listings to wishlist
- **Messaging**: Real-time-like chat between buyers/sellers
- **User Profiles**: With ratings, reviews, listings
- **Premium Listings**: Featured/boosted placement
- **20+ Sample Listings**: Pre-seeded with real Uzbekistan cities

## Tech Stack

### Frontend
- React 18 + Vite 5
- React Router v6
- Tailwind CSS 3
- Axios for API calls
- react-hot-toast for notifications
- react-icons

### Backend
- Node.js + Express
- better-sqlite3 (fast, sync SQLite)
- bcryptjs for password hashing
- jsonwebtoken for JWT auth
- cors, dotenv

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/listings | List listings (with filters) |
| POST | /api/listings | Create listing |
| GET | /api/listings/:id | Get listing details |
| PUT | /api/listings/:id | Update listing |
| DELETE | /api/listings/:id | Delete listing |
| GET | /api/categories | Get all categories |
| GET | /api/favorites | Get user favorites |
| POST | /api/favorites/:id | Add to favorites |
| DELETE | /api/favorites/:id | Remove from favorites |
| GET | /api/messages | Get conversations |
| GET | /api/messages/:userId | Get chat messages |
| POST | /api/messages | Send message |
| GET | /api/users/:id | Get user profile |
| PUT | /api/users/:id | Update user profile |
| POST | /api/reviews | Add review |

## Project Structure

```
marketplace/
├── backend/
│   ├── server.js          # Express server + all routes
│   ├── database.js        # SQLite setup + seeding
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios API calls
│   │   ├── components/    # Reusable components
│   │   ├── context/       # Auth + Lang context
│   │   ├── i18n/          # RU/UZ/EN translations
│   │   └── pages/         # All page components
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── start.bat
└── README.md
```
