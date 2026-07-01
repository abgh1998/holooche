import { amountToPersianWords, formatMoney } from "../utils/money";

function Summary({ transactions = [] }) {
  const income = transactions.reduce((total, item) => {
    if (item.type === "income") {
      return total + Number(item.amount);
    }

    return total;
  }, 0);

  const expense = transactions.reduce((total, item) => {
    if (item.type === "expense") {
      return total + Number(item.amount);
    }

    return total;
  }, 0);

  return (
    <section className="card summary-card">
      <h2>خلاصه مالی</h2>

      <div className="summary-box income">
        <h3>درآمد</h3>
        <p>{formatMoney(income)}</p>
        <small className="amount-words">{amountToPersianWords(income)}</small>
      </div>

      <div className="summary-box expense">
        <h3>هزینه</h3>
        <p>{formatMoney(expense)}</p>
        <small className="amount-words">{amountToPersianWords(expense)}</small>
      </div>
    </section>
  );
}

export default Summary;