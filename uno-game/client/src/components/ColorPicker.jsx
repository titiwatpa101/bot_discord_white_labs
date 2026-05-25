import './ColorPicker.css';

const COLORS = [
  { id: 'red',    label: '🔴', name: 'แดง' },
  { id: 'green',  label: '🟢', name: 'เขียว' },
  { id: 'blue',   label: '🔵', name: 'น้ำเงิน' },
  { id: 'yellow', label: '🟡', name: 'เหลือง' },
];

export default function ColorPicker({ onPick }) {
  return (
    <div className="cp-overlay">
      <div className="cp-modal">
        <p className="cp-title">เลือกสี</p>
        <div className="cp-grid">
          {COLORS.map((c) => (
            <button
              key={c.id}
              className={`cp-btn cp-btn-${c.id}`}
              onClick={() => onPick(c.id)}
            >
              <span className="cp-emoji">{c.label}</span>
              <span className="cp-name">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
