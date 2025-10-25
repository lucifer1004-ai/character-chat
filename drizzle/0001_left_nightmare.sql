CREATE TABLE `characterKnowledge` (
	`id` int AUTO_INCREMENT NOT NULL,
	`characterId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`embedding` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `characterKnowledge_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`systemPrompt` text NOT NULL,
	`avatarUrl` text,
	`isPublic` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `characters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`characterId` int NOT NULL,
	`title` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groupChatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupChatId` int NOT NULL,
	`characterId` int,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groupChatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groupChatParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupChatId` int NOT NULL,
	`characterId` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groupChatParticipants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groupChats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`topic` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `groupChats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
