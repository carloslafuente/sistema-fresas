"use client";

import { useState, useTransition } from "react";
import { updatePrice } from "@/app/actions/configuracion";
import { Input } from "@/components/ui/input";

interface Product { id: string; name: string; }
interface Size { id: string; name: string; order: number; }
interface Channel { id: string; name: string; }
interface PriceEntry { productId: string; sizeId: string; channelId: string; amount: number; }

interface Props {
  products: Product[];
  sizes: Size[];
  channels: Channel[];
  prices: PriceEntry[];
}

export function PriceTable({ products, sizes, channels, prices }: Props) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const sortedSizes = [...sizes].sort((a, b) => a.order - b.order);

  function getPrice(productId: string, sizeId: string, channelId: string) {
    return prices.find(
      (p) => p.productId === productId && p.sizeId === sizeId && p.channelId === channelId
    )?.amount ?? 0;
  }

  function handleBlur(
    productId: string,
    sizeId: string,
    channelId: string,
    value: string
  ) {
    const num = parseFloat(value);
    if (!num || num <= 0) return;
    const key = `${productId}-${sizeId}-${channelId}`;
    startTransition(async () => {
      await updatePrice({ productId, sizeId, channelId, amount: num });
      setSaved((s) => ({ ...s, [key]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [key]: false })), 1500);
    });
  }

  return (
    <div className="space-y-6 py-2">
      {products.map((product) => (
        <div key={product.id} className="space-y-2">
          <h3 className="font-medium text-sm">{product.name}</h3>
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="text-sm border-collapse min-w-full">
              <thead>
                <tr>
                  <th className="text-left py-1.5 pr-4 text-muted-foreground font-normal whitespace-nowrap">Tamaño</th>
                  {channels.map((ch) => (
                    <th key={ch.id} className="text-center py-1.5 px-2 text-muted-foreground font-normal whitespace-nowrap min-w-[80px]">
                      {ch.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedSizes.map((size) => (
                  <tr key={size.id}>
                    <td className="py-1.5 pr-4 font-medium whitespace-nowrap">{size.name}</td>
                    {channels.map((ch) => {
                      const key = `${product.id}-${size.id}-${ch.id}`;
                      return (
                        <td key={ch.id} className="py-1.5 px-2 text-center">
                          <Input
                            type="number"
                            defaultValue={getPrice(product.id, size.id, ch.id)}
                            onBlur={(e) => handleBlur(product.id, size.id, ch.id, e.target.value)}
                            className={`h-9 w-20 text-center text-sm ${saved[key] ? "border-green-400" : ""}`}
                            min="0"
                            step="0.50"
                            disabled={pending}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Los cambios se guardan al salir del campo.</p>
    </div>
  );
}
