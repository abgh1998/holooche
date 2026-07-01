import { useMemo, useState } from "react";
import { formatMoney } from "../utils/money";

const getNumber = (value) => {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return 0;
  }

  return number;
};

const getDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
};

const getStartOfWeek = (date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 6 ? 0 : day + 1;

  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);

  return result;
};

const filterByPeriod = (items, period, dateField = "date") => {
  if (period === "all") {
    return items;
  }

  const now = new Date();

  return items.filter((item) => {
    const itemDate = getDate(item[dateField]);

    if (period === "today") {
      return itemDate.toDateString() === now.toDateString();
    }

    if (period === "week") {
      const startOfWeek = getStartOfWeek(now);
      return itemDate >= startOfWeek && itemDate <= now;
    }

    if (period === "month") {
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth()
      );
    }

    if (period === "year") {
      return itemDate.getFullYear() === now.getFullYear();
    }

    return true;
  });
};

const getPeriodLabel = (period) => {
  if (period === "today") return "امروز";
  if (period === "week") return "این هفته";
  if (period === "month") return "این ماه";
  if (period === "year") return "امسال";
  return "کل دوره";
};

function ReportsPage({
  transactions,
  parties,
  products,
  salesInvoices,
  onBack,
}) {
  const [period, setPeriod] = useState("all");

  const filteredTransactions = useMemo(() => {
    return filterByPeriod(transactions, period, "date");
  }, [transactions, period]);

  const filteredInvoices = useMemo(() => {
    return filterByPeriod(salesInvoices, period, "createdAt");
  }, [salesInvoices, period]);

  const incomeTotal = useMemo(() => {
    return filteredTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + getNumber(transaction.amount), 0);
  }, [filteredTransactions]);

  const expenseTotal = useMemo(() => {
    return filteredTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + getNumber(transaction.amount), 0);
  }, [filteredTransactions]);

  const balance = incomeTotal - expenseTotal;

  const salesTotal = useMemo(() => {
    return filteredInvoices.reduce(
      (sum, invoice) => sum + getNumber(invoice.finalTotal),
      0
    );
  }, [filteredInvoices]);

  const invoiceItemsCount = useMemo(() => {
    return filteredInvoices.reduce((sum, invoice) => {
      const rows = Array.isArray(invoice.rows) ? invoice.rows : [];

      return (
        sum +
        rows.reduce((rowSum, row) => rowSum + getNumber(row.quantity), 0)
      );
    }, 0);
  }, [filteredInvoices]);

  const inventoryValue = useMemo(() => {
    return products.reduce((sum, product) => {
      if (product.type === "service") {
        return sum;
      }

      return (
        sum +
        getNumber(product.stock) *
          getNumber(product.buyPrice || product.purchasePrice)
      );
    }, 0);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter((product) => {
      if (product.type === "service") {
        return false;
      }

      return getNumber(product.stock) <= getNumber(product.minStock);
    });
  }, [products]);

  const debtors = useMemo(() => {
    return parties.filter((party) => party.balanceType === "debtor");
  }, [parties]);

  const creditors = useMemo(() => {
    return parties.filter((party) => party.balanceType === "creditor");
  }, [parties]);

  const topSellingProducts = useMemo(() => {
    const productMap = {};

    filteredInvoices.forEach((invoice) => {
      const rows = Array.isArray(invoice.rows) ? invoice.rows : [];

      rows.forEach((row) => {
        const productId = String(row.productId);
        const quantity = getNumber(row.quantity);
        const rowTotal = getNumber(row.total);

        if (!productMap[productId]) {
          productMap[productId] = {
            productId,
            name: row.productName || "بدون نام",
            quantity: 0,
            total: 0,
          };
        }

        productMap[productId].quantity += quantity;
        productMap[productId].total += rowTotal;
      });
    });

    return Object.values(productMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredInvoices]);

  const topExpenses = useMemo(() => {
    return filteredTransactions
      .filter((transaction) => transaction.type === "expense")
      .sort((a, b) => getNumber(b.amount) - getNumber(a.amount))
      .slice(0, 5);
  }, [filteredTransactions]);

  const downloadExcelReport = () => {
    const tableStyle =
      "border:1px solid #999;padding:8px;text-align:right;direction:rtl;";
    const headerStyle =
      "border:1px solid #999;padding:8px;text-align:right;background:#f3f4f6;font-weight:bold;direction:rtl;";

    const createTable = (title, headers, rows) => {
      const headerCells = headers
        .map((header) => `<th style="${headerStyle}">${header}</th>`)
        .join("");

      const bodyRows = rows
        .map((row) => {
          const cells = row
            .map((cell) => `<td style="${tableStyle}">${cell}</td>`)
            .join("");

          return `<tr>${cells}</tr>`;
        })
        .join("");

      return `
        <h2>${title}</h2>
        <table style="border-collapse:collapse;width:100%;direction:rtl;font-family:Tahoma;">
          <thead>
            <tr>${headerCells}</tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
        </table>
        <br />
      `;
    };

    const summaryRows = [
      ["دوره گزارش", getPeriodLabel(period)],
      ["درآمد", formatMoney(incomeTotal)],
      ["هزینه", formatMoney(expenseTotal)],
      ["مانده", formatMoney(balance)],
      ["فروش", formatMoney(salesTotal)],
      ["تعداد فاکتور", filteredInvoices.length],
      ["تعداد کالا / خدمت", products.length],
      ["تعداد طرف حساب", parties.length],
    ];

    const invoiceRows = filteredInvoices.map((invoice) => [
      invoice.invoiceNumber || "-",
      invoice.customerName || "-",
      formatMoney(invoice.finalTotal || 0),
      new Date(invoice.createdAt).toLocaleDateString("fa-IR"),
    ]);

    const transactionRows = filteredTransactions.map((transaction) => [
      transaction.title || "-",
      transaction.type === "income" ? "درآمد" : "هزینه",
      formatMoney(transaction.amount || 0),
      new Date(transaction.date).toLocaleDateString("fa-IR"),
    ]);

    const productRows = products.map((product) => [
      product.code || "-",
      product.name || "-",
      product.type === "service" ? "خدمت" : "کالا",
      product.stock ?? "-",
      formatMoney(product.salePrice || 0),
    ]);

    const partyRows = parties.map((party) => [
      party.name || "-",
      party.type || "-",
      party.phone || "-",
      party.balanceType || "-",
      formatMoney(party.openingBalance || 0),
    ]);

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
        </head>
        <body style="direction:rtl;font-family:Tahoma;">
          <h1>گزارش مالی Holooche</h1>
          ${createTable("خلاصه گزارش", ["عنوان", "مقدار"], summaryRows)}
          ${createTable("فاکتورهای فروش", ["شماره فاکتور", "مشتری", "مبلغ", "تاریخ"], invoiceRows)}
          ${createTable("تراکنش‌ها", ["عنوان", "نوع", "مبلغ", "تاریخ"], transactionRows)}
          ${createTable("کالاها و خدمات", ["کد", "نام", "نوع", "موجودی", "قیمت فروش"], productRows)}
          ${createTable("طرف حساب‌ها", ["نام", "نوع", "موبایل", "وضعیت", "مانده اول دوره"], partyRows)}
        </body>
      </html>
    `;

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "holooche-report.xls";
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleBackClick = () => {
    if (typeof onBack === "function") {
      onBack();
    }
  };

  return (
    <section className="reports-page">
      <div className="reports-back-row">
        <button
          type="button"
          className="reports-back-button"
          onClick={handleBackClick}
        >
          ← بازگشت به صفحه اصلی
        </button>
      </div>

      <div className="reports-header">
        <div>
          <p className="section-label">گزارش‌ها</p>
          <h2>گزارش مدیریتی و مالی</h2>
          <p>
            این بخش خلاصه‌ای از فروش، صندوق، موجودی کالا، طرف حساب‌ها و
            تراکنش‌ها را نمایش می‌دهد.
          </p>
        </div>

        <div className="reports-actions">
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          >
            <option value="all">کل دوره</option>
            <option value="today">امروز</option>
            <option value="week">این هفته</option>
            <option value="month">این ماه</option>
            <option value="year">امسال</option>
          </select>

          <button type="button" onClick={downloadExcelReport}>
            خروجی Excel
          </button>

          <button type="button" onClick={() => window.print()}>
            چاپ گزارش
          </button>
        </div>
      </div>

      <div className="report-kpi-grid">
        <article className="report-kpi-card">
          <span>درآمد</span>
          <strong>{formatMoney(incomeTotal)}</strong>
        </article>

        <article className="report-kpi-card">
          <span>هزینه</span>
          <strong>{formatMoney(expenseTotal)}</strong>
        </article>

        <article className="report-kpi-card">
          <span>مانده</span>
          <strong>{formatMoney(balance)}</strong>
        </article>

        <article className="report-kpi-card">
          <span>فروش</span>
          <strong>{formatMoney(salesTotal)}</strong>
        </article>
      </div>

      <div className="reports-grid">
        <article className="report-box">
          <h3>گزارش فروش</h3>

          <div className="report-row">
            <span>تعداد فاکتور</span>
            <strong>{filteredInvoices.length}</strong>
          </div>

          <div className="report-row">
            <span>تعداد اقلام فروخته شده</span>
            <strong>{invoiceItemsCount}</strong>
          </div>

          <div className="report-row">
            <span>مبلغ کل فروش</span>
            <strong>{formatMoney(salesTotal)}</strong>
          </div>
        </article>

        <article className="report-box">
          <h3>گزارش صندوق</h3>

          <div className="report-row">
            <span>ورودی صندوق</span>
            <strong>{formatMoney(incomeTotal)}</strong>
          </div>

          <div className="report-row">
            <span>خروجی صندوق</span>
            <strong>{formatMoney(expenseTotal)}</strong>
          </div>

          <div className="report-row">
            <span>مانده صندوق</span>
            <strong>{formatMoney(balance)}</strong>
          </div>
        </article>

        <article className="report-box">
          <h3>گزارش موجودی</h3>

          <div className="report-row">
            <span>تعداد کالا / خدمت</span>
            <strong>{products.length}</strong>
          </div>

          <div className="report-row">
            <span>کالاهای کم موجودی</span>
            <strong>{lowStockProducts.length}</strong>
          </div>

          <div className="report-row">
            <span>ارزش تقریبی موجودی</span>
            <strong>{formatMoney(inventoryValue)}</strong>
          </div>
        </article>

        <article className="report-box">
          <h3>طرف حساب‌ها</h3>

          <div className="report-row">
            <span>تعداد طرف حساب</span>
            <strong>{parties.length}</strong>
          </div>

          <div className="report-row">
            <span>بدهکاران</span>
            <strong>{debtors.length}</strong>
          </div>

          <div className="report-row">
            <span>بستانکاران</span>
            <strong>{creditors.length}</strong>
          </div>
        </article>
      </div>

      <div className="reports-grid">
        <article className="report-box">
          <h3>پرفروش‌ترین کالاها / خدمات</h3>

          {topSellingProducts.length === 0 ? (
            <p className="empty-text">هنوز فروشی ثبت نشده است.</p>
          ) : (
            topSellingProducts.map((item) => (
              <div className="report-row" key={item.productId}>
                <span>{item.name}</span>
                <strong>{formatMoney(item.total)}</strong>
              </div>
            ))
          )}
        </article>

        <article className="report-box">
          <h3>بیشترین هزینه‌ها</h3>

          {topExpenses.length === 0 ? (
            <p className="empty-text">هنوز هزینه‌ای ثبت نشده است.</p>
          ) : (
            topExpenses.map((transaction) => (
              <div className="report-row" key={transaction.id}>
                <span>{transaction.title}</span>
                <strong>{formatMoney(transaction.amount)}</strong>
              </div>
            ))
          )}
        </article>
      </div>

      <div className="report-table-card">
        <h3>فاکتورهای فروش</h3>

        {filteredInvoices.length === 0 ? (
          <p className="empty-text">فاکتوری برای این دوره ثبت نشده است.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>شماره فاکتور</th>
                  <th>مشتری</th>
                  <th>مبلغ نهایی</th>
                  <th>تاریخ</th>
                </tr>
              </thead>

              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{invoice.customerName || "-"}</td>
                    <td>{formatMoney(invoice.finalTotal || 0)}</td>
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

export default ReportsPage;