# Shortky

A supercharged, self-hosted URL shortener — share links, text snippets, or files behind one short URL, free forever.

## Features
- Short links with your own custom URL alias
- Share a destination URL, a block of text, or a file/image/video
- Inline preview for text and media (image/video)
- Password-protect text and files with AES-256 encryption
- Expire links anywhere from 5 minutes to never
- No accounts, no sign-up, unlimited usage

## Tech Stack
Nuxt 3 · Vue · TypeScript · Tailwind CSS + Nuxt UI · PostgreSQL

## Setup

Requires Node.js, [pnpm](https://pnpm.io), and a PostgreSQL database.

```bash
pnpm install
cp .env.sample .env   # set DATABASE_URL to your Postgres connection string
pnpm db:migrate       # create the database schema
pnpm dev              # open up http://localhost:3000
```

Uploaded files are stored locally under `.data/uploads`.

### Production build

```bash
pnpm build
pnpm preview
```
