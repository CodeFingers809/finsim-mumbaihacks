import "dotenv/config";
import express, { Request, Response } from "express";
import multer from "multer";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import path from "node:path";
import fs from "node:fs";
import {
  AnyMessageContent,
  DisconnectReason,
  WASocket,
  fetchLatestBaileysVersion,
  makeWASocket,
  useMultiFileAuthState,
} from "baileys";
import {
  enhanceAnnouncementWithAI,
  generateAnnouncementImage,
} from "./imageGenerator.js";
import {
  createShortLink,
  resolveShortLink,
  getAllLinksAnalytics,
} from "./linkShortener.js";

const PORT = Number(process.env.PORT ?? 4001);
const AUTH_FOLDER = path.join(process.cwd(), "auth");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

if (!fs.existsSync(AUTH_FOLDER)) {
  fs.mkdirSync(AUTH_FOLDER, { recursive: true });
}

let socketPromise: Promise<WASocket> | null = null;
let readyPromise: Promise<void> | null = null;
let resolveReady: (() => void) | null = null;
let connectionState: "init" | "connecting" | "open" | "closed" = "init";

function setReadyResolver() {
  readyPromise = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });
}

async function createSocket() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ["FinSim Announcements", "Desktop", "1.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("Scan the QR code below to log into WhatsApp:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      connectionState = "open";
      resolveReady?.();
      resolveReady = null;
      console.log("WhatsApp socket connected.");
    }

    if (connection === "close") {
      connectionState = "closed";
      const shouldReconnect =
        (lastDisconnect?.error as Boom | undefined)?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.warn("WhatsApp connection closed.", {
        loggedOut:
          (lastDisconnect?.error as Boom | undefined)?.output?.statusCode ===
          DisconnectReason.loggedOut,
        shouldReconnect,
      });

      if (shouldReconnect) {
        socketPromise = null;
        readyPromise = null;
        resolveReady = null;
        connectionState = "connecting";
        setTimeout(() => ensureSocket(), 1_000);
      }
    }
  });

  return sock;
}

function ensureSocket(): Promise<WASocket> {
  if (!socketPromise) {
    connectionState = "connecting";
    setReadyResolver();
    socketPromise = createSocket()
      .then((sock) => {
        if (sock.ws.readyState === sock.ws.OPEN && resolveReady) {
          connectionState = "open";
          resolveReady();
          resolveReady = null;
        }
        return sock;
      })
      .catch((err) => {
        socketPromise = null;
        readyPromise = null;
        resolveReady = null;
        connectionState = "closed";
        throw err;
      });
  }

  return socketPromise;
}

async function waitUntilReady(timeoutMs = 15_000): Promise<boolean> {
  await ensureSocket();
  if (!readyPromise) return false;

  const timer = new Promise<boolean>((resolve) =>
    setTimeout(() => resolve(false), timeoutMs),
  );
  const ready = readyPromise.then(() => true);

  return Promise.race([ready, timer]);
}

function toJid(raw: string): string {
  const trimmed = raw.trim();

  if (trimmed.endsWith("@s.whatsapp.net") || trimmed.endsWith("@g.us")) {
    return trimmed;
  }

  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) {
    throw new Error("toNumber must include digits (with country code).");
  }

  return `${digits}@s.whatsapp.net`;
}

function detectMediaType(mime?: string | null):
  | "image"
  | "video"
  | "audio"
  | "document"
  | "sticker" {
  if (!mime) return "document";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
}

function buildMessageContent(options: {
  text?: string;
  buffer?: Buffer;
  mediaType?: string;
  mime?: string;
  fileName?: string;
  caption?: string;
}): AnyMessageContent {
  const { text, buffer, mime, fileName, caption } = options;
  const mediaType = options.mediaType as
    | "image"
    | "video"
    | "audio"
    | "document"
    | "sticker"
    | undefined;

  if (buffer) {
    const kind = mediaType ?? detectMediaType(mime);
    switch (kind) {
      case "image":
        return { image: buffer, caption: caption ?? text };
      case "video":
        return { video: buffer, caption: caption ?? text, mimetype: mime };
      case "audio":
        return { audio: buffer, mimetype: mime ?? "audio/mpeg" };
      case "sticker":
        return { sticker: buffer };
      default:
        return {
          document: buffer,
          mimetype: mime ?? "application/octet-stream",
          fileName: fileName ?? "attachment",
          caption: caption ?? text,
        };
    }
  }

  if (text) {
    return { text };
  }

  throw new Error("Provide either text or media content.");
}

