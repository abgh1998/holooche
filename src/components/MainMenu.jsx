function MainMenu({ activePage, onChangePage }) {
  const menuItems = [
    {
      id: "dashboard",
      title: "داشبورد",
      icon: "📊",
    },
    {
      id: "cash",
      title: "دریافت و پرداخت",
      icon: "💳",
    },
    {
      id: "sales",
      title: "فاکتور فروش",
      icon: "🧾",
    },
    {
      id: "products",
      title: "کالا و خدمات",
      icon: "📦",
    },
    {
      id: "customers",
      title: "طرف حساب‌ها",
      icon: "👥",
    },
    {
      id: "reports",
      title: "گزارش‌ها",
      icon: "📈",
    },
  ];

  return (
    <nav className="main-menu">
      {menuItems.map((item) => (
        <button
          key={item.id}
          className={`menu-btn ${activePage === item.id ? "active" : ""}`}
          onClick={() => onChangePage(item.id)}
        >
          <span className="menu-icon">{item.icon}</span>
          <span>{item.title}</span>
        </button>
      ))}
    </nav>
  );
}

export default MainMenu;