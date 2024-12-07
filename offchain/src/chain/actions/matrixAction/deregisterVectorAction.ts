import assert from "assert";
import { KeyHash } from "../../../types/general/derived/hash/keyHash";
import { PositiveValue } from "../../../types/general/derived/value/positiveValue";
import { EigenValue } from "../../../types/tiamat/tiamat";
import {
  DeregisterVector,
  MatrixAction,
} from "../../../types/tiamat/svms/matrix/action";
import { MatrixState } from "../../../types/tiamat/svms/matrix/state";
import { TraceUtxo, Tx, TxId } from "../../../utils/wrappers";
import { Callback } from "../../state/callback";
import { MatrixUtxo } from "../../state/tiamatSvmUtxo";
import { UnhingedAction } from "../action";

/**
 *
 */
export class DeregisterVectorAction
  implements UnhingedAction<MatrixUtxo, `owner`>
{
  public readonly action: MatrixAction;
  public readonly newState: MatrixState;
  public readonly newValue: PositiveValue;
  /**
   *
   * @param matrixUtxo
   * @param vector
   */
  constructor(
    public readonly matrixUtxo: MatrixUtxo,
    public readonly vector: KeyHash,
  ) {
    console.log(`DeregisterVectorAction: ${vector}`);
    assert(
      matrixUtxo.svmDatum,
      `DeregisterVectorAction: no svmDatum in matrixUtxo`,
    );

    const index = matrixUtxo.svmDatum.state.eigenValues.findIndex(
      (ev) => ev.vector.keyHash === this.vector.keyHash,
    );
    assert(
      index !== -1,
      `DeregisterVectorAction: vector not registered: ${this.vector}`,
    );

    const config = matrixUtxo.svmDatum.config;

    const oldState = matrixUtxo.svmDatum.state;
    const oldValue = matrixUtxo.svmValue;

    this.action = new MatrixAction(this.vector, new DeregisterVector());

    const eigenValue = oldState.eigenValues[index]!;
    const stakedAmount = eigenValue.end - eigenValue.start;

    const pre = oldState.eigenValues
      .slice(0, index)
      .map(
        (ev) =>
          new EigenValue(
            ev.start - stakedAmount,
            ev.end - stakedAmount,
            ev.vector,
            ev.ip,
            ev.port,
          ),
      );
    const post = oldState.eigenValues.slice(index + 1);

    this.newState = new MatrixState(oldState.params, [...pre, ...post]);

    this.newValue = oldValue.clone;
    this.newValue.addAmountOf(config.eigenwert, -stakedAmount);
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
    console.log(`DeregisterVectorAction.unhingedTx`);
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
