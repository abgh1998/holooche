import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const CURRENT_USER_KEY = "financeCurrentUser";

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetMessages = () => {
    setMessage("");
    setError("");
  };

  const saveLoggedInUser = (user) => {
    const appUser = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email,
      role: user.email === "abgh1998@gmail.com" ? "admin" : "user",
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(appUser));
    onLogin(appUser);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    resetMessages();

    if (!isValidEmail(email)) {
      setError("لطفاً یک ایمیل معتبر وارد کنید.");
      return;
    }

    if (!password) {
      setError("لطفاً رمز عبور را وارد کنید.");
      return;
    }

    setIsLoading(true);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (loginError) {
      setError("ایمیل یا رمز عبور اشتباه است.");
      return;
    }

    if (data.user) {
      saveLoggedInUser(data.user);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    resetMessages();

    if (!fullName.trim()) {
      setError("لطفاً نام و نام خانوادگی را وارد کنید.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("لطفاً یک ایمیل معتبر وارد کنید.");
      return;
    }

    if (password.length < 8) {
      setError("رمز عبور باید حداقل ۸ کاراکتر باشد.");
      return;
    }

    setIsLoading(true);

    const { error: registerError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    setIsLoading(false);

    if (registerError) {
      setError(registerError.message);
      return;
    }

    setMessage(
      "ثبت‌نام انجام شد. لطفاً ایمیل خود را بررسی کنید و لینک تأیید حساب را بزنید."
    );
    setMode("login");
    setPassword("");
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    resetMessages();

    if (!isValidEmail(email)) {
      setError("برای بازیابی رمز، لطفاً ایمیل معتبر وارد کنید.");
      return;
    }

    setIsLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: window.location.origin,
      }
    );

    setIsLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage("لینک بازیابی رمز عبور به ایمیل شما ارسال شد.");
  };

  const pageTitle =
    mode === "login"
      ? "ورود به حساب کاربری"
      : mode === "register"
      ? "ایجاد حساب کاربری"
      : "بازیابی رمز عبور";

  const pageDescription =
    mode === "login"
      ? "برای ورود به پنل مالی Holooche اطلاعات خود را وارد کنید."
      : mode === "register"
      ? "برای شروع استفاده از سیستم، حساب کاربری خود را بسازید."
      : "ایمیل خود را وارد کنید تا لینک بازیابی رمز برای شما ارسال شود.";

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">H</div>
          <div>
            <h1>Holooche</h1>
            <p>سیستم مدیریت مالی و حسابداری</p>
          </div>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "auth-tab active" : "auth-tab"}
            onClick={() => {
              setMode("login");
              resetMessages();
            }}
          >
            ورود
          </button>

          <button
            type="button"
            className={mode === "register" ? "auth-tab active" : "auth-tab"}
            onClick={() => {
              setMode("register");
              resetMessages();
            }}
          >
            ثبت‌نام
          </button>
        </div>

        <div className="auth-heading">
          <h2>{pageTitle}</h2>
          <p>{pageDescription}</p>
        </div>

        {message && <div className="auth-message success">{message}</div>}
        {error && <div className="auth-message error">{error}</div>}

        <form
          className="auth-form"
          onSubmit={
            mode === "login"
              ? handleLogin
              : mode === "register"
              ? handleRegister
              : handleResetPassword
          }
        >
          {mode === "register" && (
            <label>
              نام و نام خانوادگی
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="مثلاً علی رضایی"
              />
            </label>
          )}

          <label>
            ایمیل
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@email.com"
            />
          </label>

          {mode !== "forgot" && (
            <label>
              رمز عبور
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="حداقل ۸ کاراکتر"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "مخفی" : "نمایش"}
                </button>
              </div>
            </label>
          )}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading
              ? "لطفاً صبر کنید..."
              : mode === "login"
              ? "ورود"
              : mode === "register"
              ? "ایجاد حساب"
              : "ارسال لینک بازیابی"}
          </button>
        </form>

        <div className="auth-footer">
          {mode === "login" && (
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                resetMessages();
              }}
            >
              رمز عبور را فراموش کرده‌اید؟
            </button>
          )}

          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                resetMessages();
              }}
            >
              بازگشت به ورود
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

export default Auth;
