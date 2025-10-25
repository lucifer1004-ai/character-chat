import { integer, pgEnum, pgTable, serial, text, timestamp, varchar, boolean } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Characters table - stores AI character definitions
 */
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(), // Creator of the character
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  systemPrompt: text("systemPrompt").notNull(), // Base personality/behavior instructions
  avatarUrl: text("avatarUrl"),
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = typeof characters.$inferInsert;

/**
 * Character knowledge base - RAG data storage
 * Each character can have multiple knowledge entries for context retrieval
 */
export const characterKnowledge = pgTable("characterKnowledge", {
  id: serial("id").primaryKey(),
  characterId: integer("characterId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  embedding: text("embedding"), // Store embedding as JSON string for vector search
  metadata: text("metadata"), // Additional metadata as JSON
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CharacterKnowledge = typeof characterKnowledge.$inferSelect;
export type InsertCharacterKnowledge = typeof characterKnowledge.$inferInsert;

/**
 * Conversations - one-on-one chats between user and character
 */
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  characterId: integer("characterId").notNull(),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages in one-on-one conversations
 */
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant"]);

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Group chats - multiple characters discussing together
 */
export const groupChats = pgTable("groupChats", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(), // Creator of the group chat
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  topic: text("topic"), // Discussion topic/prompt
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GroupChat = typeof groupChats.$inferSelect;
export type InsertGroupChat = typeof groupChats.$inferInsert;

/**
 * Group chat participants - characters in a group chat
 */
export const groupChatParticipants = pgTable("groupChatParticipants", {
  id: serial("id").primaryKey(),
  groupChatId: integer("groupChatId").notNull(),
  characterId: integer("characterId").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type GroupChatParticipant = typeof groupChatParticipants.$inferSelect;
export type InsertGroupChatParticipant = typeof groupChatParticipants.$inferInsert;

/**
 * Group chat messages - messages in group discussions
 */
export const groupChatMessages = pgTable("groupChatMessages", {
  id: serial("id").primaryKey(),
  groupChatId: integer("groupChatId").notNull(),
  characterId: integer("characterId"), // null means user message
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GroupChatMessage = typeof groupChatMessages.$inferSelect;
export type InsertGroupChatMessage = typeof groupChatMessages.$inferInsert;

