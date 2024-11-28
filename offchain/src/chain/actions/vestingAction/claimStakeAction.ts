import assert from "assert";
import { Asset } from "../../../types/general/derived/asset/asset";
import { Rational } from "../../../types/general/derived/rational";
import { PositiveValue } from "../../../types/general/derived/value/positiveValue";
import { Void } from "../../../types/general/derived/void";
import { VestingState } from "../../../types/tiamat/svms/vesting/state";
import { slotDurationMs, vestingMarginMs } from "../../../utils/constants";
import { max } from "../../../utils/generators";
import { TraceUtxo, Tx, TxId } from "../../../utils/wrappers";
import { Callback } from "../../state/callback";
import { VestingUtxo } from "../../state/tiamatSvmUtxo";
import { UnhingedAction, HaltingAction } from "../action";

const slotDurationMs_ = BigInt(slotDurationMs);

/**
 *
 */
export class ClaimStakeAction
  implements UnhingedAction<VestingUtxo>, HaltingAction<VestingUtxo>
{
  public readonly action = new Void();
  public readonly halt: boolean;
  public readonly newState?: VestingState;
  public readonly newValue?: PositiveValue;
  public readonly validFromMs: bigint;
  public readonly validUntilMs?: bigint;

  /**
   *
   * @param vestingUtxo
   * @param vestingRatio
   * @param eigenwert
   */
  constructor(
    public readonly vestingUtxo: VestingUtxo,
    public readonly vestingRatio: Rational,
    public readonly eigenwert: Asset,
  ) {
    const oldValue = vestingUtxo.svmValue;
    const oldState = vestingUtxo.svmDatum?.state;
    assert(oldState, `ClaimStakeAction: no state in vestingUtxo`);
    const oldTimeLock = oldState.time_lock;

    this.validFromMs = BigInt(Date.now());

    const elapsed = max(0n, this.validFromMs - oldTimeLock);
    const maxWithdraw = vestingRatio.timesIntFloor(elapsed);
    const balance = oldValue.amountOf(eigenwert);

    let withdrawing: bigint;
    if (maxWithdraw < balance) {
      this.halt = false;
      withdrawing = maxWithdraw;
      this.newValue = oldValue.clone;
      this.newValue.increaseAmountOf(eigenwert, -withdrawing);
      this.validUntilMs = this.validFromMs + BigInt(vestingMarginMs);
      // NOTE: Onchain is after all in ms
      const newTimeLock = this.validUntilMs + slotDurationMs_; //(BigInt(this.validTo) / 1000n) + 1n;

      this.newState = new VestingState(newTimeLock);
    } else {
      this.halt = true;
      withdrawing = balance;
    }
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
    console.log(`ClaimStakeAction.unhingedTx`);
    assert(!this.halt, `ClaimStakeAction.unhingedTx: halting`);
    assert(
      this.newState,
      `ClaimStakeAction.revolvingTx: newState is undefined`,
    );
    assert(
      this.newValue,
      `ClaimStakeAction.revolvingTx: newValue is undefined`,
    );
    assert(
      this.validUntilMs,
      `ClaimStakeAction.revolvingTx: validUntilMs is ${this.validUntilMs}`,
    );

    tx = this.vestingUtxo
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
      .setValidFromMs(this.validFromMs, slotDurationMs_, `up`)
      .setValidUntilMs(this.validUntilMs, slotDurationMs_, `down`);

    return tx;
  };

  /**
   *
   * @param tx
   * @param ackCallback
   */
  public haltingTx = (
    tx: Tx,
    // submitCallback: Callback<TxId>,
    ackCallback: Callback<TxId>,
  ): Tx => {
    console.log(`ClaimStakeAction.haltingTx`);
    assert(this.halt, `ClaimStakeAction.haltingTx: not halting`);
    assert(
      this.vestingUtxo.svmDatum,
      `ClaimStakeAction.haltingTx: no svmDatum in vestingUtxo`,
    );

    return this.vestingUtxo
      .haltingTx(
        tx,
        //submitCallback,
        ackCallback,
        this.action,
      )
      .setValidFromMs(this.validFromMs, slotDurationMs_, `up`);
  };
}
