import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function AppHeader({
  title,
  back = "/",
  right,
}: {
  title: string;
  back?: string;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-md items-center gap-3 px-4">
        <Link
          to={back}
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground active:bg-muted"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-lg font-semibold text-foreground">{title}</h1>
        {right}
      </div>
    </header>
  );
}