import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate }           from 'react-router-dom';
import { useSocket }    from '../hooks/useSocket';
import Hand             from '../components/Hand';
import Pile             from '../components/Pile';
import PlayerRow        from '../components/PlayerRow';
import ColorPicker      from '../components/ColorPicker';
import './Game.css';

export default function Game({ user }) {
  const { roomId }        = useParams();
  const navigate          = useNavigate();
  const { socket, connected } = useSocket();

  const [gameState, setGameState]       = useState(null);
  const [toast, setToast]               = useState(null);
  const [pendingCard, setPendingCard]   = useState(null); // wild card waiting for color
  const [showColorPicker, setShowCP]    = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const me = gameState?.players.find((p) => p.userId === user.id);
  const opponents = gameState?.players.filter((p) => p.userId !== user.id) ?? [];
  const myTurn = me?.isCurrentPlayer && gameState?.state === 'playing';

  // ── Effective color of top card (after wild) ─────────────────────────────────
  const topCard = gameState?.topCard;
  const effectiveColor = topCard?.chosenColor || topCard?.color;

  function canPlayCard(card) {
    if (!myTurn) return false;
    if (card.color === 'wild') return true;
    if (gameState.pendingDraw > 0) {
      if (topCard?.type === 'draw2') return card.type === 'draw2';
      if (topCard?.type === 'wild4') return card.type === 'wild4';
      return false;
    }
    return card.color === effectiveColor || card.type === topCard?.type;
  }

  // ── Socket setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.emit('join_room', { roomId });

    socket.on('game_state',   setGameState);
    socket.on('game_started', setGameState);
    socket.on('game_over',    setGameState);

    socket.on('player_joined', ({ displayName }) =>
      showToast(`${displayName} เข้าร่วมแล้ว`, 'success'));
    socket.on('player_left', ({ displayName }) =>
      showToast(`${displayName} ออกจากห้องแล้ว`));
    socket.on('uno_said', ({ displayName }) =>
      showToast(`${displayName} กด UNO! 🔔`, 'success'));
    socket.on('uno_caught', ({ catcher, target }) =>
      showToast(`${catcher} จับ ${target} ได้! +2 ใบ 😱`));
    socket.on('error', ({ message }) => showToast(message));
    socket.on('auth_error', () => navigate('/login'));

    return () => {
      socket.off('game_state');   socket.off('game_started');
      socket.off('game_over');    socket.off('player_joined');
      socket.off('player_left');  socket.off('uno_said');
      socket.off('uno_caught');   socket.off('error');
      socket.off('auth_error');
    };
  }, [socket, roomId, navigate, showToast]);

  // ── Actions ───────────────────────────────────────────────────────────────────
  const handlePlayCard = (card) => {
    if (card.color === 'wild') {
      setPendingCard(card);
      setShowCP(true);
    } else {
      socket.emit('play_card', { cardId: card.id });
    }
  };

  const handleColorPick = (color) => {
    setShowCP(false);
    socket.emit('play_card', { cardId: pendingCard.id, chosenColor: color });
    setPendingCard(null);
  };

  const handleDraw = () => socket.emit('draw_card');
  const handleUno  = () => socket.emit('say_uno');
  const handleCatchUno = (targetUserId) => socket.emit('catch_uno', { targetUserId });
  const handleStart    = () => socket.emit('start_game');

  // ── Render ────────────────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <div className="game-loading">
        <div className="splash-spinner" />
        <p>กำลังเชื่อมต่อ...</p>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="game-loading">
        <div className="splash-spinner" />
        <p>กำลังเข้าห้อง {roomId}...</p>
      </div>
    );
  }

  // ── Game over screen ──────────────────────────────────────────────────────────
  if (gameState.state === 'ended') {
    const won = gameState.winner?.userId === user.id;
    return (
      <div className="game-over">
        <div className="go-card">
          <div className="go-emoji">{won ? '🏆' : '😢'}</div>
          <h1 className="go-title">{won ? 'คุณชนะ!' : `${gameState.winner?.displayName} ชนะ!`}</h1>
          <div className="go-actions">
            <button className="btn btn-primary" onClick={() => socket.emit('join_room', { roomId })}>
              เล่นอีกรอบ
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/lobby')}>
              กลับหน้าแรก
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Waiting lobby ─────────────────────────────────────────────────────────────
  if (gameState.state === 'waiting') {
    const isHost = gameState.players[0]?.userId === user.id;
    return (
      <div className="game-waiting">
        <div className="gw-card">
          <div className="gw-logo">UNO</div>
          <p className="gw-room">ห้อง: <strong>{roomId}</strong></p>
          <div className="gw-players">
            {gameState.players.map((p) => (
              <div key={p.userId} className="gw-player">
                <img src={p.avatar} alt={p.displayName} className="gw-avatar" />
                <span>{p.displayName}</span>
                {gameState.players[0]?.userId === p.userId && (
                  <span className="gw-host-badge">Host</span>
                )}
              </div>
            ))}
            {Array.from({ length: 4 - gameState.players.length }).map((_, i) => (
              <div key={`empty-${i}`} className="gw-player gw-player-empty">
                <div className="gw-avatar-empty" />
                <span className="gw-empty-label">รอผู้เล่น...</span>
              </div>
            ))}
          </div>
          <p className="gw-hint">แชร์ Room ID: <strong>{roomId}</strong> ให้เพื่อน</p>
          {isHost ? (
            <button
              className="btn btn-primary gw-start-btn"
              onClick={handleStart}
              disabled={gameState.players.length < 2}
            >
              {gameState.players.length < 2 ? 'รอผู้เล่นอื่น...' : '▶ เริ่มเกม'}
            </button>
          ) : (
            <p className="gw-wait">รอ Host เริ่มเกม...</p>
          )}
        </div>
      </div>
    );
  }

  // ── Main game ─────────────────────────────────────────────────────────────────
  const canDraw = myTurn;
  const canUno  = me?.hand?.length === 1 && !me.saidUno;

  return (
    <div className="game-board">
      {/* Opponents */}
      <div className="game-opponents">
        {opponents.map((p) => (
          <PlayerRow key={p.userId} player={p} onCatchUno={handleCatchUno} />
        ))}
      </div>

      {/* Turn indicator */}
      <div className={`game-turn-bar ${myTurn ? 'my-turn' : ''}`}>
        {myTurn
          ? '✨ เทิร์นของคุณ!'
          : `⏳ เทิร์นของ ${gameState.players.find((p) => p.isCurrentPlayer)?.displayName}`}
        {gameState.pendingDraw > 0 && (
          <span className="turn-penalty"> · หยิบไพ่ +{gameState.pendingDraw}</span>
        )}
        <span className="turn-dir">
          {gameState.direction === 1 ? '→' : '←'}
        </span>
      </div>

      {/* Center: piles */}
      <div className="game-center">
        <Pile
          topCard={topCard}
          deckCount={gameState.deckCount}
          onDraw={handleDraw}
          canDraw={canDraw}
          pendingDraw={gameState.pendingDraw}
        />
      </div>

      {/* UNO button */}
      {canUno && (
        <button className="btn btn-primary uno-shout-btn" onClick={handleUno}>
          UNO! 🔔
        </button>
      )}

      {/* My hand */}
      <div className="game-hand-area">
        <Hand
          cards={me?.hand ?? []}
          onPlay={handlePlayCard}
          canPlay={canPlayCard}
          myTurn={myTurn}
        />
      </div>

      {/* Color picker overlay */}
      {showColorPicker && <ColorPicker onPick={handleColorPick} />}

      {/* Toast */}
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
