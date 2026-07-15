import { useState } from "react";
import {
  amountToPersianWords,
  formatMoney,
  persianToEnglishNumber,
} from "../utils/money";

function CustomersPage({
  parties = [],
  onAddParty,
  onDeleteParty,
  onUpdateParty,
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("customer");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [balanceStatus, setBalanceStatus] = useState("none");
  const [searchText, setSearchText] = useState("");

  const [editingPartyId, setEditingPartyId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    type: "customer",
    phone: "",
    address: "",
    openingBalance: "",
    balanceStatus: "none",
  });

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
    const englishValue = persianToEnglishNumber(String(value));
    const onlyNumbers = englishValue.replace(/[^0-9]/g, "");

    if (onlyNumbers === "") {
      return 0;
    }

    return Number(onlyNumbers);
  };

  const resetAddForm = () => {
    setName("");
    setType("customer");
    setPhone("");
    setAddress("");
    setOpeningBalance("");
    setBalanceStatus("none");
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
    resetAddForm();
  };

  const startEditParty = (party) => {
    setEditingPartyId(party.id);

    setEditForm({
      name: party.name || "",
      type: party.type || "customer",
      phone: party.phone || "",
      address: party.address || "",
      openingBalance:
        Number(party.openingBalance) > 0
          ? Number(party.openingBalance).toLocaleString("fa-IR")
          : "",
      balanceStatus: party.balanceStatus || "none",
    });
  };

  const cancelEditParty = () => {
    setEditingPartyId(null);

    setEditForm({
      name: "",
      type: "customer",
      phone: "",
      address: "",
      openingBalance: "",
      balanceStatus: "none",
    });
  };

  const handleEditSubmit = (e, party) => {
    e.preventDefault();

    const cleanName = editForm.name.trim();
    const pureBalance = getPureAmount(editForm.openingBalance);

    if (cleanName === "") {
      alert("نام طرف حساب را وارد کنید");
      return;
    }

    if (pureBalance > 0 && editForm.balanceStatus === "none") {
      alert("برای مانده اول دوره باید وضعیت بدهکار یا بستانکار را انتخاب کنید");
      return;
    }

    const updatedParty = {
      ...party,
      name: cleanName,
      type: editForm.type,
      phone: editForm.phone.trim(),
      address: editForm.address.trim(),
      openingBalance: pureBalance,
      balanceStatus: pureBalance === 0 ? "none" : editForm.balanceStatus,
      updatedAt: new Date().toISOString(),
    };

    onUpdateParty(updatedParty);
    cancelEditParty();
  };

  const filteredParties = parties.filter((party) => {
    const search = searchText.trim().toLowerCase();

    if (search === "") {
      return true;
    }

    const partyName = party.name || "";
    const partyPhone = party.phone || "";
    const partyType = partyTypeLabels[party.type] || "";

    return (
      partyName.toLowerCase().includes(search) ||
      partyPhone.toLowerCase().includes(search) ||
      partyType.includes(searchText)
    );
  });

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
                    <p>{partyTypeLabels[party.type] || "نامشخص"}</p>
                  </div>

                  <span className={`party-badge ${party.balanceStatus}`}>
                    {balanceStatusLabels[party.balanceStatus] || "نامشخص"}
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

                {editingPartyId === party.id && (
                  <form
                    className="party-edit-form"
                    onSubmit={(e) => handleEditSubmit(e, party)}
                  >
                    <label>
                      نام طرف حساب
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    </label>

                    <label>
                      نوع طرف حساب
                      <select
                        value={editForm.type}
                        onChange={(e) =>
                          setEditForm({ ...editForm, type: e.target.value })
                        }
                      >
                        <option value="customer">مشتری</option>
                        <option value="supplier">تامین‌کننده</option>
                        <option value="person">شخص</option>
                      </select>
                    </label>

                    <label>
                      شماره تماس
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: e.target.value })
                        }
                      />
                    </label>

                    <label>
                      مانده اول دوره
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editForm.openingBalance}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            openingBalance: formatAmountInput(e.target.value),
                          })
                        }
                      />
                    </label>

                    <label>
                      وضعیت مانده
                      <select
                        value={editForm.balanceStatus}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            balanceStatus: e.target.value,
                          })
                        }
                      >
                        <option value="none">بدون مانده</option>
                        <option value="debtor">بدهکار</option>
                        <option value="creditor">بستانکار</option>
                      </select>
                    </label>

                    <label className="party-edit-address">
                      آدرس
                      <input
                        type="text"
                        value={editForm.address}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            address: e.target.value,
                          })
                        }
                      />
                    </label>

                    <div className="party-edit-actions">
                      <button type="submit" className="party-save-btn">
                        ذخیره تغییرات
                      </button>

                      <button
                        type="button"
                        className="party-cancel-btn"
                        onClick={cancelEditParty}
                      >
                        انصراف
                      </button>
                    </div>
                  </form>
                )}

                <div className="party-actions">
                  <button
                    type="button"
                    className="party-edit-btn"
                    onClick={() => startEditParty(party)}
                  >
                    ویرایش
                  </button>

                  <button
                    type="button"
                    className="party-delete-btn"
                    onClick={() => onDeleteParty(party.id)}
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default CustomersPage;