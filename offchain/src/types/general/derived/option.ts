import assert from "assert";
import { Generators } from "../../../utils/generators";
import { PObject } from "../fundamental/container/object";
import { PRecord } from "../fundamental/container/record";
import { PSum } from "../fundamental/container/sum";
import { f, PData, PLifted } from "../fundamental/type";

/**
 *
 */
export class Some<Of> {
  public readonly typus = "Some";
  /**
   *
   * @param of
   */
  constructor(
    public readonly of: Of, // TODO check if this works
  ) {}

  /**
   *
   * @param tabs
   */
  public show(tabs = ``): string {
    const tf = tabs + f;
    // @ts-ignore FIXME
    return `Some ${this.of.show(tf)}`;
  }
}

/**
 *
 */
class PSome<POf extends PData> extends PObject<Some<PLifted<POf>>> {
  /**
   *
   * @param pof
   */
  constructor(public readonly pof: POf) {
    super(
      new PRecord({
        of: pof,
      }),
      Some<PLifted<POf>>,
      `Some`,
    );
  }

  // /**
  //  *
  //  * @param data
  //  */
  // public override pblueprint = (data: Some<PLifted<POf>>) => {
  //   return this.pof.pblueprint(data.of);
  // };

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static override genPType<POf extends PData>(
    gen: Generators,
    maxDepth: bigint,
  ): PSome<POf> {
    const pof: POf = gen.generate(maxDepth) as POf;
    return new PSome<POf>(pof);
  }
}

/**
 *
 */
export class None {
  public readonly typus = "None";
  /**
   *
   */
  constructor() {}

  /**
   *
   * @param _tabs
   */
  public show(_tabs = ``): string {
    return "None";
  }
}

/**
 *
 */
class PNone extends PObject<None, `None`> {
  /**
   *
   */
  private constructor() {
    super(new PRecord({}), None, `None`);
  }

  // /**
  //  *
  //  * @param data
  //  */
  // public override pblueprint = (data: None): PBlueprint => {
  //   assert(
  //     data.typus === "None",
  //     `PNone.pblueprint: expected None, got ${data}`,
  //   );
  //   return null;
  // };

  static ptype = new PNone();
  /**
   *
   */
  static override genPType(): PNone {
    return PNone.ptype;
  }
}

export type Option<Of> = Some<Of> | None;

/**
 *
 */
export class POption<POf extends PData> extends PSum<
  [Some<PLifted<POf>>, None]
> {
  /**
   *
   * @param pof
   */
  constructor(public readonly pof: POf) {
    super([new PSome(pof), PNone.ptype]);
  }

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static override genPType<POf extends PData>(
    gen: Generators,
    maxDepth: bigint,
  ): POption<POf> {
    const pof: POf = gen.generate(maxDepth) as POf;
    return new POption<POf>(pof);
  }
}
