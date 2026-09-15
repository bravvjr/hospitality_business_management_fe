"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

export function DashboardCard({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("glass-section overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ViewAllLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="text-xs font-medium text-brand-rich-teal hover:underline"
    >
      View all →
    </Link>
  );
}

export function MiniSparkline({
  values,
  color = "var(--brand-rich-teal)",
}: {
  values: number[];
  color?: string;
}) {
  if (values.length === 0) {
    return <div className="h-8 w-20 rounded bg-muted/40" />;
  }

  const max = Math.max(...values, 1);
  const width = 72;
  const height = 28;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / max) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-7 w-[4.5rem]"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "success" | "warning" | "neutral";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "success" &&
          "bg-brand-rich-teal/15 text-brand-rich-teal dark:text-brand-light-jade",
        tone === "warning" &&
          "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        tone === "neutral" && "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function DashboardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="glass-shimmer h-10 rounded-lg" />
      ))}
    </div>
  );
}
