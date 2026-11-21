"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

import { useTheme } from "@/features/theme/use-theme";

/** shadcn Sonner, themed by Synapse's own theme store instead of next-themes. Toasts confirm; they don't chat. */
function Toaster(props: ToasterProps) {
  const { theme } = useTheme();
  return (
    <Sonner
      theme={theme}
      position="bottom-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "!rounded-control !border-border !bg-surface !text-foreground !text-ui !shadow-float !font-sans",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
