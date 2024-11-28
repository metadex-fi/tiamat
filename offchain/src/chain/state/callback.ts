import assert from "assert";
import { arr, f, rra, t } from "../../types/general/fundamental/type";
import {
  callbackTimeoutMs,
  errorTimeoutMs,
  logCallbackFns,
  logCallbacks,
} from "../../utils/constants";
import { Sent } from "./utxoSource";
import { Trace } from "../../utils/wrappers";

/**
 *
 */
export class Callback<T> {
  public readonly fullName: string;
  private readonly shortName: string; // use fullName
  static count = 0;
  public readonly run: (
    data: T,
    from: string,
    trace: Trace,
  ) => Promise<(string | Sent)[]>;
  // public readonly name: string;
  /**
   *
   * @param perform
   * @param id
   * @param callback
   */
  constructor(
    public readonly perform: `once` | `always`,
    id: (string | undefined)[],
    callback: (data: T, trace: Trace) => Promise<(string | Sent)[]>,
  ) {
    const count = Callback.count++;
    const id_ = id.filter((id) => id !== undefined);
    assert(id_.length, `Callback ids must not be empty`);
    id_[0] = `[${id_[0]}]`;
    this.shortName = id_.join(`.`);
    this.fullName = `CALLBACK #${count}: ${this.shortName}`;
    const callbackFn = `${arr}${callback
      .toString()
      .replace(/\n/g, `\n${t}${f}`)}\n${t}${f}${rra}\n`;
    if (logCallbacks) {
      console.log(
        `CREATING ${this.fullName}\n${logCallbackFns ? callbackFn : ``}`,
      );
    }

    /**
     *
     * @param data
     * @param from
     * @param trace
     */
    this.run = async (data: T, from: string, trace: Trace) => {
      if (logCallbacks) {
        console.log(
          trace.calledFrom(this.fullName, from).toString(),
          logCallbackFns ? callbackFn : ``,
        );
      }

      let result: (string | Sent)[];
      if (callbackTimeoutMs) {
        const errorTimeout = setTimeout(() => {
          const at = new Date().toISOString().split(`T`).at(-1)!.slice(0, -1);
          const ms = parseInt(at.slice(-1));
          const style_ = count % 6;
          //   const style_ = Math.floor(Math.random() * 6);
          const style: string =
            style_ % 3 === 0 ? "" : style_ % 3 === 1 ? `1;` : `3;`; // nothing, bold or italic
          // let style = ms % 4;
          // if (style === 2) style = 4; // replace faint with underline
          const text: number = (style_ % 2 === 0 ? 31 : 91) + (ms % 5); // excluding black and white
          const bg: number = 49; //ms % 3 === 0 ? 40 : (ms % 3 === 1 ? 47 : 100); // black or white or grey ("bright black")
          const msg = `\x1b[${style}${text};${bg}m\n\n${trace
            .calledFrom(
              `${this.fullName}\n\nTIMED OUT AT ${at}\nAFTER ${callbackTimeoutMs} MS\n`,
              from,
            )
            .toString()}\n\n${callbackFn}\x1b[37m`;
          console.log(msg);

          // NOTE timeout for throw such that others can log too
          if (errorTimeoutMs === null) {
            throw new Error(msg);
          } else {
            setTimeout(() => {
              throw new Error(msg);
            }, errorTimeoutMs);
          }
        }, callbackTimeoutMs);

        result = await callback(data, trace.calledFrom(this.shortName, from));
        clearTimeout(errorTimeout);
      } else {
        result = await callback(data, trace.calledFrom(this.shortName, from));
      }
      if (logCallbacks) {
        console.log(`${this.fullName} DONE\n`);
      }
      return result;
    };
  }

  /**
   *
   * @param tabs
   */
  public show = (tabs = ``): string => `${tabs}${this.fullName}`;
}
