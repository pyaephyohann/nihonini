import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const AUDIO_DIR = join(process.cwd(), "public", "audio", "listening");
const TEMPLATE_PATH = join(process.cwd(), "prisma", "seed-assets", "listening-template.mp3");

export function ensureListeningAudioFile(slug: string): string {
  mkdirSync(AUDIO_DIR, { recursive: true });
  const targetPath = join(AUDIO_DIR, `${slug}.mp3`);
  const audioUrl = `/audio/listening/${slug}.mp3`;

  if (!existsSync(targetPath) && existsSync(TEMPLATE_PATH)) {
    copyFileSync(TEMPLATE_PATH, targetPath);
  }

  return audioUrl;
}

export function ensureAllListeningAudioFiles(slugs: string[]) {
  for (const slug of slugs) {
    ensureListeningAudioFile(slug);
  }
}
