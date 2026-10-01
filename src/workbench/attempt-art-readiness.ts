export type AttemptArtStatus = "loading" | "ready" | "failed";

/** Prevents Playtest input before selected encounter art settles. */
export class AttemptArtReadiness {
  private generation = 0;
  private current: AttemptArtStatus = "loading";

  get status() {
    return this.current;
  }

  get ready() {
    return this.current === "ready";
  }

  get canAdvance() {
    return this.ready;
  }

  begin() {
    this.current = "loading";
    return ++this.generation;
  }

  settle(generation: number, status: Exclude<AttemptArtStatus, "loading">) {
    if (generation !== this.generation) return false;
    this.current = status;
    return true;
  }

  invalidate() {
    this.generation++;
  }
}
