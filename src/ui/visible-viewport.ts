type VisibleViewportSource = {
  innerWidth: number;
  innerHeight: number;
  visualViewport?: { width: number; height: number } | null;
};

/** Fit the game shell to the part of a tablet screen the browser leaves visible. */
export function fitVisibleViewport(
  style: {
    setProperty(name: string, value: string): void;
    getPropertyValue?(name: string): string;
  },
  source: VisibleViewportSource,
) {
  const viewport = source.visualViewport;
  const width =
    viewport && viewport.width > 0 ? viewport.width : source.innerWidth;
  const height =
    viewport && viewport.height > 0 ? viewport.height : source.innerHeight;
  const nextWidth = `${Math.floor(width)}px`;
  const nextHeight = `${Math.floor(height)}px`;
  // Scroll notifications need no new layout when the visible size is unchanged.
  if (style.getPropertyValue?.("--app-width") !== nextWidth)
    style.setProperty("--app-width", nextWidth);
  if (style.getPropertyValue?.("--app-height") !== nextHeight)
    style.setProperty("--app-height", nextHeight);
}
