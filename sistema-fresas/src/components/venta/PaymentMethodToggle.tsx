"use client";

type PaymentMethod = "EFECTIVO" | "QR";

interface Props {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export function PaymentMethodToggle({ selected, onChange }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Pago (Local)</p>
      <div className="grid grid-cols-2 gap-3">
        {(["EFECTIVO", "QR"] as PaymentMethod[]).map((method) => (
          <button
            key={method}
            onClick={() => onChange(method)}
            className={`min-h-[48px] min-w-[44px] rounded-xl border-2 text-sm font-semibold transition-all ${
              selected === method
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-primary/50 hover:bg-accent"
            }`}
          >
            {method === "EFECTIVO" ? "💵 Efectivo" : "📱 QR"}
          </button>
        ))}
      </div>
    </div>
  );
}
