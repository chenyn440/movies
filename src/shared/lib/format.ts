export function formatRating(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }

  return value.toFixed(1);
}

export function formatReleaseDate(value: string | null) {
  if (!value) {
    return "未知上映日期";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "未知上映日期";
  }

  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRuntime(minutes: number | null) {
  if (!minutes || minutes <= 0) {
    return "片長未知";
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins} 分鐘`;
  }

  return `${hours} 小時 ${mins} 分鐘`;
}
