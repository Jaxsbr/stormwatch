type VisibleViewportSource = {
  innerWidth: number;
  innerHeight: number;
  visualViewport?: { width: number; height: number } | null;
};

/** Fit the game shell to the part of a tablet screen the browser leaves visible. */
export function fitVisibleViewport(
  style: { setProperty(name: string, value: string): void },
  source: VisibleViewportSource,
) {
  const viewport = source.visualViewport;
  const width =
    viewport && viewport.width > 0 ? viewport.width : source.innerWidth;
  const height =
    viewport && viewport.height > 0 ? viewport.height : source.innerHeight;
  style.setProperty("--app-width", `${Math.floor(width)}px`);
  style.setProperty("--app-height", `${Math.floor(height)}px`);
}
