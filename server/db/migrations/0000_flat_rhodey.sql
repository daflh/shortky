CREATE TABLE IF NOT EXISTS "shortlinks" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"alias" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"content" text,
	"file_name" varchar(255),
	"file_mime" varchar(255),
	"file_size" integer,
	"file_path" text,
	"encryption_salt" text,
	"encryption_iv" text,
	"is_encrypted" boolean DEFAULT false,
	"auto_redirect" boolean DEFAULT true,
	"preview_enabled" boolean DEFAULT false,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "shortlinks_alias_unique" UNIQUE("alias")
);
