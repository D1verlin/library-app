import { useState, useEffect, useCallback } from 'react';
import api from '../api.js';
import { User, Plus, AlertTriangle, Save, Book, Trash2, Pencil, Search, Phone, Calendar } from 'lucide-react';

const EMPTY_FORM = {
  imya: '', familiya: '', otchestvo: '',
  mesto_propiski: '', nomer_telefona: '', adres_elektronnoy_pochty: ''
};

function ClientModal({ client, onClose, onSave }) {
  const [form, setForm] = useState(client ? {
    imya: client.imya || '', familiya: client.familiya || '',
    otchestvo: client.otchestvo || '', mesto_propiski: client.mesto_propiski || '',
    nomer_telefona: client.nomer_telefona || '', adres_elektronnoy_pochty: client.adres_elektronnoy_pochty || ''
  } : EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (client) {
        await api.put(`/clients/${client.id_klienta}`, form);
      } else {
        await api.post('/clients', form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center' }}>{client ? <><Pencil size={20} style={{marginRight: 8}} /> Редактировать клиента</> : <><Plus size={20} style={{marginRight: 8}} /> Новый клиент</>}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><AlertTriangle size={18} style={{marginRight: 8, marginBottom: -4}} /> {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label className="form-label">Фамилия *</label>
                <input className="form-input" name="familiya" value={form.familiya} onChange={handleChange} required placeholder="Иванов" />
              </div>
              <div className="form-group">
                <label className="form-label">Имя *</label>
                <input className="form-input" name="imya" value={form.imya} onChange={handleChange} required placeholder="Иван" />
              </div>
              <div className="form-group">
                <label className="form-label">Отчество</label>
                <input className="form-input" name="otchestvo" value={form.otchestvo} onChange={handleChange} placeholder="Иванович" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Место прописки</label>
              <input className="form-input" name="mesto_propiski" value={form.mesto_propiski} onChange={handleChange} placeholder="г. Москва, ул. Ленина, 1" />
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Телефон</label>
                <input className="form-input" name="nomer_telefona" value={form.nomer_telefona} onChange={handleChange} placeholder="+7 (900) 000-00-00" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" name="adres_elektronnoy_pochty" value={form.adres_elektronnoy_pochty} onChange={handleChange} placeholder="email@mail.ru" />
              </div>
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

function ClientDetailModal({ client, onClose, onEdit, onDelete }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/clients/${client.id_klienta}`)
      .then(r => setDetail(r.data))
      .catch(() => setDetail(client))
      .finally(() => setLoading(false));
  }, [client.id_klienta]);

  const isOverdue = (srok) => srok && new Date(srok) < new Date() && !isNaN(new Date(srok));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center' }}><User size={20} style={{marginRight: 8}} /> Карточка клиента #{client.id_klienta}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner"></span></div>
        ) : detail && (
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1.5rem', fontSize: '0.9rem' }}>
              {[
                ['ФИО', `${detail.familiya} ${detail.imya} ${detail.otchestvo || ''}`],
                ['Прописка', detail.mesto_propiski || '—'],
                ['Телефон', detail.nomer_telefona || '—'],
                ['Email', detail.adres_elektronnoy_pochty || '—'],
                ['Дата регистрации', detail.data_registracii || '—'],
                ['Библиотека', detail.nazvanie_biblioteki || '—'],
              ].map(([label, val]) => (
                <>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
                  <span>{val}</span>
                </>
              ))}
            </div>

            {detail.aktivnye_knigi?.length > 0 && (
              <>
                <div className="divider" />
                <div className="card-title" style={{ display: 'flex', alignItems: 'center' }}><Book size={18} style={{marginRight: 8}} /> Активные выдачи ({detail.aktivnye_knigi.length})</div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Книга</th>
                        <th>Выдана</th>
                        <th>Вернуть до</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.aktivnye_knigi.map(v => (
                        <tr key={v.id_vydachi}>
                          <td>
                            <div>{v.nazvanie}</div>
                            <div className="text-muted">{v.avtor}</div>
                          </td>
                          <td>{v.data_vydachi}</td>
                          <td className={isOverdue(v.srok_vozvrata) ? 'overdue' : ''}>
                            {v.srok_vozvrata}
                            {isOverdue(v.srok_vozvrata) && <span style={{ marginLeft: '0.25rem' }}><AlertTriangle size={14} color="var(--accent-red)" style={{marginBottom: -2}} /></span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {(!detail.aktivnye_knigi || detail.aktivnye_knigi.length === 0) && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem', fontSize: '0.85rem' }}>
                Нет активных выдач
              </div>
            )}
          </div>
        )}
        <div className="modal-footer">
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(client)}><Trash2 size={16} style={{marginRight: 6, marginBottom: -2}} /> Удалить</button>
          <button className="btn btn-secondary" onClick={onClose}>Закрыть</button>
          <button className="btn btn-primary" onClick={() => onEdit(client)}><Pencil size={16} style={{marginRight: 6, marginBottom: -2}} /> Редактировать</button>
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [detailClient, setDetailClient] = useState(null);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchClients = useCallback(async (q = '') => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/clients', { params: q ? { search: q } : {} });
      setClients(res.data);
    } catch {
      setError('Ошибка загрузки клиентов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchClients(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchClients]);

  const handleDelete = async (client) => {
    try {
      await api.delete(`/clients/${client.id_klienta}`);
      setDeleteConfirm(null);
      setDetailClient(null);
      fetchClients(search);
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка удаления');
    }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditClient(null);
    fetchClients(search);
  };

  const openEdit = (c) => {
    setDetailClient(null);
    setEditClient(c);
    setShowModal(true);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"><User size={32} style={{marginRight: 12, marginBottom: -4}} /> Клиенты</h1>
        <p className="page-subtitle">Поиск, регистрация и управление читателями библиотеки</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><AlertTriangle size={18} style={{marginRight: 8, marginBottom: -4}} /> {error}</div>}

      <div className="toolbar">
        <div className="search-bar" style={{ maxWidth: 440 }}>
          <span className="search-bar-icon"><Search size={18} /></span>
          <input
            id="client-search"
            className="form-input"
            placeholder="Поиск по ФИО, телефону или ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          id="add-client-btn"
          className="btn btn-primary"
          onClick={() => { setEditClient(null); setShowModal(true); }}
        >
          <Plus size={18} style={{marginRight: 6, marginBottom: -4}} /> Добавить клиента
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><span className="spinner"></span><p>Загрузка...</p></div>
      ) : clients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><User size={48} color="var(--text-muted)" /></div>
          <div className="empty-state-text">{search ? 'Клиенты не найдены' : 'Список клиентов пуст'}</div>
          <div className="empty-state-sub">{search ? 'Попробуйте другой запрос' : 'Добавьте первого клиента'}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.85rem' }}>
          {clients.map(c => {
            const initials = `${c.familiya?.[0] || ''}${c.imya?.[0] || ''}`.toUpperCase();
            return (
              <div key={c.id_klienta} className="client-card" onClick={() => setDetailClient(c)}>
                <div className="client-avatar">{initials}</div>
                <div className="client-info">
                  <div className="client-name">{c.familiya} {c.imya} {c.otchestvo || ''}</div>
                  <div className="client-meta">
                    {c.nomer_telefona && <span style={{ display: 'inline-flex', alignItems: 'center' }}><Phone size={14} style={{marginRight: 4}} /> {c.nomer_telefona}</span>}
                    {!c.nomer_telefona && <span>ID: {c.id_klienta}</span>}
                  </div>
                  {c.data_registracii && (
                    <div className="client-meta" style={{ marginTop: '0.1rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}><Calendar size={14} style={{marginRight: 4}} /> {c.data_registracii}</span>
                    </div>
                  )}
                </div>
                <span className="badge badge-muted">#{c.id_klienta}</span>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <ClientModal
          client={editClient}
          onClose={() => { setShowModal(false); setEditClient(null); }}
          onSave={handleSaved}
        />
      )}

      {detailClient && !showModal && (
        <ClientDetailModal
          client={detailClient}
          onClose={() => setDetailClient(null)}
          onEdit={openEdit}
          onDelete={(c) => { setDeleteConfirm(c); setDetailClient(null); }}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center' }}><AlertTriangle size={20} color="var(--accent-amber)" style={{marginRight: 8}} /> Подтверждение</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Удалить клиента <strong>{deleteConfirm.familiya} {deleteConfirm.imya}</strong>? Это действие необратимо.
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
