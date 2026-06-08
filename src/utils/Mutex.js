/**
 * Mutex (Mutual Exclusion Lock)
 *
 * Node.js is single-threaded, but async operations can interleave at await
 * boundaries. This mutex serialises critical sections (e.g. spot allocation)
 * so that two concurrent check-in requests cannot claim the same spot.
 *
 * Usage:
 *   const lock = new Mutex();
 *   const release = await lock.acquire();
 *   try { ... critical section ... }
 *   finally { release(); }
 */
class Mutex {
  constructor() {
    /** @type {Array<Function>} Queue of resolve callbacks waiting for the lock */
    this._queue  = [];
    this._locked = false;
  }

  /**
   * Acquire the lock.
   * Returns a Promise that resolves to a release() function.
   * @returns {Promise<Function>}
   */
  acquire() {
    // Fast path — lock is free
    if (!this._locked) {
      this._locked = true;
      return Promise.resolve(() => this._release());
    }
    // Slow path — enqueue a resolve callback; it will be called by _release()
    return new Promise(resolve => {
      this._queue.push(resolve);
    });
  }

  _release() {
    if (this._queue.length > 0) {
      // Hand the lock directly to the next waiter without ever setting
      // _locked = false (the lock remains held, just by the next owner).
      const nextResolve = this._queue.shift();
      nextResolve(() => this._release());
    } else {
      this._locked = false;
    }
  }

  /**
   * Convenience wrapper — runs fn inside the lock automatically.
   * @param {Function} fn - async function to run
   */
  async runExclusive(fn) {
    const release = await this.acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

module.exports = Mutex;
