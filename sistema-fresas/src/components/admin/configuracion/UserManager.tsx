"use client";

import { useState, useTransition } from "react";
import { resetUserPassword } from "@/app/actions/configuracion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface User { id: string; name: string; username: string; role: string; }

export function UserManager({ users }: { users: User[] }) {
  const [pending, startTransition] = useTransition();
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  function handleReset(userId: string) {
    const pwd = passwords[userId] ?? "";
    if (pwd.length < 6) {
      setMessages({ ...messages, [userId]: "Mínimo 6 caracteres" });
      return;
    }
    startTransition(async () => {
      const res = await resetUserPassword(userId, pwd);
      if (!res.success) {
        setMessages({ ...messages, [userId]: res.error });
      } else {
        setMessages({ ...messages, [userId]: "✓ Contraseña actualizada" });
        setPasswords({ ...passwords, [userId]: "" });
        setTimeout(() => setMessages((m) => ({ ...m, [userId]: "" })), 2000);
      }
    });
  }

  return (
    <div className="space-y-3 py-2">
      {users.map((user) => (
        <div key={user.id} className="border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{user.name}</span>
            <span className="text-xs text-muted-foreground">@{user.username}</span>
            <Badge variant="secondary" className="text-xs ml-auto">
              {user.role}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Input
              type="password"
              value={passwords[user.id] ?? ""}
              onChange={(e) => setPasswords({ ...passwords, [user.id]: e.target.value })}
              placeholder="Nueva contraseña"
              className="h-9 text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReset(user.id)}
              disabled={pending}
              className="h-9 px-3 text-xs whitespace-nowrap"
            >
              Restablecer
            </Button>
          </div>
          {messages[user.id] && (
            <p className={`text-xs ${messages[user.id].startsWith("✓") ? "text-green-600" : "text-destructive"}`}>
              {messages[user.id]}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
