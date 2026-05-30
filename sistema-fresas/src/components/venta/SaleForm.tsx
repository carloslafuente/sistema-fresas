"use client";

import { useState, useCallback } from "react";
import { ProductSelector } from "./ProductSelector";
import { SizeSelector } from "./SizeSelector";
import { ChannelSelector } from "./ChannelSelector";
import { PaymentMethodToggle } from "./PaymentMethodToggle";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { createSale } from "@/app/actions/ventas";
import { signOut } from "next-auth/react";
import { Spinner } from "@/components/ui/spinner";

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

const INITIAL = {
  productId: null as string | null,
  sizeId: null as string | null,
  channelId: null as string | null,
  paymentMethod: "EFECTIVO" as PaymentMethod,
};

export function SaleForm({ products, sizes, channels, prices, userName }: Props) {
  const [state, setState] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const reset = useCallback(() => {
    setState(INITIAL);
    setError("");
  }, []);

  const selectedChannel = channels.find((c) => c.id === state.channelId);

  const currentPrice = state.productId && state.sizeId && state.channelId
    ? prices.find(
        (p) =>
          p.productId === state.productId &&
          p.sizeId === state.sizeId &&
          p.channelId === state.channelId
      )
    : null;

  const canConfirm =
    state.productId !== null &&
    state.sizeId !== null &&
    state.channelId !== null &&
    currentPrice !== undefined;

  async function handleConfirm() {
    if (!canConfirm || !state.productId || !state.sizeId || !state.channelId) return;
    setError("");
    setLoading(true);

    const result = await createSale({
      productId: state.productId,
      sizeId: state.sizeId,
      channelId: state.channelId,
      paymentMethod: selectedChannel?.isDelivery ? undefined : state.paymentMethod,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSuccessMsg("✓ Venta registrada");
    setTimeout(() => {
      setSuccessMsg("");
      reset();
    }, 800);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <span className="font-semibold">🍓 {userName}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Salir
        </button>
      </header>

      <div className="flex-1 flex flex-col gap-5 p-4 max-w-sm mx-auto w-full">
        <ProductSelector
          products={products}
          selected={state.productId}
          onSelect={(id) => setState({ ...INITIAL, productId: id })}
        />

        <SizeSelector
          sizes={sizes}
          selected={state.sizeId}
          disabled={!state.productId}
          onSelect={(id) => setState((s) => ({ ...s, sizeId: id, channelId: null }))}
        />

        <ChannelSelector
          channels={channels}
          selected={state.channelId}
          disabled={!state.sizeId}
          onSelect={(id) => setState((s) => ({ ...s, channelId: id }))}
        />

        {selectedChannel && !selectedChannel.isDelivery && (
          <PaymentMethodToggle
            selected={state.paymentMethod}
            onChange={(method) => setState((s) => ({ ...s, paymentMethod: method }))}
          />
        )}

        {currentPrice && (
          <div className="text-center py-3 rounded-xl bg-secondary">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-3xl font-bold">{formatCurrency(currentPrice.amount)}</p>
          </div>
        )}

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

        <Button
          onClick={handleConfirm}
          disabled={!canConfirm || loading}
          className="h-16 text-lg font-bold mt-auto"
          size="lg"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner /> Registrando...
            </span>
          ) : (
            "Confirmar Venta"
          )}
        </Button>
      </div>
    </div>
  );
}
