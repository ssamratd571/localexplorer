// src/pages/OwnerHotelChats.jsx
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

export default function OwnerHotelChats() {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [replyInput, setReplyInput] = useState("");

  // 🔥 LIVE LOAD ALL *HOTEL* CHATS FOR THIS OWNER
  useEffect(() => {
    const owner = auth.currentUser;
    if (!owner) return;

    const qRef = query(
      collection(db, "hotelChats"),
      where("ownerUid", "==", owner.uid)
    );

    const unsub = onSnapshot(qRef, (snap) => {
      const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // only hotel chats (in case you reuse hotelChats in future with context)
      const data = raw.filter(
        (msg) => !msg.context || msg.context === "hotel"
      );

      if (data.length === 0) {
        setConversations([]);
        setMessages([]);
        return;
      }

      // Group by conversationKey (hotelId_userUid)
      const grouped = {};
      data.forEach((msg) => {
        if (!grouped[msg.conversationKey]) grouped[msg.conversationKey] = [];
        grouped[msg.conversationKey].push(msg);
      });

      const list = Object.keys(grouped).map((key) => {
        const msgs = grouped[key];

        // sort messages by timestamp
        msgs.sort(
          (a, b) =>
            (a.createdAt?.seconds || 0) -
            (b.createdAt?.seconds || 0)
        );

        return {
          conversationKey: key,
          messages: msgs,
          userUid: msgs[0].userUid,
          userName: msgs[0].userName || "Guest",
          hotelId: msgs[0].hotelId,
          hotelTitle: msgs[0].hotelTitle,
        };
      });

      setConversations(list);

      // keep open conversation live updated
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

    const { conversationKey, hotelId, userUid, hotelTitle } = selectedConv;

    await addDoc(collection(db, "hotelChats"), {
      context: "hotel",
      conversationKey,
      hotelId,
      hotelTitle,
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
    await deleteDoc(doc(db, "hotelChats", msgId));
  };

  return (
    <div className="p-6 text-white min-h-screen bg-gradient-to-br from-indigo-700 to-purple-800">
      <h1 className="text-3xl font-bold mb-4">Hotel Chat Inbox 💬</h1>
      <p className="text-sm text-white/80 mb-6">
        Messages from guests who chatted from the Hotels page.
      </p>

      {conversations.length === 0 ? (
        <p>No hotel chats yet.</p>
      ) : (
        <div className="space-y-4">
          {conversations.map((conv) => {
            const lastMsg = conv.messages[conv.messages.length - 1];

            return (
              <div
                key={conv.conversationKey}
                className="p-4 bg-white/10 rounded-xl cursor-pointer hover:bg-white/20"
                onClick={() => openChat(conv)}
              >
                <p className="font-semibold">🏨 {conv.hotelTitle}</p>
                <p className="text-xs text-white/70">
                  Guest: {conv.userName}
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
              {selectedConv.hotelTitle}
            </h2>
            <p className="text-xs text-white/70">
              Guest: {selectedConv.userName}
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
                          {msg.userName || "Guest"}
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
            className="mt-3 mx-auto bg.white/20 px-4 py-2 rounded-xl text-sm"
          >
            Close
          </button>
        </Modal>
      )}
    </div>
  );
}
