import Card from './Card';
import './Pile.css';

export default function Pile({ topCard, deckCount, onDraw, canDraw, pendingDraw }) {
  return (
    <div className="pile-area">
      {/* Draw pile */}
      <div className="pile-slot">
        <div
          className={`pile-draw ${canDraw ? 'pile-draw-active' : ''}`}
          onClick={canDraw ? onDraw : undefined}
          role={canDraw ? 'button' : undefined}
        >
          <Card card="back" />
          {pendingDraw > 0 && (
            <span className="pile-pending">+{pendingDraw}</span>
          )}
        </div>
        <span className="pile-label">{deckCount} ใบ{canDraw ? ' · แตะเพื่อหยิบ' : ''}</span>
      </div>

      {/* Discard pile */}
      <div className="pile-slot">
        <Card card={topCard} />
        {topCard?.chosenColor && (
          <span className={`pile-chosen pile-chosen-${topCard.chosenColor}`}>
            ●
          </span>
        )}
        <span className="pile-label">กองทิ้ง</span>
      </div>
    </div>
  );
}
