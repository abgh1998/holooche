import { amountToPersianWords, formatMoney } from "../utils/money";

function Chart({ transactions = [] }) {
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

  const balance = income - expense;

  const chartData = [
    {
      label: "درآمد",
      value: income,
      type: "income",
    },
    {
      label: "هزینه",
      value: expense,
      type: "expense",
    },
    {
      label: "موجودی",
      value: balance,
      type: balance >= 0 ? "income" : "expense",
    },
  ];

  const maxValue = Math.max(income, expense, Math.abs(balance), 1);

  return (
    <section className="card chart-card">
      <h2>نمودار مالی</h2>

      {transactions.length === 0 ? (
        <p className="empty-text">هنوز داده ای برای نمایش نمودار وجود ندارد</p>
      ) : (
        <div className="chart">
          {chartData.map((item) => (
            <div className="chart-row" key={item.label}>
              <div className="chart-info">
                <span>{item.label}</span>

                <div className="chart-money">
                  <strong>{formatMoney(item.value)}</strong>
                  <small>{amountToPersianWords(item.value)}</small>
                </div>
              </div>

              <div className="chart-track">
                <div
                  className={`chart-fill ${item.type}`}
                  style={{
                    width: `${(Math.abs(item.value) / maxValue) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Chart;