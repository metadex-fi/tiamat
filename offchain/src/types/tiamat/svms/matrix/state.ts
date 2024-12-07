import { PList } from "../../../general/fundamental/container/list";
import { PObject } from "../../../general/fundamental/container/object";
import { PRecord } from "../../../general/fundamental/container/record";
import {
  TiamatParams,
  EigenValue,
  PTiamatParams,
  PEigenValue,
} from "../../tiamat";

/**
 *
 */
export class MatrixState {
  public readonly typus = "MatrixState";
  /**
   *
   * @param params
   * @param eigenValues
   */
  constructor(
    public readonly params: TiamatParams,
    public readonly eigenValues: Array<EigenValue>,
  ) {}
}

/**
 *
 */
export class PMatrixState extends PObject<MatrixState> {
  /**
   *
   */
  constructor() {
    super(
      new PRecord({
        params: PTiamatParams.ptype,
        eigenValues: new PList(PEigenValue.ptype),
      }),
      MatrixState,
      `MatrixState`,
    );
  }

  static ptype = new PMatrixState();
  /**
   *
   */
  static override genPType(): PMatrixState {
    return PMatrixState.ptype;
  }
}
