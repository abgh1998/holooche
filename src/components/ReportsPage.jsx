import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { formatMoney } from "../utils/money";

function ReportsPage({
  transactions = [],
  salesInvoices = [],
  products = [],
  parties = [],
  purchaseInvoices = [],
}) {
  const [period, setPeriod] = useState("all");

  const toNumber = (value) => Number(value || 0);

  const getDateValue = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  };

  const isInSelectedPeriod = (dateValue) => {
    if (period === "all") return true;

    const date = getDateValue(dateValue);
    if (!date) return false;

    const now = new Date();

    if (period === "today") {
      return date.toDateString() === now.toDateString();
    }

    if (period === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      return date >= startOfWeek && date <= now;
    }

    if (period === "month") {
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    }

    if (period === "year") {
      return date.getFullYear() === now.getFullYear();
    }

    return true;
  };

  const formatDate = (dateValue) => {
    const date = getDateValue(dateValue);
    if (!date) return "-";
    return date.toLocaleDateString("fa-IR");
  };

  const formatDateTime = (dateValue) => {
    const date = getDateValue(dateValue);
    if (!date) return "-";
    return date.toLocaleString("fa-IR");
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) =>
      isInSelectedPeriod(item.date || item.transactionDate || item.createdAt)
    );
  }, [transactions, period]);

  const filteredSalesInvoices = useMemo(() => {
    return salesInvoices.filter((item) => isInSelectedPeriod(item.createdAt));
  }, [salesInvoices, period]);

  const filteredPurchaseInvoices = useMemo(() => {
    return purchaseInvoices.filter((item) => isInSelectedPeriod(item.createdAt));
  }, [purchaseInvoices, period]);

  const incomeTotal = filteredTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + toNumber(item.amount), 0);

  const expenseTotal = filteredTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + toNumber(item.amount), 0);

  const cashBalance = incomeTotal - expenseTotal;

  const salesTotal = filteredSalesInvoices.reduce(
    (sum, invoice) => sum + toNumber(invoice.finalTotal),
    0
  );

  const salesRowsCount = filteredSalesInvoices.reduce(
    (sum, invoice) =>
      sum +
      (invoice.rows || []).reduce(
        (rowSum, row) => rowSum + toNumber(row.quantity),
        0
      ),
    0
  );

  const inventoryValue = products
    .filter((product) => product.type === "product")
    .reduce(
      (sum, product) =>
        sum + toNumber(product.stock) * toNumber(product.buyPrice),
      0
    );

  const lowStockProducts = products.filter(
    (product) =>
      product.type === "product" &&
      toNumber(product.stock) <= toNumber(product.minStock)
  );

  const topSellingProducts = useMemo(() => {
    const map = new Map();

    filteredSalesInvoices.forEach((invoice) => {
      (invoice.rows || []).forEach((row) => {
        const key = row.productId || row.name || "بدون نام";

        const previous = map.get(key) || {
          name: row.name || "بدون نام",
          quantity: 0,
          amount: 0,
        };

        previous.quantity += toNumber(row.quantity);
        previous.amount += toNumber(row.rowTotal);

        map.set(key, previous);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [filteredSalesInvoices]);

  const topExpenses = useMemo(() => {
    return filteredTransactions
      .filter((item) => item.type === "expense")
      .map((item) => ({
        title: item.title || "-",
        amount: toNumber(item.amount),
        date: item.date || item.transactionDate || item.createdAt,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [filteredTransactions]);

  const debtorParties = parties.filter(
    (party) => party.balanceStatus === "debtor"
  );

  const creditorParties = parties.filter(
    (party) => party.balanceStatus === "creditor"
  );

  const addSheet = (workbook, sheetName, rows) => {
    const safeRows =
      rows.length > 0
        ? rows
        : [
            {
              توضیح: "داده‌ای برای نمایش وجود ندارد",
            },
          ];

    const worksheet = XLSX.utils.json_to_sheet(safeRows);

    const headers = Object.keys(safeRows[0] || {});
    worksheet["!cols"] = headers.map((header) => ({
      wch: Math.max(String(header).length + 6, 18),
    }));

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  };

  const exportExcel = () => {
    const workbook = XLSX.utils.book_new();

    const reportTitle =
      period === "all"
        ? "کل دوره"
        : period === "today"
        ? "امروز"
        : period === "week"
        ? "این هفته"
        : period === "month"
        ? "این ماه"
        : "امسال";

    addSheet(workbook, "خلاصه مدیریتی", [
      {
        دوره: reportTitle,
        درآمد_عدد: incomeTotal,
        درآمد_نمایشی: formatMoney(incomeTotal),
        هزینه_عدد: expenseTotal,
        هزینه_نمایشی: formatMoney(expenseTotal),
        مانده_عدد: cashBalance,
        مانده_نمایشی: formatMoney(cashBalance),
        فروش_عدد: salesTotal,
        فروش_نمایشی: formatMoney(salesTotal),
        تعداد_فاکتور_فروش: filteredSalesInvoices.length,
        تعداد_اقلام_فروخته_شده: salesRowsCount,
        تعداد_کالا_و_خدمت: products.length,
        تعداد_طرف_حساب: parties.length,
        تاریخ_خروجی: new Date().toLocaleString("fa-IR"),
      },
    ]);

    addSheet(
      workbook,
      "گزارش فروش",
      filteredSalesInvoices.map((invoice) => ({
        شماره_فاکتور: invoice.invoiceNumber || "-",
        مشتری: invoice.customerName || "-",
        جمع_قبل_از_تخفیف_عدد: toNumber(invoice.subtotal),
        جمع_قبل_از_تخفیف_نمایشی: formatMoney(invoice.subtotal),
        تخفیف_عدد: toNumber(invoice.totalDiscount),
        تخفیف_نمایشی: formatMoney(invoice.totalDiscount),
        مبلغ_نهایی_عدد: toNumber(invoice.finalTotal),
        مبلغ_نهایی_نمایشی: formatMoney(invoice.finalTotal),
        وضعیت_پرداخت: invoice.paymentStatus || "-",
        پرداخت_شده_عدد: toNumber(invoice.paidAmount),
        پرداخت_شده_نمایشی: formatMoney(invoice.paidAmount),
        مانده_عدد: toNumber(invoice.remainingAmount),
        مانده_نمایشی: formatMoney(invoice.remainingAmount),
        تعداد_اقلام: invoice.rows?.length || 0,
        تاریخ: formatDateTime(invoice.createdAt),
        توضیحات: invoice.note || "",
      }))
    );

    addSheet(
      workbook,
      "اقلام فاکتور فروش",
      filteredSalesInvoices.flatMap((invoice) =>
        (invoice.rows || []).map((row) => ({
          شماره_فاکتور: invoice.invoiceNumber || "-",
          مشتری: invoice.customerName || "-",
          کد_کالا: row.code || "",
          نام_کالا_یا_خدمت: row.name || "-",
          نوع: row.type === "service" ? "خدمت" : "کالا",
          واحد: row.unit || "",
          تعداد_عدد: toNumber(row.quantity),
          قیمت_واحد_عدد: toNumber(row.salePrice),
          قیمت_واحد_نمایشی: formatMoney(row.salePrice),
          تخفیف_عدد: toNumber(row.discount),
          تخفیف_نمایشی: formatMoney(row.discount),
          جمع_ردیف_عدد: toNumber(row.rowTotal),
          جمع_ردیف_نمایشی: formatMoney(row.rowTotal),
          تاریخ_فاکتور: formatDateTime(invoice.createdAt),
        }))
      )
    );

    addSheet(
      workbook,
      "گزارش صندوق",
      filteredTransactions.map((item) => ({
        عنوان: item.title || "-",
        نوع: item.type === "income" ? "درآمد" : "هزینه",
        مبلغ_عدد: toNumber(item.amount),
        مبلغ_نمایشی: formatMoney(item.amount),
        تاریخ: formatDateTime(item.date || item.transactionDate || item.createdAt),
        منبع: item.sourceType || "manual",
        شناسه_منبع: item.sourceId || "",
      }))
    );

    addSheet(
      workbook,
      "موجودی کالا",
      products.map((product) => ({
        کد: product.code || "",
        نام: product.name || "-",
        نوع: product.type === "service" ? "خدمت" : "کالا",
        واحد: product.unit || "",
        دسته_بندی: product.category || "",
        قیمت_خرید_عدد: toNumber(product.buyPrice),
        قیمت_خرید_نمایشی: formatMoney(product.buyPrice),
        قیمت_فروش_عدد: toNumber(product.salePrice),
        قیمت_فروش_نمایشی: formatMoney(product.salePrice),
        سود_واحد_عدد: toNumber(product.salePrice) - toNumber(product.buyPrice),
        سود_واحد_نمایشی: formatMoney(
          toNumber(product.salePrice) - toNumber(product.buyPrice)
        ),
        موجودی_عدد: toNumber(product.stock),
        حداقل_موجودی_عدد: toNumber(product.minStock),
        وضعیت_موجودی:
          product.type === "product" &&
          toNumber(product.stock) <= toNumber(product.minStock)
            ? "کمبود موجودی"
            : "عادی",
        ارزش_موجودی_عدد:
          product.type === "product"
            ? toNumber(product.stock) * toNumber(product.buyPrice)
            : 0,
        ارزش_موجودی_نمایشی:
          product.type === "product"
            ? formatMoney(toNumber(product.stock) * toNumber(product.buyPrice))
            : formatMoney(0),
      }))
    );

    addSheet(
      workbook,
      "طرف حساب‌ها",
      parties.map((party) => ({
        نام: party.name || "-",
        نوع:
          party.type === "customer"
            ? "مشتری"
            : party.type === "supplier"
            ? "تامین کننده"
            : "شخص",
        تلفن: party.phone || "",
        آدرس: party.address || "",
        مانده_اولیه_عدد: toNumber(party.openingBalance),
        مانده_اولیه_نمایشی: formatMoney(party.openingBalance),
        وضعیت_مانده:
          party.balanceStatus === "debtor"
            ? "بدهکار"
            : party.balanceStatus === "creditor"
            ? "بستانکار"
            : "بدون مانده",
        تاریخ_ایجاد: formatDateTime(party.createdAt),
      }))
    );

    addSheet(
      workbook,
      "پرفروش‌ترین‌ها",
      topSellingProducts.map((item, index) => ({
        ردیف: index + 1,
        نام: item.name,
        تعداد_فروش_عدد: item.quantity,
        مبلغ_فروش_عدد: item.amount,
        مبلغ_فروش_نمایشی: formatMoney(item.amount),
      }))
    );

    addSheet(
      workbook,
      "بیشترین هزینه‌ها",
      topExpenses.map((item, index) => ({
        ردیف: index + 1,
        عنوان: item.title,
        مبلغ_عدد: item.amount,
        مبلغ_نمایشی: formatMoney(item.amount),
        تاریخ: formatDateTime(item.date),
      }))
    );

    addSheet(
      workbook,
      "فاکتورهای خرید",
      filteredPurchaseInvoices.map((invoice) => ({
        شماره_فاکتور: invoice.invoiceNumber || "-",
        تامین_کننده: invoice.supplierName || "-",
        جمع_قبل_از_تخفیف_عدد: toNumber(invoice.subtotal),
        جمع_قبل_از_تخفیف_نمایشی: formatMoney(invoice.subtotal),
        تخفیف_عدد: toNumber(invoice.totalDiscount),
        تخفیف_نمایشی: formatMoney(invoice.totalDiscount),
        مبلغ_نهایی_عدد: toNumber(invoice.finalTotal),
        مبلغ_نهایی_نمایشی: formatMoney(invoice.finalTotal),
        وضعیت_پرداخت: invoice.paymentStatus || "-",
        پرداخت_شده_عدد: toNumber(invoice.paidAmount),
        پرداخت_شده_نمایشی: formatMoney(invoice.paidAmount),
        مانده_عدد: toNumber(invoice.remainingAmount),
        مانده_نمایشی: formatMoney(invoice.remainingAmount),
        تعداد_اقلام: invoice.rows?.length || 0,
        تاریخ: formatDateTime(invoice.createdAt),
        توضیحات: invoice.note || "",
      }))
    );

    XLSX.writeFile(
      workbook,
      `Holooche-Report-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const printReport = () => {
    window.print();
  };

  return (
    <section className="reports-page">
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
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="all">کل دوره</option>
            <option value="today">امروز</option>
            <option value="week">این هفته</option>
            <option value="month">این ماه</option>
            <option value="year">امسال</option>
          </select>

          <button type="button" onClick={exportExcel}>
            خروجی Excel
          </button>

          <button type="button" onClick={printReport}>
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
          <strong>{formatMoney(cashBalance)}</strong>
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
            <strong>{filteredSalesInvoices.length}</strong>
          </div>
          <div className="report-row">
            <span>تعداد اقلام فروخته شده</span>
            <strong>{salesRowsCount}</strong>
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
            <strong>{formatMoney(cashBalance)}</strong>
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
            <strong>{debtorParties.length}</strong>
          </div>
          <div className="report-row">
            <span>بستانکاران</span>
            <strong>{creditorParties.length}</strong>
          </div>
        </article>
      </div>

      <div className="reports-grid">
        <article className="report-box">
          <h3>پرفروش‌ترین کالاها / خدمات</h3>
          {topSellingProducts.length === 0 ? (
            <div className="report-row">
              <span>داده‌ای وجود ندارد</span>
              <strong>{formatMoney(0)}</strong>
            </div>
          ) : (
            topSellingProducts.map((item) => (
              <div className="report-row" key={item.name}>
                <span>{item.name}</span>
                <strong>{formatMoney(item.amount)}</strong>
              </div>
            ))
          )}
        </article>

        <article className="report-box">
          <h3>بیشترین هزینه‌ها</h3>
          {topExpenses.length === 0 ? (
            <div className="report-row">
              <span>داده‌ای وجود ندارد</span>
              <strong>{formatMoney(0)}</strong>
            </div>
          ) : (
            topExpenses.map((item) => (
              <div className="report-row" key={`${item.title}-${item.amount}`}>
                <span>{item.title}</span>
                <strong>{formatMoney(item.amount)}</strong>
              </div>
            ))
          )}
        </article>
      </div>

      <div className="report-table-card">
        <h3>فاکتورهای فروش</h3>

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
              {filteredSalesInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.invoiceNumber}</td>
                  <td>{invoice.customerName}</td>
                  <td>{formatMoney(invoice.finalTotal)}</td>
                  <td>{formatDate(invoice.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default ReportsPage;