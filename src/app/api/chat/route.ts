import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ success: false, error: "Conversation ID required" }, { status: 400 });
    }

    const db = getDb();
    let messages: any[] = [];

    if (db) {
      try {
        messages = await db
          .select()
          .from(schema.chatMessages)
          .where(eq(schema.chatMessages.conversationId, conversationId as any))
          .orderBy(asc(schema.chatMessages.createdAt));
      } catch (err) {
        console.warn("DB chat fetch notice:", err);
      }
    }

    if (messages.length === 0) {
      messages = inMemoryStore.chatMessages.get(conversationId) || [];
    }

    return NextResponse.json({
      success: true,
      data: { messages },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch chat" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { conversationId, customerName, customerEmail, message, senderRole = "customer" } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: "Message content cannot be empty" }, { status: 400 });
    }

    const db = getDb();
    let convId = conversationId || crypto.randomUUID();
    const msgId = crypto.randomUUID();

    const newMsg = {
      id: msgId,
      conversationId: convId,
      senderName: customerName || "Customer",
      senderEmail: customerEmail || "guest@client.com",
      senderRole: senderRole as "customer" | "admin",
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    if (db) {
      try {
        // Upsert conversation
        await db
          .insert(schema.chatConversations)
          .values({
            id: convId as any,
            customerName: customerName || "Customer",
            customerEmail: customerEmail || "guest@client.com",
            lastMessage: message.trim(),
            updatedAt: new Date(),
          })
          .onConflictDoNothing();

        // Insert message
        await db.insert(schema.chatMessages).values({
          id: msgId as any,
          conversationId: convId as any,
          senderName: customerName || "Customer",
          senderEmail: customerEmail || "guest@client.com",
          senderRole,
          message: message.trim(),
        });
      } catch (err) {
        console.warn("DB chat insert notice:", err);
      }
    }

    // In-memory store
    const existingList = inMemoryStore.chatMessages.get(convId) || [];
    existingList.push(newMsg);
    inMemoryStore.chatMessages.set(convId, existingList);

    inMemoryStore.chatConversations.set(convId, {
      id: convId,
      customerName: customerName || "Customer",
      customerEmail: customerEmail || "guest@client.com",
      lastMessage: message.trim(),
      updatedAt: new Date().toISOString(),
    });

    // Generate intelligent concierge auto-acknowledgment on first message if from customer
    let autoReply = null;
    if (senderRole === "customer" && existingList.length === 1) {
      autoReply = {
        id: crypto.randomUUID(),
        conversationId: convId,
        senderName: "BGV Concierge",
        senderRole: "admin" as const,
        message: `Thank you for reaching out, ${customerName || "there"}. A representative from our Ojo, Lagos studio has received your inquiry and will reply shortly.`,
        createdAt: new Date().toISOString(),
      };
      existingList.push(autoReply);
    }

    return NextResponse.json({
      success: true,
      data: {
        conversationId: convId,
        message: newMsg,
        reply: autoReply,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 });
  }
}
