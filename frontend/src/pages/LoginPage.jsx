import { useState } from 'react';
import api from '../api.js';
import { BookOpen, Eye, EyeOff, Key, AlertTriangle } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { login, password });
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сервера');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ position: 'fixed', inset: 0, margin: 0, padding: 0 }}>
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon" style={{ display: 'flex', justifyContent: 'center' }}><BookOpen size={48} color="var(--accent)" /></div>
          <div className="login-logo-title">Библиотека</div>
          <div className="login-logo-sub">Информационная система</div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <AlertTriangle size={18} style={{marginRight: 8, marginBottom: -4}} /> {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-input">Логин</label>
            <input
              id="login-input"
              className="form-input"
              type="text"
              placeholder="Введите логин"
              value={login}
              onChange={e => setLogin(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Пароль</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password-input"
                className="form-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Введите пароль"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: '3rem' }}
                required
              />
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', padding: '0.3rem 0.5rem' }}
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            id="login-btn"
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }}></span> Вход...</> : <><Key size={18} style={{marginRight: 8, marginBottom: -4}} /> Войти</>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', padding: '1rem', background: 'rgba(79,142,247,0.06)', borderRadius: '8px', border: '1px solid rgba(79,142,247,0.15)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Тестовый доступ</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Логин: <strong style={{ color: 'var(--accent-light)' }}>admin</strong>&nbsp;&nbsp;
            Пароль: <strong style={{ color: 'var(--accent-light)' }}>admin123</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
