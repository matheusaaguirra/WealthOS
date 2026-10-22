CREATE TABLE `auth_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`requests` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_rate_limits_expiry_idx` ON `auth_rate_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `holdings` (
	`user_id` text NOT NULL,
	`ticker` text NOT NULL,
	`id` text NOT NULL,
	`quantity` integer NOT NULL,
	`average_price_cents` integer,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `ticker`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "holdings_quantity_valid" CHECK("holdings"."quantity" > 0 AND "holdings"."quantity" <= 1000000),
	CONSTRAINT "holdings_average_price_valid" CHECK("holdings"."average_price_cents" IS NULL OR ("holdings"."average_price_cents" >= 1 AND "holdings"."average_price_cents" <= 1000000000))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `holdings_user_id_unique` ON `holdings` (`user_id`,`id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expiry_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`provider` text NOT NULL,
	`password_hash` text,
	`google_sub` text,
	`created_at` integer NOT NULL,
	CONSTRAINT "users_provider_valid" CHECK("users"."provider" IN ('email','google')),
	CONSTRAINT "users_provider_credentials" CHECK(("users"."provider" = 'email' AND "users"."password_hash" IS NOT NULL AND "users"."google_sub" IS NULL) OR ("users"."provider" = 'google' AND "users"."google_sub" IS NOT NULL AND "users"."password_hash" IS NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_sub_unique` ON `users` (`google_sub`);