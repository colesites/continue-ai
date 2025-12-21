import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getMessages = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user || chat.ownerId !== user._id) {
      return [];
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_chat_order", (q) => q.eq("chatId", args.chatId))
      .collect();
  },
});

export const addMessage = mutation({
  args: {
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user || chat.ownerId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Get the highest order number
    const lastMessage = await ctx.db
      .query("messages")
      .withIndex("by_chat_order", (q) => q.eq("chatId", args.chatId))
      .order("desc")
      .first();

    const order = lastMessage ? lastMessage.order + 1 : 0;
    const now = Date.now();

    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      role: args.role,
      content: args.content,
      createdAt: now,
      order,
      metadata: {
        model: args.model,
        isImported: false,
      },
    });

    // Update chat's updatedAt
    await ctx.db.patch(args.chatId, {
      updatedAt: now,
    });

    return messageId;
  },
});

export const updateMessageContent = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const chat = await ctx.db.get(message.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user || chat.ownerId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
    });
  },
});

