/**
 * @file chronograph.js
 * @description High-precision 60Hz chronograph service using requestAnimationFrame.
 * Fully decoupled from DOM and presentation, following Clean Architecture.
 */

export class ChronographService {
  /**
   * @param {Object} options
   * @param {Function} [options.onTick] - Called each frame with ({ remainingSec, fraction, formatted })
   * @param {Function} [options.onComplete] - Called when timer hits 0
   * @param {Function} [options.onStateChange] - Called when running state toggles
   */
  constructor(options = {}) {
    this.onTick = options.onTick || null;
    this.onComplete = options.onComplete || null;
    this.onStateChange = options.onStateChange || null;

    this.durationSec = 0;
    this.remainingSec = 0;
    this.isRunning = false;
    this.rafId = null;
    this.lastTimestamp = 0;
  }

  /**
   * Resets the chronograph to a target duration in seconds.
   * @param {number} durationSec
   */
  reset(durationSec = 0) {
    this.stop();
    this.durationSec = Math.max(0, Math.round(durationSec));
    this.remainingSec = this.durationSec;
    this._dispatchTick();
  }

  /**
   * Starts or resumes the chronograph countdown.
   */
  start() {
    if (this.isRunning || this.remainingSec <= 0) return;

    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this._dispatchStateChange();

    const loop = (currentTimestamp) => {
      if (!this.isRunning) return;

      const deltaMs = currentTimestamp - this.lastTimestamp;
      this.lastTimestamp = currentTimestamp;

      this.remainingSec = Math.max(0, this.remainingSec - deltaMs / 1000);
      this._dispatchTick();

      if (this.remainingSec <= 0) {
        this.stop();
        if (typeof this.onComplete === 'function') {
          this.onComplete();
        }
        return;
      }

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  /**
   * Stops/pauses the chronograph countdown.
   */
  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.isRunning) {
      this.isRunning = false;
      this._dispatchStateChange();
    }
  }

  /**
   * Toggles running state.
   */
  toggle() {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * Returns a snapshot of the current timer state.
   */
  getState() {
    return {
      durationSec: this.durationSec,
      remainingSec: Math.ceil(this.remainingSec),
      exactRemaining: this.remainingSec,
      isRunning: this.isRunning
    };
  }

  _dispatchTick() {
    if (typeof this.onTick !== 'function') return;

    const roundedSec = Math.ceil(this.remainingSec);
    const fraction = this.durationSec > 0 ? this.remainingSec / this.durationSec : 0;
    const mins = Math.floor(roundedSec / 60);
    const secs = roundedSec % 60;
    const formatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    this.onTick({
      remainingSec: roundedSec,
      exactRemaining: this.remainingSec,
      fraction,
      formatted
    });
  }

  _dispatchStateChange() {
    if (typeof this.onStateChange === 'function') {
      this.onStateChange(this.isRunning);
    }
  }

  /**
   * Cleans up resources.
   */
  destroy() {
    this.stop();
    this.onTick = null;
    this.onComplete = null;
    this.onStateChange = null;
  }
}
