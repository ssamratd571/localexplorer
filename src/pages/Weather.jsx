import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom map icon
const icon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1116/1116453.png",
  iconSize: [40, 40],
});

export default function Weather() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [query, setQuery] = useState("Jamshedpur");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coords, setCoords] = useState({ lat: 22.8, lon: 86.2 });
  const API_KEY = "1f76b2e008377a8550a88aba56f7b5b0";

  // Load weather data
  const loadWeather = async (city) => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );
      const data = await res.json();
      if (data.cod !== 200) throw new Error(data.message);
      setWeather(data);
      setCoords({ lat: data.coord.lat, lon: data.coord.lon });

      // Forecast
      const resForecast = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
      );
      const forecastData = await resForecast.json();
      const list = forecastData.list
        .filter((_, i) => i % 8 === 0)
        .map((d) => ({
          date: new Date(d.dt * 1000).toLocaleDateString("en-IN", {
            weekday: "short",
          }),
          temp: d.main.temp,
          rain: d.pop * 100,
          condition: d.weather[0].main,
        }));
      setForecast(list);
    } catch (err) {
      setError("City not found!");
    } finally {
      setLoading(false);
    }
  };

  // Load via GPS
  const loadByLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
        );
        const data = await res.json();
        setWeather(data);
        setCoords({ lat: latitude, lon: longitude });

        const resForecast = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
        );
        const forecastData = await resForecast.json();
        const list = forecastData.list
          .filter((_, i) => i % 8 === 0)
          .map((d) => ({
            date: new Date(d.dt * 1000).toLocaleDateString("en-IN", {
              weekday: "short",
            }),
            temp: d.main.temp,
            rain: d.pop * 100,
            condition: d.weather[0].main,
          }));
        setForecast(list);
      },
      () => alert("Location access denied.")
    );
  };

  useEffect(() => {
    loadWeather(query);
  }, []);

  const getBackground = () => {
    if (!weather) return "from-gray-800 to-gray-900";
    const c = weather.weather[0].main.toLowerCase();
    if (c.includes("rain")) return "from-blue-800 via-sky-700 to-gray-900";
    if (c.includes("cloud")) return "from-gray-600 via-slate-700 to-gray-900";
    if (c.includes("clear")) return "from-yellow-400 via-orange-500 to-red-600";
    if (c.includes("snow")) return "from-blue-200 via-blue-400 to-indigo-600";
    if (c.includes("thunder")) return "from-indigo-700 via-purple-700 to-black";
    return "from-gray-700 to-gray-900";
  };

  const formatTime = (unix) =>
    new Date(unix * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${getBackground()} text-white flex flex-col items-center justify-start p-6 transition-all duration-700`}
    >
      <div className="w-full max-w-3xl bg-white/20 p-6 rounded-2xl backdrop-blur-md border border-white/30 shadow-2xl mt-10">
        <h1 className="text-4xl font-bold mb-4 text-center">
          🌦️ Smart Weather Dashboard
        </h1>

        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadWeather(query);
          }}
          className="flex flex-col sm:flex-row gap-2 mb-4"
        >
          <input
            type="text"
            placeholder="Search city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl text-black"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl font-semibold"
          >
            Search
          </button>
          <button
            type="button"
            onClick={loadByLocation}
            className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-xl font-semibold"
          >
            📍 My Location
          </button>
        </form>

        {loading && <p className="text-center text-lg">Loading...</p>}
        {error && <p className="text-center text-red-300">{error}</p>}

        {/* Weather Info */}
        {weather && weather.main && (
          <>
            <div className="text-center mb-4">
              <h2 className="text-4xl font-bold mb-1">{weather.name}</h2>
              <p className="text-xl mb-2 capitalize">
                {weather.weather[0].description}
              </p>

              <div className="flex justify-center items-center gap-3 mb-4">
                <img
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                  alt="icon"
                  className="w-24 h-24"
                />
                <div>
                  <p className="text-5xl font-bold">{weather.main.temp}°C</p>
                  <p className="text-sm opacity-80">
                    Feels like {weather.main.feels_like}°C
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-left bg-white/10 p-4 rounded-xl mb-4">
                <p>💧 Humidity: {weather.main.humidity}%</p>
                <p>🌬️ Wind: {weather.wind.speed} m/s</p>
                <p>📊 Pressure: {weather.main.pressure} hPa</p>
                <p>🌡️ Min: {weather.main.temp_min}°C / Max: {weather.main.temp_max}°C</p>
                <p>🌅 Sunrise: {formatTime(weather.sys.sunrise)}</p>
                <p>🌇 Sunset: {formatTime(weather.sys.sunset)}</p>
              </div>
            </div>

            {/* 5-Day Forecast */}
            {forecast.length > 0 && (
              <>
                <h3 className="text-2xl font-semibold mt-6 mb-3 text-center">
                  5-Day Forecast
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                  {forecast.map((f, i) => {
                    const temp = f.temp;
                    let bg = "from-blue-500 to-blue-700";
                    if (temp >= 30) bg = "from-red-500 to-orange-600";
                    else if (temp >= 25) bg = "from-yellow-400 to-orange-500";
                    else if (temp >= 20) bg = "from-green-400 to-emerald-600";
                    else if (temp >= 15) bg = "from-sky-400 to-blue-500";
                    else bg = "from-indigo-500 to-purple-700";

                    return (
                      <div
                        key={i}
                        className={`bg-gradient-to-br ${bg} rounded-2xl p-3 flex flex-col items-center text-sm text-white shadow-md hover:scale-105 transform transition-all duration-300 animate-gradient`}
                      >
                        <p className="font-semibold mb-1">{f.date}</p>
                        <img
                          src={`https://openweathermap.org/img/wn/10d.png`}
                          alt="forecast"
                          className="w-10 h-10 my-1 drop-shadow-md"
                        />
                        <p className="text-lg font-bold">{f.temp.toFixed(1)}°C</p>
                        <p className="text-sm opacity-90">
                          🌧 {Math.round(f.rain)}% rain
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Chart Section */}
<div className="w-full h-[22rem] sm:h-[26rem]">
  <ResponsiveContainer width="100%" height="100%">
    <LineChart
      data={forecast}
      margin={{
        top: 20,
        right: 25,
        left: 10,
        bottom: 60,
      }}
    >
      {/* Grid */}
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />

      {/* X Axis */}
      <XAxis
        dataKey="date"
        stroke="#fff"
        tick={{ fill: "#fff", fontSize: 12 }}
        label={{
          value: "Days",
          position: "insideBottom",
          offset: -10,
          fill: "white",
          fontSize: 14,
          fontWeight: "600",
        }}
      />

      {/* Y Axis */}
      <YAxis
  stroke="#fff"
  tick={{ fill: "#fff", fontSize: 12 }}
  domain={[0, "dataMax + 5"]}
  label={{
    value: "Temperature (°C) / Rain (%)",
    angle: -90,
    position: "insideLeft",
    offset: -5, // negative moves label slightly inward
    dy: 50, // vertical shift to center visually
    fill: "white",
    fontSize: 13,
    fontWeight: "600",
    textAnchor: "middle",
  }}
