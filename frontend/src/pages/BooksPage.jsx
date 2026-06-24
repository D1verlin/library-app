import { useState, useEffect, useCallback } from 'react';
import api from '../api.js';
import { Book, Plus, AlertTriangle, Save, Upload, MapPin, Search, CheckCircle2, Pencil, Trash2 } from 'lucide-react';

const EMPTY_BOOK_FORM = {
  nazvanie: '', avtor: '', opisanie: '', zhanr: '',
  vozrastnoe_ogranichenie: '0+', izdatel: '', adresa_bibliotek_nahozhdeniya: ''
};

function BookFormModal({ book, onClose, onSave }) {
  const [form, setForm] = useState(book ? {
    nazvanie: book.nazvanie || '', avtor: book.avtor || '',
    opisanie: book.opisanie || '', zhanr: book.zhanr || '',
    vozrastnoe_ogranichenie: book.vozrastnoe_ogranichenie || '0+',
    izdatel: book.izdatel || '', adresa_bibliotek_nahozhdeniya: book.adresa_bibliotek_nahozhdeniya || ''
  } : EMPTY_BOOK_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (book) await api.put(`/books/${book.id_knigi}`, form);
      else       await api.post('/books', form);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center' }}>{book ? <><Pencil size={20} style={{marginRight: 8}} /> Редактировать книгу</> : <><Plus size={20} style={{marginRight: 8}} /> Добавить книгу</>}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><AlertTriangle size={18} style={{marginRight: 8, marginBottom: -4}} /> {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Название *</label>
                <input className="form-input" name="nazvanie" value={form.nazvanie} onChange={handleChange} required placeholder="Война и мир" />
              </div>
              <div className="form-group">
                <label className="form-label">Автор *</label>
                <input className="form-input" name="avtor" value={form.avtor} onChange={handleChange} required placeholder="Лев Толстой" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Описание</label>
              <textarea className="form-textarea" name="opisanie" value={form.opisanie} onChange={handleChange} placeholder="Краткое описание книги..." />
            </div>
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label className="form-label">Жанр</label>
                <input className="form-input" name="zhanr" value={form.zhanr} onChange={handleChange} placeholder="Роман" />
              </div>
              <div className="form-group">
                <label className="form-label">Возрастное ограничение</label>
                <select className="form-select" name="vozrastnoe_ogranichenie" value={form.vozrastnoe_ogranichenie} onChange={handleChange}>
                  {['0+','6+','12+','16+','18+'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Издатель</label>
                <input className="form-input" name="izdatel" value={form.izdatel} onChange={handleChange} placeholder="АСТ" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Адрес нахождения в библиотеке</label>
              <input className="form-input" name="adresa_bibliotek_nahozhdeniya" value={form.adresa_bibliotek_nahozhdeniya} onChange={handleChange} placeholder="Зал №1, стеллаж 3" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }}></span> : <Save size={18} style={{marginRight: 6, marginBottom: -4}} />} Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function IssueModal({ book, onClose, onIssued }) {
  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [srok, setSrok] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!clientSearch.trim()) { setClients([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await api.get('/clients', { params: { search: clientSearch } });
        setClients(r.data.slice(0, 10));
      } catch {}
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [clientSearch]);

  const handleIssue = async () => {
    if (!selectedClient) return setError('Выберите клиента');
    if (!srok) return setError('Укажите срок возврата');
    setError(''); setLoading(true);
    try {
      await api.post('/archive/issue', {
        id_klienta: selectedClient.id_klienta,
        id_knigi: book.id_knigi,
        srok_vozvrata: srok
      });
      onIssued();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка выдачи');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center' }}><Upload size={20} style={{marginRight: 8}} /> Выдача книги</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><AlertTriangle size={18} style={{marginRight: 8, marginBottom: -4}} /> {error}</div>}
        <div className="modal-body">
          {/* Книга */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}><Book size={18} style={{marginRight: 8}} /> {book.nazvanie}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{book.avtor}</div>
            {book.adresa_bibliotek_nahozhdeniya && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center' }}>
                <MapPin size={14} style={{marginRight: 4}} /> {book.adresa_bibliotek_nahozhdeniya}
              </div>
            )}
          </div>

          {/* Поиск клиента */}
          <div className="form-group">
            <label className="form-label">Поиск клиента</label>
            <div className="search-bar">
              <span className="search-bar-icon"><Search size={18} /></span>
              <input
                className="form-input"
                placeholder="Введите ФИО или телефон..."
                value={clientSearch}
                onChange={e => { setClientSearch(e.target.value); setSelectedClient(null); }}
              />
            </div>
            {searching && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.25rem 0' }}>Поиск...</div>}
          </div>

          {clients.length > 0 && !selectedClient && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 200, overflowY: 'auto' }}>
              {clients.map(c => (
                <div key={c.id_klienta} className="client-card" style={{ padding: '0.75rem 1rem' }}
                  onClick={() => { setSelectedClient(c); setClientSearch(`${c.familiya} ${c.imya}`); setClients([]); }}>
                  <div className="client-avatar" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>
                    {`${c.familiya?.[0] || ''}${c.imya?.[0] || ''}`.toUpperCase()}
                  </div>
                  <div className="client-info">
                    <div className="client-name">{c.familiya} {c.imya} {c.otchestvo || ''}</div>
                    <div className="client-meta">{c.nomer_telefona || `ID: ${c.id_klienta}`}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedClient && (
            <div className="alert alert-success">
              <span style={{ display: 'inline-flex', alignItems: 'center' }}><CheckCircle2 size={16} style={{marginRight: 6}} /> Выбран:</span> <strong>{selectedClient.familiya} {selectedClient.imya} {selectedClient.otchestvo || ''}</strong>
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { setSelectedClient(null); setClientSearch(''); }}>✕</button>
            </div>
          )}

          {/* Срок возврата */}
          <div className="form-group">
            <label className="form-label">Срок возврата *</label>
            <input
              className="form-input"
              type="date"
              value={srok}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setSrok(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn btn-success" onClick={handleIssue} disabled={loading || !selectedClient}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }}></span> : <Upload size={18} style={{marginRight: 6, marginBottom: -4}} />} Выдать книгу
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBookForm, setShowBookForm] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [issueBook, setIssueBook] = useState(null);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchBooks = useCallback(async (q = '', avail = false) => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (q) params.search = q;
      if (avail) params.available = 'true';
      const res = await api.get('/books', { params });
      setBooks(res.data);
    } catch {
      setError('Ошибка загрузки книг');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchBooks(search, onlyAvailable), 300);
    return () => clearTimeout(t);
  }, [search, onlyAvailable, fetchBooks]);

  const handleDelete = async (book) => {
    try {
      await api.delete(`/books/${book.id_knigi}`);
      setDeleteConfirm(null);
      fetchBooks(search, onlyAvailable);
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка удаления');
    }
  };

  const GENRE_EMOJIS = { 'Роман': <Book size={24} color="#10b981" />, 'Поэзия': <Book size={24} color="#3b82f6" />, 'Поэма': <Book size={24} color="#f59e0b" />, 'Рассказ': <Book size={24} color="#6b7280" />, 'Повесть': <Book size={24} color="#ef4444" /> };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"><Book size={32} style={{marginRight: 12, marginBottom: -4}} /> Книги</h1>
        <p className="page-subtitle">Каталог, управление и выдача книг читателям</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><AlertTriangle size={18} style={{marginRight: 8, marginBottom: -4}} /> {error}</div>}

      <div className="toolbar">
        <div className="search-bar" style={{ maxWidth: 440 }}>
          <span className="search-bar-icon"><Search size={18} /></span>
          <input
            id="book-search"
            className="form-input"
            placeholder="Поиск по названию, автору или ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.875rem', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={e => setOnlyAvailable(e.target.checked)}
            style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
          />
          Только доступные
        </label>
        <div style={{ marginLeft: 'auto' }}>
          <button
            id="add-book-btn"
            className="btn btn-primary"
            onClick={() => { setEditBook(null); setShowBookForm(true); }}
          >
            <Plus size={18} style={{marginRight: 6, marginBottom: -4}} /> Добавить книгу
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><span className="spinner"></span><p>Загрузка...</p></div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Book size={48} color="var(--text-muted)" /></div>
          <div className="empty-state-text">{search ? 'Книги не найдены' : 'Каталог пуст'}</div>
          <div className="empty-state-sub">{search ? 'Попробуйте другой запрос' : 'Добавьте первую книгу'}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.85rem' }}>
          {books.map(book => (
            <div key={book.id_knigi} className="book-card">
              <div className="book-card-header">
                <div className="book-spine">{GENRE_EMOJIS[book.zhanr] || <Book size={24} color="var(--text-muted)" />}</div>
                <div className="book-info">
                  <div className="book-title">{book.nazvanie}</div>
                  <div className="book-author">{book.avtor}</div>
                </div>
                <span className={`badge ${book.dostupna ? 'badge-green' : 'badge-red'}`}>
                  {book.dostupna ? <span style={{ display: 'inline-flex', alignItems: 'center' }}><CheckCircle2 size={14} style={{marginRight: 4}} /> Свободна</span> : <span style={{ display: 'inline-flex', alignItems: 'center' }}><Upload size={14} style={{marginRight: 4}} /> Выдана</span>}
                </span>
              </div>

              <div className="book-meta">
                {book.zhanr && <span className="badge badge-muted">{book.zhanr}</span>}
                {book.vozrastnoe_ogranichenie && <span className="badge badge-amber">{book.vozrastnoe_ogranichenie}</span>}
                {book.izdatel && <span className="badge badge-blue">{book.izdatel}</span>}
              </div>

              {book.adresa_bibliotek_nahozhdeniya && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <MapPin size={14} style={{marginRight: 4}} /> {book.adresa_bibliotek_nahozhdeniya}
                </div>
              )}

              <div className="book-actions">
                {book.dostupna && (
                  <button
                    className="btn btn-success btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setIssueBook(book)}
                  >
                    <Upload size={16} style={{marginRight: 6, marginBottom: -2}} /> Выдать
                  </button>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setEditBook(book); setShowBookForm(true); }}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  disabled={!book.dostupna}
                  title={!book.dostupna ? 'Нельзя удалить выданную книгу' : 'Удалить'}
                  onClick={() => setDeleteConfirm(book)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showBookForm && (
        <BookFormModal
          book={editBook}
          onClose={() => { setShowBookForm(false); setEditBook(null); }}
          onSave={() => { setShowBookForm(false); setEditBook(null); fetchBooks(search, onlyAvailable); }}
        />
      )}

      {issueBook && (
        <IssueModal
          book={issueBook}
          onClose={() => setIssueBook(null)}
          onIssued={() => { setIssueBook(null); fetchBooks(search, onlyAvailable); }}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center' }}><AlertTriangle size={20} color="var(--accent-amber)" style={{marginRight: 8}} /> Подтверждение</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Удалить книгу <strong>«{deleteConfirm.nazvanie}»</strong>? Это действие необратимо.
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Отмена</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}><Trash2 size={16} style={{marginRight: 6, marginBottom: -2}} /> Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
