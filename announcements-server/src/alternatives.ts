/**
 * Alternative Image Generation Implementations
 * 
 * This file contains different approaches to generate images from announcements.
 * Choose based on your requirements:
 * - Canvas: Best performance, native rendering (current default)
 * - Puppeteer: Use HTML/CSS, easier styling
 * - Sharp: Fast, good for simple designs
 * - Jimp: Pure JS, no native dependencies
 */

import { AnnouncementData } from "./imageGenerator.js";

// =============================================================================
// OPTION 1: Puppeteer (HTML/CSS) - Easier Styling
// =============================================================================
// npm install puppeteer

/*
import puppeteer from 'puppeteer';

export async function generateWithPuppeteer(
  data: AnnouncementData
): Promise<Buffer> {
  const theme = getThemeColors(data.category);
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 1200px;
            height: 630px;
            background: linear-gradient(135deg, ${theme.gradient[0]}, ${theme.gradient[1]});
            font-family: Arial, sans-serif;
            position: relative;
            overflow: hidden;
          }
          .border { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 8px; 
            height: 100%; 
            background: ${theme.accent};
            box-shadow: 0 0 20px ${theme.accent};
          }
          .badge {
            position: absolute;
            top: 60px;
            left: 60px;
            background: ${theme.accent}30;
            padding: 10px 20px;
            border-radius: 20px;
            color: ${theme.accent};
            font-weight: bold;
            font-size: 18px;
            text-transform: uppercase;
          }
          .tickers {
            position: absolute;
            top: 60px;
            left: 240px;
            display: flex;
            gap: 15px;
          }
          .ticker {
            background: rgba(255,255,255,0.1);
            padding: 10px 15px;
            border-radius: 20px;
            color: #E5E7EB;
            font-weight: bold;
            font-size: 16px;
          }
          .title {
            position: absolute;
            top: 180px;
            left: 60px;
            right: 60px;
            color: white;
            font-size: 52px;
            font-weight: bold;
            line-height: 1.25;
          }
          .content {
            position: absolute;
            top: 320px;
            left: 60px;
            right: 60px;
            color: #D1D5DB;
            font-size: 28px;
            line-height: 1.5;
          }
          .footer {
            position: absolute;
            bottom: 50px;
            left: 60px;
            right: 60px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .timestamp {
            color: #9CA3AF;
            font-size: 20px;
          }
          .branding {
            color: ${theme.accent};
            font-size: 24px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="border"></div>
        <div class="badge">${data.category}</div>
        <div class="tickers">
          ${data.tickers?.slice(0, 3).map(t => `<div class="ticker">${t}</div>`).join('')}
        </div>
        <div class="title">${data.title}</div>
        <div class="content">${data.content}</div>
        <div class="footer">
          <div class="timestamp">${data.timestamp.toLocaleString()}</div>
          <div class="branding">FinSim Market Alert</div>
        </div>
      </body>
    </html>
  `;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });
  await page.setContent(html);
  const screenshot = await page.screenshot({ type: 'png' });
  await browser.close();

  return screenshot as Buffer;
}

function getThemeColors(category: string) {
  const themes = {
    bullish: { accent: '#10B981', gradient: ['#0F172A', '#1E293B'] },
    bearish: { accent: '#EF4444', gradient: ['#18181B', '#27272A'] },
    neutral: { accent: '#3B82F6', gradient: ['#1E293B', '#334155'] },
    alert: { accent: '#F59E0B', gradient: ['#1C1917', '#292524'] },
  };
  return themes[category as keyof typeof themes] || themes.neutral;
}
*/

// =============================================================================
// OPTION 2: Sharp with SVG - Fast and Simple
// =============================================================================
// npm install sharp

/*
import sharp from 'sharp';

export async function generateWithSharp(
  data: AnnouncementData
): Promise<Buffer> {
  const theme = getThemeColors(data.category);
  
  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${theme.gradient[0]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${theme.gradient[1]};stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="1200" height="630" fill="url(#grad)" />
      
      <!-- Border -->
      <rect x="0" y="0" width="8" height="630" fill="${theme.accent}" />
      
      <!-- Badge -->
      <rect x="60" y="60" width="160" height="40" rx="20" fill="${theme.accent}" opacity="0.3" />
      <text x="80" y="85" font-family="Arial" font-size="18" font-weight="bold" fill="${theme.accent}">
        ${data.category.toUpperCase()}
      </text>
      
      <!-- Title -->
      <text x="60" y="200" font-family="Arial" font-size="52" font-weight="bold" fill="white">
        ${escapeXml(data.title.slice(0, 40))}
      </text>
      
      <!-- Content -->
      <text x="60" y="350" font-family="Arial" font-size="28" fill="#D1D5DB">
        ${escapeXml(data.content.slice(0, 100))}
      </text>
      
      <!-- Branding -->
      <text x="1140" y="590" font-family="Arial" font-size="24" font-weight="bold" 
            fill="${theme.accent}" text-anchor="end">
        FinSim Market Alert
      </text>
    </svg>
  `;

  return sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
*/

// =============================================================================
// OPTION 3: Jimp - Pure JavaScript (No Native Dependencies)
// =============================================================================
// npm install jimp

/*
import Jimp from 'jimp';

export async function generateWithJimp(
  data: AnnouncementData
): Promise<Buffer> {
  const width = 1200;
  const height = 630;
  
  // Create image
  const image = new Jimp(width, height, getBackgroundColor(data.category));
  
  // Load fonts
  const fontTitle = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
  const fontContent = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
  
  // Add accent border
  const accentColor = getAccentColor(data.category);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < 8; x++) {
      image.setPixelColor(accentColor, x, y);
    }
  }
  
  // Add text (Jimp has limited text rendering)
  image.print(fontSmall, 60, 70, data.category.toUpperCase());
  image.print(fontTitle, 60, 180, {
    text: data.title,
    alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
    alignmentY: Jimp.VERTICAL_ALIGN_TOP
  }, 1080, 200);
  
  image.print(fontContent, 60, 320, {
    text: data.content,
    alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
    alignmentY: Jimp.VERTICAL_ALIGN_TOP
  }, 1080, 200);
  
  image.print(fontSmall, 900, 590, 'FinSim Market Alert');
  
  return image.getBufferAsync(Jimp.MIME_PNG);
}

function getBackgroundColor(category: string): number {
  const colors = {
    bullish: 0x0F172AFF,
    bearish: 0x18181BFF,
    neutral: 0x1E293BFF,
    alert: 0x1C1917FF,
  };
  return colors[category as keyof typeof colors] || colors.neutral;
}

function getAccentColor(category: string): number {
  const colors = {
    bullish: 0x10B981FF,
    bearish: 0xEF4444FF,
    neutral: 0x3B82F6FF,
    alert: 0xF59E0BFF,
  };
  return colors[category as keyof typeof colors] || colors.neutral;
}
*/

// =============================================================================
// OPTION 4: Cloud-Based Services
// =============================================================================

/*
// Cloudinary with templates
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'your_cloud_name',
  api_key: 'your_api_key',
  api_secret: 'your_api_secret'
});

export async function generateWithCloudinary(
  data: AnnouncementData
): Promise<string> {
  const result = await cloudinary.uploader.upload('template.png', {
    transformation: [
      { overlay: 'text:Arial_52_bold:' + encodeURIComponent(data.title) },
      { gravity: 'north_west', x: 60, y: 180 },
      { overlay: 'text:Arial_28:' + encodeURIComponent(data.content) },
      { gravity: 'north_west', x: 60, y: 320 }
    ]
  });
  
  return result.secure_url;
}

// Imgix with text overlays
export async function generateWithImgix(
  data: AnnouncementData
): Promise<string> {
  const baseUrl = 'https://your-source.imgix.net/template.png';
  const params = new URLSearchParams({
    txt: data.title,
    'txt-size': '52',
    'txt-color': 'FFFFFF',
    'txt-align': 'left,top',
    'txt-pad': '60'
  });
  
  return `${baseUrl}?${params.toString()}`;
}
*/

// =============================================================================
// COMPARISON MATRIX
// =============================================================================

/*
┌──────────────┬────────┬──────────┬───────────┬─────────────┬──────────┐
│ Option       │ Speed  │ Quality  │ Ease      │ Flexibility │ No Deps  │
├──────────────┼────────┼──────────┼───────────┼─────────────┼──────────┤
│ Canvas       │ ★★★★★  │ ★★★★★    │ ★★★☆☆     │ ★★★★★       │ ★★☆☆☆    │
│ Puppeteer    │ ★★☆☆☆  │ ★★★★★    │ ★★★★★     │ ★★★★★       │ ★☆☆☆☆    │
│ Sharp+SVG    │ ★★★★☆  │ ★★★★☆    │ ★★★★☆     │ ★★★☆☆       │ ★★★☆☆    │
│ Jimp         │ ★★★☆☆  │ ★★☆☆☆    │ ★★★☆☆     │ ★★☆☆☆       │ ★★★★★    │
│ Cloud        │ ★★★★★  │ ★★★★☆    │ ★★★★★     │ ★★☆☆☆       │ ★★★★★    │
└──────────────┴────────┴──────────┴───────────┴─────────────┴──────────┘

Recommendations:
- Production with servers: Canvas (current choice)
- Serverless/Edge: Cloud services
- Easy prototyping: Puppeteer
- No build tools: Jimp
- Simple graphics: Sharp+SVG
*/

export const imageGenerationOptions = {
  canvas: "Best performance and flexibility (current default)",
  puppeteer: "Use HTML/CSS for easier styling",
  sharp: "Fast, good for simple designs",
  jimp: "Pure JavaScript, no native dependencies",
  cloud: "Cloudinary, Imgix, Bannerbear - no server rendering"
};
