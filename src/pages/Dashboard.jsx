import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { FaLeaf, FaClipboardList, FaUserCheck } from "react-icons/fa";

export default function Dashboard() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [openMenu, setOpenMenu] = useState(false); // MOBILE MENU

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setRole(null);
        return navigate("/login");
      }

      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.exists() ? snap.data() : {};

      const nameFromDb = data.displayName || data.name || data.fullName || "";
      const nameFromAuth =
        user.displayName || (user.email ? user.email.split("@")[0] : "");

      setRole(data.role || "user");
      setUserName(nameFromDb || nameFromAuth || "Guest");
    });

    return () => unsubscribe();
  }, [navigate]);

  if (role === null) {
    return <div className="text-white p-10 text-2xl">Loading...</div>;
  }

  const displayRole =
    role === "admin" ? "Admin" : role === "owner" ? "Owner" : "User";

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative">
      {/* MOBILE MENU BUTTON */}
      <button
        className="md:hidden absolute top-4 left-4 z-50 text-white bg-black/60 p-2 rounded"
        onClick={() => setOpenMenu(!openMenu)}
      >
        ☰
      </button>

      {/* SIDEBAR */}
      <div
        className={
          `fixed md:static top-0 left-0 h-screen md:h-full w-64 overflow-y-auto bg-[#2b1f4f] text-white p-6 flex flex-col gap-4 z-40 transform transition-transform duration-300 ` +
          (openMenu ? "translate-x-0" : "-translate-x-full md:translate-x-0")
        }
      >
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <FaLeaf /> Dashboard
        </h2>

        <button
          onClick={() => {
            navigate("/hotels");
            setOpenMenu(false);
          }}
          className="bg-[#493a86] rounded-lg py-3 px-4"
        >
          🏘️Accommodation
        </button>
        <button
          onClick={() => {
            navigate("/dashboard/cars");
            setOpenMenu(false);
          }}
          className="bg-[#493a86] rounded-lg py-3 px-4"
        >
          🚎Transport
        </button>
        <button
          onClick={() => {
            navigate("/cuisine");
            setOpenMenu(false);
          }}
          className="bg-[#493a86] rounded-lg py-3 px-4"
        >
          🍱Cuisine
        </button>
        <button
          onClick={() => {
            navigate("/shopping");
            setOpenMenu(false);
          }}
          className="bg-[#493a86] rounded-lg py-3 px-4"
        >
          🛍️Shopping
        </button>
        <button
          onClick={() => {
            navigate("/weather");
            setOpenMenu(false);
          }}
          className="bg-[#493a86] rounded-lg py-3 px-4"
        >
          🌧️☀️Live Weather
        </button>
        <button
          onClick={() => {
            navigate("/tourist");
            setOpenMenu(false);
          }}
          className="bg-[#493a86] rounded-lg py-3 px-4"
        >
          🌏Tourist Places
        </button>
        <button
          onClick={() => {
            navigate("/elearning");
            setOpenMenu(false);
          }}
          className="bg-[#493a86] rounded-lg py-3 px-4"
        >
          📒E-learning
        </button>

        {/* NEW AGRICULTURE BUTTON */}
        <button
          onClick={() => {
            navigate("/agriculture");
            setOpenMenu(false);
          }}
          className="bg-[#493a86] rounded-lg py-3 px-4"
        >
          🌱Agriculture
        </button>

        <button
          onClick={() => {
            navigate("/support");
            setOpenMenu(false);
          }}
          className="bg-[#493a86] rounded-lg py-3 px-4"
        >
          🙎‍♂️Technical Team
        </button>

        {role === "admin" && (
          <button
            onClick={() => {
              navigate("/dashboard/upload");
              setOpenMenu(false);
            }}
            className="bg-[#6d54cd] rounded-lg py-3 px-4 font-semibold"
          >
            Upload Data
          </button>
        )}

        <button
          onClick={handleLogout}
          className="bg-red-500 rounded-lg py-3 px-4 mt-auto"
        >
          Logout
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div
        className="flex-1 p-4 sm:p-8 text-white flex flex-col items-center justify-start pt-16 md:pt-10 relative"
        style={{
          backgroundImage: 'url("/Tea.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* 🔵 RESPONSIVE ORDER BUBBLES */}
        <div
          className="
            z-30 w-full flex gap-3 
            justify-center mt-2
            md:mt-0 md:w-auto md:justify-end
            md:absolute md:top-4 md:right-4
          "
        >
          {/* User orders (any logged-in user) */}
          <button
            onClick={() => navigate("/my-orders")}
            className="
              w-20 h-20 md:w-24 md:h-24 
              rounded-full bg-white/20 border border-white/40 shadow-lg
              flex flex-col items-center justify-center 
              text-[10px] md:text-xs font-semibold
              hover:bg-white/30 backdrop-blur-md
            "
          >
            <FaClipboardList className="mb-1 text-base md:text-lg" />
            <span>My Orders</span>
          </button>

          {/* Owner/Admin orders */}
          {(role === "owner" || role === "admin") && (
            <button
              onClick={() => navigate("/owner-orders")}
              className="
                w-20 h-20 md:w-24 md:h-24
                rounded-full bg-emerald-400/25 border border-emerald-200
                shadow-lg flex flex-col items-center justify-center 
                text-[10px] md:text-xs font-semibold
                hover:bg-emerald-400/35 backdrop-blur-md
              "
            >
              <FaUserCheck className="mb-1 text-base md:text-lg" />
              <span>Owner Approval</span>
            </button>
          )}
        </div>

        {/* floating bubbles background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bubble w-20 h-20 bg-white/45 left-[20%] animation-delay-[0s]"></div>
          <div className="bubble w-24 h-24 bg-white/70 left-[50%] animation-delay-[2s]"></div>
          <div className="bubble w-16 h-16 bg-white/45 left-[70%] animation-delay-[4s]"></div>
        </div>

        {/* LOGOS */}
        <div className="relative z-10 w-full flex justify-center mt-6 mb-4">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 bg-black/30 px-4 py-3 rounded-xl backdrop-blur-sm">
            <img src="/NIT.jpeg" alt="NIT" className="h-12 w-auto" />
            <img src="/India.jpg" alt="India" className="h-12 w-auto" />
            <img src="/HEFA.jpeg" alt="HEFA" className="h-12 w-auto" />
          </div>
        </div>

        {/* TEXT SECTION */}
        <div className="relative z-10 max-w-3xl text-center drop-shadow-[0_0_6px_rgba(0,0,0,0.9)]">
          <h1 className="text-2xl sm:text-3xl font-semibold mb-6">
            Welcome {displayRole}{" "}
            <span className="text-yellow-200">{userName}</span>{" "}
            {role === "admin" ? "👑" : "🙂"}
          </h1>

          <p className="mb-2 text-base sm:text-lg font-medium">
            Smart and Effective IoT and GNSS Technology based Tea farming and
            Tourism for Tea Community Development
          </p>
          <p className="mb-2 text-base sm:text-lg font-medium">
            A CSR activity of Higher Education Financial Agency (HEFA)
          </p>
          <p className="mb-2 text-base sm:text-lg font-medium">
            Higher Education Financing Agency (HEFA) is a joint venture of MoE
            Government of India and Canara Bank
          </p>
          <p className="mb-6 text-base sm:text-lg font-medium">
            Implemented by NIT Jamshedpur
          </p>
        </div>
      </div>
    </div>
  );
}






