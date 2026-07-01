import { useMemo, useState } from "react";
import { amountToPersianWords, formatMoney } from "../utils/money";

function ReportsPage({
  transactions,
  parties,
  products,
  salesInvoices,
  onBack,
}) {
  const [period, setPeriod] = useState("month");

  const periodLabels = {
    all: "کل دوره",
    today: "امروز",
    week: "هفته جاری",
    month: "ماه جاری",
    year: "سال جاری",
  };

  const now = new Date();

  const getStartOfWeek = (date) => {
    const copiedDate = new Date(date);
    const day = copiedDate.getDay();

    // شروع هفته: شنبه
    const diff = (day + 1) % 7;

    copiedDate.setDate(copiedDate.getDate() - diff);
    copiedDate.setHours(0, 0, 0, 0);

    return copiedDate;
  };

  const isInSelectedPeriod = (dateValue) => {
    if (period === "all") {
      return true;
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(startOfToday.getDate() + 1);

    const startOfWeek = getStartOfWeek(now);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);

    if (period === "today") {
      return date >= startOfToday && date < endOfToday;
    }

    if (period === "week") {
      return date >= startOfWeek && date < endOfWeek;
    }

    if (period === "month") {
      return date >= startOfMonth && date < endOfMonth;
    }

    if (period === "year") {
      return date >= startOfYear && date < endOfYear;
    }

    return true;
  };

  const filteredTransactions = transactions.filter((transaction) =>
    isInSelectedPeriod(transaction.date)
  );

  const filteredSalesInvoices = salesInvoices.filter((invoice) =>
    isInSelectedPeriod(invoice.createdAt)
  );

  const productMap = useMemo(() => {
    const map = new Map();

    products.forEach((product) => {
      map.set(String(product.id), product);
    });

    return map;
  }, [products]);

  const salesReport = useMemo(() => {
    const totalSales = filteredSalesInvoices.reduce((total, invoice) => {
      return total + Number(invoice.finalTotal || 0);
    }, 0);

    const totalDiscount = filteredSalesInvoices.reduce((total, invoice) => {
      return total + Number(invoice.totalDiscount || 0);
    }, 0);

    const totalBeforeDiscount = filteredSalesInvoices.reduce((total, invoice) => {
      return total + Number(invoice.subtotal || 0);
    }, 0);

    const invoiceCount = filteredSalesInvoices.length;
    const averageInvoice = invoiceCount > 0 ? totalSales / invoiceCount : 0;

    const biggestInvoice =
      invoiceCount > 0
        ? filteredSalesInvoices.reduce((max, invoice) =>
            Number(invoice.finalTotal || 0) > Number(max.finalTotal || 0)
              ? invoice
              : max
          )
        : null;

    const allRows = filteredSalesInvoices.flatMap(
      (invoice) => invoice.rows || []
    );

    const soldItemsCount = allRows.reduce((total, row) => {
      return total + Number(row.quantity || 0);
    }, 0);

    const costOfGoods = allRows.reduce((total, row) => {
      const product = productMap.get(String(row.productId));

      if (!product || product.type === "service") {
        return total;
      }

      return total + Number(product.buyPrice || 0) * Number(row.quantity || 0);
    }, 0);

    const grossProfit = totalSales - costOfGoods;

    return {
      totalSales,
      totalDiscount,
      totalBeforeDiscount,
      invoiceCount,
      averageInvoice,
      biggestInvoice,
      soldItemsCount,
      costOfGoods,
      grossProfit,
    };
  }, [filteredSalesInvoices, productMap]);

  const cashReport = useMemo(() => {
    const income = filteredTransactions.reduce((total, transaction) => {
      if (transaction.type === "income") {
        return total + Number(transaction.amount || 0);
      }

      return total;
    }, 0);

    const expense = filteredTransactions.reduce((total, transaction) => {
      if (transaction.type === "expense") {
        return total + Number(transaction.amount || 0);
      }

      return total;
    }, 0);

    const net = income - expense;

    const expenseTransactions = filteredTransactions.filter(
      (transaction) => transaction.type === "expense"
    );

    const biggestExpense =
      expenseTransactions.length > 0
        ? expenseTransactions.reduce((max, transaction) =>
            Number(transaction.amount || 0) > Number(max.amount || 0)
              ? transaction
              : max
          )
        : null;

    return {
      income,
      expense,
      net,
      count: filteredTransactions.length,
      biggestExpense,
    };
  }, [filteredTransactions]);

  const inventoryReport = useMemo(() => {
    const productItems = products.filter((product) => product.type === "product");
    const serviceItems = products.filter((product) => product.type === "service");

    const inventoryValue = productItems.reduce((total, product) => {
      return total + Number(product.stock || 0) * Number(product.buyPrice || 0);
    }, 0);

    const saleValue = productItems.reduce((total, product) => {
      return total + Number(product.stock || 0) * Number(product.salePrice || 0);
    }, 0);

    const lowStockProducts = productItems.filter((product) => {
      if (Number(product.minStock || 0) <= 0) {
        return false;
      }

      return Number(product.stock || 0) <= Number(product.minStock || 0);
    });

    return {
      productCount: productItems.length,
      serviceCount: serviceItems.length,
      inventoryValue,
      saleValue,
      lowStockProducts,
    };
  }, [products]);

  const partiesReport = useMemo(() => {
    const totalDebtor = parties.reduce((total, party) => {
      if (party.balanceStatus === "debtor") {
        return total + Number(party.openingBalance || 0);
      }

      return total;
    }, 0);

    const totalCreditor = parties.reduce((total, party) => {
      if (party.balanceStatus === "creditor") {
        return total + Number(party.openingBalance || 0);
      }

      return total;
    }, 0);

    const debtorParties = parties.filter(
      (party) => party.balanceStatus === "debtor"
    );

    const creditorParties = parties.filter(
      (party) => party.balanceStatus === "creditor"
    );

    return {
      totalParties: parties.length,
      totalDebtor,
      totalCreditor,
      netParties: totalDebtor - totalCreditor,
      debtorParties,
      creditorParties,
    };
  }, [parties]);

  const topSellingProducts = useMemo(() => {
    const map = new Map();

    filteredSalesInvoices.forEach((invoice) => {
      (invoice.rows || []).forEach((row) => {
        const key = String(row.productId);

        const rowTotal =
          Number(row.quantity || 0) * Number(row.salePrice || 0) -
          Number(row.discount || 0);

        const current = map.get(key) || {
          productId: row.productId,
          name: row.name,
          quantity: 0,
          amount: 0,
        };

        map.set(key, {
          ...current,
          quantity: current.quantity + Number(row.quantity || 0),
          amount: current.amount + rowTotal,
        });
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredSalesInvoices]);

  const topExpenses = useMemo(() => {
    const map = new Map();

    filteredTransactions
      .filter((transaction) => transaction.type === "expense")
      .forEach((transaction) => {
        const key = String(transaction.title || "بدون عنوان").trim();

        const current = map.get(key) || {
          title: key,
          amount: 0,
          count: 0,
        };

        map.set(key, {
          title: key,
          amount: current.amount + Number(transaction.amount || 0),
          count: current.count + 1,
        });
      });

    return Array.from(map.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredTransactions]);

  const getFinancialStatus = () => {
    if (cashReport.income === 0 && cashReport.expense === 0) {
      return {
        className: "neutral",
        text: "هنوز داده کافی برای تحلیل مالی این بازه وجود ندارد.",
      };
    }

    if (cashReport.net > 0) {
      return {
        className: "good",
        text: "وضعیت مالی مثبت است؛ درآمد از هزینه بیشتر بوده است.",
      };
    }

    if (cashReport.net < 0) {
      return {
        className: "bad",
        text: "هشدار مدیریتی: هزینه‌ها از درآمد بیشتر بوده‌اند.",
      };
    }

    return {
      className: "neutral",
      text: "درآمد و هزینه در این بازه برابر بوده‌اند.",
    };
  };

  const escapeHtml = (value) => {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  const buildExcelTable = (title, headers, rows) => {
    return `
      <h2>${escapeHtml(title)}</h2>

      <table>
        <thead>
          <tr>
            ${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}
          </tr>
        </thead>

        <tbody>
          ${rows
            .map(
              (row) => `
                <tr>
                  ${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    `;
  };

  const downloadExcelReport = () => {
    const summaryRows = [
      ["بازه گزارش", periodLabels[period]],
      ["فروش خالص", formatMoney(salesReport.totalSales)],
      ["درآمد", formatMoney(cashReport.income)],
      ["هزینه", formatMoney(cashReport.expense)],
      ["مانده خالص", formatMoney(cashReport.net)],
      ["تعداد فاکتور فروش", salesReport.invoiceCount],
      ["تعداد تراکنش", cashReport.count],
      ["ارزش خرید موجودی", formatMoney(inventoryReport.inventoryValue)],
      ["جمع بدهکاران", formatMoney(partiesReport.totalDebtor)],
      ["جمع بستانکاران", formatMoney(partiesReport.totalCreditor)],
    ];

    const salesRows = [
      ["تعداد فاکتور فروش", salesReport.invoiceCount],
      ["جمع قبل از تخفیف", formatMoney(salesReport.totalBeforeDiscount)],
      ["جمع تخفیف", formatMoney(salesReport.totalDiscount)],
      ["فروش خالص", formatMoney(salesReport.totalSales)],
      ["میانگین هر فاکتور", formatMoney(salesReport.averageInvoice)],
      ["تعداد اقلام فروخته شده", salesReport.soldItemsCount],
      [
        "بزرگترین فاکتور",
        salesReport.biggestInvoice
          ? `${salesReport.biggestInvoice.invoiceNumber} - ${formatMoney(
              salesReport.biggestInvoice.finalTotal
            )}`
          : "ثبت نشده",
      ],
    ];

    const profitRows = [
      ["فروش خالص", formatMoney(salesReport.totalSales)],
      ["بهای تقریبی کالای فروخته شده", formatMoney(salesReport.costOfGoods)],
      ["سود ناخالص تقریبی", formatMoney(salesReport.grossProfit)],
    ];

    const inventoryRows = [
      ["تعداد کالا", inventoryReport.productCount],
      ["تعداد خدمات", inventoryReport.serviceCount],
      ["ارزش خرید موجودی", formatMoney(inventoryReport.inventoryValue)],
      ["ارزش فروش موجودی", formatMoney(inventoryReport.saleValue)],
      ["اقلام دارای کمبود موجودی", inventoryReport.lowStockProducts.length],
    ];

    const lowStockRows = inventoryReport.lowStockProducts.map((product) => [
      product.name,
      product.code,
      product.stock,
      product.unit,
      product.minStock,
    ]);

    const partiesRows = [
      ["تعداد طرف حساب", partiesReport.totalParties],
      ["جمع بدهکاران", formatMoney(partiesReport.totalDebtor)],
      ["جمع بستانکاران", formatMoney(partiesReport.totalCreditor)],
      ["مانده خالص طرف حساب‌ها", formatMoney(partiesReport.netParties)],
    ];

    const debtorRows = partiesReport.debtorParties.map((party) => [
      party.name,
      party.phone || "ثبت نشده",
      formatMoney(party.openingBalance),
    ]);

    const creditorRows = partiesReport.creditorParties.map((party) => [
      party.name,
      party.phone || "ثبت نشده",
      formatMoney(party.openingBalance),
    ]);

    const topSellingRows = topSellingProducts.map((item, index) => [
      index + 1,
      item.name,
      item.quantity,
      formatMoney(item.amount),
    ]);

    const topExpenseRows = topExpenses.map((item, index) => [
      index + 1,
      item.title,
      item.count,
      formatMoney(item.amount),
    ]);

    const invoicesRows = filteredSalesInvoices.map((invoice) => [
      invoice.invoiceNumber,
      invoice.customerName,
      new Date(invoice.createdAt).toLocaleString("fa-IR"),
      invoice.rows.length,
      formatMoney(invoice.subtotal),
      formatMoney(invoice.totalDiscount),
      formatMoney(invoice.finalTotal),
    ]);

    const transactionsRows = filteredTransactions.map((transaction) => [
      transaction.title,
      transaction.type === "income" ? "درآمد" : "هزینه",
      formatMoney(transaction.amount),
      new Date(transaction.date).toLocaleString("fa-IR"),
    ]);

    const productsRows = products.map((product) => [
      product.code,
      product.name,
      product.type === "product" ? "کالا" : "خدمت",
      product.category || "ثبت نشده",
      product.unit,
      formatMoney(product.buyPrice),
      formatMoney(product.salePrice),
      product.stock,
      product.minStock,
    ]);

    const partiesListRows = parties.map((party) => [
      party.name,
      party.type === "customer"
        ? "مشتری"
        : party.type === "supplier"
        ? "تامین‌کننده"
        : "شخص",
      party.phone || "ثبت نشده",
      party.address || "ثبت نشده",
      party.balanceStatus === "debtor"
        ? "بدهکار"
        : party.balanceStatus === "creditor"
        ? "بستانکار"
        : "بدون مانده",
      formatMoney(party.openingBalance),
    ]);

    const excelContent = `
      <!doctype html>
      <html lang="fa" dir="rtl">
        <head>
          <meta charset="UTF-8" />

          <style>
            body {
              direction: rtl;
              font-family: Tahoma, Arial, sans-serif;
              color: #111827;
            }

            h1 {
              color: #c2410c;
              margin-bottom: 8px;
            }

            h2 {
              color: #7c2d12;
              margin-top: 28px;
              margin-bottom: 10px;
            }

            p {
              color: #475569;
              font-weight: bold;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 18px;
            }

            th {
              background: #ffedd5;
              color: #7c2d12;
              font-weight: bold;
            }

            th,
            td {
              border: 1px solid #d6d3d1;
              padding: 8px;
              text-align: center;
              mso-number-format: "\\@";
            }
          </style>
        </head>

        <body>
          <h1>خروجی اکسل گزارش‌های مدیریتی</h1>
          <p>بازه گزارش: ${escapeHtml(periodLabels[period])}</p>
          <p>تاریخ خروجی: ${escapeHtml(new Date().toLocaleString("fa-IR"))}</p>

          ${buildExcelTable("خلاصه مدیریتی", ["عنوان", "مقدار"], summaryRows)}

          ${buildExcelTable("گزارش فروش", ["عنوان", "مقدار"], salesRows)}

          ${buildExcelTable("گزارش سود تقریبی", ["عنوان", "مقدار"], profitRows)}

          ${buildExcelTable("گزارش موجودی کالا", ["عنوان", "مقدار"], inventoryRows)}

          ${buildExcelTable(
            "اقلام دارای کمبود موجودی",
            ["نام کالا", "کد", "موجودی", "واحد", "حداقل موجودی"],
            lowStockRows.length > 0
              ? lowStockRows
              : [["موردی وجود ندارد", "", "", "", ""]]
          )}

          ${buildExcelTable(
            "گزارش طرف حساب‌ها",
            ["عنوان", "مقدار"],
            partiesRows
          )}

          ${buildExcelTable(
            "لیست بدهکاران",
            ["نام", "شماره تماس", "مبلغ"],
            debtorRows.length > 0 ? debtorRows : [["موردی وجود ندارد", "", ""]]
          )}

          ${buildExcelTable(
            "لیست بستانکاران",
            ["نام", "شماره تماس", "مبلغ"],
            creditorRows.length > 0
              ? creditorRows
              : [["موردی وجود ندارد", "", ""]]
          )}

          ${buildExcelTable(
            "کالاهای پرفروش",
            ["رتبه", "نام کالا", "تعداد", "مبلغ فروش"],
            topSellingRows.length > 0
              ? topSellingRows
              : [["موردی وجود ندارد", "", "", ""]]
          )}

          ${buildExcelTable(
            "هزینه‌های مهم",
            ["رتبه", "عنوان هزینه", "تعداد", "مبلغ"],
            topExpenseRows.length > 0
              ? topExpenseRows
              : [["موردی وجود ندارد", "", "", ""]]
          )}

          ${buildExcelTable(
            "فاکتورهای فروش",
            [
              "شماره فاکتور",
              "مشتری",
              "تاریخ",
              "تعداد اقلام",
              "جمع قبل از تخفیف",
              "تخفیف",
              "مبلغ نهایی",
            ],
            invoicesRows.length > 0
              ? invoicesRows
              : [["موردی وجود ندارد", "", "", "", "", "", ""]]
          )}

          ${buildExcelTable(
            "تراکنش‌های دریافت و پرداخت",
            ["عنوان", "نوع", "مبلغ", "تاریخ"],
            transactionsRows.length > 0
              ? transactionsRows
              : [["موردی وجود ندارد", "", "", ""]]
          )}

          ${buildExcelTable(
            "لیست کالا و خدمات",
            [
              "کد",
              "نام",
              "نوع",
              "دسته‌بندی",
              "واحد",
              "قیمت خرید",
              "قیمت فروش",
              "موجودی",
              "حداقل موجودی",
            ],
            productsRows.length > 0
              ? productsRows
              : [["موردی وجود ندارد", "", "", "", "", "", "", "", ""]]
          )}

          ${buildExcelTable(
            "لیست طرف حساب‌ها",
            ["نام", "نوع", "شماره تماس", "آدرس", "وضعیت مانده", "مبلغ مانده"],
            partiesListRows.length > 0
              ? partiesListRows
              : [["موردی وجود ندارد", "", "", "", "", ""]]
          )}
        </body>
      </html>
    `;

    const blob = new Blob([excelContent], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `management-reports-${period}-${new Date()
      .toISOString()
      .slice(0, 10)}.xls`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const status = getFinancialStatus();

  return (
    <section className="reports-page">
        <div className="reports-back-row">
         <button type="button" className="reports-back-button" onClick={onBack}>
         ← بازگشت به صفحه اصلی
       </button>
        </div>
      <section className="card reports-filter-card">
        <div className="reports-topbar">
          <div>
            <h2>گزارش‌های مدیریتی</h2>
            <p>
              گزارش خلاصه فروش، دریافت و پرداخت، موجودی کالا و طرف حساب‌ها برای{" "}
              {periodLabels[period]}
            </p>
          </div>

          <div className="reports-actions">
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="today">امروز</option>
              <option value="week">هفته جاری</option>
              <option value="month">ماه جاری</option>
              <option value="year">سال جاری</option>
              <option value="all">کل دوره</option>
            </select>

            <button
              className="excel-report-btn"
              type="button"
              onClick={downloadExcelReport}
            >
              خروجی Excel
            </button>

            <button
              className="print-report-btn"
              type="button"
              onClick={() => window.print()}
            >
              چاپ گزارش
            </button>
          </div>
        </div>

        <div className={`reports-status ${status.className}`}>
          {status.text}
        </div>
      </section>

      <section className="reports-kpi-grid">
        <div className="report-kpi-card">
          <span>فروش خالص</span>
          <strong>{formatMoney(salesReport.totalSales)}</strong>
          <small>{salesReport.invoiceCount.toLocaleString("fa-IR")} فاکتور</small>
        </div>

        <div className="report-kpi-card income">
          <span>دریافتی / درآمد</span>
          <strong>{formatMoney(cashReport.income)}</strong>
          <small>{cashReport.count.toLocaleString("fa-IR")} تراکنش</small>
        </div>

        <div className="report-kpi-card expense">
          <span>پرداختی / هزینه</span>
          <strong>{formatMoney(cashReport.expense)}</strong>
          <small>
            {cashReport.biggestExpense
              ? `بیشترین: ${cashReport.biggestExpense.title}`
              : "بدون هزینه"}
          </small>
        </div>

        <div className="report-kpi-card profit">
          <span>مانده خالص</span>
          <strong>{formatMoney(cashReport.net)}</strong>
          <small>{amountToPersianWords(cashReport.net)}</small>
        </div>
      </section>

      <section className="reports-grid-two">
        <div className="card report-box-card">
          <h2>گزارش فروش</h2>

          <div className="report-line">
            <span>تعداد فاکتور فروش</span>
            <strong>{salesReport.invoiceCount.toLocaleString("fa-IR")}</strong>
          </div>

          <div className="report-line">
            <span>جمع قبل از تخفیف</span>
            <strong>{formatMoney(salesReport.totalBeforeDiscount)}</strong>
          </div>

          <div className="report-line">
            <span>جمع تخفیف</span>
            <strong>{formatMoney(salesReport.totalDiscount)}</strong>
          </div>

          <div className="report-line">
            <span>فروش خالص</span>
            <strong className="income-text">
              {formatMoney(salesReport.totalSales)}
            </strong>
          </div>

          <div className="report-line">
            <span>میانگین هر فاکتور</span>
            <strong>{formatMoney(salesReport.averageInvoice)}</strong>
          </div>

          <div className="report-line">
            <span>تعداد اقلام فروخته شده</span>
            <strong>{salesReport.soldItemsCount.toLocaleString("fa-IR")}</strong>
          </div>

          <div className="report-line">
            <span>بزرگترین فاکتور</span>
            <strong>
              {salesReport.biggestInvoice
                ? `${salesReport.biggestInvoice.invoiceNumber} - ${formatMoney(
                    salesReport.biggestInvoice.finalTotal
                  )}`
                : "ثبت نشده"}
            </strong>
          </div>
        </div>

        <div className="card report-box-card">
          <h2>گزارش سود تقریبی</h2>

          <div className="report-line">
            <span>فروش خالص</span>
            <strong className="income-text">
              {formatMoney(salesReport.totalSales)}
            </strong>
          </div>

          <div className="report-line">
            <span>بهای تقریبی کالای فروخته شده</span>
            <strong>{formatMoney(salesReport.costOfGoods)}</strong>
          </div>

          <div className="report-line">
            <span>سود ناخالص تقریبی</span>
            <strong
              className={
                salesReport.grossProfit >= 0 ? "income-text" : "expense-text"
              }
            >
              {formatMoney(salesReport.grossProfit)}
            </strong>
          </div>

          <p className="report-note">
            سود تقریبی بر اساس قیمت خرید فعلی کالاها محاسبه شده است.
          </p>
        </div>
      </section>

      <section className="reports-grid-two">
        <div className="card report-box-card">
          <h2>گزارش موجودی کالا</h2>

          <div className="report-line">
            <span>تعداد کالا</span>
            <strong>{inventoryReport.productCount.toLocaleString("fa-IR")}</strong>
          </div>

          <div className="report-line">
            <span>تعداد خدمات</span>
            <strong>{inventoryReport.serviceCount.toLocaleString("fa-IR")}</strong>
          </div>

          <div className="report-line">
            <span>ارزش خرید موجودی</span>
            <strong>{formatMoney(inventoryReport.inventoryValue)}</strong>
          </div>

          <div className="report-line">
            <span>ارزش فروش موجودی</span>
            <strong className="income-text">
              {formatMoney(inventoryReport.saleValue)}
            </strong>
          </div>

          <div className="report-line">
            <span>کمبود موجودی</span>
            <strong className="expense-text">
              {inventoryReport.lowStockProducts.length.toLocaleString("fa-IR")}
            </strong>
          </div>
        </div>

        <div className="card report-box-card">
          <h2>گزارش طرف حساب‌ها</h2>

          <div className="report-line">
            <span>تعداد طرف حساب</span>
            <strong>{partiesReport.totalParties.toLocaleString("fa-IR")}</strong>
          </div>

          <div className="report-line">
            <span>جمع بدهکاران</span>
            <strong className="expense-text">
              {formatMoney(partiesReport.totalDebtor)}
            </strong>
          </div>

          <div className="report-line">
            <span>جمع بستانکاران</span>
            <strong className="income-text">
              {formatMoney(partiesReport.totalCreditor)}
            </strong>
          </div>

          <div className="report-line">
            <span>مانده خالص</span>
            <strong>{formatMoney(partiesReport.netParties)}</strong>
          </div>
        </div>
      </section>

      <section className="reports-grid-two">
        <div className="card report-box-card">
          <h2>کالاهای پرفروش</h2>

          {topSellingProducts.length === 0 ? (
            <p className="empty-text">در این بازه کالایی فروخته نشده است</p>
          ) : (
            <div className="report-ranking-list">
              {topSellingProducts.map((item, index) => (
                <div className="report-rank-item" key={item.productId}>
                  <span>{(index + 1).toLocaleString("fa-IR")}</span>

                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      تعداد: {item.quantity.toLocaleString("fa-IR")} | مبلغ:{" "}
                      {formatMoney(item.amount)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card report-box-card">
          <h2>هزینه‌های مهم</h2>

          {topExpenses.length === 0 ? (
            <p className="empty-text">در این بازه هزینه‌ای ثبت نشده است</p>
          ) : (
            <div className="report-ranking-list">
              {topExpenses.map((item, index) => (
                <div className="report-rank-item" key={item.title}>
                  <span>{(index + 1).toLocaleString("fa-IR")}</span>

                  <div>
                    <strong>{item.title}</strong>
                    <small>
                      تعداد: {item.count.toLocaleString("fa-IR")} | مبلغ:{" "}
                      {formatMoney(item.amount)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="card report-box-card">
        <h2>فاکتورهای فروش</h2>

        {filteredSalesInvoices.length === 0 ? (
          <p className="empty-text">در این بازه فاکتور فروشی ثبت نشده است</p>
        ) : (
          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>شماره فاکتور</th>
                  <th>مشتری</th>
                  <th>تاریخ</th>
                  <th>تعداد اقلام</th>
                  <th>مبلغ نهایی</th>
                </tr>
              </thead>

              <tbody>
                {filteredSalesInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{invoice.customerName}</td>
                    <td>{new Date(invoice.createdAt).toLocaleString("fa-IR")}</td>
                    <td>{invoice.rows.length.toLocaleString("fa-IR")}</td>
                    <td>{formatMoney(invoice.finalTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

export default ReportsPage;