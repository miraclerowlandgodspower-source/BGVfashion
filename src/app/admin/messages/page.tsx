"use client";

import React, { useEffect, useState, useRef } from "react";

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const endRef = useRef<HTMLDivElement>(null);

  const loadConversations = async (maintainSelectedId?: string) => {
    try {
      const res = await fetch("/api/admin/messages");
      const json = await res.json();
      if (json.success && json.data?.conversations) {
        setConversations(json.data.conversations);

        const currentId = maintainSelectedId || selectedConv?.id;
        if (currentId) {
          const updated = json.data.conversations.find((c: any) => c.id === currentId);
          if (updated) setSelectedConv(updated);
        } else if (json.data.conversations.length > 0) {
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

  // Initial load
  useEffect(() => {
    loadConversations();
  }, []);

  // Live polling for updates every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedConv) {
        // Poll current conversation messages
        fetch(`/api/admin/messages?conversationId=${selectedConv.id}`)
          .then((r) => r.json())
          .then((json) => {
            if (json.success && json.data?.messages) {
              setMessages(json.data.messages);
            }
          })
          .catch(() => {});
      }
      // Poll conversations list
      fetch("/api/admin/messages")
        .then((r) => r.json())
        .then((json) => {
          if (json.success && json.data?.conversations) {
            setConversations(json.data.conversations);
          }
        })
        .catch(() => {});
    }, 3500);

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
          adminName: "BGV Concierge Atelier",
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.reply) {
        setMessages((prev) => [...prev, json.data.reply]);
        setReplyText("");
        loadConversations(selectedConv.id);
      }
    } catch {
      alert("Failed to send reply to customer.");
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: "open" | "pending" | "resolved") => {
    if (!selectedConv) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          status: newStatus,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSelectedConv({ ...selectedConv, status: newStatus });
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedConv.id ? { ...c, status: newStatus } : c))
        );
      }
    } catch {
      alert("Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
        " · " +
        date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      c.customerName?.toLowerCase().includes(q) ||
      c.customerEmail?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" || (c.status || "open") === statusFilter;

    return matchesQuery && matchesStatus;
  });

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#111827", margin: 0 }}>
          Client Live Chat & Inquiries Inbox
        </h1>
        <p style={{ color: "#6b7280", marginTop: "4px", fontSize: "0.9rem" }}>
          Interact with store visitors in real time, answer sizing questions, and resolve customer support tickets.
        </p>
      </div>

      {/* Main Messaging Container */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "360px 1fr",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          height: "700px",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {/* Left Column: Conversations List */}
        <div style={{ borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Filter and Search */}
          <div style={{ padding: "14px", borderBottom: "1px solid #e5e7eb", background: "#fafaf9" }}>
            <input
              type="search"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "0.82rem",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: "10px",
              }}
            />

            <div style={{ display: "flex", gap: "6px" }}>
              {["all", "open", "pending", "resolved"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    flex: 1,
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: statusFilter === st ? "1px solid var(--plum, #4a154b)" : "1px solid #e5e7eb",
                    background: statusFilter === st ? "var(--plum, #4a154b)" : "#fff",
                    color: statusFilter === st ? "#fff" : "#6b7280",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    textTransform: "capitalize",
                    cursor: "pointer",
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading && conversations.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#6b7280", fontSize: "0.85rem" }}>
                Loading conversations...
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((c) => {
                const isSelected = selectedConv?.id === c.id;
                const status = c.status || "open";

                return (
                  <div
                    key={c.id}
                    onClick={() => selectConversation(c)}
                    style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid #f3f4f6",
                      cursor: "pointer",
                      background: isSelected ? "#fdf4ff" : "#ffffff",
                      borderLeft: isSelected ? "4px solid var(--plum, #4a154b)" : "4px solid transparent",
                      transition: "background 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "0.9rem", color: "#111827" }}>
                        {c.customerName}
                      </strong>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          padding: "1px 6px",
                          borderRadius: "3px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          background:
                            status === "resolved"
                              ? "#f3f4f6"
                              : status === "pending"
                              ? "#fef3c7"
                              : "#fee2e2",
                          color:
                            status === "resolved"
                              ? "#6b7280"
                              : status === "pending"
                              ? "#92400e"
                              : "#991b1b",
                        }}
                      >
                        {status}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "2px" }}>
                      {c.customerEmail}
                    </div>

                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "#4b5563",
                        marginTop: "6px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {c.lastMessage || "Conversation started..."}
                    </div>

                    {c.updatedAt && (
                      <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "4px" }}>
                        {formatMessageTime(c.updatedAt)}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#9ca3af", fontSize: "0.82rem" }}>
                No conversations matching this filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Thread & Reply Box */}
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fdfbfb" }}>
          {selectedConv ? (
            <>
              {/* Chat Thread Header */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #e5e7eb",
                  background: "#ffffff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ fontSize: "1.05rem", color: "#111827" }}>
                      {selectedConv.customerName}
                    </strong>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        textTransform: "uppercase",
                        background:
                          selectedConv.status === "resolved"
                            ? "#ecfdf5"
                            : selectedConv.status === "pending"
                            ? "#fef3c7"
                            : "#fee2e2",
                        color:
                          selectedConv.status === "resolved"
                            ? "#065f46"
                            : selectedConv.status === "pending"
                            ? "#92400e"
                            : "#991b1b",
                      }}
                    >
                      {selectedConv.status || "open"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "2px" }}>
                    Client Email: <strong>{selectedConv.customerEmail}</strong>
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    disabled={updatingStatus || selectedConv.status === "open"}
                    onClick={() => handleUpdateStatus("open")}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      border: "1px solid #d1d5db",
                      background: selectedConv.status === "open" ? "#fee2e2" : "#ffffff",
                      color: selectedConv.status === "open" ? "#991b1b" : "#374151",
                      cursor: "pointer",
                    }}
                  >
                    Mark Open
                  </button>
                  <button
                    type="button"
                    disabled={updatingStatus || selectedConv.status === "pending"}
                    onClick={() => handleUpdateStatus("pending")}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      border: "1px solid #d1d5db",
                      background: selectedConv.status === "pending" ? "#fef3c7" : "#ffffff",
                      color: selectedConv.status === "pending" ? "#92400e" : "#374151",
                      cursor: "pointer",
                    }}
                  >
                    Mark Pending
                  </button>
                  <button
                    type="button"
                    disabled={updatingStatus || selectedConv.status === "resolved"}
                    onClick={() => handleUpdateStatus("resolved")}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      border: "1px solid #d1d5db",
                      background: selectedConv.status === "resolved" ? "#ecfdf5" : "#ffffff",
                      color: selectedConv.status === "resolved" ? "#065f46" : "#374151",
                      cursor: "pointer",
                    }}
                  >
                    ✓ Mark Resolved
                  </button>
                </div>
              </div>

              {/* Messages Stream */}
              <div
                style={{
                  flex: 1,
                  padding: "20px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  background: "#f9fafb",
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
                        borderRadius: isAdmin ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                        background: isAdmin ? "var(--plum, #4a154b)" : "#ffffff",
                        color: isAdmin ? "#ffffff" : "#111827",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                        border: isAdmin ? "none" : "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.72rem",
                          marginBottom: "4px",
                          fontWeight: 700,
                          opacity: isAdmin ? 0.85 : 0.6,
                        }}
                      >
                        {m.senderName} {isAdmin ? "👑 (You · Atelier Concierge)" : ""}
                      </div>
                      <div style={{ fontSize: "0.88rem", lineHeight: "1.45" }}>{m.message}</div>
                      {m.createdAt && (
                        <div
                          style={{
                            fontSize: "0.68rem",
                            marginTop: "6px",
                            textAlign: "right",
                            opacity: isAdmin ? 0.75 : 0.5,
                          }}
                        >
                          {formatMessageTime(m.createdAt)}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              {/* Quick Snippets */}
              <div
                style={{
                  padding: "6px 16px",
                  background: "#ffffff",
                  borderTop: "1px solid #f3f4f6",
                  display: "flex",
                  gap: "8px",
                  overflowX: "auto",
                }}
              >
                {[
                  "Hello! How may our styling atelier assist you today?",
                  "Your order is currently being handcrafted at our Ojo atelier.",
                  "We have dispatched your parcel via GIG Logistics.",
                  "Could you please share your order number for verification?",
                ].map((snippet, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReplyText(snippet)}
                    style={{
                      background: "#f3f4f6",
                      border: "none",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "0.72rem",
                      color: "#4b5563",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    + &quot;{snippet.substring(0, 24)}...&quot;
                  </button>
                ))}
              </div>

              {/* Reply Form */}
              <form
                onSubmit={handleSendReply}
                style={{
                  padding: "16px 20px",
                  borderTop: "1px solid #e5e7eb",
                  display: "flex",
                  gap: "10px",
                  background: "#ffffff",
                }}
              >
                <input
                  type="text"
                  placeholder={`Reply to ${selectedConv.customerName}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  style={{
                    padding: "12px 24px",
                    background: "var(--plum, #4a154b)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    cursor: sending || !replyText.trim() ? "not-allowed" : "pointer",
                    opacity: sending || !replyText.trim() ? 0.6 : 1,
                  }}
                >
                  {sending ? "Sending..." : "Send Reply"}
                </button>
              </form>
            </>
          ) : (
            <div
              style={{
                display: "grid",
                placeItems: "center",
                height: "100%",
                color: "#9ca3af",
                fontSize: "0.9rem",
              }}
            >
              Select an inquiry conversation on the left to read and respond.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
