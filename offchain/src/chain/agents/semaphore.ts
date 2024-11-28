import assert from "assert";
import {
  errorTimeoutMs,
  logSimplephore,
  semaphoreTimeoutMs,
  slotDurationMs,
} from "../../utils/constants";
import { f } from "../../types/general/fundamental/type";

/**
 *
 */
export class Semaphore {
  private static instances = new Map<string, number>();
  public readonly name: string;

  private tickets = 0;
  private count = 0;
  private holders: Set<string> = new Set();
  private waiting: [string, number, () => void][] = [];
  private seized = false;
  private errorTimeout?: NodeJS.Timeout;

  /**
   *
   * @param name
   * @param log
   * @param max
   */
  constructor(
    name: string,
    private readonly log = true,
    private readonly max = 1,
  ) {
    this.name = `${name}Semaphore`;
    const instance = Semaphore.instances.get(this.name) ?? 0;
    Semaphore.instances.set(this.name, instance + 1);
    if (instance) this.name = `${this.name}#${instance}`;
  }

  /**
   *
   */
  public get waitingIDs(): string {
    const now = Date.now();
    return this.waiting
      .map(([id, since]) => `${id} ${now - since}ms`)
      .join(`,\n${f}`);
  }

  /**
   *
   * @param from
   * @param timeout
   */
  public latch = async (from: string, timeout?: number): Promise<string> => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0)); // NOTE to get it into the event loop, not sure about it
    const id = `${this.name}.${from}.${this.tickets++}`;
    assert(!this.seized, `${this.name}.latch(${id}): Semaphore is seized`); // TODO FIXME (not a priority)
    // if (this.seized) return id_;
    if (this.count >= this.max) {
      await new Promise<void>((resolve) =>
        this.waiting.push([id, Date.now(), resolve]),
      );
    }
    this.count++;
    this.holders.add(id);
    const timeout_ = timeout ?? semaphoreTimeoutMs;
    if (timeout_) {
      this.errorTimeout = setTimeout(() => {
        const msg = `${this.name}: Semaphore hugged too long by\n${id}\nfor ${timeout_} ms\nwaiting: [\n${f}${this.waitingIDs}\n]`;
        if (this.log) console.log(msg);

        // NOTE timeout for throw such that others can log too
        if (errorTimeoutMs === null) {
          throw new Error(msg);
        } else {
          setTimeout(() => {
            throw new Error(msg);
          }, errorTimeoutMs);
        }
      }, timeout_);
    }
    return id;
  };

  /**
   *
   */
  public seize = (): void => {
    clearTimeout(this.errorTimeout);
    assert(!this.seized, `${this.name}: Semaphore already seized`);
    if (this.log) {
      console.warn(
        `${this.name}: !!! SEMAPHORE SEIZED (current count: ${this.count}/${this.max}) !!!`,
      );
    }
    this.seized = true;
    // this.waiting.forEach((callbackfn) => callbackfn());
  };

  /**
   *
   * @param id
   */
  public discharge = (id: string): void => {
    clearTimeout(this.errorTimeout);
    this.count--;
    const next = this.waiting.shift();
    if (next) {
      next[2]();
    }
    const found = this.holders.delete(id);
    assert(
      found,
      `${this.name}.discharge(\n\t${id}\n): not found in holders [\n\t${[
        ...this.holders.keys(),
      ].join(`\n\t`)}\n]`,
    );
  };
}

/**
 *
 */
export class Simplephore {
  private static instances = new Map<string, number>();
  public readonly name: string;

  private holder: string | null = null;
  private since: number | null = null;
  private errorTimeout?: NodeJS.Timeout;

  /**
   *
   * @param name
   */
  constructor(name: string) {
    this.name = `${name}Simplephore`;
    const instance = Simplephore.instances.get(this.name) ?? 0;
    Simplephore.instances.set(this.name, instance + 1);
    if (instance) this.name = `${this.name}#${instance}`;
  }

  /**
   *
   */
  public get busy(): boolean {
    return this.holder !== null;
  }

  /**
   *
   * @param from
   * @param timeout
   */
  public latch = (from: string, timeout?: number): string => {
    const id = `${this.name}.${from}`;
    assert(
      this.holder === null,
      `${this.name}.latch(\n\t${id}\n): already in use by\n\t${this.holder}\nsince ${
        Date.now() - this.since!
      }ms (${(Date.now() - this.since!) / slotDurationMs} slots)`,
    );
    this.holder = id;
    this.since = Date.now();
    const timeout_ = timeout ?? semaphoreTimeoutMs;

    if (timeout_) {
      this.errorTimeout = setTimeout(() => {
        const msg = `${this.name}: Simplephore hugged too long by ${id}`;
        console.log(msg);

        // NOTE timeout for throw such that others can log too
        if (errorTimeoutMs === null) {
          throw new Error(msg);
        } else {
          setTimeout(() => {
            throw new Error(msg);
          }, errorTimeoutMs);
        }
      }, timeout_);
    }

    return id;
  };

  /**
   *
   * @param id
   */
  public discharge = (id: string) => {
    clearTimeout(this.errorTimeout);
    assert(
      this.holder === id,
      `${this.name}.discharge(${id}): in use by ${this.holder}`,
    );
    assert(this.since !== null, `${this.name}.discharge(${id}): since is null`);
    const duration = Date.now() - this.since;
    if (logSimplephore) {
      console.log(
        `[${this.name}].discharge\n${id}\nafter ${duration}ms (${
          duration / slotDurationMs
        } slots)`,
      );
    }
    this.holder = null;
    this.since = null;
  };
}
