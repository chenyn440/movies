import { TmdbApiError } from "@/features/movies/api/tmdb-client";

export type AppErrorKind =
  | "auth"
  | "network"
  | "not_found"
  | "validation"
  | "unknown";

export type AppError = {
  kind: AppErrorKind;
  message: string;
  status?: number;
};

export function toAppError(error: unknown): AppError {
  if (error instanceof TmdbApiError) {
    if (error.status === 401 || error.status === 403) {
      return {
        kind: "auth",
        status: error.status,
        message: "TMDB 金鑰無效或已過期，請重新設定 API Key。",
      };
    }

    if (error.status === 404) {
      return {
        kind: "not_found",
        status: error.status,
        message: "找不到對應電影資料。",
      };
    }

    return {
      kind: "network",
      status: error.status,
      message: error.message || "電影資料載入失敗，請稍後再試。",
    };
  }

  if (error instanceof Error) {
    return {
      kind: "unknown",
      message: error.message || "發生未知錯誤。",
    };
  }

  return {
    kind: "unknown",
    message: "發生未知錯誤。",
  };
}
