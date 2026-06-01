"use client";

import { useState, useCallback, useMemo } from "react";
import { ChannelSelector } from "./ChannelSelector";
import { PaymentMethodToggle } from "./PaymentMethodToggle";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/lib/utils";
import { createOrder } from "@/app/actions/ventas";
import { signOut } from "next-auth/react";
import { Minus, Plus } from "lucide-react";

interface Product { id: string; name: string; }
interface Size { id: string; name: string; order: number; }
interface Channel { id: string; name: string; isDelivery: boolean; }
interface Price { productId: string; sizeId: string; channelId: string; amount: number; }

interface Props {
  products: Product[];
  sizes: Size[];
  channels: Channel[];
  prices: Price[];
  userName: string;
}

type PaymentMethod = "EFECTIVO" | "QR";

function itemKey(productId: string, sizeId: string) {
  return `${productId}::${sizeId}`;
}

export function SaleForm({ products, sizes, channels, prices, userName }: Props) {
  const [channelId, setChannelId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("EFECTIVO");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const sortedSizes = useMemo(
    () => [...sizes].sort((a, b) => a.order - b.order),
    [sizes]
  );

  const selectedChannel = channels.find((c) => c.id === channelId);

  function getPrice(productId: string, sizeId: string): number | null {
    if (!channelId) return null;
    const p = prices.find(
      (p) => p.productId === productId && p.sizeId === sizeId && p.channelId === channelId
    );
    return p ? p.amount : null;
  }

  function adjust(productId: string, sizeId: string, delta: number) {
    const key = itemKey(productId, sizeId);
    setQuantities((prev) => ({
      ...prev,
      [key]: Math.max(0, (prev[key] ?? 0) + delta),
    }));
  }

  const cartItems = useMemo(() => {
    if (!channelId) return [];
    return products.flatMap((product) =>
      sortedSizes.flatMap((size) => {
        const key = itemKey(product.id, size.id);
        const qty = quantities[key] ?? 0;
        if (qty === 0) return [];
        const amount = getPrice(product.id, size.id);
        if (!amount) return [];
        return [{ product, size, qty, amount, subtotal: amount * qty }];
      })
    );
  }, [quantities, channelId, products, sortedSizes, prices]);

  const total = cartItems.reduce((s, i) => s + i.subtotal, 0);
  const totalUnits = cartItems.reduce((s, i) => s + i.qty, 0);

  const reset = useCallback(() => {
    setQuantities({});
    setError("");
  }, []);

  async function handleConfirm() {
    if (!channelId || cartItems.length === 0) return;
    setError("");
    setLoading(true);

    const result = await createOrder({
      items: cartItems.map((i) => ({
        productId: i.product.id,
        sizeId: i.size.id,
        quantity: i.qty,
      })),
      channelId,
      paymentMethod: selectedChannel?.isDelivery ? undefined : paymentMethod,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSuccessMsg(`✓ ${totalUnits} venta${totalUnits !== 1 ? "s" : ""} registrada${totalUnits !== 1 ? "s" : ""}`);
    setTimeout(() => {
      setSuccessMsg("");
      reset();
    }, 900);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between shrink-0">
        <span className="font-semibold text-sm">🍓 {userName}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Salir
        </button>
      </header>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 max-w-sm mx-auto w-full">

          {/* Channel */}
          <ChannelSelector
            channels={channels}
            selected={channelId}
            disabled={false}
            onSelect={(id) => {
              setChannelId(id);
              setQuantities({});
              setError("");
            }}
          />

          {/* Payment method — only for local */}
          {selectedChannel && !selectedChannel.isDelivery && (
            <PaymentMethodToggle
              selected={paymentMethod}
              onChange={setPaymentMethod}
            />
          )}

          {/* Product menu */}
          {channelId && (
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="space-y-2">
                  <p className="text-sm font-semibold">{product.name}</p>
                  <div className="space-y-2">
                    {sortedSizes.map((size) => {
                      const key = itemKey(product.id, size.id);
                      const qty = quantities[key] ?? 0;
                      const price = getPrice(product.id, size.id);
                      if (!price) return null;
                      return (
                        <div
                          key={size.id}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                            qty > 0 ? "border-primary bg-primary/5" : "border-border"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium">{size.name}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(price)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => adjust(product.id, size.id, -1)}
                              disabled={qty === 0}
                              className="h-9 w-9 rounded-full border flex items-center justify-center text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-5 text-center font-bold text-base">{qty}</span>
                            <button
                              onClick={() => adjust(product.id, size.id, 1)}
                              className="h-9 w-9 rounded-full border flex items-center justify-center hover:bg-accent"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cart summary */}
          {cartItems.length > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
              {cartItems.map((item) => (
                <div key={itemKey(item.product.id, item.size.id)} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.qty}× {item.product.name} {item.size.name}
                  </span>
                  <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          {/* Feedback */}
          {error && (
            <p className="text-sm text-destructive text-center bg-destructive/10 rounded-lg p-3">
              {error}
            </p>
          )}
          {successMsg && (
            <p className="text-sm text-center bg-green-100 text-green-800 rounded-lg p-3 font-medium">
              {successMsg}
            </p>
          )}

          {/* Confirm */}
          <Button
            onClick={handleConfirm}
            disabled={!channelId || cartItems.length === 0 || loading}
            className="h-16 text-lg font-bold"
            size="lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner /> Registrando...
              </span>
            ) : cartItems.length > 0 ? (
              `Confirmar — ${formatCurrency(total)}`
            ) : (
              "Confirmar Venta"
            )}
          </Button>

          {/* Bottom padding so content isn't hidden behind mobile nav bar */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
