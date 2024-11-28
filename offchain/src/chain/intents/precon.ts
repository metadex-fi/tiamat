import { Core } from "@blaze-cardano/sdk";
import {
  Trace,
  TraceUtxo,
  Tx,
  TxCompleat,
  TxId,
  UtxoSet,
} from "../../utils/wrappers";
import { Sent } from "../state/utxoSource";
import assert from "assert";
import { TiamatContract } from "../state/tiamatContract";
import { Callback } from "../state/callback";
import { Ganglion } from "../data/ganglion";
import { PDappConfigT, PDappParamsT } from "../../types/tiamat/tiamat";
import { Zygote } from "../data/zygote";

/**
 * intermediate and final result of combining all precons
 */
export interface FixFoldPhase<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
> {
  readonly fixWallet: `ok` | `servitor` | `owner`; // the minimum wallet-tier required to fix the precons, if any
  readonly fixTx: (fixingTx: Tx) => Tx; // the tx-modifier to fix the precons
  readonly utxoChainers: ((utxos: UtxoSet) => {
    utxo: TraceUtxo;
    redeemer: Core.PlutusData | `coerce` | `supply` | `read`;
  }[])[]; // extra utxo-selectors for the subsequent action tx
  readonly divergentFixSubmit?: (
    fixingTx: Tx,
    contract: TiamatContract<DC, DP>,
    trace: Trace,
  ) => Promise<{
    fixTxCompleat: TxCompleat; // for chaining the action-tx
    submitFixTx: () => Promise<(string | Sent)[]>;
  }>; // if we need a non-standard tx submit function, i.e. for elections. Right now only a single one per fixing-tx supported.
}

/**
 * A precondition for some action.
 */
export abstract class Precon<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
  PriorT extends Zygote,
> {
  /**
   *
   * @param fixWallet
   * @param fixTx
   * @param isMetBy
   * @param chainUtxos
   */
  constructor(
    private readonly priorGanglion: Ganglion<any[], PriorT>,
    private readonly isMetBy: (prior: PriorT) => boolean, // whether it is met or not
    private readonly fixWallet: `servitor` | `owner`, // the minimum wallet-tier required to fix the precon
    private readonly fixTx: (
      fixingTx: Tx,
      prior: PriorT,
      ackCallback: Callback<TxId> | `no fix ACK`,
    ) => Tx, // the tx-modifier to fix the precon
    private readonly chainUtxos: (utxos: UtxoSet) => {
      utxo: TraceUtxo;
      redeemer: Core.PlutusData | `coerce` | `supply` | `read`;
    }[], // extra utxo-selectors for the subsequent action tx
    private readonly mkDivergentFixSubmit?: (prior: PriorT) => (
      fixingTx: Tx,
      contract: TiamatContract<DC, DP>,
      trace: Trace,
    ) => Promise<{
      fixTxCompleat: TxCompleat; // for chaining the action-tx
      submitFixTx: () => Promise<(string | Sent)[]>;
    }>, // if we need a non-standard tx submit function, i.e. for elections. Right now only a single one per fixing-tx supported.
  ) {}

  /**
   *
   * @param previous
   * @param prior
   * @returns
   */
  public fixFold = (
    previous: FixFoldPhase<DC, DP>,
    fixAckCallback: Callback<TxId> | `no fix ACK`,
  ): FixFoldPhase<DC, DP> => {
    const prior = this.priorGanglion.scion;
    assert(
      prior !== `virginal`,
      `Precon.fixFold: prior-ganglion still virginal`,
    );
    if (this.isMetBy(prior)) {
      return previous;
    } else {
      let divergentFixSubmit = previous.divergentFixSubmit;
      if (this.mkDivergentFixSubmit) {
        assert(
          divergentFixSubmit === undefined,
          `Precon.fixFold: divergentSubmit already set (multiple not supported rn, but nothing speaking against implementing it now)`,
        );
        divergentFixSubmit = this.mkDivergentFixSubmit(prior);
      }
      return {
        fixWallet: previous.fixWallet === `owner` ? `owner` : this.fixWallet,
        fixTx: (fixingBaseTx: Tx) => {
          return this.fixTx(
            previous.fixTx(fixingBaseTx),
            prior,
            fixAckCallback,
          );
        },
        utxoChainers: [...previous.utxoChainers, this.chainUtxos],
        divergentFixSubmit,
      };
    }
  };
}
