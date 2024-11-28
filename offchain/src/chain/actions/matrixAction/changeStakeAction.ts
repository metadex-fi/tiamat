import assert from "assert";
import { KeyHash } from "../../../types/general/derived/hash/keyHash";
import { PositiveValue } from "../../../types/general/derived/value/positiveValue";
import {
  EigenValue,
  PDappConfigT,
  PDappParamsT,
} from "../../../types/tiamat/tiamat";
import {
  MatrixAction,
  ChangeStake,
} from "../../../types/tiamat/svms/matrix/action";
import { MatrixState } from "../../../types/tiamat/svms/matrix/state";
import { TraceUtxo, Tx, TxId } from "../../../utils/wrappers";
import { Callback } from "../../state/callback";
import { MatrixUtxo } from "../../state/tiamatSvmUtxo";
import { UnhingedAction } from "../action";

// TODO continue adjusting
/**
 *
 */
export class ChangeStakeAction implements UnhingedAction<MatrixUtxo> {
  public readonly action: MatrixAction;
  public readonly newState: MatrixState;
  public readonly newValue: PositiveValue;
  /**
   *
   * @param matrixUtxo
   * @param vector
   * @param deposited
   */
  constructor(
    public readonly matrixUtxo: MatrixUtxo,
    public readonly vector: KeyHash,
    public readonly deposited: bigint,
  ) {
    console.log(`ChangeStakeAction: ${deposited}`);
    assert(matrixUtxo.svmDatum, `ChangeStakeAction: no svmDatum in matrixUtxo`);

    const index = matrixUtxo.svmDatum.state.eigen_values.findIndex(
      (ev) => ev.vector.keyHash === this.vector.keyHash,
    );
    assert(
      index !== -1,
      `ChangeStakeAction: vector not registered: ${this.vector}`,
    );

    const config = matrixUtxo.svmDatum.config;

    const oldState = matrixUtxo.svmDatum.state;
    const oldValue = matrixUtxo.svmValue;

    this.action = new MatrixAction(this.vector, new ChangeStake());

    const eigenValue = oldState.eigen_values[index]!;
    const stakedAmount = eigenValue.end - eigenValue.start;
    assert(
      -deposited < stakedAmount,
      `ChangeStakeAction: not enough staked: ${-deposited} >= ${stakedAmount}`,
    );

    const pre = oldState.eigen_values
      .slice(0, index)
      .map(
        (ev) =>
          new EigenValue(
            ev.start + deposited,
            ev.end + deposited,
            ev.vector,
            ev.ip,
            ev.port,
          ),
      );
    const eigenValue_ = new EigenValue(
      eigenValue.start,
      eigenValue.end + deposited,
      eigenValue.vector,
      eigenValue.ip,
      eigenValue.port,
    );
    const post = oldState.eigen_values.slice(index + 1);

    this.newState = new MatrixState(oldState.params, [
      ...pre,
      eigenValue_,
      ...post,
    ]);

    this.newValue = oldValue.clone;
    this.newValue.addAmountOf(config.eigenwert, deposited);
  }

  /**
   *
   * @param tx
   * @param ackCallback
   * @param nexusUtxo
   */
  public unhingedTx = (
    tx: Tx,
    // submitCallback: Callback<TxId>,
    ackCallback: Callback<TxId>,
    nexusUtxo: TraceUtxo,
  ): Tx => {
    console.log(`ChangeStakeAction.unhingedTx`);
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
