import { NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, Users, Book, Archive } from 'lucide-react';
export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const initials = user ? `${user.familiya?.[0] || ''}${user.imya?.[0] || ''}`.toUpperCase() : '?';

  return (
    <nav className="navbar">
      <NavLink to="/clients" className="navbar-brand">
        <div className="navbar-brand-icon"><BookOpen size={28} /></div>
        <span className="navbar-brand-text">ИС «Библиотека»</span>
      </NavLink>

      <ul className="navbar-nav">
        <li>
          <NavLink to="/clients" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Users size={18} style={{marginRight: 6, marginBottom: -4}} /> Клиенты
          </NavLink>
        </li>
        <li>
          <NavLink to="/books" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Book size={18} style={{marginRight: 6, marginBottom: -4}} /> Книги
          </NavLink>
        </li>
        <li>
          <NavLink to="/archive" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Archive size={18} style={{marginRight: 6, marginBottom: -4}} /> Архив
          </NavLink>
        </li>
      </ul>

      <div className="navbar-user">
        <div className="navbar-user-info">
          <div className="navbar-user-name">{user?.familiya} {user?.imya}</div>
          <div className="navbar-user-role">Библиотекарь</div>
        </div>
        <div className="client-avatar" style={{ cursor: 'pointer' }} onClick={handleLogout} title="Выйти">
          {initials}
        </div>
      </div>
    </nav>
  );
}