const app = express();
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    connection: connectionState,
  });
});

// Link redirect endpoint
app.get("/l/:shortCode", (req: Request, res: Response) => {
  const { shortCode } = req.params;
  const originalUrl = resolveShortLink(shortCode);

  if (!originalUrl) {
    return res.status(404).json({ error: "Link not found" });
  }

  // Redirect to original URL
  res.redirect(originalUrl);
});

// Analytics endpoint
app.get("/analytics", (_req: Request, res: Response) => {
  const analytics = getAllLinksAnalytics();
  res.json({
    total: analytics.length,
    links: analytics.map((link) => ({
      shortCode: link.shortCode,
      originalUrl: link.originalUrl,
      clicks: link.clicks,
      createdAt: link.createdAt,
      metadata: link.metadata,
    })),
  });
});

app.post(
  "/send",
  upload.single("media"),
  async (req: Request, res: Response) => {
    const { toNumber, text, caption, mediaType, announcement } = req.body as {
      toNumber?: string;
      text?: string;
      caption?: string;
      mediaType?: string;
      announcement?: string;
    };

    if (!toNumber) {
      return res.status(400).json({ error: "toNumber is required" });
    }

    const isReady = await waitUntilReady();
    if (!isReady) {
      return res.status(409).json({
        error: "WhatsApp session not ready. Scan the QR from server logs to stay logged in.",
      });
    }

    try {
      const jid = toJid(toNumber);
      const sock = await ensureSocket();

      // If 'announcement' field is provided, generate image from text
      if (announcement) {
        console.log("Processing announcement:", announcement);

        // Use Gemini AI to enhance and structure the announcement
        const announcementData = await enhanceAnnouncementWithAI(announcement);
        console.log("Enhanced announcement data:", announcementData);

        // Generate beautiful image
        const imageBuffer = await generateAnnouncementImage(announcementData);
        console.log("Generated image, size:", imageBuffer.length, "bytes");

        // Create short link if PDF link exists
        let captionText = `📊 ${announcementData.title}`;
        if (announcementData.pdfLink) {
          const shortLink = createShortLink(announcementData.pdfLink, {
            stockCode: announcementData.stockCode,
            companyName: announcementData.companyName,
            filingType: announcementData.filingType,
          });
          captionText = shortLink;
          console.log(`Created short link: ${shortLink} -> ${announcementData.pdfLink}`);
        }

        // Send image to WhatsApp
        console.log("Attempting to send to JID:", jid);
        const message: AnyMessageContent = {
          image: imageBuffer,
          caption: captionText,
        };

        console.log("Sending message to WhatsApp...");
        const response = await sock.sendMessage(jid, message);
        console.log("Message sent successfully! Message ID:", response?.key?.id);

        return res.json({
          success: true,
          jid,
          messageId: response.key.id,
          timestamp: response.messageTimestamp,
          announcementData,
        });
      }

      // Original functionality: send text or media directly
      const message = buildMessageContent({
        text,
        buffer: req.file?.buffer,
        mime: req.file?.mimetype,
        fileName: req.file?.originalname,
        caption,
        mediaType,
      });

      const response = await sock.sendMessage(jid, message);

      return res.json({
        success: true,
        jid,
        messageId: response.key.id,
        timestamp: response.messageTimestamp,
      });
    } catch (error) {
      console.error("Failed to send WhatsApp message", error);
      return res.status(500).json({
        error: (error as Error).message ?? "Unexpected error",
      });
    }
  },
);

app.listen(PORT, () => {
  console.log(`Announcements server listening on http://localhost:${PORT}`);
  console.log(`Make sure to set GEMINI_API_KEY environment variable`);
  ensureSocket().catch((err) => {
    console.error("Failed to start WhatsApp socket", err);
  });
});
