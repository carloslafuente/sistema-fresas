"use client";

interface Product {
  id: string;
  name: string;
}

interface Props {
  products: Product[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export function ProductSelector({ products, selected, onSelect }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Producto</p>
      <div className="grid grid-cols-2 gap-3">
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`min-h-[64px] min-w-[44px] rounded-xl border-2 text-base font-semibold transition-all ${
              selected === p.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-primary/50 hover:bg-accent"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
