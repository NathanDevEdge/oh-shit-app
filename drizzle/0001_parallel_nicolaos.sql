CREATE TABLE `minigame_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gameId` varchar(64) NOT NULL,
	`score` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `minigame_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `toilet_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`durationSeconds` int NOT NULL,
	`earningsAmount` decimal(10,4) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `toilet_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `salaryType` enum('hourly','yearly') DEFAULT 'hourly' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `salaryAmount` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);