import assert from "assert";
import { slotDurationMs } from "../../../../utils/constants";
import { KeyHash, PKeyHash } from "../../../general/derived/hash/keyHash";
import { Interval, PInterval } from "../../../general/derived/interval";
import { PList } from "../../../general/fundamental/container/list";
import { PObject } from "../../../general/fundamental/container/object";
import { PRecord } from "../../../general/fundamental/container/record";
import { PInteger } from "../../../general/fundamental/primitive/integer";
import { TiamatParams, PTiamatParams, PDappParamsT } from "../../tiamat";
import { PLifted } from "../../../general/fundamental/type";
import { Generators } from "../../../../utils/generators";

const slotDurationMs_ = BigInt(slotDurationMs);

/**
 *
 */
export class NexusState<DP extends PDappParamsT> {
  public readonly typus = "NexusState";
  /**
   *
   * @param tiamat_params
   * @param dapp_params
   * @param eigenvectors
   * @param current_cycle
   */
  constructor(
    public readonly tiamat_params: TiamatParams, // expected to be a copy from the matrix, which manages the original
    public readonly dapp_params: PLifted<DP>,
    public readonly eigenvectors: Array<KeyHash>,
    public readonly current_cycle: Interval<bigint>,
  ) {
    const fromMs = BigInt(this.current_cycle.from) * slotDurationMs_;
    const toMs = BigInt(this.current_cycle.to) * slotDurationMs_;
    assert(
      fromMs % slotDurationMs_ === 0n,
      `NexusState: fromMs % slotDurationMs !== 0: ${fromMs} / ${slotDurationMs} = ${
        Number(fromMs) / slotDurationMs
      }`,
    );
    assert(
      toMs % slotDurationMs_ === 0n,
      `NexusState: toMs % slotDurationMs !== 0: ${toMs} / ${slotDurationMs} = ${
        Number(toMs) / slotDurationMs
      }`,
    );
  }
}

/**
 *
 */
export class PNexusState<DP extends PDappParamsT> extends PObject<
  NexusState<DP>
> {
  /**
   *
   */
  constructor(public readonly pdappParams: DP) {
    super(
      new PRecord({
        tiamat_params: PTiamatParams.ptype, // expected to be a copy from the matrix, which manages the original
        dapp_params: pdappParams,
        eigenvectors: new PList(PKeyHash.ptype),
        current_cycle: new PInterval(PInteger.ptype),
      }),
      NexusState,
      `NexusState`,
    );
  }

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static override genPType<DP extends PDappParamsT>(
    gen: Generators,
    maxDepth: bigint,
  ): PNexusState<DP> {
    const pdappParams: DP = gen.generate(maxDepth) as DP;
    return new PNexusState(pdappParams);
  }
}
