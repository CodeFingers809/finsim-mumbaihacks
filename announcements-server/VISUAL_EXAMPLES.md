# Visual Examples of Generated Announcements

## Example 1: Bullish Announcement (Green Theme)

```
╔═══════════════════════════════════════════════════════════════════╗
║▌                                                                  ║
║▌  [🟢 BULLISH]  [AAPL]  [MSFT]                                   ║
║▌                                                                  ║
║▌                                                                  ║
║▌  Apple Hits Record Q4 Earnings                                  ║
║▌  With Strong iPhone Sales                                       ║
║▌                                                                  ║
║▌                                                                  ║
║▌  Apple Inc. (AAPL) surges 5% after announcing record Q4        ║
║▌  earnings. Revenue hits $95B, beating analyst expectations.     ║
║▌  Stock reaches all-time high of $185.                           ║
║▌                                                                  ║
║▌                                                                  ║
║▌                                                                  ║
║▌  Dec 27, 2024, 10:30 AM         📊 FinSim Market Alert ─┐      ║
║▌                                                          │      ║
╚═══════════════════════════════════════════════════════════════════╝

Colors:
- Background: Dark blue gradient (#0F172A → #1E293B)
- Accent: Emerald green (#10B981)
- Left border: Green with glow effect
- Title: White, bold, 52px
- Content: Light gray, 28px
```

---

## Example 2: Bearish Announcement (Red Theme)

```
╔═══════════════════════════════════════════════════════════════════╗
║▌                                                                  ║
║▌  [🔴 BEARISH]  [TSLA]                                           ║
║▌                                                                  ║
║▌                                                                  ║
║▌  Tesla Deliveries Miss Estimates                                ║
║▌  Stock Down 12% After Hours                                     ║
║▌                                                                  ║
║▌                                                                  ║
║▌  BREAKING: Tesla (TSLA) stock plummets 12% in after-hours      ║
║▌  trading following disappointing delivery numbers. Q3           ║
║▌  deliveries miss estimates by 15,000 vehicles.                  ║
║▌                                                                  ║
║▌                                                                  ║
║▌                                                                  ║
║▌  Dec 27, 2024, 02:15 PM         📊 FinSim Market Alert ─┐      ║
║▌                                                          │      ║
╚═══════════════════════════════════════════════════════════════════╝

Colors:
- Background: Dark gradient (#18181B → #27272A)
- Accent: Red (#EF4444)
- Left border: Red with glow effect
- Title: White, bold, 52px
- Content: Light gray, 28px
```

---

## Example 3: Neutral Announcement (Blue Theme)

```
╔═══════════════════════════════════════════════════════════════════╗
║▌                                                                  ║
║▌  [🔵 NEUTRAL]                                                    ║
║▌                                                                  ║
║▌                                                                  ║
║▌  Federal Reserve Maintains                                      ║
║▌  Interest Rates at 5.25-5.50%                                   ║
║▌                                                                  ║
║▌                                                                  ║
║▌  Federal Reserve maintains interest rates at 5.25-5.50%         ║
║▌  range. Fed Chair signals potential rate cuts in Q1 2024 if     ║
║▌  inflation continues to moderate.                               ║
║▌                                                                  ║
║▌                                                                  ║
║▌                                                                  ║
║▌  Dec 27, 2024, 04:00 PM         📊 FinSim Market Alert ─┐      ║
║▌                                                          │      ║
╚═══════════════════════════════════════════════════════════════════╝

Colors:
- Background: Slate gradient (#1E293B → #334155)
- Accent: Blue (#3B82F6)
- Left border: Blue with glow effect
- Title: White, bold, 52px
- Content: Light gray, 28px
```

---

## Example 4: Alert Announcement (Amber Theme)

```
╔═══════════════════════════════════════════════════════════════════╗
║▌                                                                  ║
║▌  [🟡 ALERT]  [GME]                                              ║
║▌                                                                  ║
║▌                                                                  ║
║▌  Trading Halted for GameStop                                    ║
║▌  Circuit Breaker Triggered                                      ║
║▌                                                                  ║
║▌                                                                  ║
║▌  ALERT: Trading halted for GameStop (GME) after 40% surge       ║
║▌  in 30 minutes. Circuit breaker triggered. Investigation        ║
║▌  pending.                                                        ║
║▌                                                                  ║
║▌                                                                  ║
║▌                                                                  ║
║▌  Dec 27, 2024, 11:45 AM         📊 FinSim Market Alert ─┐      ║
║▌                                                          │      ║
╚═══════════════════════════════════════════════════════════════════╝

Colors:
- Background: Warm dark gradient (#1C1917 → #292524)
- Accent: Amber (#F59E0B)
- Left border: Amber with glow effect
- Title: White, bold, 52px
- Content: Light gray, 28px
```

---

## Design Details

### Dimensions
- **Width**: 1200px
- **Height**: 630px
- **Aspect Ratio**: ~1.9:1 (optimal for social media)

### Color Schemes

| Category | Background Start | Background End | Accent   | Border |
|----------|-----------------|----------------|----------|--------|
| Bullish  | #0F172A         | #1E293B        | #10B981  | Green  |
| Bearish  | #18181B         | #27272A        | #EF4444  | Red    |
| Neutral  | #1E293B         | #334155        | #3B82F6  | Blue   |
| Alert    | #1C1917         | #292524        | #F59E0B  | Amber  |

### Typography

| Element       | Font Size | Weight | Color    |
|---------------|-----------|--------|----------|
| Category      | 18px      | Bold   | Accent   |
| Tickers       | 16px      | Bold   | #E5E7EB  |
| Title         | 52px      | Bold   | #FFFFFF  |
| Content       | 28px      | Normal | #D1D5DB  |
| Timestamp     | 20px      | Normal | #9CA3AF  |
| Branding      | 24px      | Bold   | Accent   |

### Effects

1. **Gradient Background**: Diagonal (top-left to bottom-right)
2. **Accent Border**: 8px wide, left side, with 20px glow
3. **Badges**: Rounded corners (20px radius), semi-transparent background
4. **Texture**: 100 random particles (1-3px, 2% opacity)
5. **Decorative Line**: Right side, 2px, 40% opacity

### Layout Grid

```
    60px   1080px (content)   60px
   ┌────┬──────────────────────┬────┐
   │    │                      │    │
60 │    │ [Badges & Tickers]   │    │
   │    │                      │    │
   ├────┼──────────────────────┼────┤
   │    │                      │    │
180│    │ Title (2-3 lines)    │    │
   │    │                      │    │
   ├────┼──────────────────────┼────┤
   │    │                      │    │
320│    │ Content (3-4 lines)  │    │
   │    │                      │    │
   ├────┼──────────────────────┼────┤
   │    │                      │    │
580│    │ Footer (timestamp +  │    │
   │    │         branding)    │    │
   └────┴──────────────────────┴────┘
```

### Text Wrapping

- **Title**: Max 2 lines, wraps at word boundaries
- **Content**: Max 4 lines, wraps at word boundaries
- **Line heights**: 
  - Title: 65px (1.25x)
  - Content: 42px (1.5x)

### Responsive Considerations

Images render perfectly at:
- Desktop (full size)
- Mobile (scaled down)
- WhatsApp preview
- Social media embeds

### File Output

- **Format**: PNG
- **Size**: ~150-300KB
- **Quality**: High-resolution
- **Compression**: Optimized for WhatsApp

---

## How Images Are Generated

1. **Create Canvas**: 1200x630px
2. **Draw Gradient Background**: From theme colors
3. **Add Texture**: Random particles for visual interest
4. **Draw Accent Border**: Left side with glow
5. **Add Category Badge**: Rounded rectangle with text
6. **Add Ticker Badges**: Up to 3 tickers
7. **Render Title**: Large, bold, wrapped text
8. **Render Content**: Smaller body text
9. **Add Footer**: Timestamp and branding
10. **Export to PNG**: Buffer for WhatsApp

Total generation time: ~200-500ms per image.

---

## WhatsApp Appearance

When sent to WhatsApp, the image:
- ✅ Shows full preview in chat
- ✅ Includes caption with announcement text
- ✅ Maintains quality after compression
- ✅ Looks professional on all devices
- ✅ Renders instantly (no loading)

The caption format:
```
📊 [Title]

[Content]
```

Example:
```
📊 Apple Hits Record Q4 Earnings

Apple Inc. (AAPL) surges 5% after announcing record Q4 earnings. Revenue hits $95B, beating analyst expectations.
```

---

## Customization Examples

### Change to HD (1920x1080)
```typescript
const width = 1920;
const height = 1080;
```

### Add Logo
```typescript
const logo = await loadImage('./logo.png');
ctx.drawImage(logo, 1000, 50, 100, 100);
```

### Use Custom Font
```typescript
registerFont('./fonts/Roboto-Bold.ttf', { family: 'Roboto' });
ctx.font = 'bold 52px Roboto';
```

### Add Chart/Graph
```typescript
// Draw simple line chart
ctx.strokeStyle = theme.accent;
ctx.lineWidth = 3;
ctx.beginPath();
ctx.moveTo(60, 500);
ctx.lineTo(300, 450);
ctx.lineTo(540, 480);
ctx.stroke();
```

---

These visual examples show exactly what users will receive on WhatsApp! 🎨📱
