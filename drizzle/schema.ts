import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Characters table - stores AI character definitions
 */
export const characters = mysqlTable("characters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Creator of the character
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  systemPrompt: text("systemPrompt").notNull(), // Base personality/behavior instructions
  avatarUrl: text("avatarUrl"),
  isPublic: int("isPublic").default(0).notNull(), // 0 = false, 1 = true
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = typeof characters.$inferInsert;

/**
 * Character knowledge base - RAG data storage
 * Each character can have multiple knowledge entries for context retrieval
 */
export const characterKnowledge = mysqlTable("characterKnowledge", {
  id: int("id").autoincrement().primaryKey(),
  characterId: int("characterId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  embedding: text("embedding"), // Store embedding as JSON string for vector search
  metadata: text("metadata"), // Additional metadata as JSON
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CharacterKnowledge = typeof characterKnowledge.$inferSelect;
export type InsertCharacterKnowledge = typeof characterKnowledge.$inferInsert;

/**
 * Conversations - one-on-one chats between user and character
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  characterId: int("characterId").notNull(),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages in one-on-one conversations
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Group chats - multiple characters discussing together
 */
export const groupChats = mysqlTable("groupChats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Creator of the group chat
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  topic: text("topic"), // Discussion topic/prompt
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GroupChat = typeof groupChats.$inferSelect;
export type InsertGroupChat = typeof groupChats.$inferInsert;

/**
 * Group chat participants - characters in a group chat
 */
export const groupChatParticipants = mysqlTable("groupChatParticipants", {
  id: int("id").autoincrement().primaryKey(),
  groupChatId: int("groupChatId").notNull(),
  characterId: int("characterId").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type GroupChatParticipant = typeof groupChatParticipants.$inferSelect;
export type InsertGroupChatParticipant = typeof groupChatParticipants.$inferInsert;

/**
 * Group chat messages - messages in group discussions
 */
export const groupChatMessages = mysqlTable("groupChatMessages", {
  id: int("id").autoincrement().primaryKey(),
  groupChatId: int("groupChatId").notNull(),
  characterId: int("characterId"), // null means user message
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GroupChatMessage = typeof groupChatMessages.$inferSelect;
export type InsertGroupChatMessage = typeof groupChatMessages.$inferInsert;

