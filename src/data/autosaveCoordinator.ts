type PendingWrite = () => Promise<void>

export class AutosaveCoordinator {
  private scheduled = new Map<string, PendingWrite>()
  private timers = new Map<string, number>()
  private active = new Set<Promise<void>>()

  schedule(key: string, write: PendingWrite, delay = 300): void {
    const existingTimer = this.timers.get(key)
    if (existingTimer !== undefined) window.clearTimeout(existingTimer)
    this.scheduled.set(key, write)
    this.timers.set(key, window.setTimeout(() => {
      this.timers.delete(key)
      const operation = this.scheduled.get(key)
      this.scheduled.delete(key)
      if (operation) void this.track(operation())
    }, delay))
  }

  track(write: Promise<void>): Promise<void> {
    this.active.add(write)
    void write.finally(() => this.active.delete(write)).catch(() => undefined)
    return write
  }

  async flush(): Promise<void> {
    while (this.scheduled.size > 0 || this.active.size > 0) {
      const scheduled = [...this.scheduled.values()]
      this.timers.forEach((timer) => window.clearTimeout(timer))
      this.scheduled.clear()
      this.timers.clear()
      for (const write of scheduled) void this.track(write())
      await Promise.all([...this.active])
    }
  }

  dispose(): void {
    this.timers.forEach((timer) => window.clearTimeout(timer))
    this.timers.clear()
    this.scheduled.clear()
  }
}
