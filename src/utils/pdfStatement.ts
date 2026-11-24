import { jsPDF } from 'jspdf';
import { BankUserProfile, WeeklyStatement } from '../types/bank';
import { formatSdg } from '../data/sudanBanks';

export function downloadWeeklyStatementPdf(
  statement: WeeklyStatement,
  user: BankUserProfile
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  // Render crisp Arabic RTL statement onto high-DPI offscreen canvas so Arabic glyph shaping is native
  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Clean white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sovereign Emerald Green Header Banner
    ctx.fillStyle = '#064E3B';
    ctx.fillRect(0, 0, canvas.width, 220);

    // Gold accent stripe
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(0, 212, canvas.width, 8);

    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px Cairo, sans-serif';
    ctx.fillText('بنك السودان المركزي - CBOS', 1170, 95);

    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 26px Cairo, sans-serif';
    ctx.fillText('كشف الحساب الأسبوعي المعتمد', 1170, 148);

    ctx.fillStyle = '#D1FAE5';
    ctx.font = '20px Cairo, sans-serif';
    ctx.fillText(`تاريخ الإصدار: ${statement.issuedAtLabel}`, 1170, 186);

    // Customer & Account Metadata Box
    ctx.fillStyle = '#F4F7F5';
    ctx.fillRect(60, 260, 1120, 210);
    ctx.strokeStyle = '#DCE5E0';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 260, 1120, 210);

    ctx.fillStyle = '#0F1F18';
    ctx.font = 'bold 24px Cairo, sans-serif';
    ctx.fillText(`اسم العميل: ${user.fullName}`, 1140, 310);

    ctx.font = '22px Cairo, sans-serif';
    ctx.fillText(`رقم الحساب: ${user.accountNumber}`, 1140, 355);
    ctx.fillText(`رقم الآيبان (IBAN): ${user.iban}`, 1140, 400);
    ctx.fillText(
      `الفترة: من ${statement.periodStart} إلى ${statement.periodEnd}`,
      1140,
      445
    );

    // Balance Summary on Left of Metadata Box
    ctx.textAlign = 'left';
    ctx.fillStyle = '#064E3B';
    ctx.font = 'bold 24px Cairo, sans-serif';
    ctx.fillText(
      `الرصيد الختامي: ${formatSdg(statement.closingBalance)} SDG`,
      95,
      340
    );
    ctx.fillStyle = '#475A52';
    ctx.font = '20px Cairo, sans-serif';
    ctx.fillText(
      `الرصيد الافتتاحي: ${formatSdg(statement.openingBalance)} SDG`,
      95,
      385
    );
    ctx.fillText(`عدد المعاملات: ${statement.transactionCount}`, 95, 430);

    // Transactions Table Header
    ctx.textAlign = 'right';
    ctx.fillStyle = '#064E3B';
    ctx.fillRect(60, 510, 1120, 56);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 21px Cairo, sans-serif';
    ctx.fillText('التفاصيل والجهة', 1150, 545);
    ctx.fillText('القناة / المرجع', 650, 545);
    ctx.textAlign = 'left';
    ctx.fillText('المبلغ (ج.س)', 90, 545);

    let rowY = 605;
    statement.transactions.slice(0, 14).forEach((tx, index) => {
      if (index % 2 === 1) {
        ctx.fillStyle = '#F8FAF9';
        ctx.fillRect(60, rowY - 34, 1120, 54);
      }

      ctx.textAlign = 'right';
      ctx.fillStyle = '#0F1F18';
      ctx.font = 'bold 20px Cairo, sans-serif';
      ctx.fillText(tx.title.slice(0, 38), 1150, rowY);

      ctx.fillStyle = '#475A52';
      ctx.font = '18px Cairo, sans-serif';
      ctx.fillText(`${tx.channel} · ${tx.reference}`, 650, rowY);

      ctx.textAlign = 'left';
      ctx.fillStyle = tx.type === 'credit' ? '#047857' : '#0F1F18';
      ctx.font = 'bold 20px monospace';
      const sign = tx.type === 'credit' ? '+' : '-';
      ctx.fillText(`${sign} ${formatSdg(tx.amount)}`, 90, rowY);

      rowY += 58;
    });

    // Footer Seal
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 1620);
    ctx.lineTo(1180, 1620);
    ctx.stroke();

    ctx.textAlign = 'right';
    ctx.fillStyle = '#475A52';
    ctx.font = '18px Cairo, sans-serif';
    ctx.fillText(
      'وثيقة إلكترونية صادرة آلياً كل يوم أحد الساعة 00:00 من نظام بنك السودان المركزي - CBOS',
      1180,
      1665
    );

    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 0, 0, 595.28, 841.89);
  } else {
    doc.setFontSize(16);
    doc.text('CBOS Bank - Weekly Statement', 40, 50);
    doc.setFontSize(11);
    doc.text(`Account: ${user.accountNumber} | IBAN: ${user.iban}`, 40, 80);
    doc.text(`Closing Balance: ${formatSdg(statement.closingBalance)} SDG`, 40, 105);
  }

  doc.save(`CBOS-Statement-${statement.periodEnd}.pdf`);
}
