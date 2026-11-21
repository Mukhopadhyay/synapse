import { AppShell } from "@/components/shell/app-shell";
import { Toaster } from "@/components/ui/sonner";

/** Every map, list and document route shares one shell, so the canvas survives navigation between them. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <Toaster />
    </>
  );
}
