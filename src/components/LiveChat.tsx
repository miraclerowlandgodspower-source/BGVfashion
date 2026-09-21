"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { ChatIcon, CloseIcon } from "./Icons";

interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: "customer" | "admin";
  message: string;
  createdAt: string;
}

export function LiveChat() {
  const pathname = usePathname();
  const { user } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [customerName, setCustomerName] = useState(user?.name || "");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [conversationId, setConversationId] = useState<string>("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync user info
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerEmail) setCustomerEmail(user.email);
    }
  }, [user]);

  const fetchConversation = async (convId: string) => {
    try {
      const res = await fetch(`/api/chat?conversationId=${convId}`);
      const json = await res.json();
      if (json.success && json.data?.messages) {
        setMessages(json.data.messages);
      }
    } catch (err) {
      console.warn("Could not fetch chat messages:", err);
    }
  };

  // Load conversation ID from local storage
  useEffect(() => {
    const savedConvId = localStorage.getItem("bgv_chat_conv_id");
    if (savedConvId) {
      setConversationId(savedConvId);
      fetchConversation(savedConvId);
    } else {
      setMessages([
        {
          id: "welcome-1",
          senderName: "BGV Concierge",
          senderRole: "admin",
          message: "Welcome to BGV Fashion. How may our concierge team assist with your styling or orders today?",
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }, []);

  // Auto poll for replies when chat is open
  useEffect(() => {
    if (!isOpen || !conversationId) return;
    const interval = setInterval(() => {
      fetchConversation(conversationId);
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen, conversationId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    if (!customerEmail.trim()) {
      alert("Please provide your email address so we can reply.");
      return;
    }

    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      senderName: customerName || "Guest Client",
      senderRole: "customer",
      message: inputMessage.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInputMessage("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          customerName: customerName || "Guest Client",
          customerEmail: customerEmail.trim(),
          message: tempMsg.message,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.conversationId) {
        if (!conversationId) {
          setConversationId(json.data.conversationId);
          localStorage.setItem("bgv_chat_conv_id", json.data.conversationId);
        }
        if (json.data.reply) {
          setMessages((prev) => [...prev, json.data.reply]);
        }
      }
    } catch (err) {
      console.warn("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9998 }}>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open Live Chat Concierge"
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "var(--plum)",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
            border: "2px solid #fff",
            cursor: "pointer",
            transition: "transform 0.2s ease, background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <ChatIcon size={26} />
        </button>
      )}

      {isOpen && (
        <div
          style={{
            width: "min(380px, calc(100vw - 32px))",
            height: "520px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid var(--line)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "var(--plum)",
              color: "#fff",
              padding: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#4ade80",
                    display: "inline-block",
                  }}
                />
                <strong style={{ fontSize: "0.95rem" }}>BGV Client Concierge</strong>
              </div>
              <span style={{ fontSize: "0.75rem", color: "#e8d8e2" }}>Online · Mon – Sat 8am to 8pm</span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              style={{ color: "#fff", background: "none", border: "none", cursor: "pointer" }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages body */}
          <div
            style={{
              flex: 1,
              padding: "16px",
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
                    alignSelf: isAdmin ? "flex-start" : "flex-end",
                    maxWidth: "82%",
                    padding: "10px 14px",
                    borderRadius: isAdmin ? "12px 12px 12px 2px" : "12px 12px 2px 12px",
                    background: isAdmin ? "#fff" : "var(--plum)",
                    color: isAdmin ? "var(--ink)" : "#fff",
                    border: isAdmin ? "1px solid var(--line)" : "none",
                    fontSize: "0.85rem",
                    lineHeight: "1.4",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      marginBottom: "4px",
                      opacity: 0.8,
                      fontWeight: 700,
                    }}
                  >
                    {m.senderName}
                  </div>
                  <div>{m.message}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: "12px 14px",
              background: "#fff",
              borderTop: "1px solid var(--line)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {!user && !conversationId && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ padding: "8px", fontSize: "0.75rem", minHeight: "34px" }}
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  style={{ padding: "8px", fontSize: "0.75rem", minHeight: "34px" }}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Type your question..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  fontSize: "0.85rem",
                  minHeight: "40px",
                }}
              />
              <button
                type="submit"
                disabled={sending || !inputMessage.trim()}
                className="button coral"
                style={{ padding: "0 16px", minHeight: "40px", fontSize: "0.8rem" }}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
