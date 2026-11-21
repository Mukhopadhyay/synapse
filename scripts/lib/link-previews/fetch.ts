import { repoUrl } from "../../../src/config/site.ts";

const USER_AGENT = `SynapseLinkPreviews/1.0 (+${repoUrl})`;
const TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 3;
export const MAX_HTML_BYTES = 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function assertHttp(url: string) {
  const { protocol } = new URL(url);
  if (protocol !== "http:" && protocol !== "https:") throw new Error(`only http(s) links are fetched, not ${protocol}`);
}

/** GET with redirects followed by hand (at most three, each one checked for http(s)). */
async function request(url: string, accept: string, signal: AbortSignal) {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    assertHttp(current);
    const response = await fetch(current, { redirect: "manual", signal, headers: { "user-agent": USER_AGENT, accept } });
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      await response.body?.cancel();
      current = new URL(location, current).href;
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`the server answered ${response.status}`);
    }
    return { response, url: current };
  }
  throw new Error(`more than ${MAX_REDIRECTS} redirects`);
}

/** Reads at most `cap` bytes: past it, `truncate` keeps what arrived (HTML heads come first), otherwise it fails. */
async function readCapped(response: Response, cap: number, truncate: boolean) {
  const declared = Number(response.headers.get("content-length"));
  if (!truncate && declared > cap) {
    await response.body?.cancel();
    throw new Error(`larger than ${cap / 1024 / 1024} MB`);
  }
  const reader = response.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > cap) {
      await reader.cancel();
      if (!truncate) throw new Error(`larger than ${cap / 1024 / 1024} MB`);
      chunks.push(value.subarray(0, value.byteLength - (total - cap)));
      break;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

function decode(body: Buffer, contentType: string) {
  const charset = /charset=["']?([\w-]+)/i.exec(contentType)?.[1] ?? "utf-8";
  try {
    return new TextDecoder(charset).decode(body);
  } catch {
    return new TextDecoder("utf-8").decode(body);
  }
}

/** A page's HTML (first 1 MB) and the URL it ended up at. */
export async function fetchHtml(url: string) {
  const { response, url: finalUrl } = await request(url, "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1", AbortSignal.timeout(TIMEOUT_MS));
  const type = response.headers.get("content-type") ?? "";
  if (!/html/i.test(type)) {
    await response.body?.cancel();
    throw new Error(`not an HTML page (${type || "no content type"})`);
  }
  return { html: decode(await readCapped(response, MAX_HTML_BYTES, true), type), finalUrl };
}

/** An image's bytes, up to `cap`. */
export async function fetchImage(url: string, cap = MAX_IMAGE_BYTES) {
  const { response } = await request(url, "image/*", AbortSignal.timeout(TIMEOUT_MS));
  return readCapped(response, cap, false);
}

/** A short reason for a failed fetch, for warnings. */
export function failureReason(error: unknown) {
  if (error instanceof Error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") return `no answer within ${TIMEOUT_MS / 1000}s`;
    const cause = (error as { cause?: { code?: string } }).cause?.code;
    return cause ? `${error.message} (${cause})` : error.message;
  }
  return String(error);
}
