import assert from "assert";
import { Generators } from "../../../../utils/generators";
import { Data, f, PBlueprint, PData, PType, t, TObject } from "../type";
import { filterFunctionsAndTypus } from "./object";

// like PObject, but only one field in the PRecord.
// Purpose is removing the extra Arrays around pconstanted wrappers.
/**
 *
 */
export class PWrapped<O extends TObject> implements PType<Data, O> {
  population: bigint | undefined;

  /**
   *
   * @param pinner
   * @param O
   */
  constructor(
    public readonly pinner: PData,
    public readonly O: new (arg: any) => O,
    public readonly typus: string,
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
  public plift = (data: Data): O => {
    const inner = this.pinner.plift(data);
    return new this.O(inner);
  };

  /**
   *
   * @param data
   */
  public pconstant = (data: O): Data => {
    assert(
      data.typus === this.typus,
      `pconstant: expected typus ${this.typus}, got ${data.typus}`,
    );
    const inner = filterFunctionsAndTypus(data);
    const values = Object.values(inner);
    assert(values.length === 1, `pconstant: expected one value`);
    return this.pinner.pconstant(values[0]);
  };

  /**
   *
   * @param data
   */
  public pblueprint = (data: O): PBlueprint => {
    assert(
      data.typus === this.typus,
      `pblueprint: expected typus ${this.typus}, got ${data.typus}`,
    );
    const inner = filterFunctionsAndTypus(data);
    const values = Object.values(inner);
    assert(values.length === 1, `pblueprint: expected one value`);
    return this.pinner.pblueprint(values[0]);
  };

  /**
   *
   */
  public genData = (): O => {
    const inner = this.pinner.genData();
    return new this.O(inner);
  };

  /**
   *
   * @param data
   * @param tabs
   * @param maxDepth
   */
  public showData = (data: O, tabs = "", maxDepth?: bigint): string => {
    if (maxDepth !== undefined && maxDepth <= 0n) return "Wrapped ( … )";
    const tt = tabs + t;
    const ttf = tt + f;

    assert(
      data.typus === this.typus,
      `showData: expected typus ${this.typus}, got ${data.typus}`,
    );
    const inner = filterFunctionsAndTypus(data);
    const values = Object.values(inner);
    assert(values.length === 1, `showData: expected one value`);

    return `Wrapped: ${this.O.name} (
${ttf}${this.pinner.showData(
      values[0],
      ttf,
      maxDepth ? maxDepth - 1n : maxDepth,
    )}
${tt})`;
  };

  /**
   *
   * @param tabs
   * @param maxDepth
   */
  public showPType = (tabs = "", maxDepth?: bigint): string => {
    if (maxDepth !== undefined && maxDepth <= 0n) {
      return "PObject: PWrapped ( … )";
    }
    const tt = tabs + t;
    const ttf = tt + f;

    return `PObject: PWrapped (
${ttf}population: ${this.population},
${ttf}pinner: ${this.pinner.showPType(
      ttf,
      maxDepth ? maxDepth - 1n : maxDepth,
    )},
${ttf}O: ${this.O.name}
${tt})`;
  };

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static genPType(gen: Generators, maxDepth: bigint): PWrapped<any> {
    const pinner = gen.generate(maxDepth);

    return new PWrapped(pinner, WrapperClass, `WrapperClass`);
  }
}

/**
 *
 */
class WrapperClass {
  public readonly typus = "WrapperClass";
  /**
   *
   * @param inner
   */
  constructor(public inner: any) {}
  /**
   *
   */
  public show = () => {
    return `WrapperClass (${this.inner})`;
  };
}
