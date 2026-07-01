export const createInvoiceQrData = (transaction) => {
  const typeLabel = transaction.type === "income" ? "درآمد" : "هزینه";
  const formattedDate = new Date(transaction.date).toLocaleString("fa-IR");

  return `
شماره فاکتور: ${transaction.id}
عنوان: ${transaction.title}
نوع تراکنش: ${typeLabel}
تاریخ: ${formattedDate}
مبلغ: ${Number(transaction.amount).toLocaleString("fa-IR")} تومان
  `.trim();
};

export const createQrCodeUrl = (transaction, size = 150) => {
  const qrData = createInvoiceQrData(transaction);

  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    qrData
  )}`;
};