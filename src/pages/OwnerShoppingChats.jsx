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

export default function OwnerShoppingChats() {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyInput, setReplyInput] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Load ONLY shopping chats for THIS owner
  useEffect(() => {
    const owner = auth.currentUser;
    if (!owner) return;

    const qChats = query(
      collection(db, "cuisineChats"),
      where("context", "==", "shopping"),
      where("ownerUid", "==", owner.uid)
    );

    const unsub = onSnapshot(qChats, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Group by conversationKey
      const grouped = {};
      all.forEach((msg) => {
        if (!grouped[msg.conversationKey]) grouped[msg.conversationKey] = [];
        grouped[msg.conversationKey].push(msg);
      });

      const list = Object.keys(grouped).map((key) => {
        const msgs = grouped[key];
        msgs.sort(
          (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
        );

        return {
          conversationKey: key,
          messages: msgs,
          productName: msgs[0].productName,
          userUid: msgs[0].userUid,
          userName: msgs[0].userName || "Customer",
        };
      });

      setConversations(list);

      // If owner is viewing a chat → keep updating real-time
      if (selectedConv) {
        const live = list.find(
          (c) => c.conversationKey === selectedConv.conversationKey
        );
        if (live) setMessages(live.messages);
      }
    });

    return () => unsub();
  }, [selectedConv]);

  // Open chat
  const openChat = (conv) => {
    setSelectedConv(conv);
    setMessages(conv.messages);
    setReplyInput("");
    setModalOpen(true);
  };

  const closeChat = () => {
    setModalOpen(false);
    setSelectedConv(null);
    setMessages([]);
    setReplyInput("");
  };

  // OWNER sends reply
  const sendOwnerReply = async (e) => {
    e.preventDefault();
    const owner = auth.currentUser;
    if (!owner || !selectedConv) return;
    if (!replyInput.trim()) return;

    const { conversationKey, productName, userUid } = selectedConv;

    await addDoc(collection(db, "cuisineChats"), {
      context: "shopping",
      conversationKey,
      productName,
      ownerUid: owner.uid,
      userUid,
      senderUid: owner.uid,
      senderType: "owner",
      text: replyInput.trim(),
      createdAt: serverTimestamp(),
    });

    setReplyInput("");
  };

  // DELETE message
  const deleteMessage = async (id) => {
    if (!window.confirm("Delete this message?")) return;

    await deleteDoc(doc(db, "cuisineChats", id));
  };

  return (
    <div className="p-6 text-white min-h-screen bg-gradient-to-br from-indigo-700 to-purple-700">
      <h1 className="text-3xl font-bold mb-6">🛍️ Shopping Chat Inbox</h1>
      <p className="text-sm text-white/70 mb-6">
        Messages from customers who chatted from Shopping page.
      </p>

      {conversations.length === 0 ? (
        <p>No shopping chats yet.</p>
      ) : (
        <div className="space-y-4">
          {conversations.map((c) => {
            const lastMsg = c.messages[c.messages.length - 1];
            return (
              <div
                key={c.conversationKey}
                onClick={() => openChat(c)}
                className="p-4 bg-white/10 rounded-xl hover:bg-white/20 cursor-pointer"
              >
                <p className="font-semibold">🛒 {c.productName}</p>
                <p className="text-xs text-white/70">Customer: {c.userName}</p>
                <p className="text-sm text-white/80 mt-1">
                  {lastMsg?.text || "No messages"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && selectedConv && (
        <Modal
          isOpen={modalOpen}
          onRequestClose={closeChat}
          style={{
            overlay: { backgroundColor: "rgba(0,0,0,0.6)" },
            content: {
              maxWidth: "450px",
              margin: "auto",
              background: "#111",
              color: "white",
              padding: "16px",
              borderRadius: "14px",
              maxHeight: "90vh",
              overflow: "hidden",
            },
          }}
        >
          <h2 className="text-xl font-bold mb-1">{selectedConv.productName}</h2>
          <p className="text-xs text-white/60 mb-2">
            Customer: {selectedConv.userName}
          </p>

          <div className="flex-1 h-72 p-3 border border-white/20 rounded-xl overflow-y-auto mb-3">
            {messages.map((msg) => {
              const mine = msg.senderType === "owner";
              return (
                <div
                  key={msg.id}
                  className={`my-2 flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex items-center gap-2 max-w-[80%]">
                    {!mine && (
                      <span className="text-[10px] text-white/60">
                        {msg.userName || "Customer"}
                      </span>
                    )}

                    <div
                      className={`px-3 py-2 rounded-2xl text-xs ${
                        mine
                          ? "bg-indigo-600 rounded-br-none"
                          : "bg-green-600 rounded-bl-none"
                      }`}
                    >
                      {msg.text}
                    </div>

                    <button
                      className="text-xs text-red-300 hover:text-red-500"
                      onClick={() => deleteMessage(msg.id)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={sendOwnerReply} className="flex gap-2">
            <input
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl text-black"
              placeholder="Type your reply..."
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm"
            >
              Send
            </button>
          </form>

          <button
            onClick={closeChat}
            className="mt-3 block mx-auto text-sm bg-white/10 px-3 py-2 rounded-xl"
          >
            Close
          </button>
        </Modal>
      )}
    </div>
  );
}