/>


      {/* Tooltip */}
      <Tooltip
        contentStyle={{
          backgroundColor: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: "10px",
          color: "white",
        }}
        itemStyle={{ color: "white" }}
        labelStyle={{ color: "#eee" }}
      />

      {/* Legend */}
      <Legend
        verticalAlign="top"
        align="center"
        iconType="circle"
        wrapperStyle={{
          color: "white",
          fontSize: 13,
          fontWeight: "600",
        }}
      />

      {/* Temperature Line */}
      <Line
        type="monotone"
        dataKey="temp"
        stroke="url(#tempGradient)"
        strokeWidth={3}
        dot={{ r: 5 }}
        activeDot={{ r: 7 }}
        name="Temperature (°C)"
        isAnimationActive={true}
      />

      {/* Rain Line */}
      <Line
        type="monotone"
        dataKey="rain"
        stroke="url(#rainGradient)"
        strokeWidth={3}
        strokeDasharray="5 5"
        name="Rain (%)"
        isAnimationActive={true}
      />

      {/* Gradient Colors */}
      <defs>
        <linearGradient id="tempGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff6b6b" />
          <stop offset="100%" stopColor="#ffa94d" />
        </linearGradient>
        <linearGradient id="rainGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#36a2eb" />
          <stop offset="100%" stopColor="#4bc0c0" />
        </linearGradient>
      </defs>
    </LineChart>
  </ResponsiveContainer>
</div>

              </>
            )}
          </>
        )}
      </div>

      {/* Map */}
      {coords && (
        <div className="mt-8 w-full max-w-3xl h-80 rounded-2xl overflow-hidden border border-white/30 shadow-xl">
          <MapContainer
            center={[coords.lat, coords.lon]}
            zoom={10}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap"
            />
            <Marker position={[coords.lat, coords.lon]} icon={icon}>
              <Popup>
                <b>{weather?.name}</b> <br />
                Temp: {weather?.main?.temp}°C <br />
                Condition: {weather?.weather?.[0]?.main}
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      )}

      <footer className="mt-10 text-sm opacity-70">
        Powered by <b>OpenWeather</b> | Map © OpenStreetMap | Built by <b>Samrat Das</b>
      </footer>
    </div>
  );
}





