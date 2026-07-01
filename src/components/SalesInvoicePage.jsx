import { useMemo, useState } from "react";
import {
  amountToPersianWords,
  formatMoney,
  persianToEnglishNumber,
} from "../utils/money";

function SalesInvoicePage({
  parties = [],
  products = [],
  salesInvoices = [],
  onCreateSalesInvoice,
}) {
  const [customerId, setCustomerId] = useState("");
  const [invoiceRows, setInvoiceRows] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("۱");
  const [discount, setDiscount] = useState("");
  const [note, setNote] = useState("");

  const customers = parties.filter(
    (party) => party.type === "customer" || party.type === "person"
  );

  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(
    salesInvoices.length + 1
  ).padStart(5, "0")}`;

  const formatNumberInput = (value) => {
    const englishValue = persianToEnglishNumber(value);
    const onlyNumbers = englishValue.replace(/[^0-9]/g, "");

    if (onlyNumbers === "") {
      return "";
    }

    return Number(onlyNumbers).toLocaleString("fa-IR");
  };

  const getPureNumber = (value) => {
    const englishValue = persianToEnglishNumber(value);
    const onlyNumbers = englishValue.replace(/[^0-9]/g, "");

    if (onlyNumbers === "") {
      return 0;
    }

    return Number(onlyNumbers);
  };

  const selectedCustomer = customers.find(
    (customer) => String(customer.id) === String(customerId)
  );

  const totals = useMemo(() => {
    const subtotal = invoiceRows.reduce((total, row) => {
      return total + Number(row.quantity) * Number(row.salePrice);
    }, 0);

    const totalDiscount = invoiceRows.reduce((total, row) => {
      return total + Number(row.discount);
    }, 0);

    return {
      subtotal,
      totalDiscount,
      finalTotal: Math.max(subtotal - totalDiscount, 0),
    };
  }, [invoiceRows]);

  const addProductToInvoice = () => {
    const product = products.find(
      (item) => String(item.id) === String(selectedProductId)
    );

    if (!product) {
      alert("لطفا کالا یا خدمت را انتخاب کنید");
      return;
    }

    const pureQuantity = getPureNumber(quantity);
    const pureDiscount = getPureNumber(discount);

    if (pureQuantity <= 0) {
      alert("تعداد باید بیشتر از صفر باشد");
      return;
    }

    if (product.type === "product" && pureQuantity > Number(product.stock)) {
      alert("موجودی این کالا کافی نیست");
      return;
    }

    const existingRow = invoiceRows.find(
      (row) => String(row.productId) === String(product.id)
    );

    if (existingRow) {
      alert("این کالا قبلا به فاکتور اضافه شده است");
      return;
    }

    const newRow = {
      rowId: Date.now(),
      productId: product.id,
      code: product.code,
      name: product.name,
      type: product.type,
      unit: product.unit,
      quantity: pureQuantity,
      salePrice: Number(product.salePrice),
      discount: pureDiscount,
      stock: Number(product.stock),
    };

    setInvoiceRows((prevRows) => [...prevRows, newRow]);
    setSelectedProductId("");
    setQuantity("۱");
    setDiscount("");
  };

  const removeRow = (rowId) => {
    setInvoiceRows((prevRows) => prevRows.filter((row) => row.rowId !== rowId));
  };

  const createQrCodeUrl = (invoice, size = 120) => {
    const qrData = `
