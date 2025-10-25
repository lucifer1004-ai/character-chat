import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  characters: router({
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          systemPrompt: z.string().min(1),
          avatarUrl: z.string().optional(),
          isPublic: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.createCharacter({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          systemPrompt: input.systemPrompt,
          avatarUrl: input.avatarUrl,
          isPublic: input.isPublic,
        });
        return { id };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const userCharacters = await db.getUserCharacters(ctx.user.id);
      const publicCharacters = await db.getPublicCharacters();
      
      // Merge and deduplicate
      const allCharacters = [...userCharacters];
      for (const char of publicCharacters) {
        if (!allCharacters.find(c => c.id === char.id)) {
          allCharacters.push(char);
        }
      }
      
      return allCharacters;
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const character = await db.getCharacterById(input.id);
        if (!character) return null;
        return character;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          systemPrompt: z.string().min(1).optional(),
          avatarUrl: z.string().optional(),
          isPublic: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const character = await db.getCharacterById(input.id);
        if (!character || character.userId !== ctx.user.id) {
          throw new Error("Character not found or unauthorized");
        }

        const { id, ...updateData } = input;
        const dbUpdateData: any = { ...updateData };

        await db.updateCharacter(id, dbUpdateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const character = await db.getCharacterById(input.id);
        if (!character || character.userId !== ctx.user.id) {
          throw new Error("Character not found or unauthorized");
        }

        await db.deleteCharacter(input.id);
        return { success: true };
      }),
  }),

  knowledge: router({
    add: protectedProcedure
      .input(
        z.object({
          characterId: z.number(),
          title: z.string().min(1).max(255),
          content: z.string().min(1),
          metadata: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const character = await db.getCharacterById(input.characterId);
        if (!character || character.userId !== ctx.user.id) {
          throw new Error("Character not found or unauthorized");
        }

        const id = await db.addCharacterKnowledge({
          characterId: input.characterId,
          title: input.title,
          content: input.content,
          metadata: input.metadata,
        });

        return { id };
      }),

    list: protectedProcedure
      .input(z.object({ characterId: z.number() }))
      .query(async ({ ctx, input }) => {
        const character = await db.getCharacterById(input.characterId);
        if (!character || (character.userId !== ctx.user.id && !character.isPublic)) {
          throw new Error("Character not found or unauthorized");
        }

        return db.getCharacterKnowledge(input.characterId);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number(), characterId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const character = await db.getCharacterById(input.characterId);
        if (!character || character.userId !== ctx.user.id) {
          throw new Error("Character not found or unauthorized");
        }

        await db.deleteCharacterKnowledge(input.id);
        return { success: true };
      }),
  }),

  conversations: router({
    create: protectedProcedure
      .input(
        z.object({
          characterId: z.number(),
          title: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.createConversation({
          userId: ctx.user.id,
          characterId: input.characterId,
          title: input.title,
        });
        return { id };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserConversations(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const conversation = await db.getConversationById(input.id);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new Error("Conversation not found or unauthorized");
        }
        return conversation;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await db.getConversationById(input.id);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new Error("Conversation not found or unauthorized");
        }

        await db.deleteConversation(input.id);
        return { success: true };
      }),
  }),

  messages: router({
    list: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new Error("Conversation not found or unauthorized");
        }

        return db.getConversationMessages(input.conversationId);
      }),

    send: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          content: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new Error("Conversation not found or unauthorized");
        }

        // Add user message
        await db.addMessage({
          conversationId: input.conversationId,
          role: "user",
          content: input.content,
        });

        // Get character and conversation history
        const character = await db.getCharacterById(conversation.characterId);
        if (!character) throw new Error("Character not found");

        const history = await db.getConversationMessages(input.conversationId);
        
        // Get relevant knowledge for RAG
        const knowledge = await db.getCharacterKnowledge(character.id);
        let contextText = "";
        if (knowledge.length > 0) {
          // Simple keyword matching for RAG (in production, use vector embeddings)
          const relevantKnowledge = knowledge.filter(k => 
            input.content.toLowerCase().split(" ").some(word => 
              k.content.toLowerCase().includes(word) || k.title.toLowerCase().includes(word)
            )
          );
          
          if (relevantKnowledge.length > 0) {
            contextText = "\n\nRelevant knowledge:\n" + 
              relevantKnowledge.map(k => `${k.title}: ${k.content}`).join("\n");
          }
        }

        // Build messages for LLM
        const messages = [
          { role: "system" as const, content: character.systemPrompt + contextText },
          ...history.map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ];

        // Get AI response
        const response = await invokeLLM({ messages });
        const assistantMessage = typeof response.choices[0]?.message?.content === 'string' 
          ? response.choices[0].message.content 
          : "I'm sorry, I couldn't generate a response.";

        // Save assistant message
        await db.addMessage({
          conversationId: input.conversationId,
          role: "assistant",
          content: assistantMessage,
        });

        return { content: assistantMessage };
      }),
  }),

  groupChats: router({
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          topic: z.string().optional(),
          characterIds: z.array(z.number()).min(2),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.createGroupChat({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          topic: input.topic,
        });

        // Add participants
        for (const characterId of input.characterIds) {
          await db.addGroupChatParticipant({
            groupChatId: id,
            characterId,
          });
        }

        return { id };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserGroupChats(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const groupChat = await db.getGroupChatById(input.id);
        if (!groupChat || groupChat.userId !== ctx.user.id) {
          throw new Error("Group chat not found or unauthorized");
        }

        const participants = await db.getGroupChatParticipants(input.id);
        const characters = await Promise.all(
          participants.map(p => db.getCharacterById(p.characterId))
        );

        return {
          ...groupChat,
          characters: characters.filter(c => c !== undefined),
        };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const groupChat = await db.getGroupChatById(input.id);
        if (!groupChat || groupChat.userId !== ctx.user.id) {
          throw new Error("Group chat not found or unauthorized");
        }

        await db.deleteGroupChat(input.id);
        return { success: true };
      }),
  }),

  groupMessages: router({
    list: protectedProcedure
      .input(z.object({ groupChatId: z.number() }))
      .query(async ({ ctx, input }) => {
        const groupChat = await db.getGroupChatById(input.groupChatId);
        if (!groupChat || groupChat.userId !== ctx.user.id) {
          throw new Error("Group chat not found or unauthorized");
        }

        return db.getGroupChatMessages(input.groupChatId);
      }),

    send: protectedProcedure
      .input(
        z.object({
          groupChatId: z.number(),
          content: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const groupChat = await db.getGroupChatById(input.groupChatId);
        if (!groupChat || groupChat.userId !== ctx.user.id) {
          throw new Error("Group chat not found or unauthorized");
        }

        // Add user message
        await db.addGroupChatMessage({
          groupChatId: input.groupChatId,
          characterId: null,
          content: input.content,
        });

        return { success: true };
      }),

    generateResponse: protectedProcedure
      .input(z.object({ groupChatId: z.number(), characterId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const groupChat = await db.getGroupChatById(input.groupChatId);
        if (!groupChat || groupChat.userId !== ctx.user.id) {
          throw new Error("Group chat not found or unauthorized");
        }

        const character = await db.getCharacterById(input.characterId);
        if (!character) throw new Error("Character not found");

        // Get conversation history
        const history = await db.getGroupChatMessages(input.groupChatId);
        
        // Get all participants
        const participants = await db.getGroupChatParticipants(input.groupChatId);
        const characters = await Promise.all(
          participants.map(p => db.getCharacterById(p.characterId))
        );

        // Build context
        let systemPrompt = character.systemPrompt;
        if (groupChat.topic) {
          systemPrompt += `\n\nDiscussion topic: ${groupChat.topic}`;
        }
        systemPrompt += `\n\nYou are participating in a group discussion with: ${characters.map(c => c?.name).filter(Boolean).join(", ")}`;

        // Get relevant knowledge for RAG
        const knowledge = await db.getCharacterKnowledge(character.id);
        if (knowledge.length > 0) {
          const recentMessages = history.slice(-5).map(m => m.content).join(" ");
          const relevantKnowledge = knowledge.filter(k => 
            recentMessages.toLowerCase().split(" ").some(word => 
              k.content.toLowerCase().includes(word) || k.title.toLowerCase().includes(word)
            )
          );
          
          if (relevantKnowledge.length > 0) {
            systemPrompt += "\n\nRelevant knowledge:\n" + 
              relevantKnowledge.map(k => `${k.title}: ${k.content}`).join("\n");
          }
        }

        // Build messages for LLM
        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...history.slice(-10).map(m => {
            const charName = m.characterId 
              ? characters.find(c => c?.id === m.characterId)?.name || "Character"
              : "User";
            return {
              role: "user" as const,
              content: `${charName}: ${m.content}`,
            };
          }),
        ];

        // Get AI response
        const response = await invokeLLM({ messages });
        const assistantMessage = typeof response.choices[0]?.message?.content === 'string'
          ? response.choices[0].message.content
          : "I have nothing to add at this moment.";

        // Save character message
        await db.addGroupChatMessage({
          groupChatId: input.groupChatId,
          characterId: input.characterId,
          content: assistantMessage,
        });

        return { content: assistantMessage };
      }),
  }),
});

export type AppRouter = typeof appRouter;

