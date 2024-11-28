import { Asset, PAsset } from "../../../general/derived/asset/asset";
import { PObject } from "../../../general/fundamental/container/object";
import { PRecord } from "../../../general/fundamental/container/record";

/**
 *
 */
export class MatrixConfig {
  public readonly typus = "MatrixConfig";
  /**
   *
   * @param eigenwert
   */
  constructor(public readonly eigenwert: Asset) {}
}

/**
 *
 */
export class PMatrixConfig extends PObject<MatrixConfig> {
  /**
   *
   */
  constructor() {
    super(
      new PRecord({
        eigenwert: PAsset.ptype,
      }),
      MatrixConfig,
      `MatrixConfig`,
    );
  }

  static ptype = new PMatrixConfig();
  /**
   *
   */
  static override genPType(): PMatrixConfig {
    return PMatrixConfig.ptype;
  }
}
