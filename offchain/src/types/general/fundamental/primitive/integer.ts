import assert from "assert";
import { genNumber } from "../../../../utils/generators";
import { PType } from "../type";
import { maxInteger } from "../../../../utils/constants";

/**
 *
 */
export class PInteger implements PType<bigint, bigint> {
  public readonly population = maxInteger * 2n + 1n;

  /**
   *
   * @param i
   */
  public plift = (i: bigint): bigint => {
    assert(
      typeof i === `bigint`,
      `.PInteger.plift: expected Integer, got ${i} (${typeof i})`,
    );
    return i;
  };

  /**
   *
   * @param data
   */
  public pconstant = (data: bigint): bigint => {
    assert(
      typeof data === `bigint`,
      `PInteger.pconstant: expected Integer, got ${data} (${typeof data})`,
    );
    return data;
  };

  /**
   *
   * @param data
   */
  public pblueprint = (data: bigint): bigint => {
    assert(
      typeof data === `bigint`,
      `PInteger.pblueprint: expected Integer, got ${data} (${typeof data})`,
    );
    return data;
  };

  /**
   *
   */
  public genData = (): bigint => {
    return genNumber();
  };

  /**
   *
   * @param data
   */
  public showData = (data: bigint): string => {
    assert(
      typeof data === `bigint`,
      `PInteger.showData: expected Integer, got ${data} (${typeof data})`,
    );
    return `Integer: ${data}`;
  };

  /**
   *
   */
  public showPType = (): string => {
    return `PInteger`;
  };

  static ptype = new PInteger();
  /**
   *
   */
  static genPType(): PInteger {
    return PInteger.ptype;
  }
}
