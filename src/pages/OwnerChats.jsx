import { useEffect, useState } from "react";
import { db, auth } from "../services/firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import Modal from "react-modal";

Modal.setAppElement("#root");

export default function OwnerChats() {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [replyInput, setReplyInput] = useState("");

  // 🔥 LIVE LOAD ALL *CUISINE* CHATS (context !== "shopping") FOR THIS OWNER
  useEffect(() => {
    const owner = auth.currentUser;
    if (!owner) return;

    const qRef = query(
      collection(db, "cuisineChats"),
      where("ownerUid", "==", owner.uid)
    );

    const unsub = onSnapshot(qRef, (snap) => {
      const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // only cuisine chats
      const data = raw.filter(
        (msg) => !msg.context || msg.context === "cuisine"
      );

      if (data.length === 0) {
        setConversations([]);
        setMessages([]);
        return;
      }

      const grouped = {};
      data.forEach((msg) => {
        if (!grouped[msg.conversationKey]) grouped[msg.conversationKey] = [];
        grouped[msg.conversationKey].push(msg);
      });

      const list = Object.keys(grouped).map((key) => {
        const msgs = grouped[key];
        msgs.sort(
          (a, b) =>
            (a.createdAt?.seconds || 0) -
            (b.createdAt?.seconds || 0)
        );

        return {
          conversationKey: key,
          messages: msgs,
          userUid: msgs[0].userUid,
          userName: msgs[0].userName || "Customer",
          cuisineId: msgs[0].cuisineId,
          restaurantName: msgs[0].restaurantName,
        };
      });

      setConversations(list);

      // keep open conversation live
      if (selectedConv) {
        const live = list.find(
          (c) => c.conversationKey === selectedConv.conversationKey
        );
        if (live) setMessages(live.messages);
      }
    });

    return () => unsub();
  }, [selectedConv]);

  const openChat = (conv) => {
    setSelectedConv(conv);
    setMessages(conv.messages);
    setReplyInput("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedConv(null);
    setMessages([]);
    setReplyInput("");
  };

  const sendOwnerReply = async (e) => {
    e.preventDefault();
    const owner = auth.currentUser;
    if (!owner || !selectedConv) return;
    if (!replyInput.trim()) return;

    const { conversationKey, cuisineId, userUid, restaurantName } =
      selectedConv;

    await addDoc(collection(db, "cuisineChats"), {
      context: "cuisine",
      conversationKey,
      cuisineId,
      restaurantName,
      ownerUid: owner.uid,
      userUid,
      senderUid: owner.uid,
      senderType: "owner",
      text: replyInput.trim(),
      createdAt: serverTimestamp(),
    });

    setReplyInput("");
  };

  const deleteMessage = async (msgId) => {
    if (!window.confirm("Delete this message?")) return;
    await deleteDoc(doc(db, "cuisineChats", msgId));
  };

  return (
    <div className="p-6 text-white min-h-screen bg-gradient-to-br from-blue-700 to-purple-700">
      <h1 className="text-3xl font-bold mb-4">Cuisine Chat Inbox 💬</h1>
      <p className="text-sm text-white/80 mb-6">
        Messages from customers who chatted from Cuisine page.
      </p>

      {conversations.length === 0 ? (
        <p>No cuisine chats yet.</p>
      ) : (
        <div className="space-y-4">
          {conversations.map((conv) => {
            const lastMsg =
              conv.messages[conv.messages.length - 1];

            return (
              <div
                key={conv.conversationKey}
                className="p-4 bg-white/10 rounded-xl cursor-pointer hover:bg-white/20"
                onClick={() => openChat(conv)}
              >
                {/* 👇 same style as Shopping inbox */}
                <p className="font-semibold">🍽️ {conv.restaurantName}</p>
                <p className="text-xs text-white/70">
                  Customer: {conv.userName}
                </p>
                <p className="text-sm text-white/80 mt-1">
                  {lastMsg?.text}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Chat Modal */}
      {modalOpen && selectedConv && (
        <Modal
          isOpen={modalOpen}
          onRequestClose={closeModal}
          style={{
            overlay: { backgroundColor: "rgba(0,0,0,0.6)" },
            content: {
              maxWidth: "450px",
              margin: "auto",
              background: "#111",
              borderRadius: "16px",
              color: "white",
              padding: "16px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            },
          }}
        >
          <div className="mb-3">
            <h2 className="text-xl font-bold">
              {selectedConv.restaurantName}
            </h2>
            <p className="text-xs text-white/70">
              Customer: {selectedConv.userName}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto border border-white/20 rounded-xl p-3 mb-3">
            {messages.length === 0 ? (
              <p className="text-sm text-white/60">No messages yet.</p>
            ) : (
              messages.map((msg) => {
                const isOwner = msg.senderType === "owner";
                return (
                  <div
                    key={msg.id}
                    className={`my-2 flex ${
                      isOwner ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="flex items-center gap-2 max-w-[80%]">
                      {!isOwner && (
                        <span className="text-[9px] text-white/60">
                          {msg.userName || "Customer"}
                        </span>
                      )}

                      <div
                        className={`px-3 py-2 rounded-2xl text-xs ${
                          isOwner
                            ? "bg-blue-700 text-white rounded-br-none"
                            : "bg-green-700 text-white rounded-bl-none"
                        }`}
                      >
                        {msg.text}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMessage(msg.id);
                        }}
                        className="text-[10px] text-red-300 hover:text-red-500"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={sendOwnerReply} className="flex gap-2">
            <input
              type="text"
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              placeholder="Type a reply..."
              className="flex-1 px-3 py-2 rounded-xl text-black text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm"
            >
              Send
            </button>
          </form>

          <button
            onClick={closeModal}
            className="mt-3 mx-auto bg-white/20 px-4 py-2 rounded-xl text-sm"
          >
            Close
          </button>
        </Modal>
      )}
    </div>
  );
}


