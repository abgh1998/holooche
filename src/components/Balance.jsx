import { amountToPersianWords, formatMoney } from "../utils/money";

function Balance({ transactions = [] }) {
  const balance = transactions.reduce((total, item) => {
    const amount = Number(item.amount);

    if (item.type === "income") {
      return total + amount;
    }

    return total - amount;
  }, 0);

  return (
    <section className="card balance-card">
      <h2>موجودی کل</h2>
      <h3>{formatMoney(balance)}</h3>
      <p className="amount-words light">{amountToPersianWords(balance)}</p>
    </section>
  );
}

export default Balance;