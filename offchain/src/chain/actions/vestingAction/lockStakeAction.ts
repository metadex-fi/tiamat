import assert from "assert";
import { Asset } from "../../../types/general/derived/asset/asset";
import { KeyHash } from "../../../types/general/derived/hash/keyHash";
import { PositiveValue } from "../../../types/general/derived/value/positiveValue";
import { VestingConfig } from "../../../types/tiamat/svms/vesting/config";
import { VestingState } from "../../../types/tiamat/svms/vesting/state";
import { slotDurationMs, vestingMarginMs } from "../../../utils/constants";
import { Tx, TxId, UtxoSet } from "../../../utils/wrappers";
import { Callback } from "../../state/callback";
import { TiamatContract } from "../../state/tiamatContract";
import { VestingUtxo } from "../../state/tiamatSvmUtxo";
import { StartingAction } from "../action";
import { PDappConfigT, PDappParamsT } from "../../../types/tiamat/tiamat";

/**
 *
 */
export class LockStakeAction<DC extends PDappConfigT, DP extends PDappParamsT>
  implements StartingAction<DC, DP, VestingUtxo>
{
  /**
   *
   * @param contract
   * @param owner
   * @param eigenwert
   * @param stake
   */
  constructor(
    public readonly contract: TiamatContract<DC, DP>,
    public readonly owner: KeyHash,
    public readonly eigenwert: Asset,
    public readonly stake: bigint,
  ) {}

  /**
   *
   * @param tx
   * @param ackCallback
   * @param seedUtxos
   */
  public startingTx = (
    tx: Tx,
    // submitCallback: Callback<TxId>,
    ackCallback: Callback<TxId>,
    seedUtxos: UtxoSet,
  ): Tx => {
    console.log(`LockStakeAction.startingTx`);
    assert(seedUtxos.size, `LockStakeAction: ${seedUtxos.size} < 1 utxos`);
    seedUtxos = seedUtxos.clone();
    const vestingSeed = seedUtxos.removeHead();

    const config = new VestingConfig(this.owner);

    const validUntilMs = BigInt(Date.now() + vestingMarginMs);
    // NOTE: Onchain is after all in ms
    const newState = new VestingState(validUntilMs);

    const newValue = PositiveValue.singleton(this.eigenwert, this.stake);
    const vestingUtxo = this.contract.vestings.start(
      vestingSeed,
      config,
      newState,
      newValue,
    );

    tx = vestingUtxo
      .startingTx(
        tx,
        //submitCallback,
        ackCallback,
        seedUtxos,
      )
      .setValidUntilMs(validUntilMs, BigInt(slotDurationMs), `down`);

    return tx;
  };
}
