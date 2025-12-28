import sharp from "sharp";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface AnnouncementData {
  title: string;
  content: string;
  category: "critical" | "high" | "medium" | "low" | "info";
  timestamp: Date;
  tickers?: string[];
  companyName?: string;
  filingType?: string;
  stockCode?: string;
  pdfLink?: string;
}

/**
 * Parses BSE corporate filing data
 * Format: stockCode,companyName,category,subject,timestamp,hash,filename,pdfUrl
 */
export function parseBSEData(rawText: string): {
  stockCode: string;
  companyName: string;
  filingType: string;
  subject: string;
  timestamp: string;
  pdfLink: string;
} {
  const parts = rawText.split(',');
  return {
    stockCode: parts[0] || '',
    companyName: parts[1] || '',
    filingType: parts[2] || '',
    subject: parts[3] || '',
    timestamp: parts[4] || '',
    pdfLink: parts[7] || '',
  };
}

/**
 * Uses Gemini 2.5 Flash to enhance and structure the announcement text
 */
export async function enhanceAnnouncementWithAI(
  rawText: string
): Promise<AnnouncementData> {
  try {
    // Check if this is BSE structured data
    const isBSEData = rawText.includes(',') && rawText.split(',').length >= 8;
    
    if (isBSEData) {
      const bseData = parseBSEData(rawText);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

      const prompt = `
You are a financial analyst. Analyze this BSE (Bombay Stock Exchange) corporate filing:

Company: ${bseData.companyName}
Stock Code: ${bseData.stockCode}
Filing Type: ${bseData.filingType}
Subject: ${bseData.subject}

Determine:
1. Title: A catchy, clear headline (max 50 chars) - make it attention-grabbing
2. Content: Concise explanation of what this means for investors (max 150 chars)
3. Importance: Rate as "critical", "high", "medium", "low", or "info" based on:
   - Critical: Insider trading restrictions, SAST violations, major regulatory actions
   - High: Financial results, acquisitions, board changes, compliance issues
   - Medium: AGM notices, record dates, dividend announcements
   - Low: Routine disclosures, minor updates
   - Info: General information, clarifications

Return ONLY valid JSON:
{
  "title": "Catchy headline",
  "content": "Investor-focused summary",
  "importance": "critical|high|medium|low|info"
}
`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const jsonText = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(jsonText);

      return {
        title: parsed.title || bseData.subject.slice(0, 50),
        content: parsed.content || bseData.subject,
        category: parsed.importance || determineImportanceFromType(bseData.filingType),
        timestamp: bseData.timestamp ? new Date(bseData.timestamp) : new Date(),
        companyName: bseData.companyName,
        stockCode: bseData.stockCode,
        filingType: bseData.filingType,
        pdfLink: bseData.pdfLink,
        tickers: [bseData.stockCode],
      };
    }

    // Fallback for non-BSE data (original logic)
    const model = genAI.getGenerativeModel({ model: "models/gemini-3-flash-preview" });

    const prompt = `
You are a financial news analyst. Parse the following announcement and extract structured information.

Announcement:
${rawText}

Return a JSON response with:
- title: A catchy headline (max 50 chars)
- content: Clean summary (max 150 chars)
- importance: One of "critical", "high", "medium", "low", or "info"
- tickers: Array of stock ticker symbols mentioned

Return ONLY valid JSON, no markdown or extra text.
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonText = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(jsonText);

    return {
      title: parsed.title || "Market Update",
      content: parsed.content || rawText.slice(0, 150),
      category: parsed.importance || "info",
      timestamp: new Date(),
      tickers: parsed.tickers || [],
    };
  } catch (error) {
    console.error("AI enhancement failed, using fallback:", error);
    
    // Try to parse as BSE data in fallback
    if (rawText.includes(',') && rawText.split(',').length >= 8) {
      const bseData = parseBSEData(rawText);
      return {
        title: bseData.subject.slice(0, 50),
        content: `${bseData.companyName} - ${bseData.filingType}`,
        category: determineImportanceFromType(bseData.filingType),
        timestamp: bseData.timestamp ? new Date(bseData.timestamp) : new Date(),
        companyName: bseData.companyName,
        stockCode: bseData.stockCode,
        filingType: bseData.filingType,
        pdfLink: bseData.pdfLink,
        tickers: [bseData.stockCode],
      };
    }
    
    // Final fallback
    return {
      title: "Market Announcement",
      content: rawText.slice(0, 150),
      category: "info",
      timestamp: new Date(),
      tickers: [],
    };
  }
}

/**
 * Determines importance level from filing type
 */
function determineImportanceFromType(filingType: string): "critical" | "high" | "medium" | "low" | "info" {
  const type = filingType.toLowerCase();
  
  if (type.includes('insider trading') || type.includes('sast') || type.includes('violation')) {
    return 'critical';
  }
  if (type.includes('result') || type.includes('acquisition') || type.includes('merger')) {
    return 'high';
  }
  if (type.includes('agm') || type.includes('dividend') || type.includes('record date')) {
    return 'medium';
  }
  if (type.includes('clarification') || type.includes('update')) {
    return 'low';
  }
  
  return 'info';
}

/**
 * Generates a visually attractive image from announcement data using Sharp + SVG
 */
export async function generateAnnouncementImage(
  data: AnnouncementData
): Promise<Buffer> {
  const width = 1200;
  const height = 630;

  // Color schemes based on importance
  const themes = {
    critical: {
      bg: "#1A0505",
      accent: "#FF1744",
      gradient: ["#1A0505", "#2D0A0A"],
      icon: "🚨",
      label: "CRITICAL"
    },
    high: {
      bg: "#0D1B2A",
      accent: "#FF6B35",
      gradient: ["#0D1B2A", "#1B263B"],
      icon: "⚠️",
      label: "HIGH PRIORITY"
    },
    medium: {
      bg: "#1E293B",
      accent: "#FCD34D",
      gradient: ["#1E293B", "#334155"],
      icon: "📋",
      label: "IMPORTANT"
    },
    low: {
      bg: "#0F172A",
      accent: "#60A5FA",
      gradient: ["#0F172A", "#1E293B"],
      icon: "ℹ️",
      label: "NOTICE"
    },
    info: {
      bg: "#18181B",
      accent: "#A78BFA",
      gradient: ["#18181B", "#27272A"],
      icon: "📄",
      label: "INFO"
    },
  };

  const theme = themes[data.category];
  const borderWidth = data.category === 'critical' ? 12 : 8;

  // Helper to escape XML
  const escapeXml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Helper to wrap text
  const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    const avgCharWidth = fontSize * 0.6; // Approximate character width

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const estimatedWidth = testLine.length * avgCharWidth;

      if (estimatedWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Prepare text content
  const titleLines = wrapText(data.title, 1080, 48).slice(0, 2);
  const contentLines = wrapText(data.content, 1080, 26).slice(0, 4);
  
  const displayTickers = data.stockCode ? [data.stockCode] : (data.tickers?.slice(0, 3) || []);
  
  const titleY = data.companyName ? 220 : 180;
  const contentY = data.companyName ? 360 : 320;

  // Generate texture particles as circles
  let textureCircles = '';
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 2 + 1;
    textureCircles += `<circle cx="${x}" cy="${y}" r="${size}" fill="rgba(255,255,255,0.02)" />`;
  }

  // Generate ticker badges
  let tickerBadges = '';
  let tickerX = 280;
  displayTickers.forEach((ticker) => {
    const tickerWidth = ticker.length * 10 + 30;
    tickerBadges += `
      <rect x="${tickerX}" y="60" width="${tickerWidth}" height="40" rx="20" fill="rgba(255,255,255,0.15)" />
      <text x="${tickerX + 15}" y="85" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#FFFFFF">${escapeXml(ticker)}</text>
    `;
    tickerX += tickerWidth + 15;
  });

  // Generate title lines
  let titleSvg = '';
  titleLines.forEach((line, i) => {
    titleSvg += `<text x="60" y="${titleY + i * 60}" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#FFFFFF">${escapeXml(line)}</text>`;
  });

  // Generate content lines
  let contentSvg = '';
  contentLines.forEach((line, i) => {
    contentSvg += `<text x="60" y="${contentY + i * 40}" font-family="Arial, sans-serif" font-size="26" fill="#D1D5DB">${escapeXml(line)}</text>`;
  });

  // Optional elements
  const companyNameSvg = data.companyName 
    ? `<text x="60" y="140" font-family="Arial, sans-serif" font-size="20" fill="#94A3B8">${escapeXml(data.companyName.toUpperCase())}</text>`
    : '';

  const filingTypeSvg = data.filingType
    ? `<text x="60" y="165" font-family="Arial, sans-serif" font-size="18" font-style="italic" fill="${theme.accent}" opacity="0.8">${escapeXml(data.filingType)}</text>`
    : '';

  const viewDocButton = data.pdfLink
    ? `
      <rect x="60" y="${height - 150}" width="200" height="45" rx="22" fill="${theme.accent}" opacity="0.4" />
      <text x="85" y="${height - 119}" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="${theme.accent}">📄 View Document</text>
    `
    : '';

  const urgentBadge = data.category === 'critical'
    ? `
      <polygon points="${width - 150},0 ${width},0 ${width},150" fill="${theme.accent}" opacity="0.6" />
      <text x="${width - 70}" y="60" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#FFFFFF" transform="rotate(45 ${width - 70} 60)">URGENT</text>
    `
    : '';

  const badgeBorder = data.category === 'critical'
    ? `<rect x="60" y="60" width="200" height="40" rx="20" fill="none" stroke="${theme.accent}" stroke-width="2" />`
    : '';

  const timeStr = data.timestamp.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${theme.gradient[0]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${theme.gradient[1]};stop-opacity:1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="${data.category === 'critical' ? '15' : '10'}" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
      
      <!-- Texture -->
      ${textureCircles}
      
      <!-- Accent border with glow -->
      <rect x="0" y="0" width="${borderWidth}" height="${height}" fill="${theme.accent}" filter="url(#glow)" />
      <rect x="${borderWidth}" y="${height / 2 - 100}" width="4" height="200" fill="${theme.accent}" filter="url(#glow)" />
      
      <!-- Category badge -->
      <rect x="60" y="60" width="200" height="40" rx="20" fill="${theme.accent}" opacity="${data.category === 'critical' ? '0.5' : '0.3'}" />
      ${badgeBorder}
      <text x="75" y="85" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="${theme.accent}">${theme.icon} ${theme.label}</text>
      
      <!-- Ticker badges -->
      ${tickerBadges}
      
      <!-- Company name -->
      ${companyNameSvg}
      
      <!-- Filing type -->
      ${filingTypeSvg}
      
      <!-- Title -->
      ${titleSvg}
      
      <!-- Content -->
      ${contentSvg}
      
      <!-- View document button -->
      ${viewDocButton}
      
      <!-- Timestamp -->
      <text x="60" y="${height - 50}" font-family="Arial, sans-serif" font-size="20" fill="#9CA3AF">${escapeXml(timeStr)}</text>
      
      <!-- Branding -->
      <text x="${width - 60}" y="${height - 50}" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="${theme.accent}" text-anchor="end">BSE · FinSim Alert</text>
      
      <!-- Decorative line -->
      <line x1="${width - 60}" y1="${height - 80}" x2="${width - 60}" y2="60" stroke="${theme.accent}" stroke-width="2" opacity="0.4" />
      
      <!-- Urgent indicator for critical -->
      ${urgentBadge}
    </svg>
  `;

  // Convert SVG to PNG using Sharp
  return sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}
