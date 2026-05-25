import Card from './Card';
import './PlayerRow.css';

export default function PlayerRow({ player, onCatchUno }) {
  const { displayName, avatar, handCount, saidUno, isCurrentPlayer, isGuest } = player;
  const canCatch = handCount === 1 && !saidUno;

  return (
    <div className={`pr-player ${isCurrentPlayer ? 'pr-active' : ''}`}>
      <div className="pr-info">
        <img src={avatar} alt={displayName} className="pr-avatar" />
        <span className="pr-name">{displayName}</span>
        {isCurrentPlayer && <span className="pr-turn-badge">เทิร์น</span>}
        {isGuest && <span className="pr-guest-badge">Guest</span>}
        {saidUno && <span className="pr-uno-badge">UNO!</span>}
      </div>

      {/* Show card backs = number of cards in hand */}
      <div className="pr-cards">
        {Array.from({ length: Math.min(handCount, 8) }).map((_, i) => (
          <Card key={i} card="back" small />
        ))}
        {handCount > 8 && <span className="pr-more">+{handCount - 8}</span>}
      </div>

      {canCatch && onCatchUno && (
        <button
          className="btn btn-primary pr-catch-btn"
          onClick={() => onCatchUno(player.userId)}
        >
          จับ!
        </button>
      )}
    </div>
  );
}
