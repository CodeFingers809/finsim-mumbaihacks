# BSE Corporate Filing Visual Design

## 🎨 Importance-Based Color Schemes

The system now uses **5 importance levels** instead of sentiment, specifically designed for BSE corporate filings:

### 🚨 CRITICAL (Red - Urgent)
**When:** Insider trading restrictions, SAST violations, regulatory actions, compliance issues
```
Background: Deep red-black gradient (#1A0505 → #2D0A0A)
Accent: Vibrant red (#FF1744)
Border: 12px thick (extra wide)
Icon: 🚨
Label: "CRITICAL"
Special: "URGENT" corner badge, stronger glow, pulsing border
```

**Example:**
```
530565,Popees Cares Ltd,Insider Trading / SAST,Closure of Trading Window,...
```

---

### ⚠️ HIGH PRIORITY (Orange-Red - Important)
**When:** Financial results, acquisitions, mergers, board changes, major announcements
```
Background: Deep navy gradient (#0D1B2A → #1B263B)
Accent: Orange-red (#FF6B35)
Border: 8px
Icon: ⚠️
Label: "HIGH PRIORITY"
```

**Example:**
```
532540,TCS Ltd,Financial Results,Q4 Results FY 2024-25,...
```

---

### 📋 IMPORTANT (Golden Yellow - Notable)
**When:** AGM notices, record dates, dividend announcements, board meetings
```
Background: Slate gradient (#1E293B → #334155)
Accent: Golden yellow (#FCD34D)
Border: 8px
Icon: 📋
Label: "IMPORTANT"
```

**Example:**
```
500325,Reliance Industries,Board Meeting,Board Meeting Notice - AGM,...
```

---

### ℹ️ NOTICE (Light Blue - Standard)
**When:** Routine disclosures, clarifications, minor updates
```
Background: Dark blue gradient (#0F172A → #1E293B)
Accent: Light blue (#60A5FA)
Border: 8px
Icon: ℹ️
Label: "NOTICE"
```

**Example:**
```
532215,Axis Bank,Clarification,Clarification on News Article,...
```

---

### 📄 INFO (Purple - General)
**When:** General information, investor presentations, routine filings
```
Background: Neutral dark gradient (#18181B → #27272A)
Accent: Purple (#A78BFA)
Border: 8px
Icon: 📄
Label: "INFO"
```

**Example:**
```
500696,Hindustan Unilever,General Updates,Investor Presentation,...
```

---

## 📊 Layout Structure

### BSE Filing Format
```
┌──────────────────────────────────────────────────────────────────┐
│▌▌                                                                │
│▌▌  [🚨 CRITICAL]  [530565]                              URGENT ↗│ 60px
│▌▌                                                                │
│▌▌  POPEES CARES LTD                                             │ 140px
│▌▌  Insider Trading / SAST                                       │ 165px
│▌▌                                                                │
│▌▌  Trading Window Closed                                        │ 220px
│▌▌  For Designated Persons                                       │ Title
│▌▌                                                                │
│▌▌  Popees Cares Ltd has announced closure of trading            │
│▌▌  window for designated persons ahead of financial             │ 360px
│▌▌  results. Window remains closed until further notice.         │ Content
│▌▌                                                                │
│▌▌                                                                │
│▌▌  [📄 View Document]                                           │ 480px
│▌▌                                                                │
│▌▌  Dec 27, 2025, 12:57 PM         BSE · FinSim Alert      │    │ 580px
│▌▌                                                          │    │
└──────────────────────────────────────────────────────────────────┘
  12px (critical) or 8px (others)
```

## 🔍 Data Extraction

### Input Format (BSE CSV)
```
stockCode,companyName,filingType,subject,timestamp,hash,filename,pdfUrl
```

### Example Input
```
530565,Popees Cares Ltd,Insider Trading / SAST,Popees Cares Ltd - 530565 - Closure of Trading Window,2025-12-27T12:57:50.58,ab25500117c199bdea71029618ef902cf889474e744a179a569c96736e33d0e2,530565_ab255001.txt,https://www.bseindia.com/xml-data/corpfiling/AttachLive/0d0d08aa-2ba2-4fa2-8d4e-47d924134a13.pdf
```

### Extracted & Enhanced
- **Stock Code**: 530565 (badge)
- **Company**: POPEES CARES LTD (uppercase, gray)
- **Filing Type**: Insider Trading / SAST (italic, accent color)
- **AI Title**: "Trading Window Closed For Designated Persons"
- **AI Content**: Investor-focused summary
- **Importance**: Critical (auto-detected from filing type)
- **PDF Link**: Shows "View Document" button

## 🎯 Importance Auto-Detection

```typescript
Filing Type Keyword → Importance Level

'insider trading', 'sast', 'violation' → CRITICAL
'result', 'acquisition', 'merger' → HIGH
'agm', 'dividend', 'record date' → MEDIUM
'clarification', 'update' → LOW
default → INFO
```

## 🤖 AI Enhancement

### Gemini 2.5 Flash Processing
1. Receives BSE structured data
2. Analyzes filing type and subject
3. Creates catchy, investor-focused headline
4. Generates clear explanation
5. Assigns importance level
6. Returns structured JSON

