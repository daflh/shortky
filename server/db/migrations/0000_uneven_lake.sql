CREATE TYPE "public"."link_type" AS ENUM('url', 'text', 'file');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "links" (
	"id" text PRIMARY KEY NOT NULL,
	"alias" text NOT NULL,
	"type" "link_type" NOT NULL,
	"content" text,
	"file_name" text,
	"file_mime" text,
	"file_size" integer,
	"file_path" text,
	"is_encrypted" boolean DEFAULT false NOT NULL,
	"encryption_salt" text,
	"encryption_iv" text,
	"auto_redirect" boolean DEFAULT true NOT NULL,
	"preview_enabled" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone,
	"burn_after_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "links_alias_unique" UNIQUE("alias")
);
