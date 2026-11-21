import { access, mkdir, rm } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

/** Generated sizes: 400w and 800w for large cards, a 144px square thumbnail, a 32px favicon. */
const LARGE_WIDTHS = [400, 800] as const;
const THUMB = 144;
const FAVICON = 32;
const QUALITY = 80;

/** File names (inside the generated folder) for one link's images. */
export function imageFiles(hash: string) {
  return {
    large400: `${hash}-400.webp`,
    large800: `${hash}-800.webp`,
    thumb: `${hash}-${THUMB}.webp`,
    favicon: `${hash}-${FAVICON}.webp`,
  };
}

export const fileExists = (file: string) =>
  access(file).then(
    () => true,
    () => false,
  );

/** Writes the large and thumbnail sizes of a link's image; returns its real size. Throws on anything sharp can't read. */
export async function writeImage(buffer: Buffer, dir: string, hash: string) {
  const files = imageFiles(hash);
  const source = sharp(buffer, { failOn: "error" }).rotate();
  const { width, height } = await source.metadata();
  if (!width || !height) throw new Error("the image has no size");
  await mkdir(dir, { recursive: true });
  await Promise.all([
    ...LARGE_WIDTHS.map((size, index) =>
      source
        .clone()
        .resize({ width: size, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(path.join(dir, index === 0 ? files.large400 : files.large800)),
    ),
    source.clone().resize(THUMB, THUMB, { fit: "cover" }).webp({ quality: QUALITY }).toFile(path.join(dir, files.thumb)),
  ]);
  return { width, height };
}

/** Writes a link's 32px favicon. Throws on formats sharp can't read (like .ico). */
export async function writeFavicon(buffer: Buffer, dir: string, hash: string) {
  await mkdir(dir, { recursive: true });
  await sharp(buffer, { failOn: "error" })
    .resize(FAVICON, FAVICON, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: QUALITY })
    .toFile(path.join(dir, imageFiles(hash).favicon));
}

/** Deletes a link's generated images before a refresh. */
export async function removeImages(dir: string, hash: string) {
  await Promise.all(Object.values(imageFiles(hash)).map((file) => rm(path.join(dir, file), { force: true })));
}
