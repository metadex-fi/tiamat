import { Trace } from "../../utils/wrappers";
import { Callback } from "../state/callback";
import { Sent } from "../state/utxoSource";
import { Zygote } from "./zygote";

/**
 * Some side effect of data updates in some Ganglion.
 */
export class Effector<InZT extends Zygote> {
  constructor(private readonly effect: Callback<InZT>) {}

  public induce = async (
    zygote: InZT,
    from: string,
    trace: Trace,
  ): Promise<(string | Sent)[]> => {
    return await this.effect.run(zygote, from, trace);
  };
}
