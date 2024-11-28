import { PObject } from "../fundamental/container/object";
import { PRecord } from "../fundamental/container/record";
import { PData, PLifted } from "../fundamental/type";
import { PSum } from "../fundamental/container/sum";
import { Generators } from "../../../utils/generators";
import { Bool, PBool, True } from "./bool";
import assert from "assert";

/**
 *
 */
export class NegativeInfinity {
  public readonly typus = "NegativeInfinity";
  /**
   *
   */
  constructor() {}
}

/**
 *
 */
class PNegativeInfinity extends PObject<NegativeInfinity> {
  /**
   *
   */
  private constructor() {
    super(new PRecord({}), NegativeInfinity, `NegativeInfinity`);
  }

  /**
   *
   * @param data
   */
  public override pblueprint = (data: NegativeInfinity) => {
    assert(
      data instanceof NegativeInfinity,
      `PNegativeInfinity.pblueprint: expected NegativeInfinity, got ${data} (${typeof data})`,
    );
    return `NegativeInfinity`;
  };

  static ptype = new PNegativeInfinity();
  /**
   *
   */
  static override genPType(): PNegativeInfinity {
    return PNegativeInfinity.ptype;
  }
}

/**
 *
 */
export class Finite<Of> {
  public readonly typus = "Finite";
  /**
   *
   * @param of
   */
  constructor(
    public readonly of: Of, // TODO check if this works
  ) {}
}

/**
 *
 */
class PFinite<POf extends PData> extends PObject<Finite<PLifted<POf>>> {
  /**
   *
   * @param pof
   */
  constructor(public readonly pof: POf) {
    super(
      new PRecord({
        of: pof,
      }),
      Finite<PLifted<POf>>,
      `Finite`,
    );
  }

  /**
   *
   * @param data
   */
  public override pblueprint = (data: Finite<PLifted<POf>>) => {
    return {
      Finite: [this.pof.pblueprint(data.of)], // TODO correct?
    };
  };

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static override genPType<POf extends PData>(
    gen: Generators,
    maxDepth: bigint,
  ): PFinite<POf> {
    const pof: POf = gen.generate(maxDepth) as POf;
    return new PFinite<POf>(pof);
  }
}

/**
 *
 */
export class PositiveInfinity {
  public readonly typus = "PositiveInfinity";
  /**
   *
   */
  constructor() {}
}

/**
 *
 */
class PPositiveInfinity extends PObject<PositiveInfinity> {
  /**
   *
   */
  private constructor() {
    super(new PRecord({}), PositiveInfinity, `PositiveInfinity`);
  }

  /**
   *
   * @param data
   */
  public override pblueprint = (data: PositiveInfinity) => {
    assert(
      data instanceof PositiveInfinity,
      `PPositiveInfinity.pblueprint: expected PositiveInfinity, got ${data} (${typeof data})`,
    );
    return `PositiveInfinity`;
  };

  static ptype = new PPositiveInfinity();
  /**
   *
   */
  static override genPType(): PPositiveInfinity {
    return PPositiveInfinity.ptype;
  }
}

export type IntervalBoundType<Of> =
  | NegativeInfinity
  | Finite<Of>
  | PositiveInfinity;

/**
 *
 */
export class PIntervalBoundType<POf extends PData> extends PSum<
  IntervalBoundType<PLifted<POf>>
> {
  /**
   *
   * @param pof
   */
  constructor(public readonly pof: POf) {
    super([PNegativeInfinity.ptype, new PFinite(pof), PPositiveInfinity.ptype]);
  }

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static override genPType<POf extends PData>(
    gen: Generators,
    maxDepth: bigint,
  ): PIntervalBoundType<POf> {
    const pof: POf = gen.generate(maxDepth) as POf;
    return new PIntervalBoundType<POf>(pof);
  }
}

/**
 *
 */
export class IntervalBound<Of> {
  public readonly typus = "IntervalBound";
  /**
   *
   * @param boundType
   * @param isInclusive
   */
  constructor(
    public readonly boundType: IntervalBoundType<Of>,
    public readonly isInclusive: Bool, // to register a vector - TODO: what did he mean by this?
  ) {}

  /**
   *
   */
  public get maybeFinite(): Of | null {
    // todo isInclusive? (Not a priority rn)
    if (this.boundType instanceof Finite) {
      return this.boundType.of;
    } else {
      return null;
    }
  }
}

/**
 *
 */
export class PIntervalBound<POf extends PData> extends PObject<
  IntervalBound<PLifted<POf>>
> {
  /**
   *
   * @param pof
   */
  constructor(public readonly pof: POf) {
    super(
      new PRecord({
        boundType: new PIntervalBoundType(pof),
        isInclusive: PBool.ptype, // todo proper boolean type. And check if this works.
      }),
      IntervalBound<PLifted<POf>>,
      `IntervalBound`,
    );
  }

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static override genPType<POf extends PData>(
    gen: Generators,
    maxDepth: bigint,
  ): PIntervalBound<POf> {
    const pof: POf = gen.generate(maxDepth) as POf;
    return new PIntervalBound<POf>(pof);
  }
}

/**
 *
 */
export class Interval<Of> {
  public readonly typus = "Interval";
  /**
   *
   * @param lowerBound
   * @param upperBound
   */
  constructor(
    public readonly lowerBound: IntervalBound<Of>,
    public readonly upperBound: IntervalBound<Of>, // to register a vector
  ) {}

  /**
   *
   */
  public get from(): Of {
    assert(
      this.lowerBound.boundType instanceof Finite,
      `Interval.from: lower bound must be finite`,
    );
    return this.lowerBound.boundType.of;
  }

  /**
   *
   */
  public get to(): Of {
    assert(
      this.upperBound.boundType instanceof Finite,
      `Interval.to: upper bound must be finite`,
    );
    return this.upperBound.boundType.of;
  }

  // TODO why don't we get errors if we set wrong inputs here? instead of new True()
  /**
   *
   * @param from
   * @param to
   */
  static inclusive<Of>(from: Of, to: Of): Interval<Of> {
    return new Interval<Of>(
      new IntervalBound<Of>(new Finite(from), new True()),
      new IntervalBound<Of>(new Finite(to), new True()),
    );
  }

  /**
   *
   */
  static unbounded<Of>(): Interval<Of> {
    return new Interval<Of>(
      new IntervalBound<Of>(new NegativeInfinity(), new True()),
      new IntervalBound<Of>(new PositiveInfinity(), new True()),
    );
  }
}

/**
 *
 */
export class PInterval<POf extends PData> extends PObject<
  Interval<PLifted<POf>>
> {
  /**
   *
   * @param pof
   */
  constructor(public readonly pof: POf) {
    super(
      new PRecord({
        lowerBound: new PIntervalBound(pof),
        upperBound: new PIntervalBound(pof),
      }),
      Interval,
      `Interval`,
    );
  }

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static override genPType<POf extends PData>(
    gen: Generators,
    maxDepth: bigint,
  ): PInterval<POf> {
    const pof: POf = gen.generate(maxDepth) as POf;
    return new PInterval<POf>(pof);
  }
}
