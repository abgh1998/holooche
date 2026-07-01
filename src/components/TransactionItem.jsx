import { amountToPersianWords, formatMoney } from "../utils/money";
import { createQrCodeUrl } from "../utils/invoice";

function TransactionItem({
  transaction,
  maxAmount,
  onSelectTransaction,
  onDeleteTransaction,
}) {
  const sign = transaction.type === "income" ? "+" : "-";
  const typeLabel = transaction.type === "income" ? "درآمد" : "هزینه";
  const formattedDate = new Date(transaction.date).toLocaleString("fa-IR");

  const chartWidth = (Number(transaction.amount) / maxAmount) * 100;
  const amountWords = amountToPersianWords(transaction.amount);
  const qrCodeUrl = createQrCodeUrl(transaction, 150);
  const smallQrCodeUrl = createQrCodeUrl(transaction, 90);

  const handleDownloadFactor = () => {
    const factorWindow = window.open("", "_blank");

    factorWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
        <head>
          <title>فاکتور ${transaction.id}</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              background: #f8fafc;
              padding: 30px;
              color: #0f172a;
              direction: rtl;
            }

            .factor {
              max-width: 760px;
              margin: 0 auto;
              background: white;
              padding: 32px;
              border-radius: 20px;
              border: 1px solid #e2e8f0;
            }

            .factor-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 20px;
              margin-bottom: 26px;
              border-bottom: 2px solid #fed7aa;
              padding-bottom: 18px;
            }

            h1 {
              margin: 0 0 10px;
              color: #ea580c;
            }

            .factor-number {
              color: #64748b;
              margin: 0;
              font-weight: bold;
            }

            .qr-box {
              text-align: center;
              border: 1px solid #fed7aa;
              padding: 10px;
              border-radius: 14px;
              background: #fff7ed;
            }

            .qr-box img {
              width: 120px;
              height: 120px;
              display: block;
              margin: 0 auto 8px;
            }

            .qr-box span {
              font-size: 11px;
              color: #9a3412;
              font-weight: bold;
            }

            .invoice-box {
              border: 1px solid #fed7aa;
              border-radius: 18px;
              overflow: hidden;
            }

            .row {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              padding: 15px;
              border-bottom: 1px solid #fed7aa;
              background: #fffaf5;
            }

            .row:last-child {
              border-bottom: none;
            }

            .label {
              color: #9a3412;
              font-weight: bold;
            }

            .value {
              font-weight: bold;
              text-align: left;
            }

            .total {
              margin-top: 22px;
              padding: 20px;
              background: #fff7ed;
              border-radius: 16px;
              color: #ea580c;
              text-align: left;
              font-weight: bold;
              border: 1px solid #fed7aa;
            }

            .total .number {
              font-size: 24px;
            }

            .total .words {
              margin-top: 10px;
              font-size: 15px;
              color: #9a3412;
            }

            .mini-chart {
              margin-top: 25px;
            }

            .chart-track {
              width: 100%;
              height: 16px;
              background: #ffedd5;
              border-radius: 999px;
              overflow: hidden;
              margin-top: 10px;
            }

            .chart-fill {
              height: 100%;
              width: ${chartWidth}%;
              border-radius: 999px;
              background: ${
                transaction.type === "income" ? "#16a34a" : "#dc2626"
              };
            }

            .stub {
              margin-top: 34px;
              border: 1px dashed #9a3412;
              border-radius: 18px;
              background: #fffaf5;
              overflow: hidden;
            }

            .cut-line {
              border-bottom: 2px dashed #c2410c;
              text-align: center;
              padding: 10px;
              color: #9a3412;
              font-size: 12px;
              font-weight: bold;
              background: #ffedd5;
            }

            .stub-content {
              display: grid;
              grid-template-columns: 1fr 110px;
              gap: 18px;
              padding: 18px;
              align-items: center;
            }

            .stub h2 {
              margin: 0 0 12px;
              color: #7c2d12;
              font-size: 18px;
            }

            .stub-row {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              padding: 6px 0;
              font-size: 13px;
            }

            .stub-row span {
              color: #9a3412;
              font-weight: bold;
            }

            .stub-row strong {
              text-align: left;
            }

            .stub-qr {
              text-align: center;
            }

            .stub-qr img {
              width: 90px;
              height: 90px;
              display: block;
              margin: 0 auto 6px;
            }

            .stub-qr span {
              font-size: 11px;
              color: #9a3412;
              font-weight: bold;
            }

            .footer {
              margin-top: 30px;
              text-align: center;
              color: #64748b;
              font-size: 13px;
            }

            @media print {
              body {
                background: white;
                padding: 0;
              }

              .factor {
                border: 1px solid #000;
                border-radius: 0;
              }
            }

            @media (max-width: 650px) {
              .factor-header,
              .stub-content {
                grid-template-columns: 1fr;
                display: flex;
                flex-direction: column;
              }

              .factor-header {
                align-items: stretch;
              }

              .qr-box {
                width: 150px;
                margin: 0 auto;
              }
            }
          </style>
        </head>

        <body>
          <div class="factor">
            <div class="factor-header">
              <div>
                <h1>فاکتور مدیریت مالی شخصی</h1>
                <p class="factor-number">شماره فاکتور: ${transaction.id}</p>
              </div>

              <div class="qr-box">
                <img src="${qrCodeUrl}" alt="QR Code" />
                <span>کد اعتبارسنجی فاکتور</span>
              </div>
            </div>

            <div class="invoice-box">
              <div class="row">
                <span class="label">عنوان</span>
                <span class="value">${transaction.title}</span>
              </div>

              <div class="row">
                <span class="label">نوع تراکنش</span>
                <span class="value">${typeLabel}</span>
              </div>

              <div class="row">
                <span class="label">تاریخ</span>
                <span class="value">${formattedDate}</span>
              </div>
            </div>

            <div class="total">
              <div class="number">مبلغ: ${sign} ${formatMoney(transaction.amount)}</div>
              <div class="words">به حروف: ${amountWords}</div>
            </div>

            <div class="mini-chart">
              <p class="label">نمودار این تراکنش</p>
              <div class="chart-track">
                <div class="chart-fill"></div>
              </div>
            </div>

            <div class="stub">
              <div class="cut-line">محل جدا کردن ته فاکتور</div>

              <div class="stub-content">
                <div>
                  <h2>ته فاکتور</h2>

                  <div class="stub-row">
                    <span>شماره:</span>
                    <strong>${transaction.id}</strong>
                  </div>

                  <div class="stub-row">
                    <span>عنوان:</span>
                    <strong>${transaction.title}</strong>
                  </div>

                  <div class="stub-row">
                    <span>نوع:</span>
                    <strong>${typeLabel}</strong>
                  </div>

                  <div class="stub-row">
                    <span>تاریخ:</span>
                    <strong>${formattedDate}</strong>
                  </div>

                  <div class="stub-row">
                    <span>مبلغ:</span>
                    <strong>${sign} ${formatMoney(transaction.amount)}</strong>
                  </div>
                </div>

                <div class="stub-qr">
                  <img src="${smallQrCodeUrl}" alt="QR Code" />
                  <span>QR فاکتور</span>
                </div>
              </div>
            </div>

            <div class="footer">
              این فاکتور توسط برنامه مدیریت مالی شخصی ساخته شده است.
            </div>
          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 600);
            };
          </script>
        </body>
      </html>
    `);

    factorWindow.document.close();
  };

  return (
    <li className={`transaction-item ${transaction.type}`}>
      <div className="transaction-main">
        <div>
          <h3>{transaction.title}</h3>
          <p>{formattedDate}</p>
        </div>

        <div className="transaction-mini-chart">
          <div className="mini-chart-info">
            <span>نمودار این تراکنش</span>
            <small>{Math.round(chartWidth).toLocaleString("fa-IR")}٪</small>
          </div>

          <div className="mini-chart-track">
            <div
              className={`mini-chart-fill ${transaction.type}`}
              style={{ width: `${chartWidth}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="transaction-amount">
        <strong>
          {sign} {formatMoney(transaction.amount)}
        </strong>
        <small>{amountWords}</small>
      </div>

      <div className="item-actions">
        <button
          className="invoice-btn"
          onClick={() => onSelectTransaction(transaction.id)}
        >
          مشاهده فاکتور
        </button>

        <button className="download-btn" onClick={handleDownloadFactor}>
          دریافت فاکتور
        </button>

        <button
          className="delete-btn"
          onClick={() => onDeleteTransaction(transaction.id)}
        >
          حذف
        </button>
      </div>
    </li>
  );
}

export default TransactionItem;