import { useEffect, useState, useMemo, useRef } from "react";
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
import { useNavigate } from "react-router-dom";


Modal.setAppElement("#root");

export default function Cuisine() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [filter, setFilter] = useState({
    search: "",
    maxPrice: 1000,
    category: "All",
    type: "All", // Veg / Non-Veg
  });
  const [sortBy, setSortBy] = useState("latest");

  const [selectedItem, setSelectedItem] = useState(null);

  // Menu modal
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Order modal
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null); // "Veg" / "Non-Veg"
  const [orderQty, setOrderQty] = useState(1);
  const [orderNote, setOrderNote] = useState("");

  // Chat modal
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatUnsubRef = useRef(null);
  const navigate = useNavigate();


  // 🔹 Load Cuisine Data
  const loadCuisine = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "cuisine"));
    setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  // 🔹 Load User Favorites
  const loadFavorites = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const favRef = doc(db, "favorites", user.uid);
    const favSnap = await getDoc(favRef);
    if (favSnap.exists()) setFavorites(favSnap.data().cuisine || []);
  };

  useEffect(() => {
    loadCuisine();
    loadFavorites();
  }, []);

  // Helper: compute base price + veg / non-veg availability
  const itemsWithMeta = useMemo(() => {
    return items.map((item) => {
      let basePrice = 0;
      let supportsVeg = false;
      let supportsNonVeg = false;

      if (Array.isArray(item.menuItems) && item.menuItems.length > 0) {
        const prices = [];
        item.menuItems.forEach((mi) => {
          if (typeof mi.vegPrice === "number") {
            prices.push(mi.vegPrice);
            supportsVeg = true;
          }
          if (typeof mi.nonVegPrice === "number") {
            prices.push(mi.nonVegPrice);
            supportsNonVeg = true;
          }
        });
        if (prices.length > 0) {
          basePrice = Math.min(...prices);
        }
      } else if (typeof item.price === "number") {
        basePrice = item.price; // old schema fallback
      }

      if (item.type === "Veg") supportsVeg = true;
      if (item.type === "Non-Veg") supportsNonVeg = true;

      return {
        ...item,
        basePrice,
        supportsVeg,
        supportsNonVeg,
      };
    });
  }, [items]);

  // after const [items, setItems] = useState([]); etc.
