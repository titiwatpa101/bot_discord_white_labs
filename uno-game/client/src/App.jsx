import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import Game  from './pages/Game';

export default function App() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => { setUser(u); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="splash">
        <div className="splash-logo">UNO</div>
        <div className="splash-spinner" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"      element={!user ? <Login setUser={setUser} /> : <Navigate to="/lobby" replace />} />
        <Route path="/lobby"      element={user  ? <Lobby user={user} setUser={setUser} /> : <Navigate to="/login" replace />} />
        <Route path="/room/:roomId" element={user ? <Game user={user} /> : <Navigate to="/login" replace />} />
        <Route path="*"           element={<Navigate to={user ? '/lobby' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
