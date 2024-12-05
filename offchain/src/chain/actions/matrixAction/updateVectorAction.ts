import assert from "assert";
import { KeyHash } from "../../../types/general/derived/hash/keyHash";
import { PositiveValue } from "../../../types/general/derived/value/positiveValue";
import { EigenValue } from "../../../types/tiamat/tiamat";
import {
  MatrixAction,
  UpdateVector,
} from "../../../types/tiamat/svms/matrix/action";
import { MatrixState } from "../../../types/tiamat/svms/matrix/state";
import { TraceUtxo, Tx, TxId } from "../../../utils/wrappers";
import { Callback } from "../../state/callback";
import { MatrixUtxo } from "../../state/tiamatSvmUtxo";
import { UnhingedAction } from "../action";

/**
 *
 */
export class UpdateVectorAction implements UnhingedAction<MatrixUtxo, `owner`> {
  public readonly action: MatrixAction;
  public readonly newState: MatrixState;
  public readonly newValue: PositiveValue;
  /**
   *
   * @param matrixUtxo
   * @param vector
   * @param ip
   * @param port
   */
  constructor(
    public readonly matrixUtxo: MatrixUtxo,
    public readonly vector: KeyHash,
    public readonly ip: string,
    public readonly port: number,
  ) {
    console.log(`UpdateVectorAction: ${vector}, ${ip}, ${port}`);
    assert(matrixUtxo.svmDatum, `UpdateVector: no svmDatum in matrixUtxo`);

    const index = matrixUtxo.svmDatum.state.eigen_values.findIndex(
      (ev) => ev.vector.keyHash === this.vector.keyHash,
    );
    assert(index !== -1, `UpdateVector: vector not registered: ${this.vector}`);
    const oldState = matrixUtxo.svmDatum.state;
    const oldValue = matrixUtxo.svmValue;

    this.action = new MatrixAction(
      this.vector,
      new UpdateVector(ip, BigInt(port)),
    );

    const post = oldState.eigen_values.slice(index + 1);
    const eigenValue = oldState.eigen_values[index]!;
    const port_ = BigInt(port);
    assert(
      ip !== eigenValue.ip || port_ !== eigenValue.port,
      `UpdateVector: ip/port unchanged: ${ip}:${port}`,
    );
    const eigenValue_ = new EigenValue(
      eigenValue.start,
      eigenValue.end,
      eigenValue.vector,
      ip,
      port_,
    );
    const pre = oldState.eigen_values.slice(0, index);
    this.newState = new MatrixState(oldState.params, [
      ...pre,
      eigenValue_,
      ...post,
    ]);

    this.newValue = oldValue;
  }

  /**
   *
   * @param tx
   * @param ackCallback
   * @param nexusUtxo
   */
  public unhingedTx = (
    tx: Tx<`owner`>,
    // submitCallback: Callback<TxId>,
    ackCallback: Callback<TxId>,
    nexusUtxo: TraceUtxo,
  ): Tx<`owner`> => {
    console.log(`UpdateVectorAction.unhingedTx`);
    tx = this.matrixUtxo
      .revolvingTx(
        tx,
        //submitCallback,
        ackCallback,
        "unhinged",
        this.action,
        this.newState,
        this.newValue,
        nexusUtxo,
      )
      .addRequiredSigner(this.vector.toBlaze());
    return tx;
  };
}
