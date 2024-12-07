import { Generators } from "../../../../utils/generators";
import { Asset, PAsset } from "../../../general/derived/asset/asset";
import { PObject } from "../../../general/fundamental/container/object";
import { PRecord } from "../../../general/fundamental/container/record";
import { PData, PLifted } from "../../../general/fundamental/type";

/**
 *
 */
export class NexusConfig<DappConfig> {
  public readonly typus = "NexusConfig";
  /**
   *
   * @param matrix
   * @param dappConfig
   */
  constructor(
    public readonly matrix: Asset, //HashAsset,
    public readonly dappConfig: DappConfig,
  ) {}
}

/**
 *
 */
export class PNexusConfig<PDappConfig extends PData> extends PObject<
  NexusConfig<PLifted<PDappConfig>>
> {
  /**
   *
   */
  constructor(pdappConfig: PDappConfig) {
    super(
      new PRecord({
        matrix: PAsset.ptype, //PHashAsset.ptype,
        dappConfig: pdappConfig,
      }),
      NexusConfig,
      `NexusConfig`,
    );
  }

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static override genPType<PDappConfig extends PData>(
    gen: Generators,
    maxDepth: bigint,
  ): PNexusConfig<PDappConfig> {
    const pdappConfig: PDappConfig = gen.generate(maxDepth) as PDappConfig;
    return new PNexusConfig(pdappConfig);
  }
}
