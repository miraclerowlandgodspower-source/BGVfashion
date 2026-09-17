import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    const db = getDb();

    // If specific conversation requested, return messages
    if (conversationId) {
      let messages: any[] = [];
      if (db) {
        try {
          messages = await db
            .select()
            .from(schema.chatMessages)
            .where(eq(schema.chatMessages.conversationId, conversationId as any))
            .orderBy(asc(schema.chatMessages.createdAt));
        } catch (err) {
          console.warn("DB messages error:", err);
        }
      }

      if (messages.length === 0) {
        messages = inMemoryStore.chatMessages.get(conversationId) || [];
      }

      return NextResponse.json({ success: true, data: { messages } });
    }

    // Otherwise return list of all conversations
    let conversations: any[] = [];
    if (db) {
      try {
        conversations = await db.select().from(schema.chatConversations).orderBy(desc(schema.chatConversations.updatedAt));
      } catch (err) {
        console.warn("DB conversations error:", err);
      }
    }

    if (conversations.length === 0) {
      conversations = Array.from(inMemoryStore.chatConversations.values());
    }

    return NextResponse.json({
      success: true,
      data: { conversations },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { conversationId, replyMessage, adminName = "BGV Support Team" } = await req.json();

    if (!conversationId || !replyMessage?.trim()) {
      return NextResponse.json({ success: false, error: "Conversation ID and reply message required" }, { status: 400 });
    }

    const db = getDb();
    const msgId = crypto.randomUUID();
    const replyObj = {
      id: msgId,
      conversationId,
      senderName: adminName,
      senderEmail: "concierge@bgvfashion.com",
      senderRole: "admin" as const,
      message: replyMessage.trim(),
      createdAt: new Date().toISOString(),
    };

    if (db) {
      try {
        await db.insert(schema.chatMessages).values({
          id: msgId as any,
          conversationId: conversationId as any,
          senderName: adminName,
          senderEmail: "concierge@bgvfashion.com",
          senderRole: "admin",
          message: replyMessage.trim(),
        });

        await db
          .update(schema.chatConversations)
          .set({ lastMessage: replyMessage.trim(), updatedAt: new Date() })
          .where(eq(schema.chatConversations.id, conversationId));
      } catch (err) {
        console.warn("DB reply insert error:", err);
      }
    }

    const list = inMemoryStore.chatMessages.get(conversationId) || [];
    list.push(replyObj);
    inMemoryStore.chatMessages.set(conversationId, list);

    const conv = inMemoryStore.chatConversations.get(conversationId);
    if (conv) {
      conv.lastMessage = replyMessage.trim();
      conv.updatedAt = new Date().toISOString();
    }

    return NextResponse.json({
      success: true,
      message: "Reply sent to client.",
      data: { reply: replyObj },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to send reply" }, { status: 500 });
  }
}
