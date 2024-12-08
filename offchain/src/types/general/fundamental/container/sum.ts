import assert from "assert";
import {
  boundedSubset,
  Generators,
  genPositive,
  randomChoice,
} from "../../../../utils/generators";
import { ConstrData, Data, f, PType, t, TObject, SumBP } from "../type";
import { PObject } from "./object";
import { PRecord } from "./record";
import { PInteger } from "../primitive/integer";
import { PByteString } from "../primitive/bytestring";

/**
 *
 */
export class PSum<Os extends TObject[]>
  implements PType<ConstrData<Data[]>, Os[number], SumBP<Os>>
{
  public readonly population: bigint | undefined;
  /**
   *
   * @param pconstrs
   */
  constructor(
    public readonly pconstrs: {
      [I in keyof Os]: Os[I] extends TObject ? PObject<Os[I], unknown> : never;
    },
  ) {
    assert(pconstrs.length > 0, `PSum: expected at least one PObject`);
    assert(
      pconstrs.every((pconstr) => pconstr instanceof PObject),
      `PSum: expected all pconstrs to be PObjects`,
    );
    this.population = pconstrs.reduce(
      (acc: bigint | undefined, pconstr) =>
        pconstr.population && acc !== undefined
          ? acc + pconstr.population
          : undefined,
      0n,
    );
    pconstrs.forEach((pconstr, i) => {
      pconstr.setIndex(i);
    });
  }

  /**
   *
   * @param c
   */
  public plift = <I extends number>(c: ConstrData<Data[]>): Os[I] => {
    // return {} as Os;
    assert(c instanceof ConstrData, `plift: expected Constr`);
    assert(typeof c.index === `number`, `plift: Constr index not a number`);
    assert(
      c.index < this.pconstrs.length,
      `plift: constr index out of bounds: 
    ${c.index} >= ${this.pconstrs.length}
    for ${this.showPType()}`,
    );
    const pconstr: PObject<Os[typeof c.index], unknown> =
      this.pconstrs[c.index]!;
    return pconstr.plift(c);
  };

  /**
   *
   * @param data
   */
  private matchData = <I extends number>(
    data: Os[I],
  ): PObject<Os[I], unknown> => {
    assert(
      data instanceof Object,
      `PSum.matchData: expected Object, got ${data.toString()}`,
    );
    const matches = new Array<PObject<Os[I], unknown>>();
    this.pconstrs.forEach((pconstr) => {
      if (data instanceof pconstr.O) {
        matches.push(pconstr);
      }
    });
    assert(
      matches.length === 1,
      `PSum.pconstant: expected exactly one match, got ${matches.length} in\n\n${this.pconstrs
        .map((pconstr) => pconstr.O.name)
        .join(`\n`)}\n\nfor ${data.toString()} with fields:\n\n${Object.entries(
        data,
      )
        .map((e) => e.toString())
        .join(`\n`)}\n`,
    );
    return matches[0]!;
  };

  /**
   *
   * @param data
   */
  public pconstant = <I extends number>(data: Os[I]): ConstrData<Data[]> => {
    return this.matchData(data).pconstant(data);
  };

  /**
   *
   * @param data
   */
  // public pblueprint = (data: Os[I]): PBlueprinted => {
  public pblueprint = <I extends number>(data: Os[I]): SumBP<Os> => {
    const match = this.matchData(data);

    const matchBP = match.pblueprint(data);

    const bp = {
      [match.typus]: matchBP,
    } as SumBP<Os>;

    return bp;
  };

  /**
   *
   */
  public genData = (): Os[number] => {
    return randomChoice(this.pconstrs).genData();
  };

  /**
   *
   * @param data
   * @param tabs
   * @param maxDepth
   */
  public showData = <I extends number>(
    data: Os[I],
    tabs = "",
    maxDepth?: bigint,
  ): string => {
    if (maxDepth !== undefined && maxDepth <= 0n) return "Sum ( … )";
    const tt = tabs + t;
    const ttf = tt + f;

    return `Sum (
${ttf}${this.matchData(data).showData(
      data,
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
  public showPType(tabs = "", maxDepth?: bigint): string {
    if (maxDepth !== undefined && maxDepth <= 0n) return "PSum ( … )";
    const tt = tabs + t;
    const ttf = tt + f;

    return `PSum (
${ttf}pconstrs: ${this.pconstrs
      .map((pconstr) =>
        pconstr.showPType(ttf, maxDepth ? maxDepth - 1n : maxDepth),
      )
      .join(`,\n`)}
${tt})`;
  }

  /**
   *
   * @param _gen
   * @param _maxDepth
   */
  static genPType(_gen: Generators, _maxDepth: bigint): PSum<any> {
    //minSizedSubset also serves as shuffle

    const PConstr0 = new PObject(
      new PRecord({
        s: PByteString.genPType(),
        i: PInteger.genPType(),
      }),
      Constr0,
      `Constr0`,
    );

    const PConstr1 = new PObject(
      new PRecord({
        i: PInteger.genPType(),
        s: PByteString.genPType(),
      }),
      Constr1,
      `Constr1`,
    );

    const PConstr2 = new PObject(
      new PRecord({
        i: PInteger.genPType(),
      }),
      Constr2,
      `Constr2`,
    );

    const PConstr3 = new PObject(
      new PRecord({
        s: PByteString.genPType(),
      }),
      Constr3,
      `Constr3`,
    );

    const pconstrs = [PConstr0, PConstr1, PConstr2, PConstr3];
    const len = genPositive(BigInt(pconstrs.length));
    const pconstrs_ = boundedSubset(pconstrs, len);

    return new PSum<any[]>(pconstrs_);
  }
}

/**
 *
 */
class Constr0 {
  public readonly typus = "Constr0";
  /**
   *
   * @param s
   * @param i
   */
  constructor(
    public s: string,
    public i: bigint,
  ) {}
}

/**
 *
 */
class Constr1 {
  public readonly typus = "Constr1";
  /**
   *
   * @param i
   * @param s
   */
  constructor(
    public i: bigint,
    public s: string,
  ) {}
}

/**
 *
 */
class Constr2 {
  public readonly typus = "Constr2";
  /**
   *
   * @param i
   */
  constructor(public i: bigint) {}
}

/**
 *
 */
class Constr3 {
  public readonly typus = "Constr3";
  /**
   *
   * @param s
   */
  constructor(public s: string) {}
}
