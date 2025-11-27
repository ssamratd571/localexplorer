export default function Agriculture() {
  return (
    <div
      className="min-h-screen w-full p-6 text-white"
      style={{
        backgroundImage: 'url("/Tea.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-6xl mx-auto mt-8 space-y-8">

        {/* TITLE */}
        <div className="bg-gradient-to-r from-emerald-700/50 to-teal-900/50 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-center shadow-xl">
          <h1 className="text-3xl font-extrabold tracking-wide">
            🌱 Smart Tea Farming
          </h1>
          <p className="opacity-90 mt-1 text-sm sm:text-base">
            Live monitoring • Market overview • Export–Import snapshot • Knowledge hub
          </p>
        </div>

        {/* GRID: Sensor + Market Price */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* SENSOR MONITORING (CLICKABLE) */}
          <div
            className="cursor-pointer group rounded-2xl p-6 shadow-xl border border-white/20
                       bg-gradient-to-br from-emerald-600/40 to-emerald-900/40 backdrop-blur-lg
                       hover:scale-[1.02] hover:from-emerald-500/50 hover:to-emerald-900/60 transition"
            onClick={() => window.open("https://hefa-project-s1.web.app/", "_blank")}
            title="Open Live Sensor Dashboard"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">📡</div>
              <div>
                <h2 className="text-2xl font-bold">Live Sensor Monitoring</h2>
                <p className="opacity-90 mt-1">
                  Real-time soil moisture, pH, temperature & nutrients (N-P-K) for smart tea farming.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 text-center">
              <div className="rounded-xl py-3 bg-black/30">🌡️ Temp</div>
              <div className="rounded-xl py-3 bg-black/30">💧 Moisture</div>
              <div className="rounded-xl py-3 bg-black/30">⚗️ pH</div>
              <div className="rounded-xl py-3 bg-black/30">🧪 NPK</div>
            </div>

            <div className="mt-4 text-right text-sm opacity-90 group-hover:underline">
              Open live dashboard →
            </div>
          </div>

          {/* MARKET PRICE (GRAPHICAL) */}
          <div className="rounded-2xl p-6 shadow-xl border border-white/20 bg-gradient-to-br from-violet-600/40 to-indigo-900/40 backdrop-blur-lg">
            <h2 className="text-2xl font-bold text-center mb-3">💹 Tea Market Price Overview</h2>
            <p className="text-center text-sm sm:text-base opacity-90">
              Indicative range (per kg). Update these numbers as needed.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="bg-gradient-to-br from-green-500/40 to-green-900/40 p-4 text-center rounded-xl border border-white/20 hover:scale-105 duration-300">
                <h3 className="text-xl font-bold">🍃 Green Leaf</h3>
                <p className="text-2xl font-black mt-2 text-yellow-200">₹30–₹60</p>
                <p className="text-sm opacity-80">per Kg</p>
              </div>
              <div className="bg-gradient-to-br from-amber-600/40 to-amber-900/40 p-4 text-center rounded-xl border border-white/20 hover:scale-105 duration-300">
                <h3 className="text-xl font-bold">🏭 CTC Tea</h3>
                <p className="text-2xl font-black mt-2 text-yellow-200">₹180–₹350</p>
                <p className="text-sm opacity-80">per Kg</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/40 to-purple-900/40 p-4 text-center rounded-xl border border-white/20 hover:scale-105 duration-300">
                <h3 className="text-xl font-bold">🫖 Orthodox Tea</h3>
                <p className="text-2xl font-black mt-2 text-yellow-200">₹300–₹650</p>
                <p className="text-sm opacity-80">per Kg</p>
              </div>
            </div>
          </div>
        </div>

        {/* GRID: Export + Import */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* EXPORT */}
          <div className="rounded-2xl p-6 shadow-xl border border-white/20 bg-gradient-to-br from-amber-700/40 to-orange-900/40 backdrop-blur-lg">
            <h2 className="text-2xl font-bold mb-2">🌍 Tea Export (India)</h2>
            <p className="opacity-90 text-sm sm:text-base">
              Darjeeling & Assam teas are widely exported. Key buyers:
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-3 py-2 rounded-full bg-black/30">🇦🇪 UAE</span>
              <span className="px-3 py-2 rounded-full bg-black/30">🇷🇺 Russia</span>
              <span className="px-3 py-2 rounded-full bg-black/30">🇮🇷 Iran</span>
              <span className="px-3 py-2 rounded-full bg-black/30">🇺🇸 USA</span>
              <span className="px-3 py-2 rounded-full bg-black/30">🇬🇧 UK</span>
              <span className="px-3 py-2 rounded-full bg-black/30">🇩🇪 Germany</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 text-center text-sm">
              <div className="rounded-xl py-3 bg-black/30">☕ Darjeeling</div>
              <div className="rounded-xl py-3 bg-black/30">🟤 Assam</div>
              <div className="rounded-xl py-3 bg-black/30">🫖 Orthodox</div>
              <div className="rounded-xl py-3 bg-black/30">🏭 CTC</div>
            </div>
          </div>

          {/* IMPORT */}
          <div className="rounded-2xl p-6 shadow-xl border border-white/20 bg-gradient-to-br from-cyan-700/40 to-sky-900/40 backdrop-blur-lg">
            <h2 className="text-2xl font-bold mb-2">🌏 Tea Import (into India)</h2>
            <p className="opacity-90 text-sm sm:text-base">
              India also imports specialty & bulk tea for blending:
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-3 py-2 rounded-full bg-black/30">🇨🇳 China</span>
              <span className="px-3 py-2 rounded-full bg-black/30">🇱🇰 Sri Lanka</span>
              <span className="px-3 py-2 rounded-full bg-black/30">🇰🇪 Kenya</span>
              <span className="px-3 py-2 rounded-full bg-black/30">🇮🇩 Indonesia</span>
              <span className="px-3 py-2 rounded-full bg-black/30">🇻🇳 Vietnam</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 text-center text-sm">
              <div className="rounded-xl py-3 bg-black/30">🫖 Orthodox</div>
              <div className="rounded-xl py-3 bg-black/30">🏭 CTC</div>
              <div className="rounded-xl py-3 bg-black/30">🍵 Green Tea</div>
            </div>
          </div>
        </div>

        {/* KNOWLEDGE HUB */}
        <div className="rounded-2xl p-6 shadow-xl border border-white/20 bg-gradient-to-br from-emerald-500/40 to-lime-800/40 backdrop-blur-lg">
          <h2 className="text-2xl font-bold mb-3">📘 Agriculture Knowledge Hub</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="rounded-xl p-4 bg-black/30">
              <h3 className="font-semibold mb-2">🌿 Soil & Water</h3>
              <ul className="list-disc ml-5 space-y-1 text-sm sm:text-base">
                <li>Test soil pH; ideal tea range ~4.5–5.5</li>
                <li>Use drip/soaker irrigation to save water</li>
                <li>Mulching reduces evaporation & weeds</li>
              </ul>
            </div>

            <div className="rounded-xl p-4 bg-black/30">
              <h3 className="font-semibold mb-2">🧪 Nutrients</h3>
              <ul className="list-disc ml-5 space-y-1 text-sm sm:text-base">
                <li>Balance N-P-K as per leaf analysis</li>
                <li>Add organic matter for soil carbon</li>
                <li>Split fertilizer doses post-pruning</li>
              </ul>
            </div>

            <div className="rounded-xl p-4 bg-black/30">
              <h3 className="font-semibold mb-2">🪲 Pest & Disease</h3>
              <ul className="list-disc ml-5 space-y-1 text-sm sm:text-base">
                <li>Weekly scouting & sticky traps</li>
                <li>Prefer bio-control before chemicals</li>
                <li>Rotate actives to avoid resistance</li>
              </ul>
            </div>

            <div className="rounded-xl p-4 bg-black/30">
              <h3 className="font-semibold mb-2">🌳 Shade & Pruning</h3>
              <ul className="list-disc ml-5 space-y-1 text-sm sm:text-base">
                <li>Maintain suitable shade tree cover</li>
                <li>Timely light skiff & prune cycles</li>
                <li>Rejuvenation pruning for old bushes</li>
              </ul>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

