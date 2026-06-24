import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ClientsPage from './pages/ClientsPage.jsx';
import BooksPage from './pages/BooksPage.jsx';
import ArchivePage from './pages/ArchivePage.jsx';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <div className="app-layout">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        <main className="main-content">
          <Routes>
            <Route path="/login" element={
              user ? <Navigate to="/clients" replace /> :
              <LoginPage onLogin={handleLogin} />
            } />
            <Route path="/clients" element={
              <PrivateRoute><ClientsPage /></PrivateRoute>
            } />
            <Route path="/books" element={
              <PrivateRoute><BooksPage /></PrivateRoute>
            } />
            <Route path="/archive" element={
              <PrivateRoute><ArchivePage /></PrivateRoute>
            } />
            <Route path="*" element={<Navigate to={user ? "/clients" : "/login"} replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
