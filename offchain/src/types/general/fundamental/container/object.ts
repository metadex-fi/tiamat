import assert from "assert";
import { Generators } from "../../../../utils/generators";
import {
  ConstrData,
  Data,
  f,
  PData,
  TObjectBP,
  PType,
  t,
  TObject,
} from "../type";
import { PRecord } from "./record";
import { PInteger } from "../primitive/integer";
import { PByteString } from "../primitive/bytestring";

/**
 *
 * @param o
 */
export const filterFunctionsAndTypus = <O extends object>(o: O) =>
  Object.fromEntries(
    Object.entries(o).filter(
      ([k, v]) => typeof v !== "function" && k !== "typus",
    ),
  );

/**
 *
 */
export class PObject<O extends TObject>
  implements PType<ConstrData<Data[]>, O, TObjectBP<O>>
{
  public readonly population: bigint | undefined;
  /**
   *
   * @param precord
   * @param O
   */
  constructor(
    public readonly precord: PRecord<PData>,
    public readonly O: new (...args: Array<any>) => O,
    public readonly typus: string,
  ) {
    this.population = precord.population;
    assert(
      !this.population || this.population > 0,
      `Population not positive in ${this.showPType()}`,
    );
  }

  /**
   *
   * @param index
   */
  public setIndex = (index: number) => this.precord.setIndex(index);

  /**
   *
   * @param l
   */
  public plift = (l: ConstrData<Data[]>): O => {
    assert(l instanceof ConstrData, `plift: expected Constr`);
    const record = this.precord.plift(l);
    const args = Object.values(record);
    return new this.O(...args);
  };

  /**
   *
   * @param data
   */
  public pconstant = (data: O): ConstrData<Data[]> => {
    assert(
      data.typus === this.typus,
      `PObject.pconstant: expected typus ${this.typus}, got ${data.typus}`,
    );
    const record = filterFunctionsAndTypus(data);
    return this.precord.pconstant(record);
  };

  /**
   *
   * @param data
   */
  public pblueprint = (data: O): TObjectBP<O> => {
    assert(
      data.typus === this.typus,
      `PObject.pblueprint: expected typus ${this.typus}, got ${data.typus}`,
    );
    const record = filterFunctionsAndTypus(data);
    return this.precord.pblueprint(record) as TObjectBP<O>;
  };

  /**
   *
   */
  public genData = (): O => {
    const record = this.precord.genData();
    try {
      const o = new this.O(...Object.values(record));
      return o;
    } catch (e) {
      throw new Error(
        `Error in genData for ${this.precord.showData(record)}: ${e}`,
      );
    }
  };

  /**
   *
   * @param data
   * @param tabs
   * @param maxDepth
   */
  public showData = (data: O, tabs = "", maxDepth?: bigint): string => {
    if (maxDepth !== undefined && maxDepth <= 0n) return "Object ( … )";
    const tt = tabs + t;
    const ttf = tt + f;

    const record = this.precord.showData(
      filterFunctionsAndTypus(data),
      ttf,
      maxDepth ? maxDepth - 1n : maxDepth,
    );

    return `Object: ${this.O.name} (
${ttf}${record}
${tt})`;
  };

  /**
   *
   * @param tabs
   * @param maxDepth
   */
  public showPType = (tabs = "", maxDepth?: bigint): string => {
    if (maxDepth !== undefined && maxDepth <= 0n) return "PObject ( … )";
    const tt = tabs + t;
    const ttf = tt + f;

    return `PObject (
${ttf}population: ${this.population},
${ttf}precord: ${this.precord.showPType(
      ttf,
      maxDepth ? maxDepth - 1n : maxDepth,
    )},
${ttf}O: ${this.O.name}
${tt})`;
  };

  /**
   *
   * @param _gen
   * @param _maxDepth
   */
  static genPType(_gen: Generators, _maxDepth: bigint): PObject<any> {
    const precord = new PRecord<PByteString | PInteger>({
      s: PByteString.genPType(),
      i: PInteger.genPType(),
      // ls: PList.genPType(gen, maxDepth),
      // li: PList.genPType(gen, maxDepth),
      // msli: PMap.genPType(gen, maxDepth),
      // mlis: PMap.genPType(gen, maxDepth),
    });
    // return new PObject(`ExampleClass`, precord, ExampleClass);
    return new PObject(precord, ExampleClass, `ExampleClass`);
  }
}

/**
 *
 */
class ExampleClass implements TObject {
  public readonly typus = "ExampleClass";
  /**
   *
   * @param s
   * @param i
   */
  constructor(
    public s: string,
    public i: bigint,
    // public ls: string[],
    // public li: bigint[],
    // public msli: Map<string, bigint[]>,
    // public mlis: Map<bigint[], string>,
  ) {}
  /**
   *
   */
  public show = () => {
    return `ExampleClass (${this.s}, ${this.i})`;
  };
}
