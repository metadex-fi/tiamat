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
  RegisterVector,
} from "../../../types/tiamat/svms/matrix/action";
import { MatrixState } from "../../../types/tiamat/svms/matrix/state";
import { TraceUtxo, Tx, TxId } from "../../../utils/wrappers";
import { Callback } from "../../state/callback";
import { MatrixUtxo } from "../../state/tiamatSvmUtxo";
import { UnhingedAction } from "../action";

/**
 *
 */
export class RegisterVectorAction<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
> implements UnhingedAction<MatrixUtxo>
{
  public readonly action: MatrixAction;
  public readonly newState: MatrixState;
  public readonly newValue: PositiveValue;
  /**
   *
   * @param matrixUtxo
   * @param vector
   * @param ip
   * @param port
   * @param stakedAmount
   */
  constructor(
    public readonly matrixUtxo: MatrixUtxo,
    public readonly vector: KeyHash,
    public readonly ip: string,
    public readonly port: number,
    public readonly stakedAmount: bigint,
  ) {
    console.log(`RegisterVector: ${vector}. Staked: ${stakedAmount}`);
    assert(
      stakedAmount > 0,
      `RegisterVector: stakedAmount must be positive, got ${stakedAmount}`,
    );
    assert(matrixUtxo.svmDatum, `RegisterVector: no svmDatum in matrixUtxo`);
    assert(
      matrixUtxo.svmDatum.state.eigen_values.every(
        (ev) => ev.vector.keyHash !== vector.keyHash,
      ),
      `RegisterVector: vector already registered: ${vector}`,
    );

    const config = matrixUtxo.svmDatum.config;

    const oldState = matrixUtxo.svmDatum.state;
    const oldValue = matrixUtxo.svmValue;

    this.action = new MatrixAction(
      this.vector,
      new RegisterVector(this.ip, BigInt(this.port)),
    );

    const start =
      oldState.eigen_values.length > 0
        ? oldState.eigen_values[0]!.end + 1n
        : 0n;
    const end = start + this.stakedAmount;
    const eigenValue = new EigenValue(
      start,
      end,
      this.vector,
      this.ip,
      BigInt(this.port),
    );
    this.newState = new MatrixState(oldState.params, [
      eigenValue,
      ...oldState.eigen_values,
    ]);

    this.newValue = oldValue.clone;
    this.newValue.addAmountOf(config.eigenwert, this.stakedAmount);
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
    console.log(`RegisterVectorAction.unhingedTx`);
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
