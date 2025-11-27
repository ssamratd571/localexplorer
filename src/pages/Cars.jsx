// src/pages/Cars.jsx
import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  addDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../services/firebaseConfig";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { motion } from "framer-motion";

Modal.setAppElement("#root");

export default function Cars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: "",
    search: "",
    maxPrice: 10000,
    ac: false,
  });
  const [sortBy, setSortBy] = useState("latest");
  const [favorites, setFavorites] = useState([]);

  const navigate = useNavigate();

  // Booking modal state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [bookingStart, setBookingStart] = useState("");
  const [bookingEnd, setBookingEnd] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");

  // Trip info
  const [tripType, setTripType] = useState("local"); // local | outstation | airport
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [passengers, setPassengers] = useState("1");

  // User choices for rent calculation
  const [bookingVehicleType, setBookingVehicleType] = useState("4-Wheeler"); // "2-Wheeler" | "4-Wheeler"
  const [bookingCategory, setBookingCategory] = useState(""); // tariff name
  const [bookingAcChoice, setBookingAcChoice] = useState("AC"); // "AC" | "Non-AC"

  // 💬 CHAT STATES (car chat like cuisine/hotel)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatCar, setChatCar] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatUnsubRef = useRef(null);

  // Load Cars
  const loadCars = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "cars"));
    setCars(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  // Load favorites for logged user
  const loadFavorites = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const favRef = doc(db, "favorites", user.uid);
    const favSnap = await getDoc(favRef);
    if (favSnap.exists()) setFavorites(favSnap.data().cars || []);
  };

  useEffect(() => {
    loadCars();
    loadFavorites();
  }, []);

  // Toggle favorite
  const toggleFavorite = async (carId) => {
    const user = auth.currentUser;
    if (!user) return alert("Please login to save favorites!");

    let newFavs = [];
    if (favorites.includes(carId)) {
      newFavs = favorites.filter((id) => id !== carId);
    } else {
      newFavs = [...favorites, carId];
    }
    setFavorites(newFavs);
    await setDoc(doc(db, "favorites", user.uid), { cars: newFavs });
  };

  // Helper to extract usable image URLs from any shape
  const extractImageUrls = (car) => {
    if (!car) return [];

    const candidates =
      car.images ??
      car.imageUrls ??
      car.imageURLs ??
      car.imageUrl ??
      car.image ??
      car.photos ??
      car.photoUrls ??
      car.photoURL;

    const extractOne = (v) => {
      if (!v) return null;
      if (typeof v === "string") return v;
      if (typeof v === "object") {
        return (
          v.secure_url ||
          v.url ||
          v.downloadURL ||
          v.imageUrl ||
          v.src ||
          null
        );
      }
      return null;
    };

    if (Array.isArray(candidates)) {
      return candidates
        .map((item) => extractOne(item))
        .filter((x) => typeof x === "string" && x.trim() !== "");
    }

    const single = extractOne(candidates);
    return single ? [single] : [];
  };

  // Tariffs from car
  const getAvailableTwoWheelerTariffs = (car) =>
    Array.isArray(car?.twoWheelerTariffs)
      ? car.twoWheelerTariffs.filter((t) => t.available)
      : [];

  const getAvailableFourWheelerTariffs = (car) =>
    Array.isArray(car?.fourWheelerTariffs)
      ? car.fourWheelerTariffs.filter((t) => t.available)
      : [];

  // Trip days
  const getTripDays = () => {
    if (!bookingStart) return 1;
    const start = new Date(bookingStart);
    const end = bookingEnd ? new Date(bookingEnd) : start;

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const days = Math.floor(diffDays) + 1;
    return days > 0 ? days : 1;
  };

  const getSelectedTariff = () => {
    if (!selectedCar) return null;

    if (bookingVehicleType === "2-Wheeler") {
      const tariffs = getAvailableTwoWheelerTariffs(selectedCar);
      return tariffs.find((t) => t.name === bookingCategory) || null;
    } else {
      const tariffs = getAvailableFourWheelerTariffs(selectedCar);
      return tariffs.find((t) => t.name === bookingCategory) || null;
    }
  };

  const getSelectedPerDayPrice = () => {
    const tariff = getSelectedTariff();
    if (!tariff) return null;

    if (bookingVehicleType === "2-Wheeler") {
      return tariff.pricePerDay || null;
    } else {
      // 4-wheeler
      if (bookingAcChoice === "AC") {
        return tariff.acPricePerDay || null;
      } else {
        return tariff.nonAcPricePerDay || null;
      }
    }
  };

  const selectedPerDay = getSelectedPerDayPrice();
  const tripDays = getTripDays();
  const estimatedRent =
    selectedPerDay && tripDays ? selectedPerDay * tripDays : null;

  // 🚻 Max seats for currently selected category
  const currentTariff = getSelectedTariff();
  const maxSeats =
    currentTariff && Number(currentTariff.maxSeats) > 0
      ? Number(currentTariff.maxSeats)
      : null;

  // Options for passengers dropdown (cannot exceed maxSeats if known)
  const passengerOptions = maxSeats
    ? Array.from({ length: maxSeats }, (_, i) => String(i + 1))
    : ["1", "2", "3", "4", "5+"];

  // For current 4-wheeler category, check if AC / Non-AC price exists
  const currentFourTariff =
    bookingVehicleType === "4-Wheeler" ? getSelectedTariff() : null;

  const acOptionAvailable =
    currentFourTariff && Number(currentFourTariff.acPricePerDay) > 0;

  const nonAcOptionAvailable =
    currentFourTariff && Number(currentFourTariff.nonAcPricePerDay) > 0;

  // Filter + Sort
  const filteredCars = useMemo(() => {
    let list = cars.filter((car) => {
      // Type filter: use supportsTwoWheeler/supportsFourWheeler if present
      let matchType = true;
      if (filter.type === "2-Wheeler") {
        if (typeof car.supportsTwoWheeler === "boolean") {
          matchType = car.supportsTwoWheeler;
        } else {
          matchType = car.vehicleType === "2-Wheeler";
        }
      } else if (filter.type === "4-Wheeler") {
        if (typeof car.supportsFourWheeler === "boolean") {
          matchType = car.supportsFourWheeler;
        } else {
          matchType = car.vehicleType === "4-Wheeler";
        }
      }

      const search = filter.search.toLowerCase();
      const matchSearch =
        !search ||
        car.carName?.toLowerCase().includes(search) ||
        car.brand?.toLowerCase().includes(search) ||
        car.model?.toLowerCase().includes(search) ||
        car.orgName?.toLowerCase().includes(search) ||
        car.city?.toLowerCase().includes(search);

      const basePrice =
        typeof car.pricePerDay === "number" ? car.pricePerDay : 0;
      const matchPrice = basePrice <= filter.maxPrice || basePrice === 0;

      const matchAC = !filter.ac || car.freeCancellation || car.acType === "AC";

      return matchType && matchSearch && matchPrice && matchAC;
    });

    switch (sortBy) {
      case "priceLow":
        list.sort(
          (a, b) =>
            (a.pricePerDay ?? Number.MAX_SAFE_INTEGER) -
            (b.pricePerDay ?? Number.MAX_SAFE_INTEGER)
        );
        break;
      case "priceHigh":
        list.sort(
          (a, b) => (b.pricePerDay ?? 0) - (a.pricePerDay ?? 0)
        );
        break;
      case "name":
        list.sort((a, b) =>
          (a.carName || "").localeCompare(b.carName || "")
        );
        break;
      case "latest":
      default:
        list.sort(
          (a, b) => ((a.createdAt ?? 0) < (b.createdAt ?? 0) ? 1 : -1)
        );
    }

    return list;
  }, [cars, filter, sortBy]);

  // Delete car
  const removeCar = async (id, ownerUid) => {
    if (auth.currentUser?.uid !== ownerUid) {
      alert("You can only delete your own listings.");
      return;
    }
    if (!window.confirm("Delete this car listing?")) return;
    await deleteDoc(doc(db, "cars", id));
    await loadCars();
  };

  const openBooking = (car) => {
    setSelectedCar(car);

    const two = getAvailableTwoWheelerTariffs(car);
    const four = getAvailableFourWheelerTariffs(car);

    // Decide default vehicle type
    let defaultType = "4-Wheeler";
    if (car.vehicleType === "2-Wheeler") defaultType = "2-Wheeler";
    else if (car.vehicleType === "4-Wheeler") defaultType = "4-Wheeler";
    else if (two.length && !four.length) defaultType = "2-Wheeler";
    else if (!two.length && four.length) defaultType = "4-Wheeler";

    setBookingVehicleType(defaultType);

    if (defaultType === "2-Wheeler" && two.length > 0) {
      setBookingCategory(two[0].name);
    } else if (defaultType === "4-Wheeler" && four.length > 0) {
      setBookingCategory(four[0].name);
    } else {
      setBookingCategory("");
    }

    setBookingAcChoice("AC");
    setIsBookingOpen(true);
  };

  const closeBooking = () => {
    setIsBookingOpen(false);
    setSelectedCar(null);
    setBookingStart("");
    setBookingEnd("");
    setBookingMessage("");
    setTripType("local");
    setPickupLocation("");
    setDropLocation("");
    setPickupTime("");
    setPassengers("1");
    setBookingCategory("");
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("Please log in to book.");

    // 🚫 Check passenger count vs max seats
    const numPassengers = Number(passengers);
    if (maxSeats && !Number.isNaN(numPassengers) && numPassengers > maxSeats) {
      alert(
        `Max allowed passengers for ${bookingCategory || "this category"} is ${maxSeats}.`
      );
      return;
    }

    const tariff = getSelectedTariff();
    const perDay = getSelectedPerDayPrice();
    const days = getTripDays();

    await addDoc(collection(db, "bookings"), {
      carId: selectedCar.id,
      carName: selectedCar.carName,
      orgName: selectedCar.orgName || "",
      ownerUid: selectedCar.ownerUid,
      userUid: user.uid,
      startDate: bookingStart,
      endDate: bookingEnd || null,
      tripType,
      pickupLocation,
      dropLocation: dropLocation || null,
      pickupTime,
      passengers,
      message: bookingMessage,
      bookingVehicleType,
      bookingCategory,
      bookingAcChoice:
        bookingVehicleType === "4-Wheeler" ? bookingAcChoice : null,
      tripDays: days,
      selectedTariff: tariff || null,
      perDayPrice: perDay,
      estimatedRent: perDay && days ? perDay * days : null,
      freeCancellationAtBooking: !!selectedCar.freeCancellation,
      createdAt: serverTimestamp(),
      status: "pending",
    });

    alert("✅ Booking request sent to owner!");
    closeBooking();
  };

  // 💬 CAR CHAT — per user, per car (live)
  const subscribeToChat = (carId) => {
    const user = auth.currentUser;
    if (!user) return;
    setChatLoading(true);

    const conversationKey = `${carId}_${user.uid}`;

    const qRef = query(
      collection(db, "carChats"),
      where("conversationKey", "==", conversationKey)
    );

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        let msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        msgs.sort(
          (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
        );
        setChatMessages(msgs);
        setChatLoading(false);
      },
      (err) => {
        console.error("Car chat subscribe error:", err);
        setChatLoading(false);
      }
    );

    chatUnsubRef.current = unsub;
  };

  const openChat = (car) => {
    if (!auth.currentUser) {
      alert("Please log in to chat with owner.");
      return;
    }

    if (chatUnsubRef.current) {
      chatUnsubRef.current();
      chatUnsubRef.current = null;
    }

    setChatCar(car);
    setIsChatOpen(true);
    subscribeToChat(car.id);
  };

  const closeChat = () => {
    if (chatUnsubRef.current) {
      chatUnsubRef.current();
      chatUnsubRef.current = null;
    }
    setIsChatOpen(false);
    setChatCar(null);
    setChatMessages([]);
    setChatInput("");
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !chatCar) return;
    if (!chatInput.trim()) return;

    const conversationKey = `${chatCar.id}_${user.uid}`;
    const userName =
      user.displayName || user.email || user.phoneNumber || "Customer";

    try {
      await addDoc(collection(db, "carChats"), {
        context: "car",
        conversationKey,
        carId: chatCar.id,
        carName: chatCar.carName || chatCar.model || "Car",
        ownerUid: chatCar.ownerUid || null,
        userUid: user.uid,
        userName,
        senderUid: user.uid,
        senderType: "user",
        text: chatInput.trim(),
        createdAt: serverTimestamp(),
      });
      setChatInput("");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to send message: " + err.message);
    }
  };

  // ✅ Only owners of at least one car see the inbox button
  const ownsAnyCar =
    auth.currentUser &&
    cars.some((c) => c.ownerUid === auth.currentUser.uid);

  if (loading)
    return (
      <div className="p-8 text-white text-xl text-center">
        Loading vehicles…
      </div>
    );

  const avgPrice =
    filteredCars.length > 0
      ? Math.round(
          filteredCars.reduce(
            (a, c) =>
              a + (typeof c.pricePerDay === "number" ? c.pricePerDay : 0),
            0
          ) / filteredCars.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 to-indigo-800 p-6 text-white">
      <h1 className="text-4xl font-bold mb-6 text-center">
        Explore Transport 🚙
      </h1>

      {/* OWNER CAR CHAT INBOX BUTTON */}
      {ownsAnyCar && (
        <div className="flex justify-center mb-6">
          <button
            onClick={() => navigate("/owner-car-chats")}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg font-semibold"
          >
            💬 Car Chat Inbox
          </button>
        </div>
      )}

      {/* 🔍 Filter Bar */}
      <div className="flex flex-wrap justify-center gap-4 bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/20 mb-6">
        <input
          type="text"
          placeholder="Search car, agency, brand, or city..."
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          className="px-4 py-3 rounded-xl text-black w-60"
        />
        <select
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="px-4 py-3 rounded-xl text-black"
        >
          <option value="">All Types</option>
          <option value="2-Wheeler">2-Wheeler</option>
          <option value="4-Wheeler">4-Wheeler</option>
        </select>

        <label className="flex flex-col text-sm">
          Max Base Price (₹{filter.maxPrice})
          <input
            type="range"
            min="500"
            max="10000"
            step="500"
            value={filter.maxPrice}
            onChange={(e) =>
              setFilter({ ...filter, maxPrice: Number(e.target.value) })
            }
            className="w-40 accent-green-500"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filter.ac}
            onChange={(e) => setFilter({ ...filter, ac: e.target.checked })}
            className="accent-green-500"
          />
          Free cancellation / AC
        </label>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-3 rounded-xl text-black"
        >
          <option value="latest">Latest</option>
          <option value="priceLow">Price: Low → High (base)</option>
          <option value="priceHigh">Price: High → Low (base)</option>
          <option value="name">Name (A–Z)</option>
        </select>

        <button
          onClick={() =>
            setFilter({ type: "", search: "", maxPrice: 10000, ac: false })
          }
          className="px-4 py-3 bg-black/60 hover:bg-black rounded-xl font-semibold"
        >
          Clear
        </button>
      </div>

      {/* 📊 Summary */}
      <div className="text-center mb-6 text-white/80">
        Showing <b>{filteredCars.length}</b> of {cars.length} partners | Avg
        base price: ₹{avgPrice}
      </div>

      {/* 🚗 Car Cards */}
      {filteredCars.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-lg text-white/70 mt-10"
        >
          😕 No transport listings match your filters.
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map((car) => {
            const imageArray = extractImageUrls(car);
            const twoAvailable = getAvailableTwoWheelerTariffs(car).length > 0;
            const fourAvailable =
              getAvailableFourWheelerTariffs(car).length > 0;

            return (
              <motion.div
                key={car.id}
                whileHover={{ scale: 1.03 }}
                className="bg-white/15 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg border border-white/20 transition-all"
              >
                {/* IMAGES */}
                {imageArray.length > 0 ? (
                  <Swiper
                    modules={[Navigation, Pagination]}
                    navigation
                    pagination={{ clickable: true }}
                    className="w-full h-48"
                  >
                    {imageArray.map((img, i) => (
                      <SwiperSlide key={i}>
                        <img
                          src={img}
                          alt=""
                          className="w-full h-48 object-cover"
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                ) : (
                  <div className="w-full h-48 bg.white/20 flex items-center justify-center text-white/70">
                    No Image
                  </div>
                )}

                <div className="p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {car.carName || "Transport Partner"}
                      </h2>
                      {car.orgName && (
                        <p className="text-sm text-purple-200">
                          🏢 {car.orgName}
                        </p>
                      )}
                    </div>
                    <button onClick={() => toggleFavorite(car.id)}>
                      {favorites.includes(car.id) ? "❤️" : "🤍"}
                    </button>
                  </div>

                  {car.city && (
                    <p className="mt-1 text-sm text-white/80">
                      📍 {car.city}
                    </p>
                  )}
                  {car.address && (
                    <p className="text-xs text-white/70">{car.address}</p>
                  )}
                  {car.phone && (
                    <p className="text-xs text-white/70 mt-1">
                      📞 {car.phone}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {twoAvailable && (
                      <span className="px-2 py-1 bg-sky-500/30 rounded-md">
                        2-Wheeler
                      </span>
                    )}
                    {fourAvailable && (
                      <span className="px-2 py-1 bg-sky-500/30 rounded-md">
                        4-Wheeler
                      </span>
                    )}
                    {car.freeCancellation && (
                      <span className="px-2 py-1 bg-emerald-500/30 rounded-md">
                        Free Cancellation
                      </span>
                    )}
                    {typeof car.pricePerDay === "number" &&
                      car.pricePerDay > 0 && (
                        <span className="px-2 py-1 bg-amber-500/25 rounded-md">
                          Base from ₹{car.pricePerDay}/day
                        </span>
                      )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => openBooking(car)}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
                    >
                      Book
                    </button>

                    <button
                      onClick={() => openChat(car)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                      Chat with Owner
                    </button>

                    {(car.whatsapp || car.phone) && (
                      <a
                        href={`https://wa.me/${car.whatsapp || car.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg"
                      >
                        WhatsApp
                      </a>
                    )}
                    {auth.currentUser?.uid === car.ownerUid && (
                      <button
                        onClick={() => removeCar(car.id, car.ownerUid)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CHAT MODAL (like cuisine/hotel) */}
      {isChatOpen && chatCar && (
        <Modal
          isOpen={isChatOpen}
          onRequestClose={closeChat}
          style={{
            overlay: {
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            },
            content: {
              maxWidth: 500,
              margin: "auto",
              background: "rgba(0,0,0,0.9)",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
            },
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold">Chat with Owner</h2>
              <p className="text-xs text-white/60">
                {chatCar.carName || chatCar.model || "Car"}
              </p>
            </div>
            <button
              onClick={closeChat}
              className="px-3 py-1 text-sm rounded-lg bg-white/10 hover:bg-white/20"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 border border-white/10 rounded-xl p-2 overflow-y-auto mb-2">
            {chatLoading ? (
              <p className="text-sm text-white/60">Loading chat...</p>
            ) : chatMessages.length === 0 ? (
              <p className="text-sm text-white/60">
                No messages yet. Start the conversation!
              </p>
            ) : (
              chatMessages.map((msg) => {
                const isMine = msg.senderUid === auth.currentUser?.uid;
                return (
                  <div
                    key={msg.id}
                    className={`my-1 flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-2xl text-xs ${
                        isMine
                          ? "bg-green-600 text-white rounded-br-none"
                          : "bg-white/15 text-white rounded-bl-none"
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={sendChatMessage} className="flex gap-2 mt-1">
            <input
              type="text"
              placeholder="Type your message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl text-black"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm"
            >
              Send
            </button>
          </form>
        </Modal>
      )}

      {/* Booking Modal */}
      {isBookingOpen && selectedCar && (
        <Modal
          isOpen={isBookingOpen}
          onRequestClose={closeBooking}
          style={{
            overlay: {
              backgroundColor: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
            },
            content: {
              maxWidth: 800,
              margin: "auto",
              background: "rgba(15,23,42,0.95)",
              borderRadius: "20px",
              border: "1px solid rgba(148,163,184,0.4)",
              color: "white",
              padding: "20px",
            },
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-2xl font-bold">Confirm your ride 🚕</h2>
              <p className="text-sm text-slate-300">
                {selectedCar.orgName
                  ? `Partner: ${selectedCar.orgName}`
                  : "Local transport partner"}
              </p>
            </div>
            <button
              onClick={closeBooking}
              className="text-slate-300 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* LEFT: Summary and rent */}
            <div className="md:col-span-1 bg-slate-900/60 rounded-2xl p-3 border border-slate-700 space-y-3">
              <div className="flex gap-3 items-center">
                {extractImageUrls(selectedCar)[0] ? (
                  <img
                    src={extractImageUrls(selectedCar)[0]}
                    alt="vehicle"
                    className="w-20 h-16 object-cover rounded-xl border border-slate-600"
                  />
                ) : (
                  <div className="w-20 h-16 rounded-xl bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                    No Image
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {selectedCar.carName || "Vehicle"}
                  </p>
                  {selectedCar.city && (
                    <p className="text-xs text-slate-300">
                      {selectedCar.city}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                    {bookingVehicleType && (
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/40">
                        {bookingVehicleType}
                      </span>
                    )}
                    {bookingVehicleType === "4-Wheeler" && bookingAcChoice && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                        {bookingAcChoice}
                      </span>
                    )}
                    {bookingCategory && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40">
                        {bookingCategory}
                      </span>
                    )}
                    {selectedCar.freeCancellation && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/40">
                        Free Cancellation
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/70 rounded-xl p-3 text-sm space-y-1">
                <p className="flex justify-between">
                  <span className="text-slate-300">Per day price</span>
                  <span className="font-semibold text-emerald-300">
                    {selectedPerDay
                      ? `₹${selectedPerDay}`
                      : "Select type & category"}
                  </span>
                </p>

                {estimatedRent && (
                  <p className="flex justify-between text-sm mt-1">
                    <span className="text-slate-300">
                      Estimated rent ({tripDays} day
                      {tripDays > 1 ? "s" : ""})
                    </span>
                    <span className="font-semibold text-amber-300">
                      ₹{estimatedRent}
                    </span>
                  </p>
                )}

                <p className="text-[11px] text-slate-400 pt-1">
                  Final fare will be confirmed by the owner based on route and
                  duration.
                </p>
              </div>

              {selectedCar.address && (
                <p className="text-xs text-slate-300">
                  📍 Base: {selectedCar.address}
                </p>
              )}
              {selectedCar.phone && (
                <p className="text-xs text-slate-300">
                  📞 Contact: {selectedCar.phone}
                </p>
              )}
            </div>

            {/* RIGHT: selections + form */}
            <div className="md:col-span-2 bg-slate-900/50 rounded-2xl p-4 border border-slate-700">
              {/* Trip type */}
              <div className="flex flex-wrap gap-2 mb-3 text-xs">
                {[
                  { id: "local", label: "Local Ride" },
                  { id: "outstation", label: "Outstation" },
                  { id: "airport", label: "Airport Transfer" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTripType(t.id)}
                    className={
                      "px-3 py-1 rounded-full border text-xs " +
                      (tripType === t.id
                        ? "bg-emerald-500 text-black border-emerald-400"
                        : "bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700")
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Vehicle type selection */}
              <div className="mb-3 text-xs">
                <p className="text-slate-300 mb-1">Choose vehicle type</p>
                <div className="flex flex-wrap gap-2">
                  {["2-Wheeler", "4-Wheeler"].map((type) => {
                    const hasAvailable =
                      type === "2-Wheeler"
                        ? getAvailableTwoWheelerTariffs(selectedCar).length > 0
                        : getAvailableFourWheelerTariffs(selectedCar).length >
                          0;
                    const isActive = bookingVehicleType === type;

                    return (
                      <button
                        key={type}
                        type="button"
                        disabled={!hasAvailable}
                        onClick={() => {
                          setBookingVehicleType(type);
                          const list =
                            type === "2-Wheeler"
                              ? getAvailableTwoWheelerTariffs(selectedCar)
                              : getAvailableFourWheelerTariffs(selectedCar);
                          if (list.length > 0) {
                            setBookingCategory(list[0].name);
                          } else {
                            setBookingCategory("");
                          }
                        }}
                        className={
                          "px-3 py-1 rounded-full border text-xs " +
                          (hasAvailable
                            ? isActive
                              ? "bg-sky-500 text-black border-sky-400"
                              : "bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700"
                            : "bg-slate-900 text-slate-500 border-slate-700 cursor-not-allowed")
                        }
                      >
                        {type}{" "}
                        {!hasAvailable && (
                          <span className="text-[10px]">(Not available)</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category selection */}
              <div className="mb-3 text-xs">
                <p className="text-slate-300 mb-1">Choose category</p>
                <div className="flex flex-wrap gap-2">
                  {(bookingVehicleType === "2-Wheeler"
                    ? getAvailableTwoWheelerTariffs(selectedCar)
                    : getAvailableFourWheelerTariffs(selectedCar)
                  ).map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => setBookingCategory(t.name)}
                      className={
                        "px-3 py-1 rounded-full border text-xs " +
                        (bookingCategory === t.name
                          ? "bg-indigo-500 text-white border-indigo-400"
                          : "bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700")
                      }
                    >
                      {t.name}
                    </button>
                  ))}
                  {bookingCategory === "" &&
                    (bookingVehicleType === "2-Wheeler"
                      ? getAvailableTwoWheelerTariffs(selectedCar).length === 0
                      : getAvailableFourWheelerTariffs(selectedCar).length ===
                        0) && (
                      <span className="text-slate-500">
                        No category available from owner.
                      </span>
                    )}
                </div>
              </div>

              {/* AC / Non-AC for 4W */}
              {bookingVehicleType === "4-Wheeler" && (
                <div className="mb-3 text-xs">
                  <p className="text-slate-300 mb-1">
                    AC preference (based on owner pricing)
                  </p>
                  {!currentFourTariff && (
                    <p className="text-[11px] text-slate-400 mb-1">
                      Select a category first to see AC / Non-AC availability.
                    </p>
                  )}
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="acChoice"
                        value="AC"
                        checked={bookingAcChoice === "AC"}
                        onChange={(e) => setBookingAcChoice(e.target.value)}
                        disabled={!acOptionAvailable}
                      />
                      <span>
                        {acOptionAvailable ? "AC" : "AC (Not available)"}
                      </span>
                    </label>

                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="acChoice"
                        value="Non-AC"
                        checked={bookingAcChoice === "Non-AC"}
                        onChange={(e) => setBookingAcChoice(e.target.value)}
                        disabled={!nonAcOptionAvailable}
                      />
                      <span>
                        {nonAcOptionAvailable
                          ? "Non-AC"
                          : "Non-AC (Not available)"}
                      </span>
                    </label>
                  </div>

                  {currentFourTariff &&
                    !acOptionAvailable &&
                    !nonAcOptionAvailable && (
                      <p className="text-[11px] text-amber-300 mt-1">
                        AC / Non-AC prices are not set by the owner for this
                        category. You can still send a booking request and the
                        owner will confirm the fare.
                      </p>
                    )}
                </div>
              )}

              {/* Booking form */}
              <form onSubmit={handleBookingSubmit} className="grid gap-3 text-sm">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Pickup location
                    </label>
                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      placeholder="Hotel / Landmark / Address"
                      className="w-full px-3 py-2 rounded-lg text-black text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Drop location
                    </label>
                    <input
                      type="text"
                      value={dropLocation}
                      onChange={(e) => setDropLocation(e.target.value)}
                      placeholder="Destination"
                      className="w-full px-3 py-2 rounded-lg text-black text-sm"
                      required={tripType !== "local"}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Trip start date
                    </label>
                    <input
                      type="date"
                      value={bookingStart}
                      onChange={(e) => setBookingStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-black text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Trip end date{" "}
                      <span className="text-[10px] text-slate-400">
                        (optional for one-way)
                      </span>
                    </label>
                    <input
                      type="date"
                      value={bookingEnd}
                      onChange={(e) => setBookingEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-black text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Pickup time
                    </label>
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-black text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      No. of passengers
                    </label>
                    <select
                      value={passengers}
                      onChange={(e) => setPassengers(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-black text-sm"
                    >
                      {passengerOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {maxSeats && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Max allowed for this category: {maxSeats} passenger
                        {maxSeats > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-300 mb-1">
                      Special request / message to owner
                    </label>
                    <textarea
                      placeholder="Share luggage details, route preference, or any note for the driver."
                      rows="2"
                      value={bookingMessage}
                      onChange={(e) => setBookingMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-black text-sm"
                    />
                  </div>
                </div>

                {/* CTA row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-700 mt-2">
                  <div className="text-xs text-slate-300">
                    By confirming, your request will be sent to the vehicle
                    owner. They will contact you to finalise fare & availability.
                  </div>
                  <div className="flex items-center gap-3">
                    {estimatedRent && (
                      <div className="text-right">
                        <p className="text-[11px] text-slate-300">
                          Estimated rent ({tripDays} day
                          {tripDays > 1 ? "s" : ""})
                        </p>
                        <p className="text-lg font-semibold text-amber-300">
                          ₹{estimatedRent}
                        </p>
                      </div>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm"
                    >
                      Request Booking
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}




















