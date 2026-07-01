import TransactionItem from "./TransactionItem";

function TransactionList({
  transactions = [],
  onSelectTransaction,
  onDeleteTransaction,
  onClearTransactions,
}) {
  const maxAmount = Math.max(
    ...transactions.map((transaction) => Number(transaction.amount)),
    1
  );

  return (
    <section className="card">
      <div className="section-header">
        <h2>تاریخچه تراکنش ها</h2>

        {transactions.length > 0 && (
          <button className="clear-btn" onClick={onClearTransactions}>
            پاک کردن همه
          </button>
        )}
      </div>

      {transactions.length === 0 ? (
        <p className="empty-text">هنوز تراکنشی ثبت نشده است</p>
      ) : (
        <ul className="transaction-list">
          {transactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              maxAmount={maxAmount}
              onSelectTransaction={onSelectTransaction}
              onDeleteTransaction={onDeleteTransaction}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export default TransactionList;