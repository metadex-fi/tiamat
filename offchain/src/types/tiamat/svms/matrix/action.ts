import { KeyHash, PKeyHash } from "../../../general/derived/hash/keyHash";
import { PObject } from "../../../general/fundamental/container/object";
import { PRecord } from "../../../general/fundamental/container/record";
import { PSum } from "../../../general/fundamental/container/sum";
import { PInteger } from "../../../general/fundamental/primitive/integer";
import { PString } from "../../../general/fundamental/primitive/string";

/**
 *
 */
export class RegisterVector {
  public readonly typus = "RegisterVector";
  /**
   *
   * @param ip
   * @param port
   */
  constructor(
    public readonly ip: string,
    public readonly port: bigint,
  ) {}
}

/**
 *
 */
class PRegisterVector extends PObject<RegisterVector> {
  /**
   *
   */
  private constructor() {
    super(
      new PRecord({
        ip: PString.ptype,
        port: PInteger.ptype,
      }),
      RegisterVector,
      `RegisterVector`,
    );
  }

  static ptype = new PRegisterVector();
  /**
   *
   */
  static override genPType(): PRegisterVector {
    return PRegisterVector.ptype;
  }
}

/**
 *
 */
export class DeregisterVector {
  public readonly typus = "DeregisterVector";
  /**
   *
   */
  constructor() {}
}

/**
 *
 */
class PDeregisterVector extends PObject<DeregisterVector, `DeregisterVector`> {
  /**
   *
   */
  private constructor() {
    super(new PRecord({}), DeregisterVector, `DeregisterVector`);
  }

  static ptype = new PDeregisterVector();
  /**
   *
   */
  static override genPType(): PDeregisterVector {
    return PDeregisterVector.ptype;
  }
}

/**
 *
 */
export class ChangeStake {
  public readonly typus = "ChangeStake";
  /**
   *
   */
  constructor() {}
}

/**
 *
 */
class PChangeStake extends PObject<ChangeStake, `ChangeStake`> {
  /**
   *
   */
  private constructor() {
    super(new PRecord({}), ChangeStake, `ChangeStake`);
  }

  static ptype = new PChangeStake();
  /**
   *
   */
  static override genPType(): PChangeStake {
    return PChangeStake.ptype;
  }
}

/**
 *
 */
export class UpdateVector {
  public readonly typus = "UpdateVector";
  /**
   *
   * @param ip
   * @param port
   */
  constructor(
    public readonly ip: string,
    public readonly port: bigint,
  ) {}
}

/**
 *
 */
class PUpdateVector extends PObject<UpdateVector> {
  /**
   *
   */
  private constructor() {
    super(
      new PRecord({
        ip: PString.ptype,
        port: PInteger.ptype,
      }),
      UpdateVector,
      `UpdateVector`,
    );
  }

  static ptype = new PUpdateVector();
  /**
   *
   */
  static override genPType(): PUpdateVector {
    return PUpdateVector.ptype;
  }
}

/**
 *
 */
export class ChangeProtocolParams {
  public readonly typus = "ChangeProtocolParams";
  /**
   *
   */
  constructor() {}
}

/**
 *
 */
class PChangeProtocolParams extends PObject<
  ChangeProtocolParams,
  `ChangeProtocolParams`
> {
  /**
   *
   */
  private constructor() {
    super(new PRecord({}), ChangeProtocolParams, `ChangeProtocolParams`);
  }

  static ptype = new PChangeProtocolParams();
  /**
   *
   */
  static override genPType(): PChangeProtocolParams {
    return PChangeProtocolParams.ptype;
  }
}

export type MatrixActionType =
  | RegisterVector
  | DeregisterVector
  | ChangeStake
  | UpdateVector
  | ChangeProtocolParams;

/**
 *
 */
export class PMatrixActionType extends PSum<
  [
    RegisterVector,
    DeregisterVector,
    ChangeStake,
    UpdateVector,
    ChangeProtocolParams,
  ]
> {
  /**
   *
   */
  private constructor() {
    super([
      PRegisterVector.ptype,
      PDeregisterVector.ptype,
      PChangeStake.ptype,
      PUpdateVector.ptype,
      PChangeProtocolParams.ptype,
    ]);
  }

  static ptype = new PMatrixActionType();
  /**
   *
   */
  static override genPType(): PMatrixActionType {
    return PMatrixActionType.ptype;
  }
}

/**
 *
 */
export class MatrixAction {
  public readonly typus = "MatrixAction";
  /**
   *
   * @param vector
   * @param action
   */
  constructor(
    public readonly vector: KeyHash,
    public readonly action: MatrixActionType,
  ) {}
}

/**
 *
 */
export class PMatrixAction extends PObject<MatrixAction> {
  /**
   *
   */
  constructor() {
    super(
      new PRecord({
        vector: PKeyHash.ptype,
        action: PMatrixActionType.ptype,
      }),
      MatrixAction,
      `MatrixAction`,
    );
  }

  static ptype = new PMatrixAction();
  /**
   *
   */
  static override genPType(): PMatrixAction {
    return PMatrixAction.ptype;
  }
}
