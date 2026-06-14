const { createCanvas } = require('@napi-rs/canvas');

const THEME = {
  outerBg:      '#0d0519',
  bg:           '#16082a',
  year:         '#f3e5f5',
  month:        '#e040fb',
  separator:    '#7b2d8b',
  dayHeader:    '#ce93d8',
  weekendHdr:   '#f06292',
  dayNormal:    '#f3e5f5',
  dayWeekend:   '#f48fb1',
  dayOther:     'rgba(200,150,255,0.25)',
  todayBg:      '#e91e63',
  todayText:    '#ffffff',
  bookedBg:     '#6a1b9a',
  bookedBorder: '#ab47bc',
  bookedText:   '#e1bee7',
  gridLine:     'rgba(200,150,255,0.10)',
};

const MONTHS    = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_HDR   = ['Mo','Tu','We','Th','Fr','Sa','Su'];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,   x + w, y + r,   r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y,   x + r, y,   r);
  ctx.closePath();
}

async function render(year, month, bookings) {
  const W = 840, H = 610;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  // ── outer background ───────────────────────────────────────────────────────
  ctx.fillStyle = THEME.outerBg;
  ctx.fillRect(0, 0, W, H);

  roundRect(ctx, 8, 8, W - 16, H - 16, 18);
  ctx.fillStyle = THEME.bg;
  ctx.fill();

  // ── year ───────────────────────────────────────────────────────────────────
  ctx.font      = 'bold 76px sans-serif';
  ctx.fillStyle = THEME.year;
  ctx.textAlign = 'center';
  ctx.fillText(String(year), W / 2, 88);

  // ── month ─────────────────────────────────────────────────────────────────
  ctx.font      = 'bold 26px sans-serif';
  ctx.fillStyle = THEME.month;
  ctx.fillText(MONTHS[month - 1].toUpperCase(), W / 2, 120);

  // ── separator ─────────────────────────────────────────────────────────────
  ctx.strokeStyle = THEME.separator;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(28, 133);
  ctx.lineTo(W - 28, 133);
  ctx.stroke();

  // ── day-of-week headers ───────────────────────────────────────────────────
  const PAD    = 24;
  const cellW  = (W - PAD * 2) / 7;
  const hdrY   = 160;

  DAY_HDR.forEach((d, i) => {
    ctx.font      = 'bold 14px sans-serif';
    ctx.fillStyle = i >= 5 ? THEME.weekendHdr : THEME.dayHeader;
    ctx.textAlign = 'center';
    ctx.fillText(d, PAD + cellW * i + cellW / 2, hdrY);
  });

  // ── calendar grid ─────────────────────────────────────────────────────────
  const gridTop  = 173;
  const cellH    = (H - gridTop - 16) / 6;

  // Monday-first offset (0=Mon … 6=Sun)
  const rawDow  = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const offset  = rawDow === 0 ? 6 : rawDow - 1;
  const daysCnt = new Date(year, month, 0).getDate();

  const today        = new Date();
  const isThisMonth  = today.getFullYear() === year && today.getMonth() + 1 === month;

  for (let day = 1; day <= daysCnt; day++) {
    const ci  = offset + day - 1;
    const col = ci % 7;
    const row = Math.floor(ci / 7);

    const x = PAD + col * cellW;
    const y = gridTop + row * cellH;

    const dateStr    = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dayBkgs    = bookings[dateStr] || [];
    const isToday    = isThisMonth && today.getDate() === day;
    const isWeekend  = col >= 5;

    // ── cell background ───────────────────────────────────────────────────
    if (isToday) {
      roundRect(ctx, x + 3, y + 3, cellW - 6, cellH - 6, 10);
      ctx.fillStyle = THEME.todayBg;
      ctx.fill();
    } else if (dayBkgs.length > 0) {
      roundRect(ctx, x + 3, y + 3, cellW - 6, cellH - 6, 10);
      ctx.fillStyle = THEME.bookedBg;
      ctx.fill();
      ctx.strokeStyle = THEME.bookedBorder;
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }

    // ── day number ────────────────────────────────────────────────────────
    ctx.font      = `bold 19px sans-serif`;
    ctx.fillStyle = isToday ? THEME.todayText : isWeekend ? THEME.dayWeekend : THEME.dayNormal;
    ctx.textAlign = 'center';
    ctx.fillText(String(day), x + cellW / 2, y + 22);

    // ── booking topics ────────────────────────────────────────────────────
    if (dayBkgs.length > 0) {
      const show = dayBkgs.slice(0, 2);
      show.forEach((b, bi) => {
        const raw  = b.topic || '';
        const text = raw.length > 9 ? raw.slice(0, 8) + '…' : raw;
        ctx.font      = '10px sans-serif';
        ctx.fillStyle = THEME.bookedText;
        ctx.fillText(text, x + cellW / 2, y + 38 + bi * 14);
      });
      if (dayBkgs.length > 2) {
        ctx.font      = '9px sans-serif';
        ctx.fillStyle = '#ce93d8';
        ctx.fillText(`+${dayBkgs.length - 2} more`, x + cellW / 2, y + 38 + 2 * 14);
      }
    }

    // ── subtle grid line ──────────────────────────────────────────────────
    ctx.strokeStyle = THEME.gridLine;
    ctx.lineWidth   = 0.5;
    ctx.strokeRect(x, y, cellW, cellH);
  }

  return canvas.toBuffer('image/png');
}

module.exports = { render };
