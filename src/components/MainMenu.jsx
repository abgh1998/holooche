const menuItems = [
  {
    id: "dashboard",
    title: "صفحه اصلی",
    icon: "🏠",
  },
  {
    id: "cash",
    title: "صندوق",
    icon: "💰",
  },
  {
    id: "sales",
    title: "فاکتور فروش",
    icon: "🧾",
  },
  {
    id: "products",
    title: "کالاها و خدمات",
    icon: "📦",
  },
  {
    id: "customers",
    title: "مشتریان",
    icon: "👥",
  },
  {
    id: "reports",
    title: "گزارش‌ها",
    icon: "📊",
  },
];

function MainMenu({ activePage, onChangePage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-title">
        <span>Holooche</span>
        <small>سیستم مالی</small>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              activePage === item.id
                ? "sidebar-link sidebar-link-active"
                : "sidebar-link"
            }
            onClick={() => onChangePage(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.title}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default MainMenu;