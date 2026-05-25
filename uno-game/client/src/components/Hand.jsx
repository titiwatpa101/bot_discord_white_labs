import Card from './Card';
import './Hand.css';

export default function Hand({ cards = [], onPlay, canPlay, myTurn }) {
  return (
    <div className="hand-wrap">
      <div className="hand-scroll">
        {cards.map((card) => {
          const playable = myTurn && canPlay(card);
          return (
            <Card
              key={card.id}
              card={card}
              onClick={playable ? () => onPlay(card) : undefined}
              disabled={!playable}
            />
          );
        })}
      </div>
      <p className="hand-count">{cards.length} ใบ</p>
    </div>
  );
}
