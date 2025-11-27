// src/pages/auth/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerWithEmail } from "../../services/authService";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    adminCode: ""
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await registerWithEmail(form);
      navigate("/dashboard");
    } catch (error) {
      setErr(error.message);
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen w-full flex justify-center items-center p-4 relative"
      style={{
        backgroundImage: 'url("/Tea.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/35"></div>

      {/* LOGOS TOP */}
      <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center text-center">

        <div className="flex gap-3 md:gap-8 items-center bg-black/40 px-2 md:px-6 py-2 md:py-3 backdrop-blur-sm rounded-xl max-w-[90vw] overflow-x-auto">
          <img src="/NIT.jpeg" alt="NIT" className="h-6 md:h-12 w-auto" />
          <img src="/India.jpg" alt="India" className="h-6 md:h-12 w-auto" />
          <img src="/HEFA.jpeg" alt="HEFA" className="h-6 md:h-12 w-auto" />
        </div>

        <p className="text-white font-semibold mt-2 md:mt-3 max-w-[90vw] md:max-w-3xl text-center text-[8px] sm:text-[10px] md:text-base leading-tight drop-shadow-[0_0_6px_rgba(0,0,0,0.9)] break-words">
          Smart and Effective IoT and GNSS Technology based Tea farming <br className="block md:hidden" />
          and Tourism for Tea Community Development.
        </p>

      </div>

      {/* PARTICLE STARS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="star w-2 h-2 left-[10%] bottom-[5%] animation-delay-[0s]"></div>
        <div className="star w-3 h-3 left-[35%] bottom-[10%] animation-delay-[2s]"></div>
        <div className="star w-2 h-2 left-[60%] bottom-[3%] animation-delay-[4s]"></div>
        <div className="star w-1 h-1 left-[80%] bottom-[8%] animation-delay-[1s]"></div>
        <div className="star w-3 h-3 left-[25%] bottom-[15%] animation-delay-[3s]"></div>
        <div className="star w-2 h-2 left-[50%] bottom-[7%] animation-delay-[5s]"></div>
      </div>

      {/* REGISTER CARD */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 md:p-6 w-full max-w-md shadow-xl relative z-20 mt-20 md:mt-36">
        <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-6">Create Account</h1>

        <form onSubmit={submit} className="space-y-4">
          <input name="displayName" placeholder="Name" value={form.displayName} onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white/80 outline-none text-black" />

          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white/80 outline-none text-black" />

          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white/80 outline-none text-black" />

          <input name="adminCode" placeholder="Admin Secret Code (optional)" value={form.adminCode} onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white/70 outline-none text-black" />

          {err && <p className="text-red-200 text-center">{err}</p>}

          <button className="w-full px-4 py-3 rounded-xl bg-black/80 text-white hover:bg-black transition">
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-white/80 text-center mt-6 text-sm md:text-base">
          Already have account? <Link to="/login" className="underline">Login</Link>
        </p>
      </div>
    </div>
  );
}




