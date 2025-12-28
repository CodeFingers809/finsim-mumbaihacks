# Quick Reference - BSE Filing Announcements

## 🚀 Quick Start

```bash
# 1. Install
cd frontend/apps/announcements-server && pnpm install

# 2. Configure
cp .env.example .env
# Add: GEMINI_API_KEY=your_key

# 3. Run
pnpm dev

# 4. Send BSE Filing
curl -X POST http://localhost:4001/send \
  -H "Content-Type: application/json" \
  -d '{"toNumber":"+1234567890","announcement":"530565,Popees Cares Ltd,Insider Trading / SAST,..."}'
```

## 📊 Importance Levels & Colors

| Icon | Level | Color | Keywords | Border |
|------|-------|-------|----------|--------|
| 🚨 | CRITICAL | Red | insider, sast, violation | 12px thick + URGENT |
| ⚠️ | HIGH | Orange-red | result, acquisition, merger | 8px |
| 📋 | IMPORTANT | Golden | agm, dividend, record date | 8px |
| ℹ️ | NOTICE | Blue | clarification, update | 8px |
| 📄 | INFO | Purple | general, default | 8px |

## 📝 BSE Data Format

```
stockCode,companyName,filingType,subject,timestamp,hash,filename,pdfUrl
```

**Example:**
```
530565,Popees Cares Ltd,Insider Trading / SAST,Closure of Trading Window,2025-12-27T12:57:50.58,hash,file.txt,https://bse.pdf
```

## 🎨 What Gets Generated

```
┌─────────────────────────────────────────┐
│▌▌ [🚨 CRITICAL] [530565]    URGENT ↗  │  ← Importance + Stock
│▌▌                                      │
│▌▌ POPEES CARES LTD                    │  ← Company
│▌▌ Insider Trading / SAST              │  ← Filing Type
│▌▌                                      │
│▌▌ Trading Window Closed                │  ← AI Title
│▌▌ For Designated Persons               │
│▌▌                                      │
│▌▌ Closure ahead of results...          │  ← AI Content
│▌▌                                      │
│▌▌ [📄 View Document]                   │  ← PDF Link
│▌▌                                      │
│▌▌ Dec 27 2025      BSE · FinSim Alert │  ← Footer
└─────────────────────────────────────────┘
```

## 🔧 Customize Importance

**File:** `src/imageGenerator.ts`

```typescript
function determineImportanceFromType(filingType: string) {
  const type = filingType.toLowerCase();
  
  // Add your keywords
  if (type.includes('fraud')) return 'critical';
  if (type.includes('profit')) return 'high';
  if (type.includes('meeting')) return 'medium';
  
  return 'info';
}
```

## 🎨 Customize Colors

```typescript
const themes = {
  critical: {
    accent: "#YOUR_COLOR",      // Main accent
    gradient: ["#START", "#END"], // Background
    icon: "YOUR_EMOJI",          // Badge emoji
    label: "YOUR_LABEL"          // Badge text
  }
}
```

## 📱 API Examples

### BSE Filing
```json
POST /send
{
  "toNumber": "+1234567890",
  "announcement": "530565,Popees,Insider Trading,Subject,2025-12-27T12:57:50,hash,file,url"
}
```

### Plain Text (Still Works)
```json
POST /send
{
  "toNumber": "+1234567890",
  "announcement": "Apple surges 5% on earnings"
}
```

### Regular Message
```json
POST /send
{
  "toNumber": "+1234567890",
  "text": "Plain text without image"
}
```

## 🎯 Visual Urgency Features

### Critical Items Get:
- ✅ Thicker border (12px vs 8px)
- ✅ Stronger glow (30px vs 20px)
- ✅ "URGENT" corner badge (rotated 45°)
- ✅ Triangle accent top-right
- ✅ Border outline on badge
- ✅ Vibrant red color

### Others Get:
- ✅ Standard 8px border
- ✅ Normal glow effect
- ✅ Clean, professional look
- ✅ Color-coded by importance

## 📐 Layout Positions

```typescript
Badge Y:        60px   // Top badges
Company Y:      140px  // Company name
Filing Type Y:  165px  // Filing type
Title Y:        220px  // Main headline (or 180 if no company)
Content Y:      360px  // Body text (or 320)
Button Y:       height - 150px  // View Document
Footer Y:       height - 50px   // Timestamp + branding
```

## 🔍 Detection Logic

```typescript
// Auto-detects BSE format
isBSEData = text.includes(',') && text.split(',').length >= 8

// Parses into:
{
  stockCode: parts[0],
  companyName: parts[1],
  filingType: parts[2],
  subject: parts[3],
  timestamp: parts[4],
  pdfLink: parts[7]
}
```

## 🤖 AI Enhancement

Gemini 2.5 Flash analyzes:
1. Company name
2. Filing type
3. Subject line

Generates:
- Catchy investor-focused title (max 50 chars)
- Clear explanation (max 150 chars)
- Importance level assessment

## 📚 Documentation

| File | Purpose |
|------|---------|
| [README.md](./README.md) | API reference |
| [BSE_FILING_DESIGN.md](./BSE_FILING_DESIGN.md) | Complete visual specs |
| [BSE_IMPLEMENTATION.md](./BSE_IMPLEMENTATION.md) | Detailed guide |
| [QUICKSTART.md](./QUICKSTART.md) | Original setup |
| [examples.ts](./src/examples.ts) | Sample data |

## 🎨 Color Palette

```css
Critical:  #FF1744 (Red)          → Insider, SAST
High:      #FF6B35 (Orange-red)   → Results, M&A
Important: #FCD34D (Golden)       → AGM, Dividends
Notice:    #60A5FA (Blue)         → Updates
Info:      #A78BFA (Purple)       → General
```

## ⚡ Quick Changes

### Change border width for critical
```typescript
const borderWidth = data.category === 'critical' ? 16 : 8;
```

### Change glow intensity
```typescript
ctx.shadowBlur = data.category === 'critical' ? 40 : 20;
```

### Change font sizes
```typescript
ctx.font = "bold 52px Arial";  // Title
ctx.font = "28px Arial";       // Content
```

## 🔥 Features

- ✅ Auto BSE CSV parsing
- ✅ AI-powered headlines
- ✅ Importance detection
- ✅ Color-coded urgency
- ✅ Company + stock info
- ✅ PDF link button
- ✅ WhatsApp sending
- ✅ Backward compatible
- ✅ Fully customizable

## 🎯 Test Examples

```javascript
// Critical
"530565,Popees,Insider Trading / SAST,Window Closed,..."

// High
"532540,TCS,Financial Results,Q4 Results,..."

// Important
"500325,Reliance,Board Meeting,AGM Notice,..."

// Notice
"532215,Axis,Clarification,News Article,..."

// Info
"500696,HUL,General Updates,Presentation,..."
```

---

**Everything you need in one place!** 🚀
