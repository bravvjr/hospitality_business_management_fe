export type DatePreset = "7d" | "30d" | "month" | "custom";

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function monthStartIsoDate(reference = new Date()): string {
  return new Date(reference.getFullYear(), reference.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

export function rangeForPreset(preset: DatePreset): { from: string; to: string } {
  const to = todayIsoDate();
  if (preset === "7d") {
    return { from: addDaysIsoDate(to, -6), to };
  }
  if (preset === "30d") {
    return { from: addDaysIsoDate(to, -29), to };
  }
  if (preset === "month") {
    return { from: monthStartIsoDate(), to };
  }
  return { from: monthStartIsoDate(), to };
}

export function isValidDateRange(from: string, to: string): boolean {
  return Boolean(from && to && from <= to);
}
