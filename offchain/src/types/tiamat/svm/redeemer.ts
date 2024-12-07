import { Generators } from "../../../utils/generators";
import { PObject } from "../../general/fundamental/container/object";
import { PRecord } from "../../general/fundamental/container/record";
import { PSum } from "../../general/fundamental/container/sum";
import { PData, PLifted } from "../../general/fundamental/type";

/**
 *
 */
export class Start {
  public readonly typus = "Start";
  /**
   *
   */
  constructor() {}
}

/**
 *
 */
class PStart extends PObject<Start> {
  /**
   *
   */
  private constructor() {
    super(new PRecord({}), Start, `Start`);
  }

  static ptype = new PStart();
  /**
   *
   */
  static override genPType(): PStart {
    return PStart.ptype;
  }
}

// export class Unhinged<Action> {
//   constructor(
//     public readonly action: Action,
//   ) {}
// }

// class PUnhinged<PAction extends PData>
//   extends PObject<Unhinged<PLifted<PAction>>> {
//   constructor(
//     public readonly paction: PAction,
//   ) {
//     super(
//       new PRecord({
//         "action": paction,
//       }),
//       Unhinged<PLifted<PAction>>,
//     );
//   }

//   static override genPType<PAction extends PData>(
//     gen: Generators,
//     maxDepth: bigint,
//   ): PUnhinged<PAction> {
//     const paction = gen.generate(maxDepth) as PAction;
//     return new PUnhinged<PAction>(paction);
//   }
// }

/**
 *
 */
export class Revolve<Action> {
  public readonly typus = "Revolve";
  /**
   *
   * @param action
   */
  constructor(public readonly action: Action) {}
}

/**
 *
 */
class PRevolve<PAction extends PData> extends PObject<
  Revolve<PLifted<PAction>>
> {
  /**
   *
   * @param paction
   */
  constructor(public readonly paction: PAction) {
    super(
      new PRecord({
        action: paction,
      }),
      Revolve<PLifted<PAction>>,
      `Revolve`,
    );
  }

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static override genPType<PAction extends PData>(
    gen: Generators,
    maxDepth: bigint,
  ): PRevolve<PAction> {
    const paction = gen.generate(maxDepth) as PAction;
    return new PRevolve<PAction>(paction);
  }
}

/**
 *
 */
export class Halt<Action> {
  public readonly typus = "Halt";
  /**
   *
   * @param action
   */
  constructor(public readonly action: Action) {}
}

/**
 *
 */
class PHalt<PAction extends PData> extends PObject<Halt<PLifted<PAction>>> {
  /**
   *
   * @param paction
   */
  constructor(public readonly paction: PAction) {
    super(
      new PRecord({
        action: paction,
      }),
      Halt<PLifted<PAction>>,
      `Halt`,
    );
  }

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static override genPType<PAction extends PData>(
    gen: Generators,
    maxDepth: bigint,
  ): PHalt<PAction> {
    const paction = gen.generate(maxDepth) as PAction;
    return new PHalt<PAction>(paction);
  }
}

/**
 *
 */
export class Wipe {
  public readonly typus = "Wipe";
  /**
   *
   */
  constructor() {}
}

/**
 *
 */
class PWipe extends PObject<Wipe> {
  /**
   *
   */
  private constructor() {
    super(new PRecord({}), Wipe, `Wipe`);
  }

  static ptype = new PWipe();
  /**
   *
   */
  static override genPType(): PWipe {
    return PWipe.ptype;
  }
}

export type SvmRedeemer<Action> =
  // | Unhinged<Action>
  Revolve<Action> | Halt<Action> | Wipe | Start;

/**
 *
 */
export class PSvmRedeemer<PAction extends PData> extends PSum<
  [Revolve<PLifted<PAction>>, Halt<PLifted<PAction>>, Wipe, Start]
> {
  /**
   *
   * @param paction
   */
  constructor(public readonly paction: PAction) {
    super([
      // new PUnhinged(paction),
      new PRevolve(paction),
      new PHalt(paction),
      PWipe.ptype,
      PStart.ptype,
    ]);
  }

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static override genPType<PAction extends PData>(
    gen: Generators,
    maxDepth: bigint,
  ): PSvmRedeemer<PAction> {
    const paction: PAction = gen.generate(maxDepth) as PAction;
    return new PSvmRedeemer<PAction>(paction);
  }
}
