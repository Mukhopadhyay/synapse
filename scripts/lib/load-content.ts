import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import { parse as parseYaml } from "yaml";
import type { z } from "zod";

import {
  domainSchema,
  FRONTMATTER_KEYS,
  frontmatterSchema,
  SLUG_PATTERN,
  type DomainFile,
  type Frontmatter,
} from "../../src/lib/content/schema.ts";
import type { Report } from "./report.ts";
import { didYouMean } from "./suggest.ts";

export type LoadedDomain = { id: string; file: DomainFile };

export type LoadedNote = {
  slug: string;
  domain: string;
  cluster?: string;
  file: string;
  frontmatter: Frontmatter;
  body: string;
};

const display = (absolute: string) => path.relative(process.cwd(), absolute);

function describeIssues(issues: z.core.$ZodIssue[], knownKeys: string[]): string[] {
  return issues.flatMap((issue) => {
    if (issue.code === "unrecognized_keys") {
      return issue.keys.map((key) => {
        const suggestion = didYouMean(key, knownKeys);
        return suggestion
          ? `unknown key "${key}". Did you mean "${suggestion}"?`
          : `unknown key "${key}". Allowed keys: ${knownKeys.join(", ")}.`;
      });
    }
    const where = issue.path.join(".") || "frontmatter";
    if (issue.code === "invalid_type" && issue.input === undefined) return [`${where}: is required.`];
    return [`${where}: ${issue.message}`];
  });
}

async function loadDomain(id: string, dir: string, report: Report): Promise<LoadedDomain | null> {
  const file = path.join(dir, "_domain.yml");
  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch {
    report.error(display(file), "is missing. Every field folder needs one with at least a name and a colour.");
    return null;
  }

  let data: unknown;
  try {
    data = parseYaml(raw);
  } catch (error) {
    report.error(display(file), `isn't valid YAML: ${(error as Error).message.split("\n")[0]}`);
    return null;
  }

  const parsed = domainSchema.safeParse(data);
  if (!parsed.success) {
    for (const message of describeIssues(parsed.error.issues, Object.keys(domainSchema.shape))) {
      report.error(display(file), message);
    }
    return null;
  }
  return { id, file: parsed.data };
}

async function loadNote(
  domain: LoadedDomain,
  dir: string,
  relative: string,
  report: Report,
): Promise<LoadedNote | null> {
  const absolute = path.join(dir, relative);
  const file = display(absolute);
  const parts = relative.split(path.sep);
  const slug = path.basename(relative, ".md");

  if (parts.length > 2) {
    report.error(file, `notes can sit at most one folder deep: content/${domain.id}/<cluster>/${slug}.md`);
    return null;
  }
  if (!SLUG_PATTERN.test(slug)) {
    report.error(file, `the file name "${slug}" isn't a valid slug. Use lowercase words joined by hyphens.`);
    return null;
  }

  const cluster = parts.length === 2 ? parts[0] : undefined;
  if (cluster && !(cluster in domain.file.clusters)) {
    report.warn(file, `the folder "${cluster}" isn't listed under clusters in content/${domain.id}/_domain.yml.`);
  }

  let parsedMatter: matter.GrayMatterFile<string>;
  try {
    parsedMatter = matter(await readFile(absolute, "utf8"));
  } catch (error) {
    const reason = (error as { reason?: string }).reason ?? (error as Error).message.split("\n")[0];
    report.error(file, `the frontmatter isn't valid YAML: ${reason}`);
    return null;
  }

  const parsed = frontmatterSchema.safeParse(parsedMatter.data);
  if (!parsed.success) {
    for (const message of describeIssues(parsed.error.issues, FRONTMATTER_KEYS)) report.error(file, message);
    return null;
  }

  return { slug, domain: domain.id, cluster, file, frontmatter: parsed.data, body: parsedMatter.content };
}

/** Reads every `content/<domain>/_domain.yml` and `content/<domain>/[<cluster>/]<slug>.md`. */
export async function loadContent(contentDir: string, report: Report) {
  const domains: LoadedDomain[] = [];
  const notes: LoadedNote[] = [];

  const entries = await readdir(contentDir, { withFileTypes: true });
  const domainDirs = entries
    .filter((entry) => entry.isDirectory() && !/^[_.]/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  for (const id of domainDirs) {
    const dir = path.join(contentDir, id);
    const domain = await loadDomain(id, dir, report);
    if (!domain) continue;
    domains.push(domain);

    const files = (await readdir(dir, { recursive: true }))
      .filter((relative) => relative.endsWith(".md"))
      .sort();
    for (const relative of files) {
      const note = await loadNote(domain, dir, relative, report);
      if (note) notes.push(note);
    }
  }

  return { domains, notes };
}
