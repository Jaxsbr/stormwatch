import { describe, expect, it } from "vitest";
import { fitVisibleViewport } from "../src/ui/visible-viewport";

describe("visible viewport fitting", () => {
  it("uses the area below tablet browser chrome instead of layout height", () => {
    const values: Record<string, string> = {};
    fitVisibleViewport(
      { setProperty: (key, value) => void (values[key] = value) },
      {
        innerWidth: 1024,
        innerHeight: 768,
        visualViewport: { width: 1024, height: 620 },
      },
    );
    expect(values).toEqual({
      "--app-width": "1024px",
      "--app-height": "620px",
    });
  });

  it("uses the window size if visual viewport data is unavailable", () => {
    const values: Record<string, string> = {};
    fitVisibleViewport(
      { setProperty: (key, value) => void (values[key] = value) },
      { innerWidth: 844, innerHeight: 390, visualViewport: null },
    );
    expect(values["--app-height"]).toBe("390px");
  });
});
