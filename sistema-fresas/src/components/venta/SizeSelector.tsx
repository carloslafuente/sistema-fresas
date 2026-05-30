"use client";

interface Size {
  id: string;
  name: string;
  order: number;
}

interface Props {
  sizes: Size[];
  selected: string | null;
  disabled: boolean;
  onSelect: (id: string) => void;
}

export function SizeSelector({ sizes, selected, disabled, onSelect }: Props) {
  const sorted = [...sizes].sort((a, b) => a.order - b.order);
  return (
    <div className="space-y-2">
      <p className={`text-sm font-medium ${disabled ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
        Tamaño
      </p>
      <div className="grid grid-cols-3 gap-3">
        {sorted.map((s) => (
          <button
            key={s.id}
            onClick={() => !disabled && onSelect(s.id)}
            disabled={disabled}
            className={`min-h-[64px] min-w-[44px] rounded-xl border-2 text-base font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              selected === s.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-primary/50 hover:bg-accent"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
