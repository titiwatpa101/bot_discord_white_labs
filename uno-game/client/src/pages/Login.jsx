import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login({ setUser }) {
  const navigate              = useNavigate();
  const [guestName, setName]  = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showGuest, setShowGuest] = useState(false);

  const loginDiscord = () => {
    window.location.href = '/auth/discord';
  };

  const loginGuest = async () => {
    const name = guestName.trim();
    if (!name) { setError('กรุณาใส่ชื่อ'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/auth/guest', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ username: name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'เกิดข้อผิดพลาด'); return; }
      setUser(data);
      navigate('/lobby');
    } catch {
      setError('เชื่อมต่อ server ไม่ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">UNO</div>
        <p className="login-sub">เกมไพ่ออนไลน์ 2–4 คน</p>

        {/* Discord login */}
        <button className="btn login-discord-btn" onClick={loginDiscord}>
          <img
            src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a69f118df70ad7828d4_icon_clyde_blurple_RGB.svg"
            alt="Discord"
            className="discord-icon"
          />
          เข้าสู่ระบบด้วย Discord
        </button>

        {/* Divider */}
        <div className="login-divider"><span>หรือ</span></div>

        {/* Guest login */}
        {!showGuest ? (
          <button className="btn btn-ghost login-guest-toggle" onClick={() => setShowGuest(true)}>
            👤 เล่นเป็น Guest
          </button>
        ) : (
          <div className="login-guest-box">
            <p className="guest-note">⚠️ Guest ไม่มีการเก็บคะแนน</p>
            <input
              className="login-input"
              placeholder="ใส่ชื่อที่จะแสดง..."
              value={guestName}
              maxLength={20}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && loginGuest()}
              autoFocus
            />
            {error && <p className="login-error">{error}</p>}
            <div className="guest-btn-row">
              <button
                className="btn btn-ghost"
                onClick={() => { setShowGuest(false); setError(''); }}
                style={{ flex: 1 }}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-primary"
                onClick={loginGuest}
                disabled={loading || !guestName.trim()}
                style={{ flex: 2 }}
              >
                {loading ? 'กำลังเข้า...' : 'เข้าเลย →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
