# Shortky
Universal link and file sharing platform

## Tech Stack
- Nuxt.js
- Tailwind CSS
- PostgreSQL
- Drizzle
- Typescript

## Pages
- Home -> there will be 3 tabs for creating URL, Text, and File/Media
  * URL: should have destination URL, custom alias (optional), expiration time, auto-redirect switch
  * Text: should have text area, custom alias (optional), expiration time, password (optional)
  * File/Media: should have file upload area, custom alias (optional), expiration time, password (optional), preview image/video switch
- Preview -> should show the content based on the type, all should show the URL alias and expiration time
  * URL: only show this if auto-redirect if false, show URL preview, redirect within 10 seconds
  * Text: show password input (if any), text content, copy button, download button, etc. no need for syntax highlighting
  * File/Media: show password input (if any), image/video preview (ony for media), file size, download button, etc.

## Features
- Create a short url with custom alias [like Bitly]
- Share a text [like Pastebin], image, video, or other files [like SendAnywhere/Pairdrop] with short url
- Preview content for text and media (image/video)
- Choose expire time anywhere between 5 mins to no expiration
- Password protect your files using AES-256 encryption
- Free forever with unlimited usage
