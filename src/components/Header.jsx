function Header({ currentUser, onLogout }) {
  return (
    <header>
      <h1>مدیریت مالی شخصی</h1>

      <div className="user-box">
        <span>کاربر: {currentUser.email}</span>

        <button className="logout-btn" onClick={onLogout}>
          خروج
        </button>
      </div>
    </header>
  );
}

export default Header;