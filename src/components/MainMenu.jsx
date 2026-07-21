function MainMenu({ activePage, onChangePage }) {
  const menuItems = [
    {
      id: "dashboard",
      title: "داشبورد",
    },
    {
      id: "cash",
      title: "صندوق",
    },
    {
      id: "sales",
      title: "فاکتور فروش",
    },
    {
      id: "purchases",
      title: "فاکتور خرید",
    },
    {
      id: "products",
      title: "کالاها و خدمات",
    },
    {
      id: "customers",
      title: "طرف حساب‌ها",
    },
    {
      id: "ledger",
      title: "دفتر حساب",
    },
    {
      id: "reports",
      title: "گزارش‌ها",
    },
  ];

  return (
    <aside className="main-menu">
      <div className="menu-title">
        <h2>هلوچه</h2>
        <p>سیستم حسابداری</p>
      </div>

      <div className="menu-items">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activePage === item.id ? "active" : ""}
            onClick={() => onChangePage(item.id)}
          >
            {item.title}
          </button>
        ))}
      </div>
    </aside>
  );
}

export default MainMenu;