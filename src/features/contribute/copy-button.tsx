"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** Copies the example note to the clipboard and confirms with a toast. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied");
    } catch {
      toast("Couldn't copy. Select the text instead.");
    }
  }
  return (
    <Button variant="ghost" size="icon" aria-label={label} onClick={copy} className="size-7">
      <Copy aria-hidden className="size-3.5" />
    </Button>
  );
}
