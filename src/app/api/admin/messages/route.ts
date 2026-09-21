import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { checkAdminApiAccess } from "@/lib/auth";
import { eq, desc, asc } from "drizzle-orm";

export async function GET(req: Request) {
  const { authorized, errorResponse } = await checkAdminApiAccess();
  if (!authorized) {
    return errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const status = searchParams.get("status");

    const db = getDb();

    // If specific conversation requested, return messages
    if (conversationId) {
      let messages: any[] = [];
      if (db) {
        try {
          const rows = await db
            .select()
            .from(schema.chatMessages)
            .where(eq(schema.chatMessages.conversationId, conversationId as any))
            .orderBy(asc(schema.chatMessages.createdAt));

          messages = rows.map((m) => ({
            ...m,
            createdAt: m.createdAt ? m.createdAt.toISOString() : new Date().toISOString(),
          }));
        } catch (err) {
          console.warn("DB messages error (using fallback):", err);
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
        const rows = await db
          .select()
          .from(schema.chatConversations)
          .orderBy(desc(schema.chatConversations.updatedAt));

        conversations = rows.map((c) => ({
          ...c,
          status: c.status || "open",
          updatedAt: c.updatedAt ? c.updatedAt.toISOString() : new Date().toISOString(),
          createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
        }));
      } catch (err) {
        console.warn("DB conversations error (using fallback):", err);
      }
    }

    if (conversations.length === 0) {
      conversations = Array.from(inMemoryStore.chatConversations.values()).map((c) => ({
        ...c,
        status: c.status || "open",
      }));
    }

    if (status && status !== "all") {
      conversations = conversations.filter((c) => c.status === status);
    }

    return NextResponse.json({
      success: true,
      data: { conversations },
    });
  } catch (error: any) {
    console.error("Failed to fetch admin messages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch conversations." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { authorized, user, errorResponse } = await checkAdminApiAccess();
  if (!authorized) {
    return errorResponse!;
  }

  try {
    const { conversationId, replyMessage, adminName } = await req.json();

    if (!conversationId || !replyMessage?.trim()) {
      return NextResponse.json(
        { success: false, error: "Conversation ID and reply message are required." },
        { status: 400 }
      );
    }

    const db = getDb();
    const msgId = crypto.randomUUID();
    const sender = adminName || user?.name || "BGV Concierge Support";

    const replyObj = {
      id: msgId,
      conversationId,
      senderName: sender,
      senderEmail: user?.email || "concierge@bgvfashion.com",
      senderRole: "admin" as const,
      message: replyMessage.trim(),
      isRead: true,
      createdAt: new Date().toISOString(),
    };

    if (db) {
      try {
        await db.insert(schema.chatMessages).values({
          id: msgId as any,
          conversationId: conversationId as any,
          senderName: sender,
          senderEmail: user?.email || "concierge@bgvfashion.com",
          senderRole: "admin",
          message: replyMessage.trim(),
          isRead: true,
        });

        await db
          .update(schema.chatConversations)
          .set({
            lastMessage: replyMessage.trim(),
            updatedAt: new Date(),
          })
          .where(eq(schema.chatConversations.id, conversationId));
      } catch (err) {
        console.warn("DB reply insert error (using fallback):", err);
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
      message: "Reply sent to client successfully.",
      data: { reply: replyObj },
    });
  } catch (error: any) {
    console.error("Failed to send admin reply:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send reply." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const { authorized, errorResponse } = await checkAdminApiAccess();
  if (!authorized) {
    return errorResponse!;
  }

  try {
    const { conversationId, status } = await req.json();

    if (!conversationId || !status) {
      return NextResponse.json(
        { success: false, error: "Conversation ID and status ('open', 'pending', 'resolved') are required." },
        { status: 400 }
      );
    }

    const validStatuses = ["open", "pending", "resolved"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const db = getDb();
    if (db) {
      try {
        await db
          .update(schema.chatConversations)
          .set({ status, updatedAt: new Date() })
          .where(eq(schema.chatConversations.id, conversationId));
      } catch (err) {
        console.warn("DB update conversation status error:", err);
      }
    }

    const conv = inMemoryStore.chatConversations.get(conversationId);
    if (conv) {
      conv.status = status;
      conv.updatedAt = new Date().toISOString();
    }

    return NextResponse.json({
      success: true,
      message: `Conversation marked as ${status}.`,
    });
  } catch (error: any) {
    console.error("Failed to update conversation status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update conversation status." },
      { status: 500 }
    );
  }
}
