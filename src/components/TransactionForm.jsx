import { useState } from "react";
import { persianToEnglishNumber } from "../utils/money";

function TransactionForm({ addTransaction }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("income");

  const formatAmountInput = (value) => {
    const englishValue = persianToEnglishNumber(value);
    const onlyNumbers = englishValue.replace(/[^0-9]/g, "");

    if (onlyNumbers === "") {
      return "";
    }

    return Number(onlyNumbers).toLocaleString("fa-IR");
  };

  const getPureAmount = (value) => {
    const englishValue = persianToEnglishNumber(value);
    const onlyNumbers = englishValue.replace(/[^0-9]/g, "");

    return Number(onlyNumbers);
  };

  const handleAmountChange = (e) => {
    setAmount(formatAmountInput(e.target.value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const pureAmount = getPureAmount(amount);

    if (title.trim() === "" || amount === "") {
      alert("لطفا همه فیلدها را پر کنید");
      return;
    }

    if (pureAmount <= 0) {
      alert("مبلغ باید بیشتر از صفر باشد");
      return;
    }

    const newTransaction = {
      id: Date.now(),
      title: title.trim(),
      amount: pureAmount,
      type: type,
      date: new Date().toISOString(),
    };

    addTransaction(newTransaction);

    setTitle("");
    setAmount("");
    setType("income");
  };

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <h2>افزودن تراکنش</h2>

      <label>عنوان</label>
      <input
        type="text"
        placeholder="مثلا: حقوق، خرید، اجاره"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label>مبلغ</label>
      <input
        type="text"
        inputMode="numeric"
        placeholder="مثلا: ۱۰۰,۰۰۰"
        value={amount}
        onChange={handleAmountChange}
      />

      <label>نوع تراکنش</label>
      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="income">درآمد</option>
        <option value="expense">هزینه</option>
      </select>

      <button type="submit">ثبت تراکنش</button>
    </form>
  );
}

export default TransactionForm;