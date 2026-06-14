const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const MONTH_TH    = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function yyyymm(year, month) {
  return `${year}${String(month).padStart(2, '0')}`;
}

function build(year, month, bookings) {
  const cur        = yyyymm(year, month);
  const bookCount  = Object.values(bookings).flat().length;

  const prevD = new Date(year, month - 2, 1);
  const nextD = new Date(year, month,     1);
  const prev  = yyyymm(prevD.getFullYear(), prevD.getMonth() + 1);
  const next  = yyyymm(nextD.getFullYear(), nextD.getMonth() + 1);

  const embed = new EmbedBuilder()
    .setColor(0xe040fb)
    .setImage('attachment://calendar.png')
    .setFooter({ text: `📌 ${bookCount} การจอง  •  ${MONTH_TH[month - 1]} ${year}` });

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`cal_nav_${prev}`)
      .setLabel(`◀  ${MONTH_SHORT[prevD.getMonth()]}`)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`cal_today`)
      .setLabel('🏠 วันนี้')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`cal_nav_${next}`)
      .setLabel(`${MONTH_SHORT[nextD.getMonth()]}  ▶`)
      .setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`cal_openbook_${cur}`)
      .setLabel('📌 จองวัน')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`cal_booklist_${cur}`)
      .setLabel('📋 รายการ')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`cal_cancellist_${cur}`)
      .setLabel('🗑️ ยกเลิก')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(bookCount === 0),
  );

  return { embed, rows: [row1, row2] };
}

module.exports = { build, MONTH_TH, MONTH_SHORT };
