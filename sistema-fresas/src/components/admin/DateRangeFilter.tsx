"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";

export function DateRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  function update(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex items-end gap-2 flex-wrap">
      <div className="space-y-1">
        <Label className="text-xs">Desde</Label>
        <DatePicker
          value={from}
          onChange={(value) => update("from", value)}
          max={to || undefined}
          placeholder="dd/mm/aaaa"
          className="h-9 w-[150px]"
          clearable
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Hasta</Label>
        <DatePicker
          value={to}
          onChange={(value) => update("to", value)}
          min={from || undefined}
          placeholder="dd/mm/aaaa"
          className="h-9 w-[150px]"
          clearable
        />
      </div>
      {(from || to) && (
        <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => router.push(pathname)}>
          Limpiar
        </Button>
      )}
    </div>
  );
}
