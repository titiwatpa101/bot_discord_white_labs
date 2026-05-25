import './Card.css';

const LABEL = {
  skip:    '⊘',
  reverse: '↺',
  draw2:   '+2',
  wild:    '★',
  wild4:   '+4',
};

function getLabel(type) {
  return LABEL[type] ?? type;
}

// card = card object  OR  'back'  OR  null
export default function Card({ card, onClick, disabled = false, selected = false, small = false }) {
  if (!card) return <div className={`card card-empty ${small ? 'card-sm' : ''}`} />;

  if (card === 'back') {
    return (
      <div className={`card card-back ${small ? 'card-sm' : ''}`}>
        <span className="card-back-text">UNO</span>
      </div>
    );
  }

  const colorClass = card.chosenColor || card.color;
  const label      = getLabel(card.type);
  const isWild     = card.color === 'wild';

  return (
    <div
      className={[
        'card',
        `card-${colorClass}`,
        disabled  ? 'card-disabled'  : '',
        selected  ? 'card-selected'  : '',
        small     ? 'card-sm'        : '',
        isWild    ? 'card-wild'      : '',
        !disabled && onClick ? 'card-playable' : '',
      ].join(' ')}
      onClick={!disabled && onClick ? onClick : undefined}
      role={onClick ? 'button' : undefined}
    >
      <span className="card-corner tl">{label}</span>
      <div className={`card-oval ${isWild ? 'card-oval-wild' : ''}`}>
        <span className="card-center-label">{label}</span>
      </div>
      <span className="card-corner br">{label}</span>
    </div>
  );
}
