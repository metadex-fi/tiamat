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
   * @param eigen_values
   */
  constructor(
    public readonly params: TiamatParams,
    public readonly eigen_values: Array<EigenValue>,
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
        eigen_values: new PList(PEigenValue.ptype),
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
