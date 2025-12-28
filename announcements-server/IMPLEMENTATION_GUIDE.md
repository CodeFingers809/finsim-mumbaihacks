# Announcements Server - Complete Implementation Guide

## Overview

This server converts stock market text announcements into visually attractive images and sends them to WhatsApp. It uses:
- **Gemini 2.5 Flash** for AI-powered text analysis and enhancement
- **Node Canvas** for image generation with custom templates
- **Baileys** for WhatsApp integration

## Architecture

```
Text Announcement → Gemini AI (parsing) → Image Generator → WhatsApp
```

1. Receive text announcement via POST /send
2. Gemini AI analyzes and structures the content
3. Canvas generates styled image based on sentiment
4. Image is sent to WhatsApp with caption

## Installation

```bash
cd frontend/apps/announcements-server
pnpm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your Gemini API key:
```
GEMINI_API_KEY=your_actual_api_key
```

Get your API key from: https://makersuite.google.com/app/apikey

## Running the Server

```bash
# Development mode with hot reload
pnpm dev

# Production build
pnpm build
pnpm start
```

On first run, scan the QR code printed in the terminal with WhatsApp.

## API Usage

### Send Stock Market Announcement

```bash
curl -X POST http://localhost:4001/send \
  -H "Content-Type: application/json" \
  -d '{
    "toNumber": "+1234567890",
    "announcement": "Apple Inc. (AAPL) surges 5% after announcing record Q4 earnings."
  }'
```

**Response:**
```json
{
  "success": true,
  "jid": "1234567890@s.whatsapp.net",
  "messageId": "3EB0XXXX",
  "timestamp": "1703721234",
  "announcementData": {
    "title": "Apple Hits Record Q4 Earnings",
    "content": "Apple Inc. (AAPL) surges 5% after...",
    "category": "bullish",
    "timestamp": "2024-12-27T10:30:00.000Z",
    "tickers": ["AAPL"]
  }
}
```

## Image Generation Features

### 1. Dynamic Color Schemes

Images use different color palettes based on sentiment:

- **Bullish** (Green): Positive news, stock gains
  - Background: Dark blue (#0F172A)
  - Accent: Green (#10B981)
  
- **Bearish** (Red): Negative news, stock losses
  - Background: Dark (#18181B)
  - Accent: Red (#EF4444)
  
- **Neutral** (Blue): General market updates
  - Background: Slate (#1E293B)
  - Accent: Blue (#3B82F6)
  
- **Alert** (Amber): Breaking news, urgent updates
  - Background: Warm dark (#1C1917)
  - Accent: Amber (#F59E0B)

### 2. Visual Elements

- **Gradient backgrounds** with subtle texture
- **Category badges** showing sentiment
- **Ticker symbols** prominently displayed
- **Accent borders** for visual hierarchy
- **Glow effects** for emphasis
- **Timestamp** for context
- **Branding** with "FinSim Market Alert"

### 3. Typography

- **Title**: Bold 52px - Main headline
- **Content**: 28px - Body text (wrapped)
- **Tickers**: Bold 16px - Stock symbols
- **Timestamp**: 20px - Date/time info

## Gemini AI Integration

The AI performs several tasks:

1. **Parsing**: Extracts key information from raw text
2. **Summarization**: Creates concise title and content
3. **Sentiment Analysis**: Determines bullish/bearish/neutral/alert
4. **Ticker Extraction**: Identifies stock symbols (AAPL, TSLA, etc.)

If AI fails, the system uses intelligent fallbacks to ensure announcements are always sent.

## Testing

Use the provided examples:

```typescript
import { testAnnouncement, sampleAnnouncements } from './examples.js';

// Test with sample announcement
testAnnouncement(
  sampleAnnouncements[0].text,
  '+1234567890'
);
```

## Image Generation Options

The current implementation uses **Node Canvas**, but here are alternatives:

### Current: Node Canvas ✅
- **Pros**: Fast, native rendering, full control
- **Cons**: Requires native dependencies
- **Best for**: High-performance, custom designs

### Alternative 1: Puppeteer + HTML/CSS
```typescript
import puppeteer from 'puppeteer';

async function generateWithPuppeteer(html: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const screenshot = await page.screenshot({ type: 'png' });
  await browser.close();
  return screenshot;
}
```
- **Pros**: Use HTML/CSS, easier styling
- **Cons**: Slower, heavier dependency

### Alternative 2: Sharp + SVG
```typescript
import sharp from 'sharp';

async function generateWithSharp(svg: string) {
  return sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}
```
- **Pros**: Fast, good for simple designs
- **Cons**: SVG limitations

### Alternative 3: Jimp (Pure JS)
```typescript
import Jimp from 'jimp';

async function generateWithJimp(text: string) {
  const image = new Jimp(1200, 630, '#000000');
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  image.print(font, 10, 10, text);
  return image.getBufferAsync(Jimp.MIME_PNG);
}
```
- **Pros**: Pure JavaScript, no native deps
- **Cons**: Limited text rendering, slower

### Alternative 4: Fabric.js
- **Pros**: Rich canvas features
- **Cons**: Requires node-canvas

### Alternative 5: Cloud Services
- **Cloudinary** with templates
- **Imgix** with text overlays
- **Bannerbear** API
- **Pros**: No server rendering
- **Cons**: External dependency, costs

## Customization

### Change Image Size
```typescript
const width = 1200;  // Change to 1920 for HD
const height = 630;  // Change to 1080 for HD
```

### Add Custom Fonts
```typescript
import { registerFont } from 'canvas';
registerFont('./fonts/CustomFont.ttf', { family: 'CustomFont' });
ctx.font = '52px CustomFont';
```

### Modify Templates
Edit `imageGenerator.ts` to customize:
- Color schemes
- Layout
- Typography
- Visual effects

## Production Considerations

1. **Rate Limiting**: Add rate limiting for API calls
2. **Caching**: Cache Gemini responses for similar announcements
3. **Queue System**: Use Bull/BullMQ for processing
4. **Error Handling**: Implement retry logic
5. **Monitoring**: Add logging and metrics
6. **Security**: Validate input, sanitize text

## Troubleshooting

### Canvas Installation Issues
```bash
# macOS
brew install pkg-config cairo pango libpng jpeg giflib librsvg

# Ubuntu/Debian
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Windows
# Canvas provides pre-built binaries
```

### WhatsApp Not Connecting
1. Delete `auth/` folder
2. Restart server
3. Scan new QR code

### Gemini API Errors
- Check API key is correct
- Verify API quota/limits
- Check network connectivity

## Examples

See `examples.ts` for sample announcements covering:
- Bullish news (stock gains)
- Bearish news (stock losses)
- Neutral updates (Fed decisions)
- Alert notifications (trading halts)

## License

Part of FinSim project for Hack This Fall 2025.
