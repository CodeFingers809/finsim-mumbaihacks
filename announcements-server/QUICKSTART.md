# Quick Start Guide

## ✅ What Has Been Implemented

1. **Server Renamed**: `whatsapp-server` → `announcements-server`
2. **Gemini 2.5 Flash Integration**: AI-powered text analysis and structuring
3. **Image Generation**: Canvas-based rendering with beautiful templates
4. **WhatsApp Integration**: Automatic image sending with captions
5. **Smart Sentiment Detection**: Bullish/Bearish/Neutral/Alert categorization
6. **Ticker Extraction**: Automatic detection of stock symbols

## 📦 Installation

```bash
cd frontend/apps/announcements-server
pnpm install
```

**Note**: If canvas installation fails, install system dependencies first:

**Windows**: Canvas provides pre-built binaries (should work automatically)

**macOS**:
```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

**Linux**:
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

## ⚙️ Configuration

1. Create `.env` file:
```bash
cp .env.example .env
```

2. Add your Gemini API key:
```
GEMINI_API_KEY=your_actual_api_key_here
```

Get API key: https://makersuite.google.com/app/apikey

## 🚀 Run the Server

```bash
pnpm dev
```

Scan the QR code with WhatsApp on first run.

## 📨 Send Your First Announcement

```bash
curl -X POST http://localhost:4001/send \
  -H "Content-Type: application/json" \
  -d '{
    "toNumber": "+1234567890",
    "announcement": "Apple Inc. (AAPL) surges 5% after announcing record Q4 earnings. Revenue hits $95B, beating expectations."
  }'
```

## 📋 What Happens

1. Text received via `/send` endpoint
2. Gemini AI analyzes and structures content
3. System determines sentiment (bullish/bearish/neutral/alert)
4. Generates styled image (1200x630px) with:
   - Dynamic gradient background
   - Category badge
   - Stock ticker symbols
   - Formatted title and content
   - Timestamp and branding
5. Sends image to WhatsApp with caption

## 🎨 Image Features

- **4 Color Schemes**: Bullish (Green), Bearish (Red), Neutral (Blue), Alert (Amber)
- **Auto Layout**: Text wrapping, spacing, alignment
- **Visual Effects**: Gradients, glows, textures
- **Responsive Design**: Optimized for mobile viewing

## 📚 Documentation

- [README.md](./README.md) - API reference and examples
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Complete technical guide
- [DESIGN_SPECS.md](./DESIGN_SPECS.md) - Visual design specifications
- [examples.ts](./src/examples.ts) - Sample announcements for testing

## 🔧 Troubleshooting

### Canvas won't install
Install system dependencies (see Installation section above)

### WhatsApp not connecting
1. Delete `auth/` folder
2. Restart server
3. Scan new QR code

### Gemini API errors
- Verify API key is correct
- Check API quota/limits
- Ensure GEMINI_API_KEY is in .env file

## 🎯 Next Steps

1. Install dependencies: `pnpm install`
2. Set up Gemini API key
3. Start server: `pnpm dev`
4. Scan WhatsApp QR code
5. Send test announcement
6. Customize templates in `imageGenerator.ts`

## 📞 API Endpoints

### POST /send
Send announcement (generates image) or regular message

**Announcement mode**:
```json
{
  "toNumber": "+1234567890",
  "announcement": "Your stock market news here"
}
```

**Regular message mode**:
```json
{
  "toNumber": "+1234567890",
  "text": "Plain text message"
}
```

### GET /health
Check server and WhatsApp connection status

## 🎨 Customization

Edit [imageGenerator.ts](./src/imageGenerator.ts) to customize:
- Colors and themes
- Layout and spacing
- Typography
- Visual effects
- Dimensions

## 💡 Tips

- Test with sample announcements in `examples.ts`
- Use descriptive announcement text for better AI parsing
- Include ticker symbols for automatic detection
- Adjust image dimensions for different platforms
- Add custom fonts for branding

## 🔄 Alternative Image Generation Options

See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md#image-generation-options) for:
- Puppeteer (HTML/CSS rendering)
- Sharp + SVG
- Jimp (pure JavaScript)
- Fabric.js
- Cloud services (Cloudinary, Imgix, Bannerbear)

Current implementation uses **Node Canvas** for best performance and flexibility.

---

**Ready to go!** Install dependencies and start the server. 🚀
