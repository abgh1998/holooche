import { useState } from "react";
import {
  amountToPersianWords,
  formatMoney,
  persianToEnglishNumber,
} from "../utils/money";

function ProductsPage({
  products = [],
  onAddProduct,
  onDeleteProduct,
  onUpdateProduct,
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("product");
  const [unit, setUnit] = useState("عدد");
  const [category, setCategory] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");
  const [searchText, setSearchText] = useState("");

  const [editingProductId, setEditingProductId] = useState(null);
  const [editForm, setEditForm] = useState({
    code: "",
    name: "",
    type: "product",
    unit: "عدد",
    category: "",
    buyPrice: "",
    salePrice: "",
    stock: "",
    minStock: "",
  });

  const productTypeLabels = {
    product: "کالا",
    service: "خدمت",
  };

  const formatNumberInput = (value) => {
    const englishValue = persianToEnglishNumber(String(value));
    const onlyNumbers = englishValue.replace(/[^0-9]/g, "");

    if (onlyNumbers === "") {
      return "";
    }

    return Number(onlyNumbers).toLocaleString("fa-IR");
  };

  const getPureNumber = (value) => {
    const englishValue = persianToEnglishNumber(String(value));
    const onlyNumbers = englishValue.replace(/[^0-9]/g, "");

    if (onlyNumbers === "") {
      return 0;
    }

    return Number(onlyNumbers);
  };

  const resetAddForm = () => {
    setCode("");
    setName("");
    setType("product");
    setUnit("عدد");
    setCategory("");
    setBuyPrice("");
    setSalePrice("");
    setStock("");
    setMinStock("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanName = name.trim();
    const pureBuyPrice = getPureNumber(buyPrice);
    const pureSalePrice = getPureNumber(salePrice);
    const pureStock = getPureNumber(stock);
    const pureMinStock = getPureNumber(minStock);

    if (cleanName === "") {
      alert("نام کالا یا خدمت را وارد کنید");
      return;
    }

    if (pureSalePrice <= 0) {
      alert("قیمت فروش باید بیشتر از صفر باشد");
      return;
    }

    const newProduct = {
      id: Date.now(),
      code: code.trim() || `PRD-${Date.now()}`,
      name: cleanName,
      type,
      unit: unit.trim() || "عدد",
      category: category.trim(),
      buyPrice: pureBuyPrice,
      salePrice: pureSalePrice,
      stock: type === "service" ? 0 : pureStock,
      minStock: type === "service" ? 0 : pureMinStock,
      createdAt: new Date().toISOString(),
    };

    onAddProduct(newProduct);
    resetAddForm();
  };

  const startEditProduct = (product) => {
    setEditingProductId(product.id);

    setEditForm({
      code: product.code || "",
      name: product.name || "",
      type: product.type || "product",
      unit: product.unit || "عدد",
      category: product.category || "",
      buyPrice:
        Number(product.buyPrice) > 0
          ? Number(product.buyPrice).toLocaleString("fa-IR")
          : "",
      salePrice:
        Number(product.salePrice) > 0
          ? Number(product.salePrice).toLocaleString("fa-IR")
          : "",
      stock:
        Number(product.stock) > 0
          ? Number(product.stock).toLocaleString("fa-IR")
          : "",
      minStock:
        Number(product.minStock) > 0
          ? Number(product.minStock).toLocaleString("fa-IR")
          : "",
    });
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);

    setEditForm({
      code: "",
      name: "",
      type: "product",
      unit: "عدد",
      category: "",
      buyPrice: "",
      salePrice: "",
      stock: "",
      minStock: "",
    });
  };

  const handleEditSubmit = (e, product) => {
    e.preventDefault();

    const cleanName = editForm.name.trim();
    const pureBuyPrice = getPureNumber(editForm.buyPrice);
    const pureSalePrice = getPureNumber(editForm.salePrice);
    const pureStock = getPureNumber(editForm.stock);
    const pureMinStock = getPureNumber(editForm.minStock);

    if (cleanName === "") {
      alert("نام کالا یا خدمت را وارد کنید");
      return;
    }

    if (pureSalePrice <= 0) {
      alert("قیمت فروش باید بیشتر از صفر باشد");
      return;
    }

    const updatedProduct = {
      ...product,
      code: editForm.code.trim() || product.code,
      name: cleanName,
      type: editForm.type,
      unit: editForm.unit.trim() || "عدد",
      category: editForm.category.trim(),
      buyPrice: pureBuyPrice,
      salePrice: pureSalePrice,
      stock: editForm.type === "service" ? 0 : pureStock,
      minStock: editForm.type === "service" ? 0 : pureMinStock,
      updatedAt: new Date().toISOString(),
    };

    onUpdateProduct(updatedProduct);
    cancelEditProduct();
  };

  const filteredProducts = products.filter((product) => {
    const search = searchText.trim().toLowerCase();

    if (search === "") {
      return true;
    }

    const productName = product.name || "";
    const productCode = product.code || "";
    const productCategory = product.category || "";
    const productType = productTypeLabels[product.type] || "";

    return (
      productName.toLowerCase().includes(search) ||
      productCode.toLowerCase().includes(search) ||
      productCategory.toLowerCase().includes(search) ||
      productType.includes(searchText)
    );
  });

  const totalProducts = products.filter(
    (product) => product.type === "product"
  ).length;

  const totalServices = products.filter(
    (product) => product.type === "service"
  ).length;

  const totalStockValue = products.reduce((total, product) => {
    if (product.type === "product") {
      return total + Number(product.stock || 0) * Number(product.buyPrice || 0);
    }

    return total;
  }, 0);

  const lowStockProducts = products.filter((product) => {
    if (product.type !== "product") {
      return false;
    }

    if (Number(product.minStock) <= 0) {
      return false;
    }

    return Number(product.stock) <= Number(product.minStock);
  });

  return (
    <>
      <section className="card products-summary-card">
        <h2>خلاصه کالا و خدمات</h2>

        <div className="products-summary-grid">
          <div className="product-summary-box">
            <span>تعداد کالا</span>
            <strong>{totalProducts.toLocaleString("fa-IR")}</strong>
          </div>

          <div className="product-summary-box">
            <span>تعداد خدمات</span>
            <strong>{totalServices.toLocaleString("fa-IR")}</strong>
          </div>

          <div className="product-summary-box value">
            <span>ارزش موجودی</span>
            <strong>{formatMoney(totalStockValue)}</strong>
          </div>

          <div className="product-summary-box warning">
            <span>کمبود موجودی</span>
            <strong>{lowStockProducts.length.toLocaleString("fa-IR")}</strong>
          </div>
        </div>
      </section>

      <section className="card product-form-card">
        <h2>ثبت کالا یا خدمت جدید</h2>

        <form onSubmit={handleSubmit}>
          <div className="product-form-grid">
            <div className="product-field">
              <label>کد کالا / خدمت</label>
              <input
                type="text"
                placeholder="مثلا: P-1001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div className="product-field">
              <label>نام کالا / خدمت</label>
              <input
                type="text"
                placeholder="مثلا: مانیتور یا طراحی سایت"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="product-field">
              <label>نوع</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="product">کالا</option>
                <option value="service">خدمت</option>
              </select>
            </div>

            <div className="product-field">
              <label>واحد</label>
              <input
                type="text"
                placeholder="عدد، کیلو، متر، ساعت"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>

            <div className="product-field">
              <label>دسته‌بندی</label>
              <input
                type="text"
                placeholder="مثلا: دیجیتال، خدمات، مصرفی"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div className="product-field">
              <label>قیمت خرید</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="مثلا: ۱,۰۰۰,۰۰۰"
                value={buyPrice}
                onChange={(e) => setBuyPrice(formatNumberInput(e.target.value))}
              />
            </div>

            <div className="product-field">
              <label>قیمت فروش</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="مثلا: ۱,۵۰۰,۰۰۰"
                value={salePrice}
                onChange={(e) =>
                  setSalePrice(formatNumberInput(e.target.value))
                }
              />
            </div>

            <div className="product-field">
              <label>موجودی</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder={type === "service" ? "برای خدمت لازم نیست" : "مثلا: ۱۰"}
                value={stock}
                disabled={type === "service"}
                onChange={(e) => setStock(formatNumberInput(e.target.value))}
              />
            </div>

            <div className="product-field">
              <label>حداقل موجودی هشدار</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder={type === "service" ? "برای خدمت لازم نیست" : "مثلا: ۲"}
                value={minStock}
                disabled={type === "service"}
                onChange={(e) => setMinStock(formatNumberInput(e.target.value))}
              />
            </div>
          </div>

          <button type="submit">ثبت کالا / خدمت</button>
        </form>
      </section>

      <section className="card products-list-card">
        <div className="section-header">
          <h2>لیست کالا و خدمات</h2>

          <input
            className="product-search-input"
            type="text"
            placeholder="جستجو بر اساس نام، کد، دسته یا نوع"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {filteredProducts.length === 0 ? (
          <p className="empty-text">کالا یا خدمتی برای نمایش وجود ندارد</p>
        ) : (
          <div className="products-list">
            {filteredProducts.map((product) => {
              const profit =
                Number(product.salePrice || 0) - Number(product.buyPrice || 0);

              const isLowStock =
                product.type === "product" &&
                Number(product.minStock) > 0 &&
                Number(product.stock) <= Number(product.minStock);

              return (
                <div className="product-item" key={product.id}>
                  <div className="product-main">
                    <div>
                      <h3>{product.name}</h3>
                      <p>
                        {product.code} - {productTypeLabels[product.type]}
                      </p>
                    </div>

                    <span
                      className={`product-badge ${
                        product.type === "service" ? "service" : "product"
                      }`}
                    >
                      {productTypeLabels[product.type]}
                    </span>
                  </div>

                  <div className="product-details">
                    <p>
                      <span>دسته‌بندی:</span>
                      <strong>{product.category || "ثبت نشده"}</strong>
                    </p>

                    <p>
                      <span>واحد:</span>
                      <strong>{product.unit}</strong>
                    </p>

                    <p>
                      <span>قیمت خرید:</span>
                      <strong>{formatMoney(product.buyPrice)}</strong>
                    </p>

                    <p>
                      <span>قیمت فروش:</span>
                      <strong className="product-sale-price">
                        {formatMoney(product.salePrice)}
                      </strong>
                    </p>

                    <p>
                      <span>سود واحد:</span>
                      <strong
                        className={profit >= 0 ? "income-text" : "expense-text"}
                      >
                        {formatMoney(profit)}
                      </strong>
                    </p>

                    {product.type === "product" && (
                      <>
                        <p>
                          <span>موجودی:</span>
                          <strong>
                            {Number(product.stock || 0).toLocaleString("fa-IR")}{" "}
                            {product.unit}
                          </strong>
                        </p>

                        <p>
                          <span>حداقل موجودی:</span>
                          <strong>
                            {Number(product.minStock || 0).toLocaleString("fa-IR")}{" "}
                            {product.unit}
                          </strong>
                        </p>
                      </>
                    )}

                    <p className="product-words">
                      قیمت فروش به حروف: {amountToPersianWords(product.salePrice)}
                    </p>

                    {isLowStock && (
                      <p className="product-stock-alert">
                        هشدار: موجودی این کالا به حداقل رسیده است
                      </p>
                    )}
                  </div>

                  {editingProductId === product.id && (
                    <form
                      className="product-edit-form"
                      onSubmit={(e) => handleEditSubmit(e, product)}
                    >
                      <label>
                        کد کالا / خدمت
                        <input
                          type="text"
                          value={editForm.code}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              code: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label>
                        نام کالا / خدمت
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              name: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label>
                        نوع
                        <select
                          value={editForm.type}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              type: e.target.value,
                            })
                          }
                        >
                          <option value="product">کالا</option>
                          <option value="service">خدمت</option>
                        </select>
                      </label>

                      <label>
                        واحد
                        <input
                          type="text"
                          value={editForm.unit}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              unit: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label>
                        دسته‌بندی
                        <input
                          type="text"
                          value={editForm.category}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              category: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label>
                        قیمت خرید
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editForm.buyPrice}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              buyPrice: formatNumberInput(e.target.value),
                            })
                          }
                        />
                      </label>

                      <label>
                        قیمت فروش
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editForm.salePrice}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              salePrice: formatNumberInput(e.target.value),
                            })
                          }
                        />
                      </label>

                      <label>
                        موجودی
                        <input
                          type="text"
                          inputMode="numeric"
                          disabled={editForm.type === "service"}
                          value={editForm.stock}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              stock: formatNumberInput(e.target.value),
                            })
                          }
                        />
                      </label>

                      <label>
                        حداقل موجودی هشدار
                        <input
                          type="text"
                          inputMode="numeric"
                          disabled={editForm.type === "service"}
                          value={editForm.minStock}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              minStock: formatNumberInput(e.target.value),
                            })
                          }
                        />
                      </label>

                      <div className="product-edit-actions">
                        <button type="submit" className="product-save-btn">
                          ذخیره تغییرات
                        </button>

                        <button
                          type="button"
                          className="product-cancel-btn"
                          onClick={cancelEditProduct}
                        >
                          انصراف
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="product-actions">
                    <button
                      type="button"
                      className="product-edit-btn"
                      onClick={() => startEditProduct(product)}
                    >
                      ویرایش
                    </button>

                    <button
                      type="button"
                      className="product-delete-btn"
                      onClick={() => onDeleteProduct(product.id)}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

export default ProductsPage;