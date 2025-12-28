import crypto from "node:crypto";

interface LinkData {
  originalUrl: string;
  shortCode: string;
  clicks: number;
  createdAt: Date;
  metadata?: {
    stockCode?: string;
    companyName?: string;
    filingType?: string;
  };
}

// In-memory store (use Redis/Database in production)
const linkStore = new Map<string, LinkData>();

/**
 * Generate a short code for URL
 */
function generateShortCode(): string {
  return crypto.randomBytes(4).toString("base64url").slice(0, 6);
}

/**
 * Create a shortened link
 */
export function createShortLink(
  originalUrl: string,
  metadata?: {
    stockCode?: string;
    companyName?: string;
    filingType?: string;
  }
): string {
  const shortCode = generateShortCode();
  
  linkStore.set(shortCode, {
    originalUrl,
    shortCode,
    clicks: 0,
    createdAt: new Date(),
    metadata,
  });

  // Return short URL with your domain (change localhost in production)
  const baseUrl = process.env.BASE_URL || "http://localhost:4001";
  return `${baseUrl}/l/${shortCode}`;
}

/**
 * Get original URL and track click
 */
export function resolveShortLink(shortCode: string): string | null {
  const linkData = linkStore.get(shortCode);
  
  if (!linkData) {
    return null;
  }

  // Increment click count
  linkData.clicks++;
  
  console.log(`Link clicked: ${shortCode} -> ${linkData.originalUrl} (${linkData.clicks} clicks)`);
  
  return linkData.originalUrl;
}

/**
 * Get analytics for a short link
 */
export function getLinkAnalytics(shortCode: string): LinkData | null {
  return linkStore.get(shortCode) || null;
}

/**
 * Get all links analytics
 */
export function getAllLinksAnalytics(): LinkData[] {
  return Array.from(linkStore.values());
}