### Example AI Transformation
**Input:**
```
Popees Cares Ltd - 530565 - Closure of Trading Window
```

**AI Output:**
```json
{
  "title": "Trading Window Closed For Designated Persons",
  "content": "Popees Cares Ltd has announced closure of trading window for designated persons ahead of financial results. Window remains closed until further notice.",
  "importance": "critical"
}
```

## 📐 Visual Elements

### 1. Importance Badge (Top Left)
- Icon + Label (e.g., "🚨 CRITICAL")
- Rounded rectangle
- Accent color with transparency
- For CRITICAL: extra border

### 2. Stock Code Badge
- White background (15% opacity)
- Stock code in white text
- Positioned after importance badge

### 3. Company Name
- All caps
- Gray color (#94A3B8)
- 20px font
- Below badges

### 4. Filing Type
- Italic style
- Accent color with 80% opacity
- 18px font
- Below company name

### 5. Title
- Bold 48px
- White text
- 2-3 lines max
- Word-wrapped

### 6. Content
- 26px regular
- Light gray (#D1D5DB)
- 3-4 lines max
- Investor-focused summary

### 7. View Document Button (if PDF link)
- Rounded button
- Accent color background (40% opacity)
- "📄 View Document" text
- Interactive look

### 8. Critical Indicators (CRITICAL only)
- Thicker border (12px vs 8px)
- Stronger glow (30px vs 20px)
- Corner "URGENT" badge (rotated 45°)
- Triangle accent in top-right

## 📱 API Usage

### Send BSE Filing
```bash
curl -X POST http://localhost:4001/send \
  -H "Content-Type: application/json" \
  -d '{
    "toNumber": "+1234567890",
    "announcement": "530565,Popees Cares Ltd,Insider Trading / SAST,Popees Cares Ltd - 530565 - Closure of Trading Window,2025-12-27T12:57:50.58,ab25500117c199bdea71029618ef902cf889474e744a179a569c96736e33d0e2,530565_ab255001.txt,https://www.bseindia.com/xml-data/corpfiling/AttachLive/0d0d08aa-2ba2-4fa2-8d4e-47d924134a13.pdf"
  }'
```

### Response
```json
{
  "success": true,
  "jid": "1234567890@s.whatsapp.net",
  "messageId": "3EB0XXXX",
  "timestamp": "1735302000",
  "announcementData": {
    "title": "Trading Window Closed For Designated Persons",
    "content": "Popees Cares Ltd announced closure...",
    "category": "critical",
    "timestamp": "2025-12-27T12:57:50.580Z",
    "companyName": "Popees Cares Ltd",
    "stockCode": "530565",
    "filingType": "Insider Trading / SAST",
    "pdfLink": "https://www.bseindia.com/...",
    "tickers": ["530565"]
  }
}
```

## 🎨 Visual Comparison

### Critical vs Info

**CRITICAL** (Red theme, thick border, urgent badge):
```
▌▌ 🚨 High urgency
▌▌ Extra thick border (12px)
▌▌ Vibrant red (#FF1744)
▌▌ Strong glow effect
▌▌ "URGENT" corner badge
▌▌ Pulsing border style
```

**INFO** (Purple theme, standard):
```
▌ 📄 Standard filing
▌ Normal border (8px)
▌ Subtle purple (#A78BFA)
▌ Standard glow
▌ No special badges
▌ Clean, minimal
```

## 🔧 Customization Parameters

You can adjust these in `imageGenerator.ts`:

### Importance Thresholds
```typescript
function determineImportanceFromType(filingType: string) {
  // Customize keywords and mapping
  if (type.includes('your_keyword')) return 'critical';
}
```

### Color Schemes
```typescript
const themes = {
  critical: {
    accent: "#YOUR_COLOR",
    gradient: ["#START", "#END"],
    icon: "YOUR_EMOJI",
    label: "YOUR_LABEL"
  }
}
```

### Visual Elements
- Border width: `borderWidth = 12 or 8`
- Glow intensity: `shadowBlur = 30 or 20`
- Badge size: `badgeWidth = 200`
- Font sizes: Title (48px), Content (26px)

## 📊 Smart Features

1. **Auto-parsing**: Detects BSE CSV format
2. **AI enhancement**: Uses Gemini for better titles/content
3. **Importance detection**: Keywords → urgency level
4. **Visual urgency**: Critical items get special styling
5. **PDF link handling**: Shows document button
6. **Fallback support**: Works even if AI fails
7. **Backward compatible**: Still handles plain text

## 🚀 Example Outputs

### 1. Critical Filing (Insider Trading)
- **Red theme** with urgent styling
- Thick border, strong glow
- "URGENT" corner badge
- Company + stock code prominently displayed

### 2. High Priority (Financial Results)
- **Orange-red theme**
- Standard border
- Clear filing type label
- Results-focused summary

### 3. Medium (Dividend)
- **Golden yellow theme**
- Clean, professional look
- Dividend details highlighted

### 4. Low (Clarification)
- **Light blue theme**
- Minimal urgency
- Informational style

### 5. Info (General)
- **Purple theme**
- Subtle, elegant
- Standard information display

---

**Now your BSE filings look professional, urgent when needed, and always attention-grabbing! 🎯**
