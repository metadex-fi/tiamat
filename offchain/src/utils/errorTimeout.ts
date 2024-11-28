import { errorTimeoutMs } from "./constants";
import { Trace } from "./wrappers";

/**
 *
 */
export class ErrorTimeout {
  private errorTimeout?: NodeJS.Timeout;

  /**
   *
   * @param name
   * @param from
   * @param timeout
   * @param trace
   */
  constructor(name: string, from: string, timeout: number, trace: Trace) {
    const fullName = `${name} ErrorTimeout: ${from}`;
    this.errorTimeout = setTimeout(() => {
      const at = new Date().toISOString().split(`T`).at(-1)!.slice(0, -1);
      const ms = parseInt(at.slice(-1));
      const style_ = Math.floor(Math.random() * 6);
      const style: string =
        style_ % 3 === 0 ? "" : style_ % 3 === 1 ? `1;` : `3;`; // nothing, bold or italic
      // let style = ms % 4;
      // if (style === 2) style = 4; // replace faint with underline
      const text: number = 37; //39; // default
      const bg: number = (style_ % 2 === 0 ? 41 : 101) + (ms % 5); // excluding black and white
      const msg = `\x1b[${style}${text};${bg}m\n${fullName}\n\nTIMED OUT AT ${at}\nAFTER ${timeout} MS\n${trace.compose()}\x1b[49m`;

      console.log(msg);

      // NOTE timeout for throw such that others can log too
      if (errorTimeoutMs === null) {
        throw new Error(msg);
      } else {
        setTimeout(() => {
          throw new Error(msg);
        }, errorTimeoutMs);
      }
    }, timeout);
  }

  /**
   *
   */
  public clear = () => {
    clearTimeout(this.errorTimeout);
  };
}
