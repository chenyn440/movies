import { Button } from "@/shared/ui/button";

type ErrorNoticeProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ErrorNotice({
  title,
  message,
  actionLabel = "重試",
  onAction,
}: ErrorNoticeProps) {
  return (
    <div className="glass-surface rounded-[var(--radius-md)] border border-[var(--danger)]/45 p-4">
      <p className="text-lg text-[var(--danger)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{message}</p>
      {onAction ? (
        <Button className="mt-3" onClick={onAction} variant="secondary">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
