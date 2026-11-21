import { styleText } from "node:util";

export type Problem = { file?: string; message: string };

export type Report = {
  errors: Problem[];
  warnings: Problem[];
  error: (file: string | undefined, message: string) => void;
  warn: (file: string | undefined, message: string) => void;
};

export function createReport(): Report {
  const errors: Problem[] = [];
  const warnings: Problem[] = [];
  return {
    errors,
    warnings,
    error: (file, message) => errors.push({ file, message }),
    warn: (file, message) => warnings.push({ file, message }),
  };
}

function printGroup(label: string, color: "red" | "yellow", problems: Problem[]) {
  const byFile = new Map<string, string[]>();
  for (const { file, message } of problems) {
    const key = file ?? "content";
    byFile.set(key, [...(byFile.get(key) ?? []), message]);
  }
  for (const [file, messages] of byFile) {
    console.log(`${styleText(color, label)} ${styleText("bold", file)}`);
    for (const message of messages) console.log(`  ${message}`);
  }
}

export function printReport(report: Report) {
  printGroup("warning", "yellow", report.warnings);
  printGroup("error", "red", report.errors);
}
