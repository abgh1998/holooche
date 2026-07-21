import { useMemo, useState } from "react";
import { formatMoney, persianToEnglishNumber } from "../utils/money";

function PurchaseInvoicePage({
  parties = [],
  products = [],
  purchaseInvoices = [],
  onCreatePurchaseInvoice,
}) {
  const [supplierId, setSupplierId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [rows, setRows] = useState([]);
  const [note, setNote] = useState("");

  const suppliers = parties.filter(
    (party) =>
      party.type === "supplier" ||
      party.type === "person" ||
      party.type === "customer"
  );

  const productItems = products.filter((product) => product.type === "product");

  const selectedSupplier = suppliers.find(
    (party) => String(party.id) === String(supplierId)
  );

  const selectedProduct = productItems.find(
    (product) => String(product.id) === String(selectedProductId)
  );

  const formatNumberInput = (value) => {
    const englishValue = persianToEnglishNumber(value);
    const onlyNumbers = englishValue.replace(/[^0-9]/g, "");

    if (onlyNumbers === "") return "";

    return Number(onlyNumbers).toLocaleString("fa-IR");
  };

  const getPureNumber = (value) => {
    const englishValue = persianToEnglishNumber(value);
    const onlyNumbers = englishValue.replace(/[^0-9]/g, "");

    if (onlyNumbers === "") return 0;

    return Number(onlyNumbers);
  };

  const generateInvoiceNumber = () => {
    return `PI-${Date.now()}`;
  };

  const totals = useMemo(() => {
    const subtotal = rows.reduce(
      (sum, row) => sum + Number(row.quantity || 0) * Number(row.buyPrice || 0),
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

  const getPaymentStatusLabel = (status) => {
    if (status === "paid") return "تسویه شده";
    if (status === "partial") return "نیمه تسویه";
    return "پرداخت نشده";
  };

  const addRow = () => {
    if (!selectedProduct) {
      alert("لطفا کالا را انتخاب کنید");
      return;
    }

    const pureQuantity = getPureNumber(quantity);
    const pureBuyPrice = getPureNumber(buyPrice);
    const pureDiscount = getPureNumber(discount);

    if (pureQuantity <= 0) {
      alert("تعداد باید بیشتر از صفر باشد");
      return;
    }

    if (pureBuyPrice <= 0) {
      alert("قیمت خرید باید بیشتر از صفر باشد");
      return;
    }

    const rowTotal = Math.max(pureQuantity * pureBuyPrice - pureDiscount, 0);

    const newRow = {
      rowId: Date.now(),
      productId: selectedProduct.id,
      code: selectedProduct.code || "",
      name: selectedProduct.name,
      type: selectedProduct.type || "product",
      unit: selectedProduct.unit || "عدد",
      stock: Number(selectedProduct.stock || 0),
      quantity: pureQuantity,
      buyPrice: pureBuyPrice,
      discount: pureDiscount,
      rowTotal,
    };

    setRows((prevRows) => [...prevRows, newRow]);

    setSelectedProductId("");
    setQuantity("");
    setBuyPrice("");
    setDiscount("");
  };

  const deleteRow = (rowId) => {
    setRows((prevRows) => prevRows.filter((row) => row.rowId !== rowId));
  };

  const handleProductChange = (productId) => {
    setSelectedProductId(productId);

    const product = productItems.find(
      (item) => String(item.id) === String(productId)
    );

    if (product) {
      setBuyPrice(formatNumberInput(String(product.buyPrice || "")));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSupplier) {
      alert("لطفا تامین کننده را انتخاب کنید");
      return;
    }

    if (rows.length === 0) {
      alert("حداقل یک ردیف کالا ثبت کنید");
      return;
    }

    const invoice = {
      invoiceNumber: generateInvoiceNumber(),
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      rows,
      subtotal: totals.subtotal,
      totalDiscount: totals.totalDiscount,
      finalTotal: totals.finalTotal,
      paymentStatus: "unpaid",
      paidAmount: 0,
      remainingAmount: totals.finalTotal,
      note: note.trim(),
    };

    await onCreatePurchaseInvoice(invoice);

    setSupplierId("");
    setSelectedProductId("");
    setQuantity("");
    setBuyPrice("");
    setDiscount("");
    setRows([]);
    setNote("");
  };

  return (
    <section className="card purchase-card">
      <div className="purchase-header">
        <div>
          <h2>فاکتور خرید</h2>
          <p>ثبت خرید کالا، افزایش موجودی انبار و بدهکاری به تامین کننده</p>
        </div>
      </div>

      <form className="purchase-form" onSubmit={handleSubmit}>
        <div className="purchase-form-grid">
          <div>
            <label>تامین کننده</label>

            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">انتخاب کنید</option>

              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>کالا</label>

            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
            >
              <option value="">انتخاب کالا</option>

              {productItems.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - موجودی: {Number(product.stock || 0).toLocaleString("fa-IR")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>تعداد خرید</label>

            <input
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(formatNumberInput(e.target.value))}
              placeholder="مثلا ۱۰"
            />
          </div>

          <div>
            <label>قیمت خرید</label>

            <input
              type="text"
              inputMode="numeric"
              value={buyPrice}
              onChange={(e) => setBuyPrice(formatNumberInput(e.target.value))}
              placeholder="مثلا ۱۰۰,۰۰۰"
            />
          </div>

          <div>
            <label>تخفیف ردیف</label>

            <input
              type="text"
              inputMode="numeric"
              value={discount}
              onChange={(e) => setDiscount(formatNumberInput(e.target.value))}
              placeholder="اختیاری"
            />
          </div>

          <div className="purchase-add-row-box">
            <button type="button" onClick={addRow}>
              افزودن ردیف
            </button>
          </div>

          <div className="full">
            <label>توضیحات</label>

            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="اختیاری"
            />
          </div>
        </div>

        {rows.length > 0 && (
          <div className="purchase-table-wrap">
            <table className="purchase-table">
              <thead>
                <tr>
                  <th>کالا</th>
                  <th>تعداد</th>
                  <th>قیمت خرید</th>
                  <th>تخفیف</th>
                  <th>جمع ردیف</th>
                  <th>عملیات</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.rowId}>
                    <td>{row.name}</td>
                    <td>
                      {Number(row.quantity || 0).toLocaleString("fa-IR")}{" "}
                      {row.unit}
                    </td>
                    <td>{formatMoney(row.buyPrice)}</td>
                    <td>{formatMoney(row.discount)}</td>
                    <td>{formatMoney(row.rowTotal)}</td>
                    <td>
                      <button
                        type="button"
                        className="purchase-delete-row-btn"
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

        <div className="purchase-summary-grid">
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

        <button type="submit" className="purchase-submit-btn">
          ثبت فاکتور خرید
        </button>
      </form>

      <div className="purchase-list">
        <h3>فاکتورهای خرید ثبت شده</h3>

        {purchaseInvoices.length === 0 ? (
          <p className="empty-text">هنوز فاکتور خریدی ثبت نشده است</p>
        ) : (
          <div className="purchase-table-wrap">
            <table className="purchase-table">
              <thead>
                <tr>
                  <th>شماره</th>
                  <th>تامین کننده</th>
                  <th>مبلغ</th>
                  <th>وضعیت پرداخت</th>
                  <th>تاریخ</th>
                </tr>
              </thead>

              <tbody>
                {purchaseInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{invoice.supplierName}</td>
                    <td>{formatMoney(invoice.finalTotal)}</td>
                    <td>{getPaymentStatusLabel(invoice.paymentStatus)}</td>
                    <td>
                      {new Date(invoice.createdAt).toLocaleDateString("fa-IR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default PurchaseInvoicePage;
