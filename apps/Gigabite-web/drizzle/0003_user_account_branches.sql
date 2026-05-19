ALTER TABLE "users" RENAME COLUMN "delivery_address" TO "default_delivery_address";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "work_location" text;
