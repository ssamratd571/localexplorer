// src/pages/Hotels.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../services/firebaseConfig";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

Modal.setAppElement("#root");

export default function Hotels() {
  const [hotels, setHotels] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Filters
  const [filterCity, setFilterCity] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filterAC, setFilterAC] = useState(false);
  const [filterBackup, setFilterBackup] = useState(false);
  const [filterCancellation, setFilterCancellation] = useState(false);

  // BOOKING STATES
  const [bookingModal, setBookingModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [roomType, setRoomType] = useState("AC"); // AC / Non-AC
  const [roomCategory, setRoomCategory] = useState("Standard"); // Standard / Deluxe / Suite
  const [guests, setGuests] = useState(2);
  const [loadingBooking, setLoadingBooking] = useState(false);

  // 💬 CHAT STATES (hotel chat like cuisine)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHotel, setChatHotel] = useState(null); // hotel for chat modal
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatUnsubRef = useRef(null);

  // Load user role
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) return setRole(null);
      const snap = await getDoc(doc(db, "users", user.uid));
      setRole(snap.exists() ? snap.data().role : "user");
    });
    return unsub;
  }, []);

  // Load hotels
  const loadHotels = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "hotels"));
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setHotels(data);
    setFiltered(data);
    setLoading(false);
  };

  useEffect(() => {
    loadHotels();
  }, []);

  // ✅ Helper: get min room price from all guest/AC combinations
  const getMinRoomPrice = (h) => {
    if (!h.rooms || h.rooms.length === 0) return null;

    const values = [];
    h.rooms.forEach((r) => {
      [
        r.acPrice1,
        r.acPrice2,
        r.acPrice3,
        r.acPrice4,
        r.nonAcPrice1,
        r.nonAcPrice2,
        r.nonAcPrice3,
        r.nonAcPrice4,
      ].forEach((v) => {
        if (typeof v === "number" && v > 0) values.push(v);
      });
    });

    if (values.length === 0) return null;
    return Math.min(...values);
  };

  // Filter logic
  useEffect(() => {
    let filteredList = [...hotels];

    if (filterCity)
      filteredList = filteredList.filter((h) =>
        h.city?.toLowerCase().includes(filterCity.toLowerCase())
      );

    if (filterRoom)
      filteredList = filteredList.filter((h) =>
        h.rooms?.some((r) =>
          r.name.toLowerCase().includes(filterRoom.toLowerCase())
        )
      );

    if (maxPrice)
      filteredList = filteredList.filter((h) => {
        const minRoomPrice = getMinRoomPrice(h);
        const base = minRoomPrice ?? h.price ?? 0;
        return base <= Number(maxPrice);
      });

    if (filterAC)
      filteredList = filteredList.filter(
        (h) => h.acType?.toLowerCase() === "ac"
      );

    if (filterBackup)
      filteredList = filteredList.filter(
        (h) => h.powerBackup?.toLowerCase() === "yes"
      );

    if (filterCancellation)
      filteredList = filteredList.filter((h) => h.freeCancellation === true);

    setFiltered(filteredList);
  }, [
    filterCity,
    filterRoom,
    maxPrice,
    filterAC,
    filterBackup,
    filterCancellation,
    hotels,
  ]);

  const openBooking = (hotel) => {
    setSelectedHotel(hotel);
    if (hotel.rooms && hotel.rooms.length > 0) {
      setRoomCategory(hotel.rooms[0].name || "Standard");
    } else {
      setRoomCategory("Standard");
    }
    setRoomType("AC");
    setCheckIn(null);
    setCheckOut(null);
    setGuests(2);
    setBookingModal(true);
  };

  const calculateDays = () => {
    if (!checkIn || !checkOut) return 0;
    const diff = (checkOut - checkIn) / (1000 * 60 * 60 * 24);
    return diff > 0 ? diff : 0;
  };

  // ✅ Helper: choose correct price based on room, AC/Non-AC, guests
  const getPerNightPrice = () => {
    if (!selectedHotel) return 0;

    const rooms = selectedHotel.rooms || [];
    const room = rooms.find((r) => r.name === roomCategory);

    let basePrice = selectedHotel.price || 0;

    if (room) {
      const guestCount = Math.min(Math.max(guests, 1), 4); // clamp 1–4
      const key =
        roomType === "AC" ? `acPrice${guestCount}` : `nonAcPrice${guestCount}`;
      const val = room[key];

      if (typeof val === "number" && val > 0) {
        basePrice = val;
      } else {
        // fallback: min of all its prices
        const candidates = [
          room.acPrice1,
          room.acPrice2,
          room.acPrice3,
          room.acPrice4,
          room.nonAcPrice1,
          room.nonAcPrice2,
          room.nonAcPrice3,
          room.nonAcPrice4,
        ].filter((v) => typeof v === "number" && v > 0);
        if (candidates.length > 0) {
          basePrice = Math.min(...candidates);
        }
      }
    }

    return Number(basePrice || 0);
  };

  const perNightPrice = getPerNightPrice();
  const totalPrice = calculateDays() * perNightPrice;

  const handleConfirmBooking = async () => {
    if (!selectedHotel || !checkIn || !checkOut) {
      alert("Please select check-in and check-out dates.");
      return;
    }

    const days = calculateDays();
    if (days <= 0) {
      alert("Check-out date must be after check-in date.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("Please login to book.");
      return;
    }

    try {
      setLoadingBooking(true);

      await addDoc(collection(db, "hotelBookings"), {
        hotelId: selectedHotel.id,
        hotelTitle: selectedHotel.title,
        hotelCity: selectedHotel.city || "",
        pricePerNight: perNightPrice,
        totalPrice: totalPrice,
        days,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        roomType,
        roomCategory,
        guests,
        userId: user.uid,
        userEmail: user.email,
        ownerUid: selectedHotel.ownerUid || null,
        ownerEmail: selectedHotel.ownerEmail || null,
        ownerPhone: selectedHotel.phone || null,
        createdAt: serverTimestamp(),
        status: "pending",
      });

      alert("✅ Booking submitted!");
      setBookingModal(false);
    } catch (err) {
      console.error(err);
      alert("Booking failed. Please try again.");
    } finally {
      setLoadingBooking(false);
    }
  };

  const removeHotel = async (id, ownerUid) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return alert("Not logged in.");
    if (role !== "admin" && currentUser.uid !== ownerUid)
      return alert("Not authorized.");
    if (!window.confirm("Delete this property?")) return;

    await deleteDoc(doc(db, "hotels", id));
    await loadHotels();
  };

  // 💬 HOTEL CHAT (per user, per hotel) – like cuisine chatmodal
  const subscribeToChat = (hotelId) => {
    const user = auth.currentUser;
    if (!user) return;
    setChatLoading(true);

    const conversationKey = `${hotelId}_${user.uid}`;

    const qRef = query(
      collection(db, "hotelChats"),
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
        console.error("Hotel chat subscribe error:", err);
        setChatLoading(false);
      }
    );

    chatUnsubRef.current = unsub;
  };

  const openChat = (hotel) => {
    if (!auth.currentUser) {
      alert("Please log in to chat with owner.");
      return;
    }

    // cleanup previous listener
    if (chatUnsubRef.current) {
      chatUnsubRef.current();
      chatUnsubRef.current = null;
    }

    setChatHotel(hotel);
    setIsChatOpen(true);
    subscribeToChat(hotel.id);
  };

  const closeChat = () => {
    if (chatUnsubRef.current) {
      chatUnsubRef.current();
      chatUnsubRef.current = null;
    }
    setIsChatOpen(false);
    setChatHotel(null);
    setChatMessages([]);
    setChatInput("");
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !chatHotel) return;
    if (!chatInput.trim()) return;

    const conversationKey = `${chatHotel.id}_${user.uid}`;
    const userName =
      user.displayName || user.email || user.phoneNumber || "Guest";

    try {
      await addDoc(collection(db, "hotelChats"), {
        context: "hotel",
        conversationKey,
        hotelId: chatHotel.id,
        hotelTitle: chatHotel.title,
        ownerUid: chatHotel.ownerUid || null,
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

  // ✅ Only owners of at least one hotel see the inbox button
  const ownsAnyHotel =
    auth.currentUser &&
    hotels.some((h) => h.ownerUid === auth.currentUser.uid);

  if (loading) {
    return <div className="p-8 text-white text-xl">Loading properties…</div>;
  }

  return (
    <div className="p-6 text-white min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700">
      <h1 className="text-4xl font-bold mb-6 typing">Explore Stays 🌏</h1>

      {/* OWNER HOTEL CHAT INBOX BUTTON */}
      {ownsAnyHotel && (
        <div className="flex justify-center mb-6">
          <button
            onClick={() => navigate("/owner-hotel-chats")}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg font-semibold"
          >
            💬 Hotel Chat Inbox
          </button>
        </div>
      )}

      {/* Filter Section */}
      <div className="flex flex-wrap gap-4 mb-6 bg-white/20 p-4 rounded-xl items-center backdrop-blur-md border border-white/20 shadow-md">
        <input
          placeholder="Filter by City"
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          className="px-4 py-2 rounded-lg text.black"
        />

        <input
          placeholder="Filter by Room Type"
          value={filterRoom}
          onChange={(e) => setFilterRoom(e.target.value)}
          className="px-4 py-2 rounded-lg text.black"
        />

        <input
          placeholder="Max Price"
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="px-4 py-2 rounded-lg text.black w-32"
        />

        {/* Checkboxes */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filterAC}
            onChange={(e) => setFilterAC(e.target.checked)}
            className="accent-purple-600 w-4 h-4"
          />
          AC
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filterBackup}
            onChange={(e) => setFilterBackup(e.target.checked)}
            className="accent-purple-600 w-4 h-4"
          />
          Power Backup
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filterCancellation}
            onChange={(e) => setFilterCancellation(e.target.checked)}
            className="accent-purple-600 w-4 h-4"
          />
          Free Cancellation
        </label>

        <button
          onClick={() => {
            setFilterCity("");
            setFilterRoom("");
            setMaxPrice("");
            setFilterAC(false);
            setFilterBackup(false);
            setFilterCancellation(false);
          }}
          className="px-4 py-2 bg-black/60 hover:bg-black rounded-lg"
        >
          Clear
        </button>
      </div>

      {/* Hotels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((h) => {
          // Images: category + all room images
          const galleryImages = [
            ...(h.categoryImages || []),
            ...((h.rooms || []).flatMap((r) => r.imageURLs || [])),
          ].filter(Boolean);

          const displayedPrice = getMinRoomPrice(h) ?? h.price ?? 0;

          return (
            <div
              key={h.id}
              className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl overflow-hidden transition-all hover:scale-[1.02]"
            >
              {/* Image Carousel */}
              {galleryImages.length > 0 ? (
                <Swiper
                  modules={[Navigation, Pagination]}
                  navigation
                  pagination={{ clickable: true }}
                  spaceBetween={10}
                  slidesPerView={1}
                  className="h-52"
                >
                  {galleryImages.map((img, idx) => (
                    <SwiperSlide key={idx}>
                      <img
                        src={img}
                        alt="property"
                        className="w-full h-52 object-cover"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                <div className="h-52 flex items-center justify-center bg-black/30">
                  <span className="text-white/60 text-sm">
                    No images uploaded
                  </span>
                </div>
              )}

              <div className="p-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">{h.title}</h2>
                  <span className="text-white/90 font-medium">
                    ₹{displayedPrice}
                  </span>
                </div>
                <p className="text-white/80">{h.city}</p>
                <p className="text-white/70 mt-1">📞 {h.phone}</p>
                <p className="text-white/80 mt-2 line-clamp-3">
                  {h.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {h.rooms?.map((r, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-white/30 rounded-lg text-xs"
                    >
                      {r.name}
                    </span>
                  ))}
                  {h.acType && (
                    <span className="px-2 py-1 bg-blue-600/40 rounded-lg text-xs">
                      {h.acType}
                    </span>
                  )}
                  {h.powerBackup === "Yes" && (
                    <span className="px-2 py-1 bg-green-600/40 rounded-lg text-xs">
                      Power Backup
                    </span>
                  )}
                  {h.freeCancellation && (
                    <span className="px-2 py-1 bg-yellow-500/40 rounded-lg text-xs">
                      Free Cancellation
                    </span>
                  )}
                </div>

                {/* Buttons Section */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => openBooking(h)}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
                  >
                    Book
                  </button>

                  <button
                    onClick={() => openChat(h)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    Chat with Owner
                  </button>

                  {/*{h.phone && h.phone.replace(/[^0-9]/g, "").length >= 10 && (
                    <a
                      href={`https://wa.me/${h.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-[#25D366] hover:bg-[#20b85d] rounded-lg flex items-center gap-1"
                    >
                      💬 WhatsApp
                    </a>
                  )}*/}

                  {auth.currentUser?.uid === h.ownerUid && (
                    <button
                      onClick={() => removeHotel(h.id, h.ownerUid)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CHAT MODAL (like cuisine) */}
      {isChatOpen && chatHotel && (
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
              <p className="text-xs text-white/60">{chatHotel.title}</p>
            </div>
            <button
              onClick={closeChat}
              className="px-3 py-1 text-sm rounded-lg bg-white/10 hover:bg-white/20"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 border border.white/10 rounded-xl p-2 overflow-y-auto mb-2">
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
      <Modal
        isOpen={bookingModal}
        onRequestClose={() => setBookingModal(false)}
        style={{
          overlay: {
            backgroundColor: "rgba(0,0,0,0.6)",
          },
          content: {
            maxWidth: 450,
            margin: "auto",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(20px)",
            borderRadius: 16,
            padding: 20,
            color: "white",
            border: "1px solid rgba(255,255,255,0.2)",
          },
        }}
      >
        {selectedHotel && (
          <div>
            <h2 className="text-2xl font-bold mb-1">
              Book {selectedHotel.title}
            </h2>
            <p className="mb-2 text-sm text-purple-200">
              Price per night: ₹{perNightPrice}
            </p>

            {/* Dates */}
            <div className="flex gap-3 mb-3">
              <div>
                <p className="text-sm">Check-in</p>
                <DatePicker
                  selected={checkIn}
                  onChange={(d) => setCheckIn(d)}
                  dateFormat="dd/MM/yyyy"
                  className="text-black rounded-lg px-2 py-1"
                />
              </div>
              <div>
                <p className="text-sm">Check-out</p>
                <DatePicker
                  selected={checkOut}
                  onChange={(d) => setCheckOut(d)}
                  dateFormat="dd/MM/yyyy"
                  className="text-black rounded-lg px-2 py-1"
                />
              </div>
            </div>

            {/* MakeMyTrip style options */}
            <div className="grid gap-3 mb-3">
              {/* AC / Non AC */}
              <div>
                <p className="text-sm mb-1">Room Type</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRoomType("AC")}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      roomType === "AC"
                        ? "bg-green-600"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    AC
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoomType("Non-AC")}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      roomType === "Non-AC"
                        ? "bg-green-600"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    Non-AC
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <p className="text-sm mb-1">Room Category</p>
                <select
                  value={roomCategory}
                  onChange={(e) => setRoomCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-black"
                >
                  {selectedHotel.rooms?.length
                    ? selectedHotel.rooms.map((r, i) => (
                        <option key={i} value={r.name}>
                          {r.name}
                        </option>
                      ))
                    : ["Standard", "Deluxe", "Suite"].map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                </select>
              </div>

              {/* Guests */}
              <div>
                <p className="text-sm mb-1">Guests</p>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg text-black"
                >
                  <option value={1}>1 Guest</option>
                  <option value={2}>2 Guests</option>
                  <option value={3}>3 Guests</option>
                  <option value={4}>4 Guests</option>
                </select>
              </div>
            </div>

            <p className="text-sm">
              Total days:{" "}
              <span className="font-semibold">{calculateDays()}</span>
            </p>
            <p className="font-semibold text-xl mt-1">
              Total Price: ₹{totalPrice}
            </p>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleConfirmBooking}
                disabled={loadingBooking}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
              >
                {loadingBooking ? "Booking..." : "Confirm"}
              </button>
              <button
                onClick={() => setBookingModal(false)}
                className="px-4 py-2 bg-gray-500 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}









