import { amountToPersianWords, formatMoney } from "../utils/money";
import { createQrCodeUrl } from "../utils/invoice";

function Invoice({ transaction }) {
  if (!transaction) {
    return (
      <section className="card invoice-card">
        <h2>فاکتور</h2>
        <p className="empty-text">هیچ تراکنشی برای نمایش فاکتور انتخاب نشده است</p>
      </section>
    );
  }

  const typeLabel = transaction.type === "income" ? "درآمد" : "هزینه";
  const sign = transaction.type === "income" ? "+" : "-";
  const formattedDate = new Date(transaction.date).toLocaleString("fa-IR");
  const qrCodeUrl = createQrCodeUrl(transaction, 150);
  const smallQrCodeUrl = createQrCodeUrl(transaction, 90);

  return (
    <section className="card invoice-card">
      <div className="invoice-header">
        <div>
          <h2>فاکتور</h2>
          <p>شماره فاکتور: {transaction.id}</p>
        </div>

        <button className="print-btn" onClick={() => window.print()}>
          چاپ / ذخیره PDF
        </button>
      </div>

      <div className="invoice-main">
        <div className="invoice-box">
          <div className="invoice-row">
            <span>عنوان</span>
            <strong>{transaction.title}</strong>
          </div>

          <div className="invoice-row">
            <span>نوع تراکنش</span>
            <strong>{typeLabel}</strong>
          </div>

          <div className="invoice-row">
            <span>تاریخ</span>
            <strong>{formattedDate}</strong>
          </div>

          <div className="invoice-row total-row">
            <span>مبلغ</span>

            <div className="invoice-amount">
              <strong>
                {sign} {formatMoney(transaction.amount)}
              </strong>
              <small>{amountToPersianWords(transaction.amount)}</small>
            </div>
          </div>
        </div>

        <div className="invoice-qr-box">
          <img src={qrCodeUrl} alt="QR Code فاکتور" />
          <span>کد اعتبارسنجی فاکتور</span>
        </div>
      </div>

      <div className="invoice-stub">
        <div className="stub-cut-line">
          <span>محل جدا کردن ته فاکتور</span>
        </div>

        <div className="stub-content">
          <div className="stub-info">
            <h3>ته فاکتور</h3>

            <p>
              <span>شماره:</span>
              <strong>{transaction.id}</strong>
            </p>

            <p>
              <span>عنوان:</span>
              <strong>{transaction.title}</strong>
            </p>

            <p>
              <span>نوع:</span>
              <strong>{typeLabel}</strong>
            </p>

            <p>
              <span>تاریخ:</span>
              <strong>{formattedDate}</strong>
            </p>

            <p>
              <span>مبلغ:</span>
              <strong>
                {sign} {formatMoney(transaction.amount)}
              </strong>
            </p>
          </div>

          <div className="stub-qr">
            <img src={smallQrCodeUrl} alt="QR Code ته فاکتور" />
            <span>QR فاکتور</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Invoice;