import { useMemo, useState } from "react";
import { formatMoney, persianToEnglishNumber } from "../utils/money";

function CustomerLedgerPage({
  parties = [],
  salesInvoices = [],
  partyPayments = [],
  onAddPartyPayment,
  onDeletePartyPayment,
  onBack,
}) {
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [paymentType, setPaymentType] = useState("receive");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amount, setAmount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [note, setNote] = useState("");

  const availableParties = parties.filter(
    (party) =>
      party.type === "customer" ||
      party.type === "person" ||
      party.type === "supplier"
  );

  const selectedParty = availableParties.find(
    (party) => String(party.id) === String(selectedPartyId)
  );

  const selectedPartyInvoices = salesInvoices.filter((invoice) => {
    const remaining = Number(
      invoice.remainingAmount ?? invoice.finalTotal ?? 0
    );

    return (
      String(invoice.customerId) === String(selectedPartyId) && remaining > 0
    );
  });

  const selectedInvoice = selectedPartyInvoices.find(
    (invoice) => String(invoice.id) === String(selectedInvoiceId)
  );

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

  const ledgerData = useMemo(() => {
    if (!selectedParty) {
      return {
        entries: [],
        totalDebit: 0,
        totalCredit: 0,
        balance: 0,
      };
    }

    const entries = [];
    const openingBalance = Number(selectedParty.openingBalance || 0);

    if (openingBalance > 0) {
      entries.push({
        id: `opening-${selectedParty.id}`,
        type: "opening",
        title: "مانده اول دوره",
        date: selectedParty.createdAt || new Date().toISOString(),
        debit: selectedParty.balanceStatus === "debtor" ? openingBalance : 0,
        credit:
          selectedParty.balanceStatus === "creditor" ? openingBalance : 0,
        description:
          selectedParty.balanceStatus === "debtor"
            ? "بدهکار اول دوره"
            : selectedParty.balanceStatus === "creditor"
            ? "بستانکار اول دوره"
            : "بدون مانده",
      });
    }

    const partyInvoices = salesInvoices.filter(
      (invoice) => String(invoice.customerId) === String(selectedParty.id)
    );

    partyInvoices.forEach((invoice) => {
      entries.push({
        id: `invoice-${invoice.id}`,
        type: "invoice",
        title: `فاکتور فروش ${invoice.invoiceNumber}`,
        date: invoice.createdAt,
        debit: Number(invoice.finalTotal || 0),
        credit: 0,
        description: getInvoiceStatusLabel(invoice.paymentStatus),
      });
    });

    const payments = partyPayments.filter(
      (payment) => String(payment.partyId) === String(selectedParty.id)
    );

    payments.forEach((payment) => {
      const isReceive = payment.paymentType === "receive";
      const relatedInvoice = salesInvoices.find(
        (invoice) => String(invoice.id) === String(payment.invoiceId)
      );

      entries.push({
        id: `payment-${payment.id}`,
        realId: payment.id,
        type: "payment",
        title: isReceive ? "دریافت از طرف حساب" : "پرداخت به طرف حساب",
        date: payment.paymentDate,
        debit: isReceive ? 0 : Number(payment.amount || 0),
        credit: isReceive ? Number(payment.amount || 0) : 0,
        description:
          payment.note ||
          payment.referenceNumber ||
          (relatedInvoice
            ? `بابت فاکتور ${relatedInvoice.invoiceNumber}`
            : "-"),
        paymentMethod: payment.paymentMethod,
        referenceNumber: payment.referenceNumber,
        invoiceNumber: relatedInvoice?.invoiceNumber || "",
      });
    });

    const sortedEntries = entries.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    let runningBalance = 0;

    const entriesWithBalance = sortedEntries.map((entry) => {
      runningBalance += Number(entry.debit || 0) - Number(entry.credit || 0);

      return {
        ...entry,
        runningBalance,
      };
    });

    const totalDebit = entriesWithBalance.reduce(
      (sum, entry) => sum + Number(entry.debit || 0),
      0
    );

    const totalCredit = entriesWithBalance.reduce(
      (sum, entry) => sum + Number(entry.credit || 0),
      0
    );

    return {
      entries: entriesWithBalance,
      totalDebit,
      totalCredit,
      balance: totalDebit - totalCredit,
    };
  }, [selectedParty, salesInvoices, partyPayments]);

  const getBalanceText = (balance) => {
    if (balance > 0) {
      return `بدهکار: ${formatMoney(balance)}`;
    }

    if (balance < 0) {
      return `بستانکار: ${formatMoney(Math.abs(balance))}`;
    }

    return "تسویه";
  };

  function getInvoiceStatusLabel(status) {
    if (status === "paid") {
      return "تسویه شده";
    }

    if (status === "partial") {
      return "نیمه تسویه";
    }

    return "پرداخت نشده";
  }

  const getPaymentMethodLabel = (method) => {
    if (method === "cash") {
      return "نقدی";
    }

    if (method === "card") {
      return "کارت";
    }

    if (method === "bank") {
      return "حواله بانکی";
    }

    if (method === "check") {
      return "چک";
    }

    return method;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedParty) {
      alert("لطفا طرف حساب را انتخاب کنید");
      return;
    }

    const pureAmount = getPureNumber(amount);

    if (pureAmount <= 0) {
      alert("مبلغ باید بیشتر از صفر باشد");
      return;
    }

    if (selectedInvoice) {
      const invoiceRemaining = Number(
        selectedInvoice.remainingAmount ?? selectedInvoice.finalTotal ?? 0
      );

      if (pureAmount > invoiceRemaining) {
        alert("مبلغ دریافت نباید بیشتر از مانده فاکتور باشد");
        return;
      }
    }

    onAddPartyPayment({
      partyId: selectedParty.id,
      invoiceId: selectedInvoice ? selectedInvoice.id : null,
      paymentType,
      amount: pureAmount,
      paymentMethod,
      referenceNumber: referenceNumber.trim(),
      note: note.trim(),
      paymentDate: new Date().toISOString(),
    });

    setAmount("");
    setReferenceNumber("");
    setNote("");
    setSelectedInvoiceId("");
    setPaymentType("receive");
    setPaymentMethod("cash");
  };

  const printLedger = () => {
    if (!selectedParty) {
      alert("لطفا طرف حساب را انتخاب کنید");
      return;
    }

    const rowsHtml = ledgerData.entries
      .map(
        (entry, index) => `
      <tr>
        <td>${(index + 1).toLocaleString("fa-IR")}</td>
        <td>${new Date(entry.date).toLocaleDateString("fa-IR")}</td>
        <td>${entry.title}</td>
        <td>${entry.description}</td>
        <td>${entry.debit ? formatMoney(entry.debit) : "-"}</td>
        <td>${entry.credit ? formatMoney(entry.credit) : "-"}</td>
        <td>${getBalanceText(entry.runningBalance)}</td>
      </tr>
    `
      )
      .join("");

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
        <head>
          <title>صورت حساب ${selectedParty.name}</title>
          <style>
            body {
              direction: rtl;
              font-family: Arial, sans-serif;
              padding: 28px;
              color: #111827;
            }

            h1 {
              color: #c2410c;
              margin-bottom: 8px;
            }

            .info {
              margin-bottom: 20px;
              color: #475569;
              font-weight: bold;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }

            th,
            td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: center;
              font-size: 13px;
            }

            th {
              background: #ffedd5;
              color: #7c2d12;
            }

            .summary {
              margin-top: 20px;
              padding: 14px;
              border: 1px solid #fed7aa;
              border-radius: 14px;
              background: #fff7ed;
              font-weight: bold;
            }
          </style>
        </head>

        <body>
          <h1>صورت حساب طرف حساب</h1>

          <div class="info">نام طرف حساب: ${selectedParty.name}</div>
          <div class="info">تاریخ چاپ: ${new Date().toLocaleString(
            "fa-IR"
          )}</div>

          <table>
            <thead>
              <tr>
                <th>ردیف</th>
                <th>تاریخ</th>
                <th>شرح</th>
                <th>توضیحات</th>
                <th>بدهکار</th>
                <th>بستانکار</th>
                <th>مانده</th>
              </tr>
            </thead>

            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="summary">
            جمع بدهکار: ${formatMoney(ledgerData.totalDebit)}
            <br />
            جمع بستانکار: ${formatMoney(ledgerData.totalCredit)}
            <br />
            مانده نهایی: ${getBalanceText(ledgerData.balance)}
          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <>
      <section className="card ledger-card">
        <div className="ledger-header">
          <div>
            <h2>دفتر حساب طرف حساب</h2>
            <p>گردش حساب، فاکتورها، دریافت‌ها و پرداخت‌ها</p>
          </div>

          {onBack && (
            <button
              type="button"
              className="ledger-back-btn"
              onClick={onBack}
            >
              بازگشت
            </button>
          )}
        </div>

        <div className="ledger-select-box">
          <label>انتخاب طرف حساب</label>

          <select
            value={selectedPartyId}
            onChange={(e) => {
              setSelectedPartyId(e.target.value);
              setSelectedInvoiceId("");
            }}
          >
            <option value="">انتخاب کنید</option>

            {availableParties.map((party) => (
              <option key={party.id} value={party.id}>
                {party.name}
              </option>
            ))}
          </select>
        </div>

        {selectedParty && (
          <>
            <div className="ledger-summary-grid">
              <div>
                <span>جمع بدهکار</span>
                <strong>{formatMoney(ledgerData.totalDebit)}</strong>
              </div>

              <div>
                <span>جمع بستانکار</span>
                <strong>{formatMoney(ledgerData.totalCredit)}</strong>
              </div>

              <div className="final">
                <span>مانده نهایی</span>
                <strong>{getBalanceText(ledgerData.balance)}</strong>
              </div>
            </div>

            <form className="ledger-payment-form" onSubmit={handleSubmit}>
              <h3>ثبت دریافت / پرداخت</h3>

              <div className="ledger-form-grid">
                <div>
                  <label>نوع عملیات</label>

                  <select
                    value={paymentType}
                    onChange={(e) => {
                      setPaymentType(e.target.value);

                      if (e.target.value === "pay") {
                        setSelectedInvoiceId("");
                      }
                    }}
                  >
                    <option value="receive">دریافت از مشتری</option>
                    <option value="pay">پرداخت به طرف حساب</option>
                  </select>
                </div>

                {paymentType === "receive" && (
                  <div>
                    <label>تسویه فاکتور</label>

                    <select
                      value={selectedInvoiceId}
                      onChange={(e) => setSelectedInvoiceId(e.target.value)}
                    >
                      <option value="">بدون اتصال به فاکتور</option>

                      {selectedPartyInvoices.map((invoice) => {
                        const remaining = Number(
                          invoice.remainingAmount ?? invoice.finalTotal ?? 0
                        );

                        return (
                          <option key={invoice.id} value={invoice.id}>
                            {invoice.invoiceNumber} - مانده:{" "}
                            {formatMoney(remaining)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div>
                  <label>روش پرداخت</label>

                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">نقدی</option>
                    <option value="card">کارت</option>
                    <option value="bank">حواله بانکی</option>
                    <option value="check">چک</option>
                  </select>
                </div>

                <div>
                  <label>مبلغ</label>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) =>
                      setAmount(formatNumberInput(e.target.value))
                    }
                    placeholder="مثلا ۱,۰۰۰,۰۰۰"
                  />
                </div>

                <div>
                  <label>شماره پیگیری / چک</label>

                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="اختیاری"
                  />
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

              <button type="submit">ثبت عملیات</button>
            </form>

            <div className="ledger-actions">
              <button type="button" onClick={printLedger}>
                چاپ صورت حساب
              </button>
            </div>

            {ledgerData.entries.length === 0 ? (
              <p className="empty-text">
                هنوز گردش حسابی برای این طرف حساب وجود ندارد
              </p>
            ) : (
              <div className="ledger-table-wrap">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>تاریخ</th>
                      <th>شرح</th>
                      <th>توضیحات</th>
                      <th>بدهکار</th>
                      <th>بستانکار</th>
                      <th>مانده</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {ledgerData.entries.map((entry) => (
                      <tr key={entry.id}>
                        <td>
                          {new Date(entry.date).toLocaleDateString("fa-IR")}
                        </td>

                        <td>{entry.title}</td>

                        <td>
                          {entry.type === "payment"
                            ? `${getPaymentMethodLabel(entry.paymentMethod)} ${
                                entry.referenceNumber
                                  ? `- ${entry.referenceNumber}`
                                  : ""
                              } ${
                                entry.invoiceNumber
                                  ? `- فاکتور ${entry.invoiceNumber}`
                                  : ""
                              }`
                            : entry.description}
                        </td>

                        <td>{entry.debit ? formatMoney(entry.debit) : "-"}</td>

                        <td>
                          {entry.credit ? formatMoney(entry.credit) : "-"}
                        </td>

                        <td>{getBalanceText(entry.runningBalance)}</td>

                        <td>
                          {entry.type === "payment" ? (
                            <button
                              type="button"
                              className="ledger-delete-btn"
                              onClick={() => onDeletePartyPayment(entry.realId)}
                            >
                              حذف
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}

export default CustomerLedgerPage;