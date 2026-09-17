"use client";

import React, { useEffect, useState, useRef } from "react";

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/messages");
      const json = await res.json();
      if (json.success && json.data?.conversations) {
        setConversations(json.data.conversations);
        if (!selectedConv && json.data.conversations.length > 0) {
          selectConversation(json.data.conversations[0]);
        }
      }
    } catch (err) {
      console.warn("Could not load conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv: any) => {
    setSelectedConv(conv);
    try {
      const res = await fetch(`/api/admin/messages?conversationId=${conv.id}`);
      const json = await res.json();
      if (json.success && json.data?.messages) {
        setMessages(json.data.messages);
      }
    } catch (err) {
      console.warn("Load conversation error:", err);
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(() => {
      if (selectedConv) {
        selectConversation(selectedConv);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedConv?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv) return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          replyMessage: replyText.trim(),
          adminName: "BGV Concierge Support",
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.reply) {
        setMessages((prev) => [...prev, json.data.reply]);
        setReplyText("");
      }
    } catch (err) {
      alert("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "2rem" }}>Client Live Chat & Inquiries Center</h1>
        <p style={{ color: "var(--muted)", marginTop: "4px" }}>
          Respond to customer questions submitted through the floating live chat widget in real-time.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: "20px",
          background: "#fff",
          border: "1px solid var(--line)",
          height: "620px",
          overflow: "hidden",
        }}
      >
        {/* Left: Conversations list */}
        <div style={{ borderRight: "1px solid var(--line)", overflowY: "auto" }}>
          <div style={{ padding: "16px", background: "var(--soft)", borderBottom: "1px solid var(--line)", fontWeight: 700 }}>
            Active Conversations ({conversations.length})
          </div>

          {loading && conversations.length === 0 ? (
            <p style={{ padding: "16px", color: "var(--muted)" }}>Loading messages...</p>
          ) : conversations.length > 0 ? (
            conversations.map((c) => {
              const isSelected = selectedConv?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => selectConversation(c)}
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid var(--line)",
                    cursor: "pointer",
                    background: isSelected ? "#fcf6f9" : "#fff",
                    borderLeft: isSelected ? "4px solid var(--plum)" : "4px solid transparent",
                  }}
                >
                  <strong style={{ fontSize: "0.95rem", display: "block" }}>{c.customerName}</strong>
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{c.customerEmail}</div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--ink)",
                      marginTop: "6px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.lastMessage}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--muted)", fontSize: "0.875rem" }}>
              No client conversations yet. When visitors use the live chat, their inquiries appear here.
            </div>
          )}
        </div>

        {/* Right: Message stream & Reply box */}
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--line)",
                  background: "var(--soft)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ fontSize: "1.1rem" }}>{selectedConv.customerName}</strong>
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                    Client Email: {selectedConv.customerEmail}
                  </div>
                </div>
                <span style={{ fontSize: "0.75rem", background: "var(--plum)", color: "#fff", padding: "4px 8px", fontWeight: 700 }}>
                  LIVE THREAD
                </span>
              </div>

              {/* Message List */}
              <div
                style={{
                  flex: 1,
                  padding: "20px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  background: "#faf8f9",
                }}
              >
                {messages.map((m, idx) => {
                  const isAdmin = m.senderRole === "admin";
                  return (
                    <div
                      key={m.id || idx}
                      style={{
                        alignSelf: isAdmin ? "flex-end" : "flex-start",
                        maxWidth: "75%",
                        padding: "12px 16px",
                        borderRadius: isAdmin ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                        background: isAdmin ? "var(--plum)" : "#fff",
                        color: isAdmin ? "#fff" : "var(--ink)",
                        border: isAdmin ? "none" : "1px solid var(--line)",
                        fontSize: "0.9rem",
                      }}
                    >
                      <div style={{ fontSize: "0.75rem", marginBottom: "4px", fontWeight: 700, opacity: 0.85 }}>
                        {m.senderName} {isAdmin ? "👑 (You)" : ""}
                      </div>
                      <div>{m.message}</div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              {/* Reply Form */}
              <form
                onSubmit={handleSendReply}
                style={{
                  padding: "16px",
                  borderTop: "1px solid var(--line)",
                  display: "flex",
                  gap: "10px",
                  background: "#fff",
                }}
              >
                <input
                  type="text"
                  placeholder={`Reply to ${selectedConv.customerName}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ flex: 1, padding: "12px 16px" }}
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="button coral"
                  style={{ minWidth: "120px" }}
                >
                  {sending ? "Sending..." : "Send Reply"}
                </button>
              </form>
            </>
          ) : (
            <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--muted)" }}>
              Select a conversation from the left to read and reply.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
