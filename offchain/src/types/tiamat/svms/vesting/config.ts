import { KeyHash, PKeyHash } from "../../../general/derived/hash/keyHash";
import { PObject } from "../../../general/fundamental/container/object";
import { PRecord } from "../../../general/fundamental/container/record";

/**
 *
 */
export class VestingConfig {
  public readonly typus = "VestingConfig";
  /**
   *
   * @param owner
   */
  constructor(public readonly owner: KeyHash) {}
}

/**
 *
 */
export class PVestingConfig extends PObject<VestingConfig> {
  /**
   *
   */
  constructor() {
    super(
      new PRecord({
        owner: PKeyHash.ptype,
      }),
      VestingConfig,
      `VestingConfig`,
    );
  }

  static ptype = new PVestingConfig();
  /**
   *
   */
  static override genPType(): PVestingConfig {
    return PVestingConfig.ptype;
  }
}
