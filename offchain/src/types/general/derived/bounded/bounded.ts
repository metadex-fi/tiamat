import assert from "assert";
import { genNonNegative } from "../../../../utils/generators";
import { PConstraint } from "../../fundamental/container/constraint";
import { PInteger } from "../../fundamental/primitive/integer";
import { maxInteger } from "../../../../utils/constants";

/**
 *
 * @param a
 * @param b
 */
export const bothExtreme = (a: bigint, b: bigint) =>
  (a === b && a === maxInteger) || a === -maxInteger;

/**
 *
 */
export class PBounded extends PConstraint<PInteger> {
  static pinner = new PInteger();
  /**
   *
   * @param lowerBound
   * @param upperBound
   */
  constructor(
    public lowerBound = -maxInteger,
    public upperBound = maxInteger,
  ) {
    assert(lowerBound <= upperBound, `PBounded: ${lowerBound} > ${upperBound}`);

    super(
      PBounded.pinner,
      [newAssertInRange(lowerBound, upperBound)],
      newGenInRange(lowerBound, upperBound),
      `PBounded(${lowerBound}, ${upperBound})`,
    );
    this.population = upperBound - lowerBound + 1n;
  }

  /**
   *
   */
  static override genPType(): PConstraint<PInteger> {
    return genPBounded();
  }
}

/**
 *
 * @param minLowerBound
 */
export const genPBounded = (minLowerBound = -maxInteger): PBounded => {
  assert(minLowerBound >= -maxInteger, `${minLowerBound} < -maxInteger`);
  assert(minLowerBound < maxInteger, `${minLowerBound} >= maxInteger`);
  const lowerBound = newGenInRange(minLowerBound, maxInteger)();
  const upperBound = newGenInRange(lowerBound, maxInteger)();
  return new PBounded(lowerBound, upperBound);
};

/**
 *
 * @param lowerBound
 * @param upperBound
 */
export const newGenInRange = (lowerBound: bigint, upperBound: bigint) => {
  if (lowerBound === upperBound) return () => lowerBound;
  assert(
    lowerBound <= upperBound,
    `newGenInRange: ${lowerBound} > ${upperBound}`,
  );
  return () => lowerBound + genNonNegative(upperBound - lowerBound);
};

/**
 *
 * @param lowerBound
 * @param upperBound
 */
const newAssertInRange =
  (lowerBound?: bigint, upperBound?: bigint) => (i: bigint) => {
    assert(
      !lowerBound || lowerBound <= i,
      `too small: ${i} < ${lowerBound} by ${lowerBound! - i}`,
    );
    assert(
      !upperBound || i <= upperBound,
      `too big: ${i} > ${upperBound} by ${i - upperBound!}`,
    );
  };
