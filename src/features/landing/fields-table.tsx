import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { NodeDot } from "@/components/node-dot";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { graphHref } from "@/lib/content/note-url";

import type { FieldStats } from "./field-stats";

const COLUMNS = [
  { key: "notes", label: "Notes" },
  { key: "written", label: "Written" },
  { key: "stubs", label: "Stubs" },
  { key: "unwritten", label: "Unwritten" },
] as const;

/** Section 03: one row per field in content/, counted at build time, each linking to that field's map. */
export function FieldsTable({ fields }: { fields: FieldStats[] }) {
  return (
    <Table className="mt-6 min-w-80">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-9 px-1 font-mono text-meta text-faint">Field</TableHead>
          {COLUMNS.map((column) => (
            <TableHead key={column.key} className="h-9 px-1 text-right font-mono text-meta text-faint sm:px-3">
              {column.label}
            </TableHead>
          ))}
          <TableHead className="h-9 w-10 px-1">
            <span className="sr-only">Open</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="[&_tr:last-child]:border-b">
        {fields.map((field) => (
          <TableRow key={field.id} className="hover:bg-transparent">
            <TableCell className="h-13 px-1">
              <span className="flex items-center gap-3 text-ui-small text-foreground">
                <NodeDot color={field.color} tint={0} className="size-1.5" />
                {field.name}
              </span>
            </TableCell>
            {COLUMNS.map((column) => (
              <TableCell key={column.key} className="px-1 text-right text-ui-small font-normal text-foreground tabular-nums sm:px-3">
                {field[column.key]}
              </TableCell>
            ))}
            <TableCell className="px-1 text-right">
              <Link
                href={graphHref(field.id)}
                prefetch={false}
                aria-label={`Open ${field.name} on the map`}
                className="inline-flex size-8 items-center justify-center rounded-control text-muted-foreground transition-colors duration-instant hover:bg-surface-raised hover:text-foreground"
              >
                <ArrowRight aria-hidden className="size-icon" />
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
