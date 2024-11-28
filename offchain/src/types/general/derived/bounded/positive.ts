import assert from "assert";
import { maxInteger } from "../../../../utils/constants";
import { genPBounded, PBounded } from "./bounded";

/**
 *
 */
export class PPositive extends PBounded {
  /**
   *
   * @param lowerBound
   * @param upperBound
   */
  constructor(
    public override lowerBound = 1n,
    public override upperBound = maxInteger,
  ) {
    assert(!lowerBound || lowerBound > 0n, `PPositive: ${lowerBound} <= 0`);
    super(lowerBound, upperBound);
  }

  /**
   *
   */
  static override genPType(): PPositive {
    return genPBounded(1n);
  }
}
