import fs from "fs";
import path from "path";
import { config } from "@/lib/config";

function getStorageRoot(): string {
  return path.resolve(process.cwd(), config.ET_STORAGE_PATH);
}

function getConversationAudioDir(conversationId: number): string {
  return path.join(
    getStorageRoot(),
    "audio",
    "conversations",
    String(conversationId),
  );
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function saveUserAudio(
  conversationId: number,
  messageId: number,
  buffer: Buffer,
): string {
  const dir = getConversationAudioDir(conversationId);
  ensureDir(dir);
  const filename = `user_${messageId}.webm`;
  const fullPath = path.join(dir, filename);
  fs.writeFileSync(fullPath, buffer);
  return path.join("audio", "conversations", String(conversationId), filename);
}

export function saveAiAudio(
  conversationId: number,
  messageId: number,
  buffer: Buffer,
  extension = "mp3",
): string {
  const dir = getConversationAudioDir(conversationId);
  ensureDir(dir);
  const filename = `ai_${messageId}.${extension}`;
  const fullPath = path.join(dir, filename);
  fs.writeFileSync(fullPath, buffer);
  return path.join("audio", "conversations", String(conversationId), filename);
}

export function readAudioFile(relativePath: string): {
  buffer: Buffer;
  contentType: string;
} | null {
  const fullPath = path.join(getStorageRoot(), relativePath);
  if (!fs.existsSync(fullPath)) return null;

  const ext = path.extname(fullPath).toLowerCase();
  const contentTypes: Record<string, string> = {
    ".webm": "audio/webm",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
  };

  return {
    buffer: fs.readFileSync(fullPath),
    contentType: contentTypes[ext] ?? "application/octet-stream",
  };
}

export function audioUrlFromPath(relativePath: string): string {
  return `/api/audio/${relativePath.replace(/^audio\//, "")}`;
}
