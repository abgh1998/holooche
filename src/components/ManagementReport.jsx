import { amountToPersianWords, formatMoney } from "../utils/money";

function ManagementReport({ transactions = [] }) {
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

  const getEndOfWeek = (date) => {
    const startOfWeek = getStartOfWeek(date);
    const endOfWeek = new Date(startOfWeek);

    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return endOfWeek;
  };

  const startOfWeek = getStartOfWeek(now);
  const endOfWeek = getEndOfWeek(now);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const weeklyTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);

    return transactionDate >= startOfWeek && transactionDate < endOfWeek;
  });

  const monthlyTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);

    return transactionDate >= startOfMonth && transactionDate < endOfMonth;
  });

  const calculateReport = (items) => {
    const income = items.reduce((total, item) => {
      if (item.type === "income") {
        return total + Number(item.amount);
      }

      return total;
    }, 0);

    const expense = items.reduce((total, item) => {
      if (item.type === "expense") {
        return total + Number(item.amount);
      }

      return total;
    }, 0);

    const expenseItems = items.filter((item) => item.type === "expense");

    const averageExpense =
      expenseItems.length > 0 ? expense / expenseItems.length : 0;

    const biggestExpense =
      expenseItems.length > 0
        ? expenseItems.reduce((max, item) =>
            Number(item.amount) > Number(max.amount) ? item : max
          )
        : null;

    return {
      income,
      expense,
      balance: income - expense,
      count: items.length,
      expenseCount: expenseItems.length,
      averageExpense,
      biggestExpense,
    };
  };

  const weeklyReport = calculateReport(weeklyTransactions);
  const monthlyReport = calculateReport(monthlyTransactions);

  const getStatusText = (report) => {
    if (report.income === 0 && report.expense === 0) {
      return "هنوز داده ای برای تحلیل وجود ندارد";
    }

    if (report.balance > 0) {
      return "وضعیت مثبت است؛ درآمد از هزینه بیشتر بوده است";
    }

    if (report.balance < 0) {
      return "هشدار مدیریتی: هزینه ها از درآمد بیشتر بوده است";
    }

    return "درآمد و هزینه برابر بوده اند";
  };

  const getStatusClass = (report) => {
    if (report.income === 0 && report.expense === 0) {
      return "neutral";
    }

    if (report.balance >= 0) {
      return "good";
    }

    return "bad";
  };

  const renderReportBox = (title, report) => {
    return (
      <div className="management-box">
        <h3>{title}</h3>

        <div className="report-row">
          <span>درآمد</span>
          <strong className="income-text">{formatMoney(report.income)}</strong>
        </div>

        <div className="report-row">
          <span>هزینه</span>
          <strong className="expense-text">{formatMoney(report.expense)}</strong>
        </div>

        <div className="report-row">
          <span>مانده</span>
          <strong
            className={report.balance >= 0 ? "income-text" : "expense-text"}
          >
            {formatMoney(report.balance)}
          </strong>
        </div>

        <div className="report-row">
          <span>تعداد تراکنش</span>
          <strong>{report.count.toLocaleString("fa-IR")}</strong>
        </div>

        <div className="report-row">
          <span>تعداد هزینه ها</span>
          <strong>{report.expenseCount.toLocaleString("fa-IR")}</strong>
        </div>

        <div className="report-row">
          <span>میانگین هزینه</span>
          <strong>{formatMoney(report.averageExpense)}</strong>
        </div>

        <div className="report-row">
          <span>بزرگترین هزینه</span>
          <strong>
            {report.biggestExpense
              ? `${report.biggestExpense.title} - ${formatMoney(
                  report.biggestExpense.amount
                )}`
              : "ثبت نشده"}
          </strong>
        </div>

        <p className="report-words">
          هزینه به حروف: {amountToPersianWords(report.expense)}
        </p>

        <p className={`management-status ${getStatusClass(report)}`}>
          {getStatusText(report)}
        </p>
      </div>
    );
  };

  return (
    <section className="card management-report-card">
      <h2>گزارش مدیریتی</h2>

      <p className="management-description">
        در این بخش وضعیت درآمد، هزینه و مانده مالی به صورت هفتگی و ماهانه
        بررسی میشود.
      </p>

      <div className="management-grid">
        {renderReportBox("گزارش هفته جاری", weeklyReport)}
        {renderReportBox("گزارش ماه جاری", monthlyReport)}
      </div>
    </section>
  );
}

export default ManagementReport;