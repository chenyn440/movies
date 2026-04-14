"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/shared/ui/button";

type ModalProps = {
  title: string;
  description?: string;
  open: boolean;
  disableClose?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  pending?: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  onConfirm?: () => void;
  children: React.ReactNode;
};

export function Modal({
  title,
  description,
  open,
  disableClose = false,
  confirmLabel,
  cancelLabel = "取消",
  confirmDisabled,
  pending,
  onOpenChange,
  onConfirm,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !disableClose) {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("keydown", onEscape);
    };
  }, [open, disableClose, onOpenChange]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const firstInput = panelRef.current?.querySelector<
      HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement
    >("input,textarea,button");
    firstInput?.focus();
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      role="dialog"
    >
      <div
        className="glass-surface w-full max-w-lg rounded-[var(--radius-lg)] p-5 md:p-6"
        ref={panelRef}
      >
        <div className="mb-4">
          <h2 className="text-3xl text-[var(--text)]">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
          ) : null}
        </div>

        {children}

        {(onConfirm || !disableClose) && (
          <div className="mt-5 flex justify-end gap-2">
            {!disableClose && (
              <Button
                onClick={() => onOpenChange(false)}
                type="button"
                variant="ghost"
              >
                {cancelLabel}
              </Button>
            )}
            {onConfirm && (
              <Button
                disabled={confirmDisabled || pending}
                onClick={onConfirm}
                type="button"
              >
                {pending ? "驗證中..." : confirmLabel ?? "儲存"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
