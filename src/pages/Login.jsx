import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form.email, form.password, form.name);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body gap-4">
          <div className="text-center mb-2">
            <h1 className="text-3xl font-bold">🧪 TestVerse</h1>
            <p className="text-base-content/60 text-sm mt-1">Automated Website Testing</p>
          </div>
          <div className="tabs tabs-boxed">
            <button className={`tab flex-1 ${mode === "login" ? "tab-active" : ""}`} onClick={() => setMode("login")}>Login</button>
            <button className={`tab flex-1 ${mode === "register" ? "tab-active" : ""}`} onClick={() => setMode("register")}>Register</button>
          </div>
          {mode === "register" && (
            <input name="name" type="text" placeholder="Full name" className="input input-bordered w-full" value={form.name} onChange={handle} />
          )}
          <input name="email" type="email" placeholder="Email address" className="input input-bordered w-full" value={form.email} onChange={handle} />
          <input name="password" type="password" placeholder="Password (min 8 chars)" className="input input-bordered w-full"
            value={form.password} onChange={handle} onKeyDown={(e) => e.key === "Enter" && submit()} />
          {error && <div className="alert alert-error text-sm py-2">{error}</div>}
          <button className="btn btn-primary w-full" onClick={submit} disabled={loading}>
            {loading ? <span className="loading loading-spinner" /> : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
