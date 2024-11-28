import assert from "assert";
import { maxInteger } from "../../../../utils/constants";
import { genPBounded, PBounded } from "./bounded";

/**
 *
 */
export class PNonneg extends PBounded {
  /**
   *
   * @param lowerBound
   * @param upperBound
   */
  constructor(
    public override lowerBound = 0n,
    public override upperBound = maxInteger,
  ) {
    assert(!lowerBound || lowerBound >= 0n, `PNonneg: ${lowerBound} < 0`);
    super(lowerBound, upperBound);
  }

  /**
   *
   */
  static override genPType(): PNonneg {
    return genPBounded(0n);
  }
}
