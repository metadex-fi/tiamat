import { Generators } from "../../../utils/generators";
import { Asset, PAsset } from "../../general/derived/asset/asset";
import { PObject } from "../../general/fundamental/container/object";
import { PRecord } from "../../general/fundamental/container/record";
import {
  PBlueprint,
  PData,
  PLifted,
  PBlueprinted,
} from "../../general/fundamental/type";

/**
 *
 */
export class SvmDatum<Config, State> {
  public readonly typus = "SvmDatum";
  /**
   *
   * @param id
   * @param config
   * @param state
   */
  constructor(
    public readonly id: Asset, //HashAsset,
    public readonly config: Config, // constants
    public readonly state: State, // variables
  ) {}
}

/**
 *
 */
export class PSvmDatum<
  PConfig extends PData,
  PState extends PData,
> extends PObject<SvmDatum<PLifted<PConfig>, PLifted<PState>>> {
  /**
   *
   * @param pconfig
   * @param pstate
   */
  constructor(
    public readonly pconfig: PConfig, // constants
    public readonly pstate: PState, // variables
  ) {
    super(
      new PRecord({
        id: PAsset.ptype, //PHashAsset.ptype,
        config: pconfig, // constants
        state: pstate, // variables
      }),
      SvmDatum<PLifted<PConfig>, PLifted<PState>>,
      `SvmDatum`,
    );
  }

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static override genPType<PConfig extends PData, PState extends PData>(
    gen: Generators,
    maxDepth: bigint,
  ): PSvmDatum<PConfig, PState> {
    const pconfig: PConfig = gen.generate(maxDepth) as PConfig;
    const pstate: PState = gen.generate(maxDepth) as PState;
    return new PSvmDatum<PConfig, PState>(pconfig, pstate);
  }
}
