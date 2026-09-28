import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BattleMenu,
  battleMenuMarkup,
  type MenuView,
} from "../src/ui/battle-menu";

const save = { music: 0.35, effects: 0.8, muted: false, showGrid: false };

/** Only the DOM/Animation surface used by BattleMenu; no layout emulation. */
function fixture(reduced = false) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: reduced })),
  );
  let focused = "";
  const animations: {
    page: MenuView;
    frames: Keyframe[];
    options: KeyframeAnimationOptions;
    finished: Promise<void>;
    finish: () => void;
    cancel: ReturnType<typeof vi.fn>;
  }[] = [];
  const control = (name: string) => ({ focus: () => (focused = name) });
  const pages = Object.fromEntries(
    (["menu", "settings", "quit"] as const).map((page) => [
      page,
      {
        hidden: page !== "menu",
        inert: page !== "menu",
        querySelector: vi.fn((selector: string) =>
          selector === "button,input" ? control(`${page}:first`) : null,
        ),
        animate: (frames: Keyframe[], options: KeyframeAnimationOptions) => {
          let finish!: () => void;
          let reject!: (reason: Error) => void;
          const finished = new Promise<void>((resolve, fail) => {
            finish = resolve;
            reject = fail;
          });
          const animation = {
            page,
            frames,
            options,
            finished,
            finish,
            cancel: vi.fn(() => reject(new Error("Animation cancelled"))),
          };
          animations.push(animation);
          return animation;
        },
      },
    ]),
  );
  const root = {
    innerHTML: "",
    querySelector: vi.fn((selector: string) => {
      if (selector === '[data-action="menu-continue"]')
        return control("continue");
      if (selector === '[role="dialog"]') return control("dialog");
      const view = selector.match(
        /^\[data-menu-view="(menu|settings|quit)"\]$/,
      )?.[1];
      return view ? pages[view as MenuView] : null;
    }),
    replaceChildren: vi.fn(() => {
      root.innerHTML = "";
    }),
  };
  const menu = new BattleMenu(root as unknown as HTMLElement, save);
  // Drain only promise continuations; animation time advances explicitly via finish().
  const flush = async () => {
    for (let i = 0; i < 6; i++) await Promise.resolve();
  };
  const finish = async (index: number) => {
    animations[index].finish();
    await flush();
  };
  return {
    menu,
    root,
    pages,
    animations,
    finish,
    flush,
    focused: () => focused,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("battle menu markup", () => {
  it("provides one labelled modal with initially hidden, inert subpages", () => {
    const html = battleMenuMarkup(save);
    expect(html.match(/role="dialog"/g)).toHaveLength(1);
    expect(html).toContain(
      'aria-modal="true" aria-labelledby="battle-menu-title" tabindex="-1"',
    );
    expect(html).toContain('<h2 id="battle-menu-title">Game paused</h2>');
    expect(html).toContain('data-menu-view="menu">');
    for (const view of ["settings", "quit"])
      expect(html).toContain(`data-menu-view="${view}" hidden inert>`);
    for (const action of ["continue", "settings", "quit", "confirm-quit"])
      expect(html).toContain(`data-action="menu-${action}"`);
    expect(html.match(/data-action="menu-back"/g)).toHaveLength(2);
    expect(html).toContain("This attempt will end. Completed maps stay saved.");
  });

  it("reflects saved audio values and both mute states", () => {
    const html = battleMenuMarkup(save);
    for (const [setting, value] of [
      ["music", "0.35"],
      ["effects", "0.8"],
    ])
      expect(html).toContain(
        `data-setting="${setting}" type="range" min="0" max="1" step="0.05" value="${value}"`,
      );
    expect(
      html.match(/<input[^>]+data-setting="muted"[^>]*>/)?.[0],
    ).not.toContain("checked");
    expect(battleMenuMarkup({ ...save, muted: true })).toContain(
      'data-setting="muted" type="checkbox" checked',
    );
  });
});

describe("battle menu transitions", () => {
  it("renders the markup and focuses Continue on entry", () => {
    const f = fixture();
    expect(f.root.innerHTML).toBe(battleMenuMarkup(save));
    expect(f.focused()).toBe("continue");
    expect(f.menu.view).toBe("menu");
    expect(f.menu.transitioning).toBe(false);
  });

  it.each(["settings", "quit"] as const)(
    "finishes the outgoing page before revealing %s",
    async (view) => {
      const f = fixture();
      const pending = f.menu.navigate(view);
      expect(f.menu.transitioning).toBe(true);
      expect(f.pages.menu.inert).toBe(true);
      expect(f.pages.menu.hidden).toBe(false);
      expect(f.pages[view].hidden).toBe(true);
      expect(f.focused()).toBe("dialog");
      expect(f.animations).toHaveLength(1);
      expect(f.animations[0].page).toBe("menu");
      expect(f.animations[0].frames.at(-1)?.transform).toBe(
        "translateX(-32px)",
      );
      await f.finish(0);
      expect(f.animations[0].cancel).toHaveBeenCalledOnce();
      expect(f.pages.menu.hidden).toBe(true);
      expect(f.pages[view].hidden).toBe(false);
      expect(f.pages[view].inert).toBe(true);
      expect(f.animations).toHaveLength(2);
      expect(f.animations[1].page).toBe(view);
      expect(f.animations[1].frames[0].transform).toBe("translateX(32px)");
      expect(f.menu.view).toBe("menu");
      expect(f.focused()).toBe("dialog");
      await f.finish(1);
      await pending;
      expect(f.pages[view].inert).toBe(false);
      expect(f.menu.view).toBe(view);
      expect(f.menu.transitioning).toBe(false);
      expect(f.focused()).toBe(`${view}:first`);
      expect(f.animations[1].cancel).toHaveBeenCalledOnce();
    },
  );

  it("reverses direction when returning and permits another entry", async () => {
    const f = fixture();
    const first = f.menu.navigate("settings");
    await f.finish(0);
    await f.finish(1);
    await first;
    const back = f.menu.navigate("menu");
    expect(f.animations[2].frames.at(-1)?.transform).toBe("translateX(32px)");
    await f.finish(2);
    expect(f.animations[3].frames[0].transform).toBe("translateX(-32px)");
    await f.finish(3);
    await back;
    expect(f.pages.settings.hidden).toBe(true);
    expect(f.pages.settings.inert).toBe(true);
    expect(f.pages.menu.inert).toBe(false);
    expect(f.focused()).toBe("menu:first");
    const again = f.menu.navigate("settings");
    await f.finish(4);
    await f.finish(5);
    await again;
    expect(f.menu.view).toBe("settings");
    expect(f.pages.settings.inert).toBe(false);
    expect(f.animations).toHaveLength(6);
  });

  it("ignores same-page requests and reentrant navigation during either animation", async () => {
    const f = fixture();
    await f.menu.navigate("menu");
    expect(f.animations).toHaveLength(0);
    const pending = f.menu.navigate("settings");
    await f.menu.navigate("quit");
    expect(f.animations).toHaveLength(1);
    await f.finish(0);
    await f.menu.navigate("menu");
    expect(f.animations).toHaveLength(2);
    await f.finish(1);
    await pending;
    expect(f.menu.view).toBe("settings");
    expect(f.pages.quit.hidden).toBe(true);
  });

  it("honours reduced motion while preserving visibility, interactivity and focus", async () => {
    const f = fixture(true);
    await f.menu.navigate("quit");
    expect(f.animations).toHaveLength(0);
    expect(f.pages.menu.hidden).toBe(true);
    expect(f.pages.quit.hidden).toBe(false);
    expect(f.pages.quit.inert).toBe(false);
    expect(f.focused()).toBe("quit:first");
    await f.menu.navigate("menu");
    expect(f.pages.quit.hidden).toBe(true);
    expect(f.pages.menu.hidden).toBe(false);
    expect(f.menu.transitioning).toBe(false);
    expect(f.focused()).toBe("menu:first");
  });

  it.each(["outgoing", "incoming"] as const)(
    "cancels safely when destroyed during the %s animation",
    async (stage) => {
      const f = fixture();
      const pending = f.menu.navigate("settings");
      if (stage === "incoming") await f.finish(0);
      const active = f.animations.at(-1)!;
      const before = { ...f.pages.settings };
      f.menu.destroy();
      await pending;
      expect(active.cancel).toHaveBeenCalled();
      expect(f.root.innerHTML).toBe("");
      expect(f.root.replaceChildren).toHaveBeenCalledOnce();
      expect(f.pages.settings.hidden).toBe(before.hidden);
      expect(f.pages.settings.inert).toBe(true);
      expect(f.focused()).toBe("dialog");
      expect(f.menu.view).toBe("menu");
      const count = f.animations.length;
      await f.menu.navigate("quit");
      expect(f.animations).toHaveLength(count);
    },
  );

  it("prevents navigation after idle destruction and allows a fresh controller", async () => {
    const f = fixture(true);
    f.menu.destroy();
    await f.menu.navigate("settings");
    expect(f.pages.menu.hidden).toBe(false);
    expect(f.root.innerHTML).toBe("");
    const reopened = new BattleMenu(f.root as unknown as HTMLElement, save);
    expect(f.focused()).toBe("continue");
    expect(reopened.view).toBe("menu");
    await reopened.navigate("settings");
    expect(reopened.view).toBe("settings");
    expect(f.focused()).toBe("settings:first");
  });
});