const ownsAnyCuisine = useMemo(() => {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  return items.some((item) => item.ownerUid === uid);
}, [items]);


  // 🔍 Filter & Sort Logic
  const filteredItems = useMemo(() => {
    let list = itemsWithMeta.filter((item) => {
      const searchLower = filter.search.toLowerCase();

      const matchSearch =
        !filter.search ||
        item.restaurantName?.toLowerCase().includes(searchLower) ||
        item.name?.toLowerCase().includes(searchLower) ||
        item.owner?.toLowerCase().includes(searchLower) ||
        (Array.isArray(item.menuItems) &&
          item.menuItems.some((mi) =>
            mi.name?.toLowerCase().includes(searchLower)
          ));

      const matchPrice =
        item.basePrice === 0 || item.basePrice <= filter.maxPrice;

      const matchCategory =
        filter.category === "All" || item.category === filter.category;

      let matchType = true;
      if (filter.type === "Veg") {
        matchType = item.supportsVeg;
      } else if (filter.type === "Non-Veg") {
        matchType = item.supportsNonVeg;
      }

      return matchSearch && matchPrice && matchCategory && matchType;
    });

    switch (sortBy) {
      case "priceLow":
        list.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case "priceHigh":
        list.sort((a, b) => b.basePrice - a.basePrice);
        break;
      case "name":
        list.sort((a, b) =>
          (a.restaurantName || a.name || "").localeCompare(
            b.restaurantName || b.name || ""
          )
        );
        break;
      case "latest":
      default:
        list.sort((a, b) => {
          const aVal =
            typeof a.createdAt === "number"
              ? a.createdAt
              : a.createdAt?.toMillis?.() || 0;
          const bVal =
            typeof b.createdAt === "number"
              ? b.createdAt
              : b.createdAt?.toMillis?.() || 0;
          return bVal - aVal;
        });
    }

    return list;
  }, [itemsWithMeta, filter, sortBy]);

  // ❤️ Toggle Favorite
  const toggleFavorite = async (id) => {
    const user = auth.currentUser;
    if (!user) return alert("Please login to save favorites!");

    let newFavs = [];
    if (favorites.includes(id)) {
      newFavs = favorites.filter((fid) => fid !== id);
    } else {
      newFavs = [...favorites, id];
    }
    setFavorites(newFavs);
    await setDoc(
      doc(db, "favorites", user.uid),
      { cuisine: newFavs },
      { merge: true }
    );
  };

  // 🗑️ Delete Cuisine
  const removeItem = async (id, ownerUid) => {
    if (auth.currentUser?.uid !== ownerUid) {
      alert("You can only delete your own cuisines.");
      return;
    }
    if (!window.confirm("Delete this cuisine item?")) return;
    await deleteDoc(doc(db, "cuisine", id));
    await loadCuisine();
  };

  // 🧾 MENU MODAL (Zomato style)
  const openMenu = (item) => {
    setSelectedItem(item);
    setIsMenuOpen(true);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setSelectedItem(null);
  };

  // 🛒 ORDER MODAL (per dish + variant)
  const openOrderForDish = (item, dish, variant) => {
    if (!auth.currentUser) {
      alert("Please log in to place an order.");
      return;
    }
    setSelectedItem(item);
    setSelectedDish(dish);
    setSelectedVariant(variant);
    setOrderQty(1);
    setOrderNote("");
    setIsOrderOpen(true);
  };

  const closeOrder = () => {
    setIsOrderOpen(false);
    setSelectedDish(null);
    setSelectedVariant(null);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("Please log in to order.");

    if (!selectedItem || !selectedDish || !selectedVariant) {
      alert("Something went wrong. Please try again.");
      return;
    }

    const price =
      selectedVariant === "Veg"
        ? selectedDish.vegPrice
        : selectedDish.nonVegPrice;

    const totalAmount = price * orderQty;

    try {
      await addDoc(collection(db, "orders"), {
        cuisineId: selectedItem.id,
        restaurantName: selectedItem.restaurantName || selectedItem.name,
        ownerUid: selectedItem.ownerUid,
        userUid: user.uid,
        dishName: selectedDish.name,
        variant: selectedVariant,
        unitPrice: price,
        quantity: orderQty,
        totalAmount,
        note: orderNote,
        createdAt: serverTimestamp(),
        status: "pending",
      });

      alert("✅ Order placed successfully!");
      closeOrder();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to place order: " + err.message);
    }
  };

  // 💬 CHAT MODAL – per-user, per-restaurant

      const subscribeToChat = (cuisineId) => {
        const user = auth.currentUser;
        if (!user) return;
        setChatLoading(true);

        const conversationKey = `${cuisineId}_${user.uid}`;

        const q = query(
          collection(db, "cuisineChats"),
          where("conversationKey", "==", conversationKey)
        );

        const unsub = onSnapshot(
          q,
          (snap) => {
            let msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

            // ⭐ FIX: Sort by createdAt timestamp
            msgs.sort((a, b) => {
              const A = a.createdAt?.seconds || 0;
              const B = b.createdAt?.seconds || 0;
              return A - B;
            });

            setChatMessages(msgs);
            setChatLoading(false);
          },
          (error) => {
            console.error("Chat subscribe error:", error);
            setChatLoading(false);
          }
        );

        chatUnsubRef.current = unsub;
      };


  const openChat = (item) => {
    if (!auth.currentUser) {
      alert("Please log in to chat with owner.");
      return;
    }

    if (chatUnsubRef.current) {
      chatUnsubRef.current();
      chatUnsubRef.current = null;
    }

    setSelectedItem(item);
    setIsChatOpen(true);
    subscribeToChat(item.id);
  };

  const closeChat = () => {
    if (chatUnsubRef.current) {
      chatUnsubRef.current();
      chatUnsubRef.current = null;
    }
    setIsChatOpen(false);
    setSelectedItem(null);
    setChatMessages([]);
    setChatInput("");
  };

        const sendChatMessage = async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;
        if (!chatInput.trim() || !selectedItem) return;

        const conversationKey = `${selectedItem.id}_${user.uid}`;

        const userName =
          user.displayName || user.email || user.phoneNumber || "Customer";

        try {
          await addDoc(collection(db, "cuisineChats"), {
            conversationKey, // per-user, per-restaurant
            cuisineId: selectedItem.id,
            restaurantName: selectedItem.restaurantName || selectedItem.name,
            ownerUid: selectedItem.ownerUid,
            userUid: user.uid,
            userName,                // ⭐ for showing in owner view
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


  // 🔄 If Firestore rules block read, you’ll see an error in console:
  // "Missing or insufficient permissions." – then check rules for cuisineChats.

  if (loading)
    return (
      <div className="p-8 text-white text-xl text-center">Loading cuisines…</div>
    );

  const avgPrice =
    filteredItems.length > 0
      ? Math.round(
          filteredItems.reduce((a, c) => a + (c.basePrice || 0), 0) /
            filteredItems.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-700 to-orange-700 p-6 text-white">
      <h1 className="text-4xl font-bold mb-6 text-center">Explore Cuisine 🍽️</h1>
      {/* ⭐ OWNER CHAT INBOX BUTTON — only owner can see */}

{/* Only show inbox if this user has uploaded at least one cuisine */}
{ownsAnyCuisine && (
  <div className="flex justify-center mb-6">
    <button
      onClick={() => navigate("/owner-chats")}
      className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg"
    >
      💬 Owner Chat Inbox
    </button>
  </div>
)}



      {/* Filter Bar */}
      <div className="flex flex-wrap justify-center gap-4 bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/20 mb-6">
        <input
          type="text"
          placeholder="Search restaurant, cuisine or dish..."
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          className="px-4 py-3 rounded-xl text-black w-60"
        />

        <select
          value={filter.category}
          onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          className="px-4 py-3 rounded-xl text-black"
        >
          <option value="All">All Categories</option>
          <option value="Indian">Indian</option>
          <option value="Chinese">Chinese</option>
          <option value="Continental">Continental</option>
          <option value="Dessert">Dessert</option>
          <option value="Fast Food">Fast Food</option>
          <option value="Beverage">Beverage</option>
        </select>

        <select
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="px-4 py-3 rounded-xl text-black"
        >
          <option value="All">All Types</option>
          <option value="Veg">Veg 🥬</option>
          <option value="Non-Veg">Non-Veg 🍗</option>
        </select>

        <label className="flex flex-col text-sm">
          Max Price (₹{filter.maxPrice})
          <input
            type="range"
            min="50"
            max="2000"
            step="50"
            value={filter.maxPrice}
            onChange={(e) =>
              setFilter({ ...filter, maxPrice: Number(e.target.value) })
            }
            className="w-40 accent-green-500"
          />
        </label>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-3 rounded-xl text-black"
        >
          <option value="latest">Latest</option>
          <option value="priceLow">Price: Low → High</option>
          <option value="priceHigh">Price: High → Low</option>
          <option value="name">Name (A–Z)</option>
        </select>

        <button
          onClick={() =>
            setFilter({
              search: "",
              maxPrice: 1000,
              category: "All",
              type: "All",
            })
          }
          className="px-4 py-3 bg-black/60 hover:bg-black rounded-xl font-semibold"
        >
          Clear
        </button>
      </div>

      {/* Summary */}
      <div className="text-center mb-6 text-white/80">
        Showing <b>{filteredItems.length}</b> of {items.length} restaurants | Avg
        Starting Price: ₹{avgPrice}
      </div>

      {/* Cuisine Cards */}
      {filteredItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-lg text-white/70 mt-10"
        >
          😕 No cuisines found.
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            // Build image list: restaurant + gallery + fallback old images
            let imgs = [];

            if (item.restaurantImage) {
              const ri =
                typeof item.restaurantImage === "string"
                  ? item.restaurantImage
                  : item.restaurantImage.secure_url || "";
              if (ri) imgs.push(ri);
            }

            if (Array.isArray(item.galleryImages) && item.galleryImages.length) {
              imgs = imgs.concat(
                item.galleryImages.map((g) =>
                  typeof g === "string" ? g : g.secure_url
                )
              );
            }

            if (!imgs.length && Array.isArray(item.images)) {
              imgs = imgs.concat(
                item.images.map((img) =>
                  typeof img === "string" ? img : img.secure_url
                )
              );
            } else if (!imgs.length && item.image) {
              imgs.push(item.image);
            }

            const title = item.restaurantName || item.name || "Cuisine";

            return (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.03 }}
                className="bg-white/15 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg border border-white/20 transition-all"
              >
                {/* Images */}
                {imgs.length > 0 ? (
                  <Swiper
                    modules={[Navigation, Pagination]}
                    navigation
                    pagination={{ clickable: true }}
                    className="w-full h-48 rounded-t-2xl overflow-hidden border-b border-white/20"
                  >
                    {imgs.map((url, i) => (
                      <SwiperSlide key={i}>
                        <img
                          src={url}
                          alt={`${title}-${i}`}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/400x300/2d2d2d/ffffff?text=No+Image";
                          }}
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                ) : (
                  <div className="w-full h-48 bg-white/10 flex items-center justify-center text-white/70">
                    No Image Available
                  </div>
                )}

                {/* Card Info */}
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <button onClick={() => toggleFavorite(item.id)}>
                      {favorites.includes(item.id) ? "❤️" : "🤍"}
                    </button>
                  </div>

                  {item.owner && (
                    <p className="text-sm text-yellow-300 mt-1 font-medium">
                      👨‍🍳 {item.owner}
                    </p>
                  )}

                  {item.basePrice > 0 && (
                    <p className="text-sm text-white/80 mt-1">
                      Starting from <b>₹{item.basePrice}</b>
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.supportsVeg && (
                      <span className="px-2 py-1 rounded-md text-xs bg-green-500/30 text-green-200">
                        Veg Options 🥬
                      </span>
                    )}
                    {item.supportsNonVeg && (
                      <span className="px-2 py-1 rounded-md text-xs bg-red-500/30 text-red-200">
                        Non-Veg Options 🍗
                      </span>
                    )}
                    {item.category && (
                      <span className="px-2 py-1 bg-orange-500/30 rounded-md text-xs">
                        {item.category}
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-white/80 text-sm mt-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Menu preview like Zomato (TEXT ONLY on main card) */}
                  {Array.isArray(item.menuItems) && item.menuItems.length > 0 && (
                    <div className="mt-3 space-y-1 text-sm text-white/80">
                      {item.menuItems.slice(0, 3).map((mi, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between gap-2 text-xs sm:text-sm"
                        >
                          <span>{mi.name}</span>
                          <span className="text-white/70 text-right">
                            {mi.vegPrice != null && `Veg ₹${mi.vegPrice}`}
                            {mi.vegPrice != null &&
                              mi.nonVegPrice != null &&
                              " | "}
                            {mi.nonVegPrice != null &&
                              `Non-Veg ₹${mi.nonVegPrice}`}
                          </span>
                        </div>
                      ))}
                      {item.menuItems.length > 3 && (
                        <div className="text-xs text-white/60">
                          + {item.menuItems.length - 3} more items
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => openMenu(item)}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
                    >
                      View Full Menu
                    </button>
                    <button
                      onClick={() => openChat(item)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                      Chat with Owner
                    </button>
                    {auth.currentUser?.uid === item.ownerUid && (
                      <button
                        onClick={() => removeItem(item.id, item.ownerUid)}
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

      {/* MENU MODAL (full list, with Order buttons) */}
      {isMenuOpen && selectedItem && (
        <Modal
          isOpen={isMenuOpen}
          onRequestClose={closeMenu}
          style={{
            overlay: {
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            },
            content: {
              maxWidth: 700,
              margin: "auto",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "rgba(20,20,20,0.95)",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
              padding: "20px",
            },
          }}
        >
          <h2 className="text-2xl font-bold mb-1">
            {selectedItem.restaurantName || selectedItem.name}
          </h2>
          {selectedItem.owner && (
            <p className="text-sm text-yellow-300 mb-2">
              👨‍🍳 {selectedItem.owner}
            </p>
          )}
          {selectedItem.description && (
            <p className="text-sm text-white/70 mb-4">
              {selectedItem.description}
            </p>
          )}

          <h3 className="text-xl font-semibold mb-3">Menu</h3>

          {Array.isArray(selectedItem.menuItems) &&
          selectedItem.menuItems.length > 0 ? (
            <div className="space-y-3">
              {selectedItem.menuItems.map((mi, idx) => (
                <div
                  key={idx}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/5 rounded-xl p-3"
                >
                  <div>
                    <p className="font-semibold">{mi.name}</p>
                    <p className="text-xs text-white/60">
                      {mi.vegPrice != null && `Veg ₹${mi.vegPrice}`}{" "}
                      {mi.vegPrice != null && mi.nonVegPrice != null && " | "}
                      {mi.nonVegPrice != null && `Non-Veg ₹${mi.nonVegPrice}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {mi.vegPrice != null && (
                      <button
                        onClick={() =>
                          openOrderForDish(selectedItem, mi, "Veg")
                        }
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs"
                      >
                        Order Veg
                      </button>
                    )}
                    {mi.nonVegPrice != null && (
                      <button
                        onClick={() =>
                          openOrderForDish(selectedItem, mi, "Non-Veg")
                        }
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs"
                      >
                        Order Non-Veg
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text.white/60">No menu added yet.</p>
          )}

          <div className="mt-4 text-right">
            <button
              onClick={closeMenu}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* ORDER MODAL */}
      {isOrderOpen && selectedItem && selectedDish && selectedVariant && (
        <Modal
          isOpen={isOrderOpen}
          onRequestClose={closeOrder}
          style={{
            overlay: {
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            },
            content: {
              maxWidth: 500,
              margin: "auto",
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
              padding: "20px",
            },
          }}
        >
          <h2 className="text-2xl font-bold mb-2">
            Order {selectedDish.name} ({selectedVariant})
          </h2>
          <p className="text-sm text-yellow-200 mb-2">
            from {selectedItem.restaurantName || selectedItem.name}
          </p>

          <form onSubmit={handleOrderSubmit} className="grid gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                Price per plate:{" "}
                <b>
                  ₹
                  {selectedVariant === "Veg"
                    ? selectedDish.vegPrice
                    : selectedDish.nonVegPrice}
                </b>
              </span>
            </div>

            <label className="text-sm">
              Quantity
              <input
                type="number"
                min={1}
                value={orderQty}
                onChange={(e) => setOrderQty(Number(e.target.value) || 1)}
                className="mt-1 w-24 px-2 py-1 rounded-md text-black"
              />
            </label>

            <p className="text-sm">
              Total:{" "}
              <b>
                ₹
                {orderQty *
                  (selectedVariant === "Veg"
                    ? selectedDish.vegPrice
                    : selectedDish.nonVegPrice)}
              </b>
            </p>

            <textarea
              placeholder="Special instructions (optional)"
              rows="3"
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              className="w-full px-4 py-2 rounded-md text-black"
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeOrder}
                className="px-4 py-3 rounded-xl bg-white/25 hover:bg-white/35"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700"
              >
                Confirm Order
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* CHAT MODAL */}
      {isChatOpen && selectedItem && (
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
                {selectedItem.restaurantName || selectedItem.name}
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
    </div>
  );
}








