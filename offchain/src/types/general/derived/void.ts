import assert from "assert";
import { PObject } from "../fundamental/container/object";
import { PRecord } from "../fundamental/container/record";

/**
 *
 */
export class Void {
  public readonly typus = "Void";
  /**
   *
   */
  constructor() {}
}

/**
 *
 */
export class PVoid extends PObject<Void, undefined> {
  /**
   *
   */
  constructor() {
    super(new PRecord({}), Void, `Void`);
    this.setIndex(121); // Void := d87980 decodes to "tag(121): array(0)" aka "Constr 121 []"
  }

  /**
   *
   * @param data
   */
  public override pblueprint = (data: Void): undefined => {
    assert(
      data instanceof Void,
      `PVoid.pblueprint: expected Void, got ${data} (${typeof data})`,
    );
    return undefined;
  };

  static ptype = new PVoid();
  /**
   *
   */
  static override genPType(): PVoid {
    return PVoid.ptype;
  }
}