شماره فاکتور: ${invoice.invoiceNumber}
مشتری: ${invoice.customerName}
تاریخ: ${new Date(invoice.createdAt).toLocaleString("fa-IR")}
مبلغ نهایی: ${Number(invoice.finalTotal).toLocaleString("fa-IR")} تومان
    `.trim();

    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
      qrData
    )}`;
  };

  const printSalesInvoice = (invoice) => {
    const qrCodeUrl = createQrCodeUrl(invoice, 130);
    const smallQrCodeUrl = createQrCodeUrl(invoice, 80);

    const rowsHtml = invoice.rows
      .map((row, index) => {
        const rowTotal =
          Number(row.quantity) * Number(row.salePrice) - Number(row.discount);

        return `
          <tr>
            <td>${(index + 1).toLocaleString("fa-IR")}</td>
            <td>${row.name}</td>
            <td>${Number(row.quantity).toLocaleString("fa-IR")} ${row.unit}</td>
            <td>${formatMoney(row.salePrice)}</td>
            <td>${formatMoney(row.discount)}</td>
            <td>${formatMoney(rowTotal)}</td>
          </tr>
        `;
      })
      .join("");

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
        <head>
          <title>فاکتور فروش ${invoice.invoiceNumber}</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 28px;
              direction: rtl;
              font-family: Arial, sans-serif;
              background: #f8fafc;
              color: #111827;
            }

            .sales-print {
              max-width: 850px;
              margin: 0 auto;
              background: white;
              border: 1px solid #fed7aa;
              border-radius: 20px;
              padding: 28px;
            }

            .print-header {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              padding-bottom: 18px;
              border-bottom: 2px solid #fed7aa;
            }

            .print-header h1 {
              margin: 0 0 10px;
              color: #c2410c;
              font-size: 26px;
            }

            .print-header p {
              margin: 5px 0;
              color: #475569;
              font-size: 13px;
              font-weight: bold;
            }

            .print-qr {
              width: 150px;
              padding: 10px;
              border-radius: 16px;
              border: 1px solid #fed7aa;
              background: #fff7ed;
              text-align: center;
            }

            .print-qr img {
              width: 120px;
              height: 120px;
              display: block;
              margin: 0 auto 8px;
            }

            .print-qr span {
              color: #9a3412;
              font-size: 11px;
              font-weight: bold;
            }

            table {
              width: 100%;
              margin-top: 24px;
              border-collapse: collapse;
              overflow: hidden;
              border-radius: 14px;
            }

            th,
            td {
              border: 1px solid #fed7aa;
              padding: 11px;
              font-size: 13px;
              text-align: center;
            }

            th {
              background: #ffedd5;
              color: #7c2d12;
            }

            td {
              background: #fffaf5;
            }

            .totals {
              margin-top: 22px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }

            .total-box {
              padding: 14px;
              border-radius: 14px;
              background: #fff7ed;
              border: 1px solid #fed7aa;
            }

            .total-box span {
              display: block;
              margin-bottom: 8px;
              color: #9a3412;
              font-size: 12px;
              font-weight: bold;
            }

            .total-box strong {
              color: #111827;
              font-size: 16px;
            }

            .final {
              grid-column: 1 / -1;
              background: #ffedd5;
            }

            .final strong {
              color: #c2410c;
              font-size: 24px;
            }

            .words {
              margin-top: 10px;
              color: #7c2d12;
              font-size: 13px;
              font-weight: bold;
              line-height: 1.9;
            }

            .note {
              margin-top: 18px;
              padding: 14px;
              border-radius: 14px;
              background: #f8fafc;
              border: 1px solid #e5e7eb;
              color: #475569;
              font-size: 13px;
              line-height: 1.9;
            }

            .stub {
              margin-top: 30px;
              border: 1px dashed #9a3412;
              border-radius: 18px;
              overflow: hidden;
              background: #fffaf5;
            }

            .cut-line {
              padding: 10px;
              text-align: center;
              border-bottom: 2px dashed #c2410c;
              background: #ffedd5;
              color: #9a3412;
              font-size: 12px;
              font-weight: bold;
            }

            .stub-content {
              display: grid;
              grid-template-columns: 1fr 95px;
              gap: 16px;
              padding: 16px;
              align-items: center;
            }

            .stub-content h2 {
              margin: 0 0 10px;
              color: #7c2d12;
              font-size: 17px;
            }

            .stub-row {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              padding: 5px 0;
              font-size: 12px;
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
              width: 80px;
              height: 80px;
              display: block;
              margin: 0 auto 6px;
            }

            .stub-qr span {
              color: #9a3412;
              font-size: 10px;
              font-weight: bold;
            }

            .footer {
              margin-top: 20px;
              text-align: center;
              color: #64748b;
              font-size: 12px;
            }

            @media print {
              body {
                background: white;
                padding: 0;
              }

              .sales-print {
                border: 1px solid #000;
                border-radius: 0;
              }

              .stub {
                break-inside: avoid;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>

        <body>
          <div class="sales-print">
            <div class="print-header">
              <div>
                <h1>فاکتور فروش</h1>
                <p>شماره فاکتور: ${invoice.invoiceNumber}</p>
                <p>مشتری: ${invoice.customerName}</p>
                <p>تاریخ: ${new Date(invoice.createdAt).toLocaleString("fa-IR")}</p>
              </div>

              <div class="print-qr">
                <img src="${qrCodeUrl}" alt="QR Code" />
                <span>کد اعتبارسنجی فاکتور</span>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>ردیف</th>
                  <th>شرح کالا / خدمت</th>
                  <th>تعداد</th>
                  <th>قیمت واحد</th>
                  <th>تخفیف</th>
                  <th>جمع</th>
                </tr>
              </thead>

              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-box">
                <span>جمع قبل از تخفیف</span>
                <strong>${formatMoney(invoice.subtotal)}</strong>
              </div>

              <div class="total-box">
                <span>جمع تخفیف</span>
                <strong>${formatMoney(invoice.totalDiscount)}</strong>
              </div>

              <div class="total-box final">
                <span>مبلغ قابل پرداخت</span>
                <strong>${formatMoney(invoice.finalTotal)}</strong>
                <div class="words">${amountToPersianWords(invoice.finalTotal)}</div>
              </div>
            </div>

            ${
              invoice.note
                ? `<div class="note">توضیحات: ${invoice.note}</div>`
                : ""
            }

            <div class="stub">
              <div class="cut-line">محل جدا کردن ته فاکتور</div>

              <div class="stub-content">
                <div>
                  <h2>ته فاکتور فروش</h2>

                  <div class="stub-row">
                    <span>شماره:</span>
                    <strong>${invoice.invoiceNumber}</strong>
                  </div>

                  <div class="stub-row">
                    <span>مشتری:</span>
                    <strong>${invoice.customerName}</strong>
                  </div>

                  <div class="stub-row">
                    <span>تعداد اقلام:</span>
                    <strong>${invoice.rows.length.toLocaleString("fa-IR")}</strong>
                  </div>

                  <div class="stub-row">
                    <span>مبلغ:</span>
                    <strong>${formatMoney(invoice.finalTotal)}</strong>
                  </div>
                </div>

                <div class="stub-qr">
                  <img src="${smallQrCodeUrl}" alt="QR Code" />
                  <span>QR فاکتور</span>
                </div>
              </div>
            </div>

            <div class="footer">
              این فاکتور توسط نرم‌افزار حسابداری شخصی ساخته شده است.
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

    printWindow.document.close();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedCustomer) {
      alert("لطفا مشتری را انتخاب کنید");
      return;
    }

    if (invoiceRows.length === 0) {
      alert("حداقل یک کالا یا خدمت به فاکتور اضافه کنید");
      return;
    }

    const stockProblem = invoiceRows.find((row) => {
      if (row.type !== "product") {
        return false;
      }

      return Number(row.quantity) > Number(row.stock);
    });

    if (stockProblem) {
      alert(`موجودی کالا کافی نیست: ${stockProblem.name}`);
      return;
    }

    const newInvoice = {
      id: Date.now(),
      invoiceNumber,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      rows: invoiceRows,
      subtotal: totals.subtotal,
      totalDiscount: totals.totalDiscount,
      finalTotal: totals.finalTotal,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };

    onCreateSalesInvoice(newInvoice);

    setCustomerId("");
    setInvoiceRows([]);
    setSelectedProductId("");
    setQuantity("۱");
    setDiscount("");
    setNote("");

    setTimeout(() => {
      printSalesInvoice(newInvoice);
    }, 200);
  };

  return (
    <>
      <section className="card sales-invoice-card">
        <h2>صدور فاکتور فروش</h2>

        {customers.length === 0 || products.length === 0 ? (
          <div className="sales-warning-box">
            <p>
              برای صدور فاکتور فروش باید حداقل یک طرف حساب و یک کالا یا خدمت
              ثبت کرده باشید.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="sales-form-grid">
            <div className="sales-field">
              <label>شماره فاکتور</label>
              <input type="text" value={invoiceNumber} readOnly />
            </div>

            <div className="sales-field">
              <label>مشتری</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">انتخاب مشتری</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sales-field full">
              <label>توضیحات</label>
              <input
                type="text"
                placeholder="توضیحات اختیاری فاکتور"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className="sales-add-row-box">
            <div className="sales-field">
              <label>کالا / خدمت</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">انتخاب کالا یا خدمت</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {formatMoney(product.salePrice)}
                  </option>
                ))}
              </select>
            </div>

            <div className="sales-field">
              <label>تعداد</label>
              <input
                type="text"
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(formatNumberInput(e.target.value))}
              />
            </div>

            <div className="sales-field">
              <label>تخفیف</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="اختیاری"
                value={discount}
                onChange={(e) => setDiscount(formatNumberInput(e.target.value))}
              />
            </div>

            <button type="button" onClick={addProductToInvoice}>
              افزودن قلم
            </button>
          </div>

          {invoiceRows.length > 0 && (
            <div className="sales-table-wrap">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>شرح</th>
                    <th>تعداد</th>
                    <th>قیمت واحد</th>
                    <th>تخفیف</th>
                    <th>جمع</th>
                    <th>حذف</th>
                  </tr>
                </thead>

                <tbody>
                  {invoiceRows.map((row) => {
                    const rowTotal =
                      Number(row.quantity) * Number(row.salePrice) -
                      Number(row.discount);

                    return (
                      <tr key={row.rowId}>
                        <td>{row.name}</td>
                        <td>
                          {Number(row.quantity).toLocaleString("fa-IR")}{" "}
                          {row.unit}
                        </td>
                        <td>{formatMoney(row.salePrice)}</td>
                        <td>{formatMoney(row.discount)}</td>
                        <td>{formatMoney(rowTotal)}</td>
                        <td>
                          <button
                            type="button"
                            className="sales-row-delete"
                            onClick={() => removeRow(row.rowId)}
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="sales-total-panel">
            <div>
              <span>جمع قبل از تخفیف</span>
              <strong>{formatMoney(totals.subtotal)}</strong>
            </div>

            <div>
              <span>جمع تخفیف</span>
              <strong>{formatMoney(totals.totalDiscount)}</strong>
            </div>

            <div className="final">
              <span>مبلغ نهایی</span>
              <strong>{formatMoney(totals.finalTotal)}</strong>
              <small>{amountToPersianWords(totals.finalTotal)}</small>
            </div>
          </div>

          <button
            className="create-sales-btn"
            type="submit"
            disabled={customers.length === 0 || products.length === 0}
          >
            ثبت و چاپ فاکتور فروش
          </button>
        </form>
      </section>

      <section className="card sales-list-card">
        <h2>فاکتورهای فروش ثبت شده</h2>

        {salesInvoices.length === 0 ? (
          <p className="empty-text">هنوز فاکتور فروشی ثبت نشده است</p>
        ) : (
          <div className="sales-invoice-list">
            {salesInvoices.map((invoice) => (
              <div className="sales-invoice-item" key={invoice.id}>
                <div>
                  <h3>{invoice.invoiceNumber}</h3>
                  <p>{invoice.customerName}</p>
                  <p>{new Date(invoice.createdAt).toLocaleString("fa-IR")}</p>
                </div>

                <div className="sales-invoice-total">
                  <strong>{formatMoney(invoice.finalTotal)}</strong>
                  <small>{invoice.rows.length.toLocaleString("fa-IR")} قلم</small>
                </div>

                <button onClick={() => printSalesInvoice(invoice)}>
                  چاپ مجدد
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default SalesInvoicePage;