import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Lobby.css';

export default function Lobby({ user, setUser }) {
  const navigate = useNavigate();
  const [roomInput, setRoomInput] = useState('');
  const [error, setError]         = useState('');
  const [creating, setCreating]   = useState(false);

  const createRoom = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        credentials: 'include',
      });
      if (res.status === 401) {
        setError('Session หมดอายุ — ลอง login ใหม่');
        return;
      }
      const data = await res.json();
      navigate(`/room/${data.roomId}`);
    } catch {
      setError('เชื่อมต่อ server ไม่ได้ — รัน uno-server ก่อน');
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = async () => {
    const id = roomInput.trim().toUpperCase();
    if (!id) return;
    try {
      const res = await fetch(`/api/rooms/${id}`, { credentials: 'include' });
      if (!res.ok) { setError('ไม่พบห้องนี้'); return; }
      navigate(`/room/${id}`);
    } catch {
      setError('เชื่อมต่อ server ไม่ได้');
    }
  };

  const logout = async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="lobby-page">
      <header className="lobby-header">
        <div className="lobby-logo">UNO</div>
        <div className="lobby-user">
          <img src={user.avatar} alt={user.username} className="lobby-avatar" />
          <span>{user.username}</span>
          <button className="btn btn-ghost" onClick={logout} style={{ padding: '6px 14px', fontSize: '.8rem' }}>
            ออก
          </button>
        </div>
      </header>

      <main className="lobby-main">
        <div className="lobby-section">
          <h2>สร้างห้องใหม่</h2>
          <p className="lobby-hint">ห้องรองรับ 2–4 คน · เริ่มเกมได้เมื่อพร้อม</p>
          <button
            className="btn btn-primary lobby-action-btn"
            onClick={createRoom}
            disabled={creating}
          >
            {creating ? 'กำลังสร้าง...' : '🃏 สร้างห้อง'}
          </button>
        </div>

        <div className="lobby-divider">หรือ</div>

        <div className="lobby-section">
          <h2>เข้าห้องด้วย Room ID</h2>
          <div className="lobby-join-row">
            <input
              className="lobby-input"
              placeholder="เช่น A3F9B2C1"
              value={roomInput}
              onChange={(e) => { setRoomInput(e.target.value.toUpperCase()); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
              maxLength={8}
            />
            <button className="btn btn-blue" onClick={joinRoom} disabled={!roomInput.trim()}>
              เข้าร่วม
            </button>
          </div>
        </div>

        {error && <p className="lobby-error">⚠️ {error}</p>}
      </main>
    </div>
  );
}
