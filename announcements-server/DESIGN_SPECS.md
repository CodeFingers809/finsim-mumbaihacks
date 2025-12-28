# Image Template Design Specifications

## Layout Structure (1200x630px)

```
┌─────────────────────────────────────────────────────────┐
│ ▌                                                       │
│ ▌  [BADGE: BULLISH] [AAPL] [MSFT]                     │ 60px
│ ▌                                                       │
│ ▌                                                       │
│ ▌  Apple Hits Record Q4 Earnings                       │ 180px
│ ▌  With Strong iPhone Sales                            │ Title Area
│ ▌                                                       │
│ ▌                                                       │
│ ▌  Apple Inc. (AAPL) surges 5% after announcing        │
│ ▌  record Q4 earnings. Revenue hits $95B, beating      │ 320px
│ ▌  analyst expectations. Stock reaches all-time        │ Content Area
│ ▌  high of $185.                                        │
│ ▌                                                       │
│ ▌                                                       │
│ ▌  Dec 27, 2024, 10:30 AM         FinSim Market Alert │ 580px
│ ▌─────────────────────────────────────────────────┐    │ Footer
└─────────────────────────────────────────────────────────┘
  8px                                              1140px
  Border
```

## Color Palettes

### Bullish (Green) 📈
```css
background: linear-gradient(135deg, #0F172A, #1E293B)
accent: #10B981 (emerald-500)
text-primary: #FFFFFF
text-secondary: #D1D5DB
```

### Bearish (Red) 📉
```css
background: linear-gradient(135deg, #18181B, #27272A)
accent: #EF4444 (red-500)
text-primary: #FFFFFF
text-secondary: #D1D5DB
```

### Neutral (Blue) ℹ️
```css
background: linear-gradient(135deg, #1E293B, #334155)
accent: #3B82F6 (blue-500)
text-primary: #FFFFFF
text-secondary: #D1D5DB
```

### Alert (Amber) ⚠️
```css
background: linear-gradient(135deg, #1C1917, #292524)
accent: #F59E0B (amber-500)
text-primary: #FFFFFF
text-secondary: #D1D5DB
```

## Component Breakdown

### 1. Accent Border (Left)
- Width: 8px
- Height: 630px (full height)
- Color: Accent color
- Glow effect: 20px blur

### 2. Category Badge
- Position: (60, 60)
- Size: 160x40px
- Background: Accent with 30% opacity
- Text: Bold 18px, uppercase
- Border radius: 20px

### 3. Ticker Badges
- Position: Starting at (240, 60)
- Size: Dynamic width, 40px height
- Background: White with 10% opacity
- Text: Bold 16px
- Border radius: 20px
- Spacing: 15px between badges
- Max: 3 tickers shown

### 4. Title
- Position: (60, 180)
- Font: Bold 52px Arial
- Color: #FFFFFF
- Max width: 1080px
- Line height: 65px
- Word wrap enabled

### 5. Content
- Position: (60, 320)
- Font: 28px Arial
- Color: #D1D5DB (gray-300)
- Max width: 1080px
- Line height: 42px
- Word wrap enabled

### 6. Timestamp
- Position: (60, 580)
- Font: 20px Arial
- Color: #9CA3AF (gray-400)
- Format: "MMM DD, YYYY, HH:MM AM/PM"

### 7. Branding
- Position: (1140, 580) - right aligned
- Font: Bold 24px Arial
- Color: Accent color
- Text: "FinSim Market Alert"

### 8. Decorative Line
- Position: (1140, 60) to (1140, 580)
- Width: 2px
- Color: Accent with 40% opacity

### 9. Background Texture
- 100 random particles
- Size: 1-3px
- Color: White with 2% opacity
- Distributed randomly

## Typography Scale

```
Category Badge:  18px bold uppercase
Tickers:         16px bold
Title:           52px bold
Content:         28px regular
Timestamp:       20px regular
Branding:        24px bold
```

## Spacing System

```
Padding:        60px (left/right)
Badge spacing:  15px
Line heights:   
  - Title: 65px (1.25x)
  - Content: 42px (1.5x)
```

## Example Outputs

### Bullish Announcement
![Bullish](https://via.placeholder.com/1200x630/0F172A/10B981?text=BULLISH+Apple+Earnings)

### Bearish Announcement
![Bearish](https://via.placeholder.com/1200x630/18181B/EF4444?text=BEARISH+Tesla+Deliveries)

### Neutral Announcement
![Neutral](https://via.placeholder.com/1200x630/1E293B/3B82F6?text=NEUTRAL+Fed+Rate+Decision)

### Alert Announcement
![Alert](https://via.placeholder.com/1200x630/1C1917/F59E0B?text=ALERT+Trading+Halted)

## Accessibility

- Minimum contrast ratio: 4.5:1
- Readable at small sizes (mobile)
- Clear visual hierarchy
- Color not sole indicator (badges + text)

## Performance

- Generation time: ~200-500ms
- Output size: ~150-300KB PNG
- Optimized for WhatsApp compression
- Sharp rendering at all sizes

## Customization Points

1. **Dimensions**: Change width/height for different platforms
2. **Colors**: Modify theme object for brand colors
3. **Fonts**: Register custom fonts with canvas
4. **Layout**: Adjust positions and spacing
5. **Effects**: Add shadows, borders, patterns
6. **Branding**: Update logo and text

## Platform Optimization

### WhatsApp
- Current: 1200x630 (social media standard)
- Recommended: Same (works well)

### Twitter/X
- Recommended: 1200x675 (16:9)

### Instagram
- Story: 1080x1920 (9:16)
- Feed: 1080x1080 (1:1)

### LinkedIn
- Recommended: 1200x627

### Discord
- Recommended: 1280x720 (16:9)
