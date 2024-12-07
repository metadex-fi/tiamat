import { PObject } from "../../../general/fundamental/container/object";
import { PRecord } from "../../../general/fundamental/container/record";
import { PInteger } from "../../../general/fundamental/primitive/integer";

/**
 *
 */
export class VestingState {
  public readonly typus = "VestingState";
  /**
   *
   * @param timeLock
   */
  constructor(
    public readonly timeLock: bigint, // NOTE: onchain is after all in ms
  ) {}
}

/**
 *
 */
export class PVestingState extends PObject<VestingState> {
  /**
   *
   */
  constructor() {
    super(
      new PRecord({
        timeLock: PInteger.ptype,
      }),
      VestingState,
      `VestingState`,
    );
  }

  static ptype = new PVestingState();
  /**
   *
   */
  static override genPType(): PVestingState {
    return PVestingState.ptype;
  }
}
