/** Shared portrait/battlefield badge layout, in logical pixels. */
export const RANK_BADGE = {
  image: "art/v2/battle-icons-v1/marker.webp",
  width: 40,
  height: 44,
  color: "#fff3c5",
  background: "#123b3d",
} as const;

/** Invalid ranks fall back to one; large ranks use bounded scientific notation. */
export function rankLabel(level: number): string {
  const rank = Number.isFinite(level)
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(1, Math.floor(level)))
    : 1;
  return rank < 10000 ? String(rank) : rank.toExponential(1).replace("e+", "e");
}

export function rankFontSize(label: string): number {
  return Math.min(20, 48 / label.length);
}

/** One illustrated marker and one readable number, independent of rank count. */
export function rankBadge(level: number): string {
  const label = rankLabel(level);
  return `<span class="rank-badge" role="img" aria-label="Rank ${label}" style="position:relative;display:inline-block;flex:none;width:${RANK_BADGE.width}px;height:${RANK_BADGE.height}px"><img src="${import.meta.env.BASE_URL}${RANK_BADGE.image}" alt="" aria-hidden="true" style="display:block;width:100%;height:100%"><span aria-hidden="true" style="position:absolute;left:4px;right:4px;top:9px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:5px;background:${RANK_BADGE.background};color:${RANK_BADGE.color};font:800 ${rankFontSize(label)}px Arial,sans-serif;line-height:1;font-variant-numeric:tabular-nums">${label}</span></span>`;
}
