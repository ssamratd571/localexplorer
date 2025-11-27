import { useEffect, useState, useMemo, useRef } from "react";
import Modal from "react-modal";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
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

export default function Shopping() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState({
    search: "",
    maxPrice: 2000,
    category: "All",
  });
  const [sortBy, setSortBy] = useState("latest");

  // ORDER MODAL
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [orderQty, setOrderQty] = useState(1);
  const [orderNote, setOrderNote] = useState("");

  // CHAT MODAL (Shopping)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatUnsubRef = useRef(null);
  const navigate = useNavigate();


  const loadShopping = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "shopping"));
    setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => {
    loadShopping();
  }, []);

  const filteredItems = useMemo(() => {
    let list = items.filter((item) => {
      const matchSearch =
        !filter.search ||
        item.name?.toLowerCase().includes(filter.search.toLowerCase()) ||
        item.ownerName
          ?.toLowerCase()
          .includes(filter.search.toLowerCase());

      const matchCategory =
        filter.category === "All" || item.category === filter.category;

      const matchPrice =
        item.price == null || item.price <= filter.maxPrice;

      return matchSearch && matchCategory && matchPrice;
    });

    switch (sortBy) {
      case "priceLow":
        list.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "priceHigh":
        list.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "name":
        list.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
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
  }, [items, filter, sortBy]);

  const removeItem = async (id, ownerUid) => {
    if (auth.currentUser?.uid !== ownerUid) {
      alert("You can only delete your own products.");
      return;
    }
    if (!window.confirm("Delete this product?")) return;
    await deleteDoc(doc(db, "shopping", id));
    await loadShopping();
  };

            const ownsAnyProduct = useMemo(() => {
            const uid = auth.currentUser?.uid;
            if (!uid) return false;
            return items.some((item) => item.ownerUid === uid);
          }, [items]);

  // ============================
  // ORDER MODAL LOGIC
  // ============================
  const openOrder = (item) => {
    if (!auth.currentUser) {
      alert("Please login to place an order.");
      return;
    }
    setSelectedItem(item);
    setOrderQty(1);
    setOrderNote("");
    setIsOrderOpen(true);
  };

  const closeOrder = () => {
    setIsOrderOpen(false);
    setSelectedItem(null);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !selectedItem) return;

    const unitPrice = selectedItem.price || 0;
    const totalAmount = unitPrice * orderQty;

    try {
      await addDoc(collection(db, "orders"), {
        orderType: "shopping",
        productId: selectedItem.id,
        productName: selectedItem.name,
        ownerUid: selectedItem.ownerUid,
        userUid: user.uid,
        unitPrice,
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

  // ============================
  // CHAT LOGIC (Shopping chat)
  // Uses same cuisineChats collection
  // ============================

  const subscribeToChat = (productId) => {
    const user = auth.currentUser;
    if (!user) return;
    setChatLoading(true);

    // make key unique for shopping
    const conversationKey = `shopping_${productId}_${user.uid}`;

    const q = query(
      collection(db, "cuisineChats"),
      where("conversationKey", "==", conversationKey)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        let msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // sort by time (old → new)
        msgs.sort((a, b) => {
          const A = a.createdAt?.seconds || 0;
          const B = b.createdAt?.seconds || 0;
          return A - B;
        });

        setChatMessages(msgs);
        setChatLoading(false);
      },
      (err) => {
        console.error("Shopping chat subscribe error:", err);
        setChatLoading(false);
      }
    );

    chatUnsubRef.current = unsub;
  };

  const openChat = (item) => {
    if (!auth.currentUser) {
      alert("Please login to chat with seller.");
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
    if (!user || !selectedItem) return;
    if (!chatInput.trim()) return;

    const conversationKey = `shopping_${selectedItem.id}_${user.uid}`;
    const userName =
      user.displayName || user.email || user.phoneNumber || "Customer";

    try {
      await addDoc(collection(db, "cuisineChats"), {
        context: "shopping", // optional flag
        conversationKey,
        cuisineId: selectedItem.id, // reused field for OwnerChats
        restaurantName: selectedItem.ownerName || selectedItem.name,
        productName: selectedItem.name,
        ownerUid: selectedItem.ownerUid,
        userUid: user.uid,
        userName,
        senderUid: user.uid,
        senderType: "user",
        text: chatInput.trim(),
        createdAt: serverTimestamp(),
      });

      setChatInput("");
    } catch (err) {
      console.error("Shopping chat send error:", err);
      alert("❌ Failed to send message: " + err.message);
    }
  };

  // ============================

  if (loading)
    return (
      <div className="p-8 text-white text-xl text-center">
        Loading products…
      </div>
    );

  const avgPrice =
    filteredItems.length > 0
      ? Math.round(
          filteredItems.reduce((a, c) => a + (c.price || 0), 0) /
            filteredItems.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-700 to-sky-700 p-6 text-white">
      <h1 className="text-4xl font-bold mb-6 text-center">
        Local Shopping 🛒
      </h1>
      {/* ⭐ Seller Chat Inbox — visible only for shop owners */}
      {ownsAnyProduct && (
  <div className="flex justify-center mb-6">
    <button
      onClick={() => navigate("/owner-shopping-chats")}
      className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold shadow-lg text-white"
    >
      🛍️ Seller Chat Inbox
    </button>
  </div>
)}


      {/* Filter Bar */}
      <div className="flex flex-wrap justify-center gap-4 bg-white/15 p-4 rounded-2xl backdrop-blur-md border border-white/20 mb-6">
        <input
          type="text"
          placeholder="Search product or shop..."
          value={filter.search}
          onChange={(e) =>
            setFilter({ ...filter, search: e.target.value })
          }
          className="px-4 py-3 rounded-xl text-black w-60"
        />

        <select
          value={filter.category}
          onChange={(e) =>
            setFilter({ ...filter, category: e.target.value })
          }
          className="px-4 py-3 rounded-xl text-black"
        >
          <option value="All">All Categories</option>
          <option value="Groceries">Groceries</option>
          <option value="Handicraft">Handicraft</option>
          <option value="Tea & Spices">Tea & Spices</option>
          <option value="Clothing">Clothing</option>
          <option value="Electronics">Electronics</option>
          <option value="Others">Others</option>
        </select>

        <label className="flex flex-col text-sm">
          Max Price (₹{filter.maxPrice})
          <input
            type="range"
            min="50"
            max="5000"
            step="50"
            value={filter.maxPrice}
            onChange={(e) =>
              setFilter({
                ...filter,
                maxPrice: Number(e.target.value),
              })
            }
            className="w-40 accent-emerald-400"
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
              maxPrice: 2000,
              category: "All",
            })
          }
          className="px-4 py-3 bg-black/60 hover:bg-black rounded-xl font-semibold"
        >
          Clear
        </button>
      </div>

      {/* Summary */}
      <div className="text-center mb-6 text-white/80">
        Showing <b>{filteredItems.length}</b> of {items.length} products
        {filteredItems.length > 0 && (
          <> | Avg Price: ₹{avgPrice}</>
        )}
      </div>

      {/* Product Cards */}
      {filteredItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-lg text-white/70 mt-10"
        >
          😕 No products found.
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            let imgs = [];
            if (Array.isArray(item.images) && item.images.length > 0) {
              imgs = item.images.map((img) =>
                typeof img === "string" ? img : img.secure_url
              );
            } else if (item.image) {
              imgs = [item.image];
            }

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
                          alt={`${item.name}-${i}`}
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
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {item.name}
                      </h2>
                      {item.ownerName && (
                        <p className="text-xs text-emerald-200 mt-1">
                          🏪 {item.ownerName}
                        </p>
                      )}
                    </div>
                    {item.price != null && (
                      <p className="text-lg font-bold">
                        ₹{item.price}
                      </p>
                    )}
                  </div>

                  {item.category && (
                    <p className="text-xs text-white/70 mt-1">
                      Category: {item.category}
                    </p>
                  )}
                  {item.stock != null && (
                    <p className="text-xs text-white/70">
                      Stock: {item.stock}
                    </p>
                  )}

                  {item.description && (
                    <p className="text-sm text-white/80 mt-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => openOrder(item)}
                      className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm"
                    >
                      Order Now
                    </button>

                    <button
                      onClick={() => openChat(item)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                    >
                      Chat with Seller
                    </button>

                    {auth.currentUser?.uid === item.ownerUid && (
                      <button
                        onClick={() =>
                          removeItem(item.id, item.ownerUid)
                        }
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
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

      {/* ORDER MODAL */}
      {isOrderOpen && selectedItem && (
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
            Order {selectedItem.name}
          </h2>
          {selectedItem.ownerName && (
            <p className="text-sm text-emerald-200 mb-2">
              from {selectedItem.ownerName}
            </p>
          )}

          <form onSubmit={handleOrderSubmit} className="grid gap-3">
            <p className="text-sm">
              Price per unit: <b>₹{selectedItem.price}</b>
            </p>

            <label className="text-sm">
              Quantity
              <input
                type="number"
                min={1}
                value={orderQty}
                onChange={(e) =>
                  setOrderQty(Number(e.target.value) || 1)
                }
                className="mt-1 w-24 px-2 py-1 rounded-md text-black"
              />
            </label>

            <p className="text-sm">
              Total:{" "}
              <b>₹{(selectedItem.price || 0) * orderQty}</b>
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
                className="px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600"
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
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            },
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold">Chat with Seller</h2>
              <p className="text-xs text-white/60">
                {selectedItem.ownerName || selectedItem.name}
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
                          ? "bg-emerald-600 text-white rounded-br-none"
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





