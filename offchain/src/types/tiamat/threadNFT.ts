import { Asset } from "../general/derived/asset/asset";
import { PVoid } from "../general/derived/void";
import { PObject } from "../general/fundamental/container/object";
import { PRecord } from "../general/fundamental/container/record";
import { PSum } from "../general/fundamental/container/sum";
import { PSvmDatum, SvmDatum } from "./svm/datum";

/**
 *
 */
export class MintNexus {
  public readonly typus = "MintNexus";
  /**
   *
   */
  constructor() {}
}

/**
 *
 */
class PMintNexus extends PObject<MintNexus> {
  /**
   *
   */
  private constructor() {
    super(new PRecord({}), MintNexus, `MintNexus`);
  }

  static ptype = new PMintNexus();
  /**
   *
   */
  static override genPType(): PMintNexus {
    return PMintNexus.ptype;
  }
}

/**
 *
 */
export class MintSvm {
  public readonly typus = "MintSvm";
  /**
   *
   */
  constructor() {}
}

/**
 *
 */
class PMintSvm extends PObject<MintSvm> {
  /**
   *
   */
  private constructor() {
    super(new PRecord({}), MintSvm, `MintSvm`);
  }

  static ptype = new PMintSvm();
  /**
   *
   */
  static override genPType(): PMintSvm {
    return PMintSvm.ptype;
  }
}

export type ThreadNFTRedeemer = MintNexus | MintSvm;

/**
 *
 */
export class PThreadNFTRedeemer extends PSum<ThreadNFTRedeemer> {
  /**
   *
   */
  private constructor() {
    super([PMintNexus.ptype, PMintSvm.ptype]);
  }

  static ptype = new PThreadNFTRedeemer();
  /**
   *
   */
  static override genPType(): PThreadNFTRedeemer {
    return PThreadNFTRedeemer.ptype;
  }
}

export const pnullDatum = new PSvmDatum(PVoid.ptype, PVoid.ptype);
// export const mkNullDatum = (idNFT: HashAsset) =>
/**
 *
 * @param idNFT
 */
export const mkNullDatum = (idNFT: Asset) =>
  new SvmDatum(idNFT, PVoid.ptype, PVoid.ptype);
