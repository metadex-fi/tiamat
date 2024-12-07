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
   * @param tiamatParams
   * @param dappParams
   * @param eigenvectors
   * @param currentCycle
   */
  constructor(
    public readonly tiamatParams: TiamatParams, // expected to be a copy from the matrix, which manages the original
    public readonly dappParams: PLifted<DP>,
    public readonly eigenvectors: Array<KeyHash>,
    public readonly currentCycle: Interval<bigint>,
  ) {
    const fromMs = BigInt(this.currentCycle.from) * slotDurationMs_;
    const toMs = BigInt(this.currentCycle.to) * slotDurationMs_;
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
        tiamatParams: PTiamatParams.ptype, // expected to be a copy from the matrix, which manages the original
        dappParams: pdappParams,
        eigenvectors: new PList(PKeyHash.ptype),
        currentCycle: new PInterval(PInteger.ptype),
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
