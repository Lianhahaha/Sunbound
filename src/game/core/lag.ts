export class LagFollower {
  private buf: { x: number; y: number }[] = [];
  constructor(private frames: number) {}
  push(x: number, y: number): { x: number; y: number } {
    this.buf.push({ x, y });
    if (this.buf.length > this.frames + 1) this.buf.shift();
    return this.buf[0];
  }
  reset(): void {
    this.buf.length = 0;
  }
}
