import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers, FiList, FiGrid, FiBarChart2, FiTrash2, FiShield,
  FiShieldOff, FiStar, FiToggleLeft, FiToggleRight, FiEdit2,
  FiPlus, FiX, FiCheck, FiSearch, FiAlertTriangle, FiEye,
  FiChevronLeft, FiChevronRight, FiRefreshCw, FiTag
} from 'react-icons/fi';
import { adminAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import toast from 'react-hot-toast';

// ── helpers ─────────────────────────────────────────────
function fmtPrice(p) {
  return p ? p.toLocaleString('ru-RU') + ' сум' : '—';
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── stat card ────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600 border-blue-100',
    green:  'bg-green-50 text-green-600 border-green-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    red:    'bg-red-50 text-red-600 border-red-100',
    teal:   'bg-teal-50 text-teal-600 border-teal-100',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── confirm dialog ───────────────────────────────────────
function Confirm({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <FiAlertTriangle className="text-red-500" size={24} />
          <p className="text-gray-800 font-semibold">Подтверждение</p>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors">Отмена</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 font-medium transition-colors">Удалить</button>
        </div>
      </div>
    </div>
  );
}

// ── category modal ───────────────────────────────────────
function CategoryModal({ cat, onSave, onClose }) {
  const [form, setForm] = useState(cat || { name_ru: '', name_uz: '', name_en: '', icon: '🏷️', color: '#6B7280', slug: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name_ru || !form.name_en || !form.slug) { toast.error('Заполните все обязательные поля'); return; }
    await onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-800">{cat ? 'Редактировать категорию' : 'Новая категория'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><FiX /></button>
        </div>
        <div className="space-y-3">
          {[['name_ru','Название (RU) *'],['name_uz','Название (UZ)'],['name_en','Название (EN) *'],['slug','Slug *'],['icon','Иконка (emoji)'],['color','Цвет (hex)']].map(([k,l]) => (
            <div key={k}>
              <label className="block text-sm text-gray-600 mb-1">{l}</label>
              <input value={form[k] || ''} onChange={e => set(k, e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          ))}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <span className="text-3xl">{form.icon}</span>
            <div className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ background: form.color }} />
            <span className="text-sm text-gray-500">Предпросмотр</span>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors">Отмена</button>
          <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 font-medium transition-colors">Сохранить</button>
        </div>
      </div>
    </div>
  );
}

// ── pagination ───────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button disabled={page === 1} onClick={() => onChange(page - 1)}
        className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
        <FiChevronLeft size={16} />
      </button>
      <span className="text-sm text-gray-600 px-3">Стр. {page} из {totalPages}</span>
      <button disabled={page === totalPages} onClick={() => onChange(page + 1)}
        className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
        <FiChevronRight size={16} />
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TABS
// ════════════════════════════════════════════════════════

// ── Dashboard ────────────────────────────────────────────
function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getCatName } = useLang();

  useEffect(() => {
    adminAPI.getStats().then(r => setStats(r.data)).catch(() => toast.error('Ошибка загрузки статистики')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard icon={<FiUsers size={22} />}    label="Пользователей"  value={stats.totalUsers}    sub={`+${stats.newUsersToday} сегодня`}    color="blue" />
        <StatCard icon={<FiList size={22} />}     label="Объявлений"     value={stats.totalListings}  sub={`${stats.activeListings} активных`}    color="green" />
        <StatCard icon={<FiStar size={22} />}     label="Премиум"        value={stats.premiumCount}   color="orange" />
        <StatCard icon={<FiBarChart2 size={22} />} label="Сообщений"     value={stats.totalMessages}  color="purple" />
        <StatCard icon={<FiTag size={22} />}      label="В избранном"    value={stats.totalFavs}      color="teal" />
        <StatCard icon={<FiShieldOff size={22} />} label="Заблокировано" value={stats.bannedUsers}    color="red" />
        <StatCard icon={<FiList size={22} />}     label="Новых объявл."  value={stats.newListingsToday} sub="сегодня" color="green" />
        <StatCard icon={<FiUsers size={22} />}    label="Новых юзеров"   value={stats.newUsersToday}  sub="сегодня" color="blue" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FiUsers size={18} /> Новые пользователи</h3>
          <div className="space-y-3">
            {stats.recentUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3">
                <img src={u.avatar || `https://i.pravatar.cc/32?u=${u.id}`} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {u.is_admin ? <span className="badge bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">Admin</span> : null}
                  {u.is_banned ? <span className="badge bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">Бан</span> : null}
                  <span className="text-xs text-gray-400">{fmtDate(u.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent listings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FiList size={18} /> Новые объявления</h3>
          <div className="space-y-3">
            {stats.recentListings.map(l => (
              <div key={l.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 text-lg">
                  {l.is_premium ? '⭐' : '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{l.title}</p>
                  <p className="text-xs text-gray-400">{l.seller_name} · {fmtPrice(l.price)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${l.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {l.status === 'active' ? 'Активно' : 'Скрыто'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Users tab ─────────────────────────────────────────────
function UsersTab() {
  const [data, setData] = useState({ users: [], total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback((p = page, s = search) => {
    setLoading(true);
    adminAPI.getUsers({ page: p, limit: 15, search: s || undefined })
      .then(r => setData(r.data))
      .catch(() => toast.error('Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [page, search]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); setPage(1); };

  const handleBan = async (id, name, isBanned) => {
    try {
      const r = await adminAPI.banUser(id);
      toast.success(r.data.is_banned ? `${name} заблокирован` : `${name} разблокирован`);
      load();
    } catch { toast.error('Ошибка'); }
  };

  const handleAdmin = async (id, name, isAdmin) => {
    try {
      const r = await adminAPI.toggleAdmin(id);
      toast.success(r.data.is_admin ? `${name} — теперь администратор` : `Права администратора сняты`);
      load();
    } catch { toast.error('Ошибка'); }
  };

  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteUser(id);
      toast.success('Пользователь удалён');
      setConfirm(null);
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Ошибка'); setConfirm(null); }
  };

  return (
    <div>
      {confirm && <Confirm message={`Удалить пользователя «${confirm.name}»? Все его объявления тоже будут удалены.`} onConfirm={() => handleDelete(confirm.id)} onCancel={() => setConfirm(null)} />}

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <p className="text-sm text-gray-500">Всего: <strong className="text-gray-800">{data.total}</strong></p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 transition-all">
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Поиск по имени / email..." className="px-3 py-2 text-sm focus:outline-none w-56" />
            <button type="submit" className="px-3 bg-primary-600 text-white hover:bg-primary-700 transition-colors"><FiSearch size={15} /></button>
          </div>
          {search && <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }} className="p-2 text-gray-400 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50"><FiX size={15} /></button>}
        </form>
      </div>

      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Пользователь</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Город</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Рейтинг</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Статус</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Дата</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img src={u.avatar || `https://i.pravatar.cc/32?u=${u.id}`} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        <div>
                          <p className="font-medium text-gray-800 leading-tight">{u.name}</p>
                          <p className="text-gray-400 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{u.city || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-yellow-500">★</span> <span className="text-gray-700">{u.rating ? u.rating.toFixed(1) : '0.0'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {u.is_admin ? <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Admin</span> : null}
                        {u.is_banned ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">Бан</span>
                          : <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Активен</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleAdmin(u.id, u.name, u.is_admin)} title={u.is_admin ? 'Снять admin' : 'Сделать admin'}
                          className={`p-2 rounded-xl transition-colors ${u.is_admin ? 'text-purple-600 bg-purple-50 hover:bg-purple-100' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}>
                          <FiShield size={15} />
                        </button>
                        <button onClick={() => handleBan(u.id, u.name, u.is_banned)} title={u.is_banned ? 'Разблокировать' : 'Заблокировать'}
                          className={`p-2 rounded-xl transition-colors ${u.is_banned ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'}`}>
                          {u.is_banned ? <FiToggleRight size={15} /> : <FiToggleLeft size={15} />}
                        </button>
                        <button onClick={() => setConfirm(u)} title="Удалить" className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.users.length === 0 && <p className="text-center text-gray-400 py-10">Пользователи не найдены</p>}
        </div>
      )}
      <Pagination page={page} totalPages={data.totalPages} onChange={p => setPage(p)} />
    </div>
  );
}

// ── Listings tab ──────────────────────────────────────────
function ListingsTab() {
  const [data, setData] = useState({ listings: [], total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const { getCatName } = useLang();

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.getListings({ page, limit: 15, search: search || undefined, status: statusFilter || undefined })
      .then(r => setData(r.data))
      .catch(() => toast.error('Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); setPage(1); };

  const handleStatus = async (id, currentStatus) => {
    const next = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await adminAPI.setListingStatus(id, next);
      toast.success(next === 'active' ? 'Объявление активировано' : 'Объявление скрыто');
      load();
    } catch { toast.error('Ошибка'); }
  };

  const handlePremium = async (id, isPremium) => {
    try {
      const r = await adminAPI.togglePremium(id);
      toast.success(r.data.is_premium ? 'Помечено как Premium' : 'Premium снят');
      load();
    } catch { toast.error('Ошибка'); }
  };

  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteListing(id);
      toast.success('Объявление удалено');
      setConfirm(null);
      load();
    } catch { toast.error('Ошибка'); setConfirm(null); }
  };

  return (
    <div>
      {confirm && <Confirm message={`Удалить объявление «${confirm.title}»?`} onConfirm={() => handleDelete(confirm.id)} onCancel={() => setConfirm(null)} />}

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <p className="text-sm text-gray-500">Всего: <strong className="text-gray-800">{data.total}</strong></p>
        <div className="flex gap-2 flex-wrap">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Скрытые</option>
          </select>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 transition-all">
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Поиск по названию..." className="px-3 py-2 text-sm focus:outline-none w-48" />
              <button type="submit" className="px-3 bg-primary-600 text-white hover:bg-primary-700 transition-colors"><FiSearch size={15} /></button>
            </div>
            {search && <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }} className="p-2 text-gray-400 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50"><FiX size={15} /></button>}
          </form>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Объявление</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Продавец</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Цена</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Статус</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Просм.</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.listings.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {l.images?.[0]
                          ? <img src={l.images[0]} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" onError={e => { e.target.style.display='none'; }} />
                          : <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center text-gray-300"><FiList size={16} /></div>}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate max-w-[160px]">{l.title}</p>
                          <p className="text-xs text-gray-400">{l.name_ru} {l.is_premium ? '⭐' : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{l.seller_name}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium hidden lg:table-cell">{fmtPrice(l.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {l.status === 'active' ? 'Активно' : 'Скрыто'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{l.views}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handlePremium(l.id, l.is_premium)} title={l.is_premium ? 'Снять Premium' : 'Сделать Premium'}
                          className={`p-2 rounded-xl transition-colors ${l.is_premium ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'}`}>
                          <FiStar size={15} />
                        </button>
                        <button onClick={() => handleStatus(l.id, l.status)} title={l.status === 'active' ? 'Скрыть' : 'Активировать'}
                          className={`p-2 rounded-xl transition-colors ${l.status === 'active' ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}>
                          {l.status === 'active' ? <FiToggleRight size={15} /> : <FiToggleLeft size={15} />}
                        </button>
                        <a href={`/listings/${l.id}`} target="_blank" rel="noreferrer" title="Просмотреть" className="p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                          <FiEye size={15} />
                        </a>
                        <button onClick={() => setConfirm(l)} title="Удалить" className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.listings.length === 0 && <p className="text-center text-gray-400 py-10">Объявления не найдены</p>}
        </div>
      )}
      <Pagination page={page} totalPages={data.totalPages} onChange={p => setPage(p)} />
    </div>
  );
}

// ── Categories tab ────────────────────────────────────────
function CategoriesTab() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | categoryObj
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    adminAPI.getCategories().then(r => setCats(r.data)).catch(() => toast.error('Ошибка')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    try {
      if (modal === 'new') {
        await adminAPI.createCategory(form);
        toast.success('Категория создана');
      } else {
        await adminAPI.updateCategory(modal.id, form);
        toast.success('Категория обновлена');
      }
      setModal(null);
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Ошибка'); }
  };

  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteCategory(id);
      toast.success('Категория удалена');
      setConfirm(null);
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Нельзя удалить: есть объявления'); setConfirm(null); }
  };

  return (
    <div>
      {modal && <CategoryModal cat={modal === 'new' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
      {confirm && <Confirm message={`Удалить категорию «${confirm.name_ru}»?`} onConfirm={() => handleDelete(confirm.id)} onCancel={() => setConfirm(null)} />}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Всего: <strong className="text-gray-800">{cats.length}</strong></p>
        <button onClick={() => setModal('new')} className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
          <FiPlus size={15} /> Добавить категорию
        </button>
      </div>

      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cats.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border-2 border-white shadow-sm" style={{ background: c.color + '20' }}>
                {c.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{c.name_ru}</p>
                <p className="text-xs text-gray-400 truncate">{c.name_uz} · {c.name_en}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.listing_count} объявлений · /{c.slug}</p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => setModal(c)} className="p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                  <FiEdit2 size={15} />
                </button>
                <button onClick={() => setConfirm(c)} className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <FiTrash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// MAIN ADMIN PAGE
// ════════════════════════════════════════════════════════
const TABS = [
  { id: 'dashboard', label: 'Дашборд',      icon: <FiBarChart2 size={18} /> },
  { id: 'users',     label: 'Пользователи', icon: <FiUsers size={18} /> },
  { id: 'listings',  label: 'Объявления',   icon: <FiList size={18} /> },
  { id: 'categories',label: 'Категории',    icon: <FiGrid size={18} /> },
];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      toast.error('Доступ запрещён');
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user?.is_admin) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <FiShield className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Панель администратора</h1>
              <p className="text-xs text-gray-400">Bozor.uz Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 hidden sm:block">Вы: <strong>{user.name}</strong></span>
            <button onClick={() => navigate('/')} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
              ← На сайт
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-0">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  tab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {tab === 'dashboard'  && <Dashboard />}
        {tab === 'users'      && <UsersTab />}
        {tab === 'listings'   && <ListingsTab />}
        {tab === 'categories' && <CategoriesTab />}
      </div>
    </div>
  );
}
