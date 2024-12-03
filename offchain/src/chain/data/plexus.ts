import assert from "assert";
import { errorTimeoutMs } from "../../utils/constants";
import { Sent } from "../state/utxoSource";

/**
 * Ganglia often interconnect with other ganglia to form a complex system of ganglia known as a plexus.
 */
export abstract class Plexus {
  constructor(public readonly name: string) {
    assert(
      name.endsWith(`Plexus`),
      `Plexus name must end with Plexus: ${name}`,
    );
  }

  abstract myelinate(from: string[]): Promise<(string | Sent)[]>;

  /**
   *
   * @param msg
   * @param {...any} args
   */
  protected log = (msg: string, ...args: any) => {
    console.log(`[${this.name}] ${msg}`, ...args, `\n`);
  };

  /**
   *
   * @param msg
   */
  protected throw = (msg: string) => {
    this.log(`ERROR: ${msg}\n`);
    if (errorTimeoutMs === null) {
      throw new Error(`${this.name} ERROR: ${msg}\n`);
    } else {
      setTimeout(() => {
        throw new Error(`${this.name} ERROR: ${msg}\n`);
      }, errorTimeoutMs);
    }
  };
}
