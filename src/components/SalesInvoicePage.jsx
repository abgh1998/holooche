import { useMemo, useState } from "react";
import { formatMoney, persianToEnglishNumber } from "../utils/money";

function SalesInvoicePage({
  parties = [],
  products = [],
  salesInvoices = [],
  onCreateSalesInvoice,
}) {
  const [invoiceNumber, setInvoiceNumber] = useState(() =>
    generateInvoiceNumber(salesInvoices.length + 1)
  );
  const [customerId, setCustomerId] = useState("");
  const [note, setNote] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("۱");
  const [discount, setDiscount] = useState("");
  const [rows, setRows] = useState([]);

  const [printInvoice, setPrintInvoice] = useState(null);

  const customers = parties.filter(
    (party) =>
      party.type === "customer" ||
      party.type === "person" ||
      party.type === "supplier"
  );

  const invoiceItems = products.filter(
    (product) => product.type === "product" || product.type === "service"
  );

  const selectedCustomer = customers.find(
    (customer) => String(customer.id) === String(customerId)
  );

  const selectedProduct = invoiceItems.find(
    (product) => String(product.id) === String(selectedProductId)
  );

  function generateInvoiceNumber(index = 1) {
    const year = new Date().getFullYear();
    return `INV-${year}-${String(index).padStart(5, "0")}`;
  }

  const formatNumberInput = (value) => {
    const englishValue = persianToEnglishNumber(value);
    const onlyNumbers = englishValue.replace(/[^0-9]/g, "");

    if (onlyNumbers === "") return "";
    return Number(onlyNumbers).toLocaleString("fa-IR");
  };

  const getPureNumber = (value) => {
    const englishValue = persianToEnglishNumber(value || "");
    const onlyNumbers = englishValue.replace(/[^0-9]/g, "");

    if (onlyNumbers === "") return 0;
    return Number(onlyNumbers);
  };

  const totals = useMemo(() => {
    const subtotal = rows.reduce(
      (sum, row) => sum + Number(row.quantity || 0) * Number(row.salePrice || 0),
      0
    );

    const totalDiscount = rows.reduce(
      (sum, row) => sum + Number(row.discount || 0),
      0
    );

    const finalTotal = Math.max(subtotal - totalDiscount, 0);

    return {
      subtotal,
      totalDiscount,
      finalTotal,
    };
  }, [rows]);

  const addRow = () => {
    if (!selectedProduct) {
      alert("لطفا کالا یا خدمت را انتخاب کنید");
      return;
    }

    const pureQuantity = getPureNumber(quantity);
    const pureDiscount = getPureNumber(discount);
    const salePrice = Number(selectedProduct.salePrice || 0);

    if (pureQuantity <= 0) {
      alert("تعداد باید بیشتر از صفر باشد");
      return;
    }

    if (salePrice <= 0) {
      alert("قیمت فروش این کالا یا خدمت صفر است");
      return;
    }

    if (
      selectedProduct.type === "product" &&
      pureQuantity > Number(selectedProduct.stock || 0)
    ) {
      alert("موجودی کالا کافی نیست");
      return;
    }

    const rowTotal = Math.max(pureQuantity * salePrice - pureDiscount, 0);

    const newRow = {
      rowId: Date.now(),
      productId: selectedProduct.id,
      code: selectedProduct.code || "",
      name: selectedProduct.name,
      type: selectedProduct.type || "product",
      unit: selectedProduct.unit || "عدد",
      stock: Number(selectedProduct.stock || 0),
      quantity: pureQuantity,
      salePrice,
      discount: pureDiscount,
      rowTotal,
    };

    setRows((prevRows) => [...prevRows, newRow]);
    setSelectedProductId("");
    setQuantity("۱");
    setDiscount("");
  };

  const deleteRow = (rowId) => {
    setRows((prevRows) => prevRows.filter((row) => row.rowId !== rowId));
  };

  const resetForm = () => {
    setInvoiceNumber(generateInvoiceNumber(salesInvoices.length + 2));
    setCustomerId("");
    setNote("");
    setSelectedProductId("");
    setQuantity("۱");
    setDiscount("");
    setRows([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) {
      alert("لطفا مشتری را انتخاب کنید");
      return;
    }

    if (rows.length === 0) {
      alert("حداقل یک قلم به فاکتور اضافه کنید");
      return;
    }

    const invoice = {
      invoiceNumber,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      rows,
      subtotal: totals.subtotal,
      totalDiscount: totals.totalDiscount,
      finalTotal: totals.finalTotal,
      paymentStatus: "unpaid",
      paidAmount: 0,
      remainingAmount: totals.finalTotal,
      note: note.trim(),
    };

    const result = await onCreateSalesInvoice(invoice);

    const printableInvoice = result?.data || {
      ...invoice,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };

    setPrintInvoice(printableInvoice);

    setTimeout(() => {
      window.print();
    }, 300);

    resetForm();
  };

  const handlePrintAgain = (invoice) => {
    setPrintInvoice(invoice);

    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <>
      <section className="card sales-invoice-card">
        <h2>صدور فاکتور فروش</h2>

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
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="توضیحات اختیاری فاکتور"
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
                {invoiceItems.map((product) => (
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
                value={discount}
                onChange={(e) => setDiscount(formatNumberInput(e.target.value))}
                placeholder="اختیاری"
              />
            </div>

            <button type="button" onClick={addRow}>
              افزودن قلم
            </button>
          </div>

          {rows.length > 0 && (
            <div className="sales-table-wrap">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>کالا / خدمت</th>
                    <th>نوع</th>
                    <th>تعداد</th>
                    <th>قیمت واحد</th>
                    <th>تخفیف</th>
                    <th>جمع ردیف</th>
                    <th>عملیات</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row) => (
                    <tr key={row.rowId}>
                      <td>{row.name}</td>
                      <td>{row.type === "service" ? "خدمت" : "کالا"}</td>
                      <td>
                        {Number(row.quantity || 0).toLocaleString("fa-IR")}{" "}
                        {row.unit}
                      </td>
                      <td>{formatMoney(row.salePrice)}</td>
                      <td>{formatMoney(row.discount)}</td>
                      <td>{formatMoney(row.rowTotal)}</td>
                      <td>
                        <button
                          type="button"
                          className="sales-delete-row-btn"
                          onClick={() => deleteRow(row.rowId)}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
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
            </div>
          </div>

          <button className="create-sales-btn" type="submit">
            ثبت و چاپ فاکتور فروش
          </button>
        </form>
      </section>

      <section className="card sales-list-card">
        <h2>فاکتورهای فروش ثبت شده</h2>

        <div className="sales-invoice-list">
          {salesInvoices.length === 0 ? (
            <p className="sales-empty-text">هنوز فاکتور فروشی ثبت نشده است</p>
          ) : (
            salesInvoices.map((invoice) => (
              <div className="sales-invoice-item" key={invoice.id}>
                <div className="sales-invoice-info">
                  <h3>{invoice.invoiceNumber}</h3>
                  <p>{invoice.customerName}</p>
                  <p>
                    {invoice.createdAt
                      ? new Date(invoice.createdAt).toLocaleString("fa-IR")
                      : "-"}
                  </p>
                </div>

                <div className="sales-invoice-total">
                  <strong>{formatMoney(invoice.finalTotal)}</strong>
                  <small>{invoice.rows?.length || 0} قلم</small>
                </div>

                <button
                  type="button"
                  className="sales-print-btn"
                  onClick={() => handlePrintAgain(invoice)}
                >
                  چاپ مجدد
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {printInvoice && (
        <section className="card invoice-card sales-print-invoice">
          <div className="invoice-header">
            <div>
              <h2>فاکتور فروش</h2>
              <p>شماره فاکتور: {printInvoice.invoiceNumber}</p>
            </div>

            <button
              type="button"
              className="print-btn"
              onClick={() => window.print()}
            >
              چاپ / ذخیره PDF
            </button>
          </div>

          <div className="invoice-main">
            <div className="invoice-box">
              <div className="invoice-row">
                <span>مشتری</span>
                <strong>{printInvoice.customerName}</strong>
              </div>

              <div className="invoice-row">
                <span>تاریخ</span>
                <strong>
                  {printInvoice.createdAt
                    ? new Date(printInvoice.createdAt).toLocaleString("fa-IR")
                    : new Date().toLocaleString("fa-IR")}
                </strong>
              </div>

              <div className="invoice-row">
                <span>توضیحات</span>
                <strong>{printInvoice.note || "-"}</strong>
              </div>

              <div className="invoice-row total-row">
                <span>مبلغ نهایی</span>
                <div className="invoice-amount">
                  <strong>{formatMoney(printInvoice.finalTotal)}</strong>
                </div>
              </div>
            </div>

            <div className="invoice-qr-box">
              <img
                alt="QR Code فاکتور فروش"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                  `شماره فاکتور: ${printInvoice.invoiceNumber}
مشتری: ${printInvoice.customerName}
مبلغ: ${formatMoney(printInvoice.finalTotal)}`
                )}`}
              />
              <span>کد اعتبارسنجی فاکتور</span>
            </div>
          </div>

          <div className="sales-print-rows">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>کالا / خدمت</th>
                  <th>تعداد</th>
                  <th>قیمت واحد</th>
                  <th>تخفیف</th>
                  <th>جمع</th>
                </tr>
              </thead>

              <tbody>
                {(printInvoice.rows || []).map((row) => (
                  <tr key={row.rowId || row.productId || row.name}>
                    <td>{row.name}</td>
                    <td>
                      {Number(row.quantity || 0).toLocaleString("fa-IR")}{" "}
                      {row.unit}
                    </td>
                    <td>{formatMoney(row.salePrice)}</td>
                    <td>{formatMoney(row.discount)}</td>
                    <td>{formatMoney(row.rowTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

export default SalesInvoicePage;