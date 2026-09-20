/** Bounded render-resource reuse; checked-out objects are never shared. */
export class ResourcePool<T extends { dispose(): void }> {
  private idle = new Map<string, T[]>();
  private active = new Map<T, string>();
  constructor(private readonly limitPerKey = 16) {}
  acquire(key: string, create: () => T): T {
    const value = this.idle.get(key)?.pop() ?? create();
    this.active.set(value, key);
    return value;
  }
  release(value: T) {
    const key = this.active.get(value);
    if (key === undefined) throw new Error("Resource is not checked out");
    this.active.delete(value);
    const entries = this.idle.get(key) ?? [];
    if (entries.length >= this.limitPerKey) value.dispose();
    else {
      entries.push(value);
      this.idle.set(key, entries);
    }
  }
  dispose() {
    for (const value of this.active.keys()) value.dispose();
    for (const entries of this.idle.values())
      for (const value of entries) value.dispose();
    this.active.clear();
    this.idle.clear();
  }
}
