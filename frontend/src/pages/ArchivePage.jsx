import { useState, useEffect, useCallback } from 'react';
import api from '../api.js';
import { Archive, AlertTriangle, ClipboardList, Upload, CheckCircle2, Search, RefreshCw } from 'lucide-react';

export default function ArchivePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ id_klienta: '', id_knigi: '', vozvrashchena: '' });
  const [returnLoading, setReturnLoading] = useState(null);

  const fetchArchive = useCallback(async (f = {}) => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (f.id_klienta) params.id_klienta = f.id_klienta;
      if (f.id_knigi)   params.id_knigi   = f.id_knigi;
      if (f.vozvrashchena !== '') params.vozvrashchena = f.vozvrashchena;
      const res = await api.get('/archive', { params });
      setRecords(res.data);
    } catch {
      setError('Ошибка загрузки архива');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchArchive(filter), 300);
    return () => clearTimeout(t);
  }, [filter, fetchArchive]);

  const handleReturn = async (id_vydachi) => {
    setReturnLoading(id_vydachi);
    try {
      await api.post(`/archive/return/${id_vydachi}`);
      fetchArchive(filter);
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка возврата');
    } finally {
      setReturnLoading(null);
    }
  };

  const isOverdue = (srok, vozvrashchena) => {
    if (vozvrashchena) return false;
    return srok && new Date(srok) < new Date() && !isNaN(new Date(srok));
  };

  const stats = {
    all: records.length,
    active: records.filter(r => !r.vozvrashchena).length,
    returned: records.filter(r => r.vozvrashchena).length,
    overdue: records.filter(r => isOverdue(r.srok_vozvrata, r.vozvrashchena)).length,
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"><Archive size={32} style={{marginRight: 12, marginBottom: -4}} /> Архив выдач</h1>
        <p className="page-subtitle">История выдачи книг — поиск по клиенту, книге и статусу</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><AlertTriangle size={18} style={{marginRight: 8, marginBottom: -4}} /> {error}</div>}

      {/* Статистика */}
      {records.length > 0 && (
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-icon"><ClipboardList size={24} /></div>
            <div className="stat-value">{stats.all}</div>
            <div className="stat-label">Всего записей</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Upload size={24} /></div>
            <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{stats.active}</div>
            <div className="stat-label">На руках</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><CheckCircle2 size={24} /></div>
            <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{stats.returned}</div>
            <div className="stat-label">Возвращено</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><AlertTriangle size={24} /></div>
            <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{stats.overdue}</div>
            <div className="stat-label">Просрочено</div>
          </div>
        </div>
      )}

      {/* Фильтры */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center' }}><Search size={18} style={{marginRight: 8}} /> Фильтры</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">ID клиента</label>
            <input
              id="filter-client-id"
              className="form-input"
              type="number"
              placeholder="Например: 1"
              value={filter.id_klienta}
              onChange={e => setFilter(f => ({ ...f, id_klienta: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">ID книги</label>
            <input
              id="filter-book-id"
              className="form-input"
              type="number"
              placeholder="Например: 5"
              value={filter.id_knigi}
              onChange={e => setFilter(f => ({ ...f, id_knigi: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Статус</label>
            <select
              id="filter-status"
              className="form-select"
              value={filter.vozvrashchena}
              onChange={e => setFilter(f => ({ ...f, vozvrashchena: e.target.value }))}
            >
              <option value="">Все</option>
              <option value="false">На руках</option>
              <option value="true">Возвращены</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setFilter({ id_klienta: '', id_knigi: '', vozvrashchena: '' })}
          >
            <RefreshCw size={16} style={{marginRight: 6, marginBottom: -2}} /> Сбросить фильтры
          </button>
        </div>
      </div>

      {/* Таблица */}
      {loading ? (
        <div className="empty-state"><span className="spinner"></span><p>Загрузка...</p></div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Archive size={48} color="var(--text-muted)" /></div>
          <div className="empty-state-text">Записей не найдено</div>
          <div className="empty-state-sub">Измените параметры фильтра или выдайте книгу читателю</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Клиент</th>
                <th>Книга</th>
                <th>Выдана</th>
                <th>Срок возврата</th>
                <th>Библиотекарь</th>
                <th>Статус</th>
                <th>Дата возврата</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => {
                const overdue = isOverdue(r.srok_vozvrata, r.vozvrashchena);
                return (
                  <tr key={r.id_vydachi} style={overdue ? { background: 'rgba(248,113,113,0.04)' } : {}}>
                    <td><span className="badge badge-muted">#{r.id_vydachi}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.familiya} {r.imya}</div>
                      <div className="text-muted">ID: {r.id_klienta}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.nazvanie}</div>
                      <div className="text-muted">{r.avtor}</div>
                    </td>
                    <td>{r.data_vydachi}</td>
                    <td className={overdue ? 'overdue' : ''}>
                      {r.srok_vozvrata}
                      {overdue && <span style={{ marginLeft: '0.25rem' }}><AlertTriangle size={14} color="var(--accent-red)" style={{marginBottom: -2}} /></span>}
                    </td>
                    <td>
                      {r.bl_familiya ? `${r.bl_familiya} ${r.bl_imya}` : '—'}
                    </td>
                    <td>
                      {r.vozvrashchena ? (
                        <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center' }}><CheckCircle2 size={14} style={{marginRight: 4}} /> Возвращена</span>
                      ) : overdue ? (
                        <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center' }}><AlertTriangle size={14} style={{marginRight: 4}} /> Просрочена</span>
                      ) : (
                        <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center' }}><Upload size={14} style={{marginRight: 4}} /> На руках</span>
                      )}
                    </td>
                    <td>{r.data_vozvrata || '—'}</td>
                    <td>
                      {!r.vozvrashchena && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleReturn(r.id_vydachi)}
                          disabled={returnLoading === r.id_vydachi}
                          id={`return-btn-${r.id_vydachi}`}
                        >
                          {returnLoading === r.id_vydachi
                            ? <span className="spinner" style={{ width: 14, height: 14 }}></span>
                            : <div style={{ display: 'flex', alignItems: 'center' }}><CheckCircle2 size={16} style={{marginRight: 6}} /> Возврат</div>}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
