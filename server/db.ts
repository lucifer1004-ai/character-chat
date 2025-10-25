import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser,
  users,
  characters,
  InsertCharacter,
  characterKnowledge,
  InsertCharacterKnowledge,
  conversations,
  InsertConversation,
  messages,
  InsertMessage,
  groupChats,
  InsertGroupChat,
  groupChatParticipants,
  InsertGroupChatParticipant,
  groupChatMessages,
  InsertGroupChatMessage,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL);
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Character queries
export async function createCharacter(data: InsertCharacter) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(characters).values(data).returning();
  return result[0].id;
}

export async function getCharacterById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(characters).where(eq(characters.id, id)).limit(1);
  return result[0];
}

export async function getUserCharacters(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(characters).where(eq(characters.userId, userId));
}

export async function getPublicCharacters() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(characters).where(eq(characters.isPublic, true));
}

export async function updateCharacter(id: number, data: Partial<InsertCharacter>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(characters).set(data).where(eq(characters.id, id));
}

export async function deleteCharacter(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(characters).where(eq(characters.id, id));
}

// Character knowledge queries
export async function addCharacterKnowledge(data: InsertCharacterKnowledge) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(characterKnowledge).values(data).returning();
  return result[0].id;
}

export async function getCharacterKnowledge(characterId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(characterKnowledge).where(eq(characterKnowledge.characterId, characterId));
}

export async function deleteCharacterKnowledge(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(characterKnowledge).where(eq(characterKnowledge.id, id));
}

// Conversation queries
export async function createConversation(data: InsertConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(conversations).values(data).returning();
  return result[0].id;
}

export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations).where(eq(conversations.userId, userId));
}

export async function getConversationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result[0];
}

export async function deleteConversation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(conversations).where(eq(conversations.id, id));
}

// Message queries
export async function addMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(data).returning();
  return result[0].id;
}

export async function getConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId));
}

// Group chat queries
export async function createGroupChat(data: InsertGroupChat) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(groupChats).values(data).returning();
  return result[0].id;
}

export async function getUserGroupChats(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(groupChats).where(eq(groupChats.userId, userId));
}

export async function getGroupChatById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(groupChats).where(eq(groupChats.id, id)).limit(1);
  return result[0];
}

export async function deleteGroupChat(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(groupChats).where(eq(groupChats.id, id));
}

// Group chat participant queries
export async function addGroupChatParticipant(data: InsertGroupChatParticipant) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(groupChatParticipants).values(data).returning();
  return result[0].id;
}

export async function getGroupChatParticipants(groupChatId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(groupChatParticipants).where(eq(groupChatParticipants.groupChatId, groupChatId));
}

export async function removeGroupChatParticipant(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(groupChatParticipants).where(eq(groupChatParticipants.id, id));
}

// Group chat message queries
export async function addGroupChatMessage(data: InsertGroupChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(groupChatMessages).values(data).returning();
  return result[0].id;
}

export async function getGroupChatMessages(groupChatId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(groupChatMessages).where(eq(groupChatMessages.groupChatId, groupChatId));
}
