import assert from "assert";
import { Generators } from "../../../../utils/generators";
import {
  f,
  PConstanted,
  PData,
  PLifted,
  PType,
  PBlueprinted,
  t,
} from "../type";

/**
 *
 */
export class PConstraint<PInner extends PData>
  implements PType<PConstanted<PInner>, PLifted<PInner>, PBlueprinted<PInner>>
{
  public population: bigint | undefined;

  /**
   *
   * @param pinner
   * @param asserts
   * @param genInnerData
   * @param details
   */
  constructor(
    public pinner: PInner,
    public asserts: ((i: PLifted<PInner>) => void)[],
    public genInnerData: () => PLifted<PInner>,
    public details?: string,
  ) {
    this.population = pinner.population;
    assert(
      !this.population || this.population > 0,
      `Population not positive in ${this.showPType()}`,
    );
  }

  /**
   *
   * @param data
   */
  public plift = (data: PConstanted<PInner>): PLifted<PInner> => {
    const plifted = this.pinner.plift(data) as PLifted<PInner>;
    this.asserts.forEach((assertion) => {
      assertion(plifted);
    });
    return plifted;
  };

  /**
   *
   * @param data
   */
  public pconstant = (data: PLifted<PInner>): PConstanted<PInner> => {
    this.asserts.forEach((assertion) => {
      try {
        assertion(data);
      } catch (e) {
        throw new Error(
          `Assertion failed in pconstant: ${
            (e as Error).message
          } of ${this.showPType()}`,
        );
      }
    });
    return this.pinner.pconstant(data) as PConstanted<PInner>;
  };

  /**
   *
   * @param data
   */
  public pblueprint = (data: PLifted<PInner>): PBlueprinted<PInner> => {
    this.asserts.forEach((assertion) => {
      try {
        assertion(data);
      } catch (e) {
        throw new Error(
          `Assertion failed in pconstant: ${
            (e as Error).message
          } of ${this.showPType()}`,
        );
      }
    });
    return this.pinner.pblueprint(data) as PBlueprinted<PInner>;
  };

  /**
   *
   */
  public genData = (): PLifted<PInner> => {
    return this.genInnerData();
  };

  /**
   *
   * @param data
   * @param tabs
   * @param maxDepth
   */
  public showData = (
    data: PLifted<PInner>,
    tabs = "",
    maxDepth?: bigint,
  ): string => {
    if (maxDepth !== undefined && maxDepth <= 0n) return "Constraint ( … )";
    const tt = tabs + t;
    const ttf = tt + f;

    return `Constraint (
${ttf}${this.pinner.showData(data, ttf, maxDepth ? maxDepth - 1n : maxDepth)}
${tt})`;
  };

  /**
   *
   * @param tabs
   * @param maxDepth
   */
  public showPType = (tabs = "", maxDepth?: bigint): string => {
    if (maxDepth !== undefined && maxDepth <= 0n) return "PConstraint ( … )";
    const tt = tabs + t;
    const ttf = tt + f;

    // const asserts =
    //   `[\n
    //   ${ttf}` +
    //   this.asserts
    //     .map((a) => {
    //       return `(${a.toString()})`;
    //     })
    //     .join(`,\n${ttf}`) +
    //   `\n
    // ${ttf}]`;

    return `PConstraint (${
      this.details ? `\n${ttf}details: ${this.details}` : ""
    }
${ttf}population: ${this.population},
${ttf}pinner: ${this.pinner.showPType(
      ttf,
      maxDepth ? maxDepth - 1n : maxDepth,
    )},
    ${tt})`;
    // ${ttf}asserts: \${asserts},
    // ${ttf}genInnerData: \${this.genInnerData.toString()}
  };

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static genPType(gen: Generators, maxDepth: bigint): PConstraint<PData> {
    const pinner = gen.generate(maxDepth);
    const genInnerData = pinner.genData;
    return new PConstraint(pinner, [], genInnerData);
  }
}
