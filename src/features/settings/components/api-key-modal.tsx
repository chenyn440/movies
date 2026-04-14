"use client";

import { useEffect, useState } from "react";
import { validateTmdbAuth } from "@/features/movies/api/tmdb-client";
import { parseTmdbAuthInput } from "@/features/settings/lib/tmdb-auth";
import { useAppState } from "@/shared/providers/app-state";
import { Input } from "@/shared/ui/input";
import { Modal } from "@/shared/ui/modal";
import { Button } from "@/shared/ui/button";

type ApiKeyModalProps = {
  open: boolean;
  isRequired: boolean;
  onOpenChange: (nextOpen: boolean) => void;
};

export function ApiKeyModal({
  open,
  isRequired,
  onOpenChange,
}: ApiKeyModalProps) {
  const { auth, authSource, setRuntimeAuth, clearRuntimeAuth } = useAppState();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setInput(auth ? auth.value : "");
    setError(null);
  }, [open, auth]);

  async function handleSave() {
    const parsed = parseTmdbAuthInput(input);
    if (!parsed) {
      setError("請輸入有效的 TMDB Bearer Token 或 API Key。");
      return;
    }

    setPending(true);
    setError(null);
    try {
      await validateTmdbAuth(parsed);
      setRuntimeAuth(parsed);
      onOpenChange(false);
    } catch {
      setError("金鑰驗證失敗，請確認內容或稍後再試。");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      confirmDisabled={input.trim().length < 16}
      confirmLabel="儲存並驗證"
      description="系統未找到可用的 TMDB 金鑰。請貼上 v4 Bearer Token 或 v3 API Key。"
      disableClose={isRequired}
      onConfirm={handleSave}
      onOpenChange={(nextOpen) => {
        if (isRequired && !nextOpen) {
          return;
        }
        onOpenChange(nextOpen);
      }}
      open={open}
      pending={pending}
      title="設定 TMDB API Key"
    >
      <div className="space-y-3">
        <label className="block text-sm text-[var(--text-muted)]" htmlFor="tmdb-key">
          TMDB Key / Bearer Token
        </label>
        <Input
          autoComplete="off"
          id="tmdb-key"
          onChange={(event) => setInput(event.target.value)}
          placeholder="例如：Bearer eyJ... 或 32 碼 API Key"
          value={input}
        />
        <p className="text-xs text-[var(--text-soft)]">
          目前來源：
          {authSource === "runtime"
            ? "LocalStorage"
            : authSource === "env"
              ? ".env"
              : "未設定"}
        </p>
        {error ? (
          <p className="rounded-[var(--radius-sm)] border border-[var(--danger)]/45 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
            {error}
          </p>
        ) : null}
      </div>
      {!isRequired && auth ? (
        <div className="mt-3 flex justify-start">
          <Button
            onClick={() => {
              clearRuntimeAuth();
              setInput("");
            }}
            type="button"
            variant="ghost"
          >
            清除 LocalStorage 金鑰
          </Button>
        </div>
      ) : null}
    </Modal>
  );
}
