import { useState } from "react";
import {
  amountToPersianWords,
  formatMoney,
  persianToEnglishNumber,
} from "../utils/money";

function CustomersPage({ parties = [], onAddParty, onDeleteParty }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("customer");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [balanceStatus, setBalanceStatus] = useState("none");
  const [searchText, setSearchText] = useState("");

  const partyTypeLabels = {
    customer: "مشتری",
    supplier: "تامین‌کننده",
    person: "شخص",
  };

  const balanceStatusLabels = {
    none: "بدون مانده",
    debtor: "بدهکار",
    creditor: "بستانکار",
  };

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

    if (onlyNumbers === "") {
      return 0;
    }

    return Number(onlyNumbers);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanName = name.trim();
    const pureBalance = getPureAmount(openingBalance);

    if (cleanName === "") {
      alert("نام طرف حساب را وارد کنید");
      return;
    }

    if (pureBalance > 0 && balanceStatus === "none") {
      alert("برای مانده اول دوره باید وضعیت بدهکار یا بستانکار را انتخاب کنید");
      return;
    }

    const newParty = {
      id: Date.now(),
      name: cleanName,
      type,
      phone: phone.trim(),
      address: address.trim(),
      openingBalance: pureBalance,
      balanceStatus: pureBalance === 0 ? "none" : balanceStatus,
      createdAt: new Date().toISOString(),
    };

    onAddParty(newParty);

    setName("");
    setType("customer");
    setPhone("");
    setAddress("");
    setOpeningBalance("");
    setBalanceStatus("none");
  };

  const filteredParties = parties.filter((party) => {
    const search = searchText.trim().toLowerCase();

    if (search === "") {
      return true;
    }

    return (
      party.name.toLowerCase().includes(search) ||
      party.phone.toLowerCase().includes(search) ||
      partyTypeLabels[party.type].includes(searchText)
    );
  });

  const totalDebtor = parties.reduce((total, party) => {
    if (party.balanceStatus === "debtor") {
      return total + Number(party.openingBalance);
    }

    return total;
  }, 0);

  const totalCreditor = parties.reduce((total, party) => {
    if (party.balanceStatus === "creditor") {
      return total + Number(party.openingBalance);
    }

    return total;
  }, 0);

  return (
    <>
      <section className="card parties-summary-card">
        <h2>خلاصه طرف حساب‌ها</h2>

        <div className="parties-summary-grid">
          <div className="party-summary-box">
            <span>تعداد کل</span>
            <strong>{parties.length.toLocaleString("fa-IR")}</strong>
          </div>

          <div className="party-summary-box debtor">
            <span>جمع بدهکاری</span>
            <strong>{formatMoney(totalDebtor)}</strong>
          </div>

          <div className="party-summary-box creditor">
            <span>جمع بستانکاری</span>
            <strong>{formatMoney(totalCreditor)}</strong>
          </div>
        </div>
      </section>

      <section className="card party-form-card">
        <h2>ثبت طرف حساب جدید</h2>

        <form onSubmit={handleSubmit}>
          <div className="party-form-grid">
            <div className="form-field">
              <label>نام طرف حساب</label>
              <input
                type="text"
                placeholder="مثلا: علی محمدی یا شرکت بهار"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>نوع طرف حساب</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="customer">مشتری</option>
                <option value="supplier">تامین‌کننده</option>
                <option value="person">شخص</option>
              </select>
            </div>

            <div className="form-field">
              <label>شماره تماس</label>
              <input
                type="text"
                placeholder="مثلا: 09120000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>مانده اول دوره</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="مثلا: ۵۰۰,۰۰۰"
                value={openingBalance}
                onChange={(e) =>
                  setOpeningBalance(formatAmountInput(e.target.value))
                }
              />
            </div>

            <div className="form-field">
              <label>وضعیت مانده</label>
              <select
                value={balanceStatus}
                onChange={(e) => setBalanceStatus(e.target.value)}
              >
                <option value="none">بدون مانده</option>
                <option value="debtor">بدهکار</option>
                <option value="creditor">بستانکار</option>
              </select>
            </div>

            <div className="form-field full">
              <label>آدرس</label>
              <input
                type="text"
                placeholder="آدرس طرف حساب"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          <button type="submit">ثبت طرف حساب</button>
        </form>
      </section>

      <section className="card parties-list-card">
        <div className="section-header">
          <h2>لیست طرف حساب‌ها</h2>

          <input
            className="party-search-input"
            type="text"
            placeholder="جستجو بر اساس نام، تماس یا نوع"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {filteredParties.length === 0 ? (
          <p className="empty-text">طرف حسابی برای نمایش وجود ندارد</p>
        ) : (
          <div className="parties-list">
            {filteredParties.map((party) => (
              <div className="party-item" key={party.id}>
                <div className="party-main">
                  <div>
                    <h3>{party.name}</h3>
                    <p>{partyTypeLabels[party.type]}</p>
                  </div>

                  <span
                    className={`party-badge ${party.balanceStatus}`}
                  >
                    {balanceStatusLabels[party.balanceStatus]}
                  </span>
                </div>

                <div className="party-details">
                  <p>
                    <span>شماره تماس:</span>
                    <strong>{party.phone || "ثبت نشده"}</strong>
                  </p>

                  <p>
                    <span>آدرس:</span>
                    <strong>{party.address || "ثبت نشده"}</strong>
                  </p>

                  <p>
                    <span>مانده:</span>
                    <strong>
                      {party.openingBalance > 0
                        ? formatMoney(party.openingBalance)
                        : "بدون مانده"}
                    </strong>
                  </p>

                  {party.openingBalance > 0 && (
                    <p className="party-words">
                      {amountToPersianWords(party.openingBalance)}
                    </p>
                  )}
                </div>

                <button
                  className="party-delete-btn"
                  onClick={() => onDeleteParty(party.id)}
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default CustomersPage;