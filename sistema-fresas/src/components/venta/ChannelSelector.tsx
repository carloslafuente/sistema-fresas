"use client";

interface Channel {
  id: string;
  name: string;
  isDelivery: boolean;
}

interface Props {
  channels: Channel[];
  selected: string | null;
  disabled: boolean;
  onSelect: (id: string) => void;
}

export function ChannelSelector({ channels, selected, disabled, onSelect }: Props) {
  return (
    <div className="space-y-2">
      <p className={`text-sm font-medium ${disabled ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
        Canal
      </p>
      <div className="grid grid-cols-3 gap-3">
        {channels.map((c) => (
          <button
            key={c.id}
            onClick={() => !disabled && onSelect(c.id)}
            disabled={disabled}
            className={`min-h-[64px] min-w-[44px] rounded-xl border-2 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              selected === c.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-primary/50 hover:bg-accent"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
