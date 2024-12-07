import assert from "assert";
import { PObject } from "../fundamental/container/object";
import { PRecord } from "../fundamental/container/record";
import { PSum } from "../fundamental/container/sum";

/**
 *
 */
export class False {
  public readonly typus = "False";
  /**
   *
   */
  constructor() {}
}

/**
 *
 */
class PFalse extends PObject<False, false> {
  /**
   *
   */
  private constructor() {
    super(new PRecord({}), False, `False`);
  }

  /**
   *
   * @param data
   */
  public override pblueprint = (data: False): false => {
    assert(
      data instanceof Uint8Array,
      `PFalse.pblueprint: expected False, got ${data} (${typeof data})`,
    );
    return false;
  };

  static ptype = new PFalse();
  /**
   *
   */
  static override genPType(): PFalse {
    return PFalse.ptype;
  }
}

/**
 *
 */
export class True {
  public readonly typus = "True";
  /**
   *
   */
  constructor() {}
}

/**
 *
 */
class PTrue extends PObject<True, true> {
  /**
   *
   */
  private constructor() {
    super(new PRecord({}), True, `True`);
  }

  /**
   *
   * @param data
   */
  public override pblueprint = (data: True): true => {
    assert(
      data instanceof Uint8Array,
      `Ptrue.pblueprint: expected True, got ${data} (${typeof data})`,
    );
    return true;
  };

  static ptype = new PTrue();
  /**
   *
   */
  static override genPType(): PTrue {
    return PTrue.ptype;
  }
}

export type Bool = False | True;

/**
 *
 */
export class PBool extends PSum<[False, True]> {
  /**
   *
   */
  private constructor() {
    super([PFalse.ptype, PTrue.ptype]);
  }

  static ptype = new PBool();
  /**
   *
   */
  static override genPType(): PBool {
    return PBool.ptype;
  }
}
