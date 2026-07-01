import { useState } from "react";

const USERS_KEY = "financeUsers";
const CURRENT_USER_KEY = "financeCurrentUser";

function Auth({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const getUsers = () => {
    const savedUsers = localStorage.getItem(USERS_KEY);

    if (savedUsers) {
      try {
        return JSON.parse(savedUsers);
      } catch {
        return [];
      }
    }

    return [];
  };

  const saveUsers = (users) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanEmail === "" || cleanPassword === "") {
      alert("لطفا ایمیل و رمز عبور را وارد کنید");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      alert("لطفا یک ایمیل معتبر وارد کنید");
      return;
    }

    if (cleanPassword.length < 6) {
      alert("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }

    const users = getUsers();

    if (isRegister) {
      const userExists = users.some((user) => user.email === cleanEmail);

      if (userExists) {
        alert("این ایمیل قبلا ثبت شده است");
        return;
      }

      const newUser = {
        id: Date.now(),
        email: cleanEmail,
        password: cleanPassword,
      };

      const updatedUsers = [...users, newUser];

      saveUsers(updatedUsers);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
      onLogin(newUser);

      setEmail("");
      setPassword("");

      return;
    }

    const foundUser = users.find(
      (user) => user.email === cleanEmail && user.password === cleanPassword
    );

    if (!foundUser) {
      alert("ایمیل یا رمز عبور اشتباه است");
      return;
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(foundUser));
    onLogin(foundUser);

    setEmail("");
    setPassword("");
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>مدیریت مالی شخصی</h1>

        <h2>{isRegister ? "ثبت نام" : "ورود"}</h2>

        <form onSubmit={handleSubmit}>
          <label>ایمیل</label>
          <input
            type="email"
            placeholder="مثلا: user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>رمز عبور</label>
          <input
            type="password"
            placeholder="حداقل ۶ کاراکتر"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">{isRegister ? "ساخت حساب" : "ورود"}</button>
        </form>

        <button
          className="switch-auth-btn"
          onClick={() => {
            setIsRegister(!isRegister);
            setEmail("");
            setPassword("");
          }}
        >
          {isRegister
            ? "قبلا حساب ساخته ام"
            : "حساب کاربری ندارم"}
        </button>
      </section>
    </main>
  );
}

export default Auth;