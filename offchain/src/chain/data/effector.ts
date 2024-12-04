import { Trace } from "../../utils/wrappers";
import { Callback, Result } from "../state/callback";
import { Zygote } from "./zygote";

/**
 * Some side effect of data updates in some Ganglion.
 */
export class Effector<InZT extends Zygote> {
  constructor(
    public readonly name: string,
    private readonly effect: Callback<InZT>,
  ) {}

  public induce = async (
    zygote: InZT,
    from: string,
    trace: Trace,
  ): Promise<Result> => {
    return await this.effect.run(
      zygote,
      from,
      trace.via(`${this.name}.induce from ${from}`),
    );
  };
}
