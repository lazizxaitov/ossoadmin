import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  actionUrl?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  imagePath: string;
  width: number;
  height: number;
  active: boolean;
  sortOrder: number;
  createdAt: string;
};

const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "banners.json");

export async function readBanners(): Promise<Banner[]> {
  try {
    return JSON.parse(await readFile(dataFile, "utf8")) as Banner[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function writeBanners(banners: Banner[]) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(dataFile, JSON.stringify(banners, null, 2), "utf8");
}

export function withPublicUrl(banner: Banner, origin: string) {
  return { ...banner, imageUrl: new URL(banner.imagePath, origin).toString() };
}
