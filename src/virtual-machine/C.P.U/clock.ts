import type { Bit } from "../types";

export class Clock extends EventTarget {
    private lastTime: number;
    private accumulatedTime: number;
    private TICK_INTERVAL: number;

    private isActive: boolean;
    rafId: number | null;

    constructor(hertz: number) {
        super();
        this.lastTime = 0;
        this.accumulatedTime = 0;
        this.TICK_INTERVAL = 1000 / hertz;

        this.isActive = false;
        this.rafId = null;

        document.addEventListener("visibilitychange", () => this.handleVisibilityChange());
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.lastTime = 0;
        this.accumulatedTime = 0;
        this.rafId = requestAnimationFrame((ts) => this.loop(ts));
    }

    stop() {
        this.isActive = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
    }

    private handleVisibilityChange() {
        if (document.hidden) {
            console.log("Tab backgrounded. Clock paused.");
            this.stop();
        } else {
            console.log("Tab foregrounded. Clock resumed.");
            this.start();
        }
    }

    private loop(timestamp: number) {
        if (!this.isActive) return;

        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.accumulatedTime += deltaTime;

        while (this.accumulatedTime >= this.TICK_INTERVAL) {
            this.emitClk();
            this.accumulatedTime -= this.TICK_INTERVAL;
        }

        this.rafId = requestAnimationFrame((ts) => this.loop(ts));
    }

    private emitClk() {
        const event = new CustomEvent('clk', {
            detail: { bit: 1 as Bit },
        })

        this.dispatchEvent(event);
    }
}