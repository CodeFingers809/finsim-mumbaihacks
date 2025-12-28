# Announcements Server (WhatsApp + Gemini AI)

Express + Baileys + Gemini AI server that converts stock market news announcements into visually attractive images and sends them to WhatsApp.

## Features

- Converts text announcements to beautiful images with templates
- Uses Gemini 2.5 Flash for content enhancement
- Persistent WhatsApp session
- Auto-generates styled images with stock market news

## Setup

1) Install deps from the monorepo root:

```sh
pnpm install
```

2) Set your Gemini API key:

```sh
export GEMINI_API_KEY=your_api_key_here
```

3) Start the server (from repo root or this app folder):

```sh
pnpm --filter announcements-server dev
```

- On first launch, a QR code is printed to the terminal—scan it with the WhatsApp account you want to use.
- Auth is persisted under `apps/announcements-server/auth`, so you stay logged in on restarts.

## Sending Announcements

The `/send` endpoint now supports BSE corporate filing data with automatic parsing and importance-based visual design:

### 1. BSE Corporate Filing Announcement (Recommended)

Send BSE filing data in CSV format:

```sh
curl -X POST http://localhost:4001/send \
  -H "Content-Type: application/json" \
  -d '{
    "toNumber": "+15551234567",
    "announcement": "530565,Popees Cares Ltd,Insider Trading / SAST,Popees Cares Ltd - 530565 - Closure of Trading Window,2025-12-27T12:57:50.58,ab25500117c199bdea71029618ef902cf889474e744a179a569c96736e33d0e2,530565_ab255001.txt,https://www.bseindia.com/xml-data/corpfiling/AttachLive/0d0d08aa-2ba2-4fa2-8d4e-47d924134a13.pdf"
  }'
```

**Features:**
- Auto-parses BSE CSV format (stockCode,companyName,filingType,subject,timestamp,hash,filename,pdfUrl)
- Uses Gemini 2.5 Flash to create catchy headlines
- Assigns importance level: CRITICAL, HIGH, MEDIUM, LOW, INFO
- Visual design changes based on importance:
  - 🚨 **CRITICAL** (Red): Insider trading, SAST violations - thick border, urgent badge
  - ⚠️ **HIGH** (Orange-red): Financial results, acquisitions - prominent display
  - 📋 **IMPORTANT** (Golden): AGM, dividends - professional look
  - ℹ️ **NOTICE** (Blue): Clarifications, updates - standard style
  - 📄 **INFO** (Purple): General filings - minimal urgency
- Displays company name, stock code, filing type
- Shows "View Document" button if PDF link present

### 2. Plain Text Announcement (Also Supported)

Send any stock market news text:

```sh
curl -X POST http://localhost:4001/send \
  -H "Content-Type: application/json" \
  -d '{
    "toNumber": "+15551234567",
    "announcement": "Apple Inc. (AAPL) surges 5% on record earnings!"
  }'
```

**Features:**
- AI analyzes and structures announcement
- Assigns importance based on content
- Generates styled image
- Sends to WhatsApp automatically

### 3. Regular Message (Original Functionality)

Send plain text:

```sh
curl -X POST http://localhost:4001/send \
  -H "Content-Type: application/json" \
  -d '{"toNumber":"+15551234567","text":"Hello from Baileys"}'
```

Send media with caption:

```sh
curl -X POST http://localhost:4001/send \
  -F "toNumber=+15551234567" \
  -F "caption=Chart snapshot" \
  -F "media=@/path/to/image.png" \
  -F "mediaType=image"
```

## API Parameters

- `toNumber` (required): E.164-style number (e.g., `+15551234567`)
- `announcement` (optional): Text to convert into styled image announcement
- `text` (optional): Plain text message
- `caption` (optional): Caption for media
- `media` (optional): File upload for images/videos/documents
- `mediaType` (optional): Force media type (`image`, `video`, `audio`, `document`, `sticker`)

## Environment Variables

- `PORT`: Server port (default: 4001)
- `GEMINI_API_KEY`: Required for announcement image generation

## Health Check

`GET /health` returns `{ status: "ok", connection: "open" | "connecting" | ... }`.
