// src/pages/auth/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginWithEmail } from "../../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await loginWithEmail(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      alert(err.message);
    }
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

      {/* TOP LOGOS + TITLE */}
      <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center text-center">
        <div className="flex gap-3 md:gap-8 items-center bg-black/40 px-4 md:px-6 py-2 md:py-3 backdrop-blur-sm rounded-xl">
          <img src="/NIT.jpeg" alt="NIT" className="h-8 md:h-12 w-auto" />
          <img src="/India.jpg" alt="India" className="h-8 md:h-12 w-auto" />
          <img src="/HEFA.jpeg" alt="HEFA" className="h-8 md:h-12 w-auto" />
        </div>

        <p className="typing text-white font-semibold mt-2 md:mt-3 mx-auto text-center text-[10px] sm:text-xs md:text-base w-[90vw] md:w-auto leading-tight">
  Smart and Effective IoT and GNSS Technology based Tea farming <br className="block md:hidden" />
  and Tourism for Tea Community Development
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

      {/* LOGIN CARD */}
      <div className="bg-white/20 backdrop-blur-lg border border-white/30 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-xl relative z-10 mt-36 md:mt-40">
        <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-6">
          Digital Tourism Login
        </h1>

        <form className="space-y-4" onSubmit={submit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white/80 outline-none text-black"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white/80 outline-none text-black"
          />

          <button
            className="w-full px-4 py-3 rounded-xl bg-black/80 text-white hover:bg-black transition"
            type="submit"
          >
            Sign In
          </button>
        </form>

        <p className="text-white/80 text-center mt-6 text-sm md:text-base">
          No account? <Link to="/register" className="underline">Register</Link>
        </p>
      </div>
    </div>
  );
}






