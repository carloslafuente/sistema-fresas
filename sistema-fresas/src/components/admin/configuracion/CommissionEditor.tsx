"use client";

import { useState, useTransition } from "react";
import { updateChannelCommission } from "@/app/actions/configuracion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Channel { id: string; name: string; commissionPct: number; }

export function CommissionEditor({ channels }: { channels: Channel[] }) {
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(channels.map((c) => [c.id, String(c.commissionPct)]))
  );
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  function handleSave(channelId: string) {
    const pct = parseFloat(values[channelId] ?? "");
    if (isNaN(pct)) return;
    startTransition(async () => {
      await updateChannelCommission(channelId, pct);
      setSaved((s) => ({ ...s, [channelId]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [channelId]: false })), 1500);
    });
  }

  return (
    <div className="space-y-4 py-2">
      {channels.map((ch) => (
        <div key={ch.id} className="space-y-2">
          <Label className="text-sm font-medium">{ch.name} — comisión (%)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={values[ch.id] ?? ""}
              onChange={(e) => setValues({ ...values, [ch.id]: e.target.value })}
              className="h-10 w-28"
              min="0"
              max="100"
              step="0.5"
            />
            <Button
              size="sm"
              onClick={() => handleSave(ch.id)}
              disabled={pending}
              className={saved[ch.id] ? "bg-green-600" : ""}
            >
              {saved[ch.id] ? "✓" : "Guardar"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
