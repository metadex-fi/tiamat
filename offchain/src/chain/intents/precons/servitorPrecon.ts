import { Core } from "@blaze-cardano/sdk";
import { Bech32Address, Tx, TxId, UtxoSet } from "../../../utils/wrappers";
import { Precon } from "../precon";
import assert from "assert";
import {
  minNumTxFees,
  prefundNumTxFees,
  txFees,
} from "../../../utils/constants";
import { Ganglion } from "../../data/ganglion";
import { WalletFunds, Zygote } from "../../data/zygote";
import { PDappConfigT, PDappParamsT } from "../../../types/tiamat/tiamat";
import { min } from "../../../utils/generators";
import { f } from "../../../types/general/fundamental/type";
import { Callback } from "../../state/callback";
import { Wallet } from "../../state/wallet";

export class WalletsFundsStatus implements Zygote {
  public readonly ownerFunds: Map<Core.AssetId, bigint>;
  public readonly servitorFunds: Map<Core.AssetId, bigint>;
  constructor(
    ownerFunds: WalletFunds<`owner`>,
    servitorFunds: WalletFunds<`servitor`>,
  ) {
    this.ownerFunds = new Map(ownerFunds.funds);
    this.servitorFunds = new Map(servitorFunds.funds);
  }

  public equals = (other: WalletsFundsStatus): boolean => {
    if (this.ownerFunds.size !== other.ownerFunds.size) {
      return false;
    }
    for (const [assetID, amount] of this.ownerFunds) {
      if (other.ownerFunds.get(assetID) !== amount) {
        return false;
      }
    }
    if (this.servitorFunds.size !== other.servitorFunds.size) {
      return false;
    }
    for (const [assetID, amount] of this.servitorFunds) {
      if (other.servitorFunds.get(assetID) !== amount) {
        return false;
      }
    }
    return true;
  };

  public get ownerADA(): bigint {
    return this.ownerFunds.get(`` as Core.AssetId) ?? 0n;
  }
  public get servitorADA(): bigint {
    return this.servitorFunds.get(`` as Core.AssetId) ?? 0n;
  }

  public show = (tabs = ``): string => {
    const tf = `${tabs}${f}`;
    const tff = `${tf}${f}`;
    return `WalletsFundsStatus:\n${tf}ownerFunds:\n${[...this.ownerFunds.entries()].map(([assetID, amount]) => `${tff}"${assetID}": ${amount}`).join(`\n`)}\n${tf}servitorFunds:\n${[...this.servitorFunds.entries()].map(([assetID, amount]) => `${tff}"${assetID}": ${amount}`).join(`\n`)}`;
  };
}

export class ServitorPrecon<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
> extends Precon<DC, DP, WalletsFundsStatus> {
  constructor(
    name: string,
    priorGanglion: Ganglion<any[], WalletsFundsStatus>,
    servitorWallet: Wallet<`servitor`>,
    servitorAddress: Bech32Address,
  ) {
    name = `${name} ServitorPrecon`;

    // check if servitor has enough ADA for at least one action- and tipping-tx.
    // TODO could reduce this to 1 for unhinged txes.
    const isMetBy = (prior: WalletsFundsStatus): boolean => {
      const isMet = prior.servitorADA >= minNumTxFees * txFees;
      if (isMet) {
        console.log(`${name} is met by ${prior.show()}`);
      } else {
        console.log(`${name} is not met by ${prior.show()}`);
      }
      return isMet;
    };

    // funds to fund the servitor-wallet come from the owner-wallet, naturally.
    const fixWallet = `owner`;

    let fixTxAckCallback_: Callback<TxId>;
    const setFixTxId = (fixTxId: TxId) => {
      assert(
        fixTxAckCallback_,
        `ServitorPrecon.setFixTxId: fixTxAckCallback_ undefined`,
      );
      servitorWallet.subscribeAck(fixTxId, fixTxAckCallback_);
    };

    // send some ADA from the owner-wallet to the servitor-wallet.
    const fixTx = (
      tx: Tx<`owner`>,
      prior: WalletsFundsStatus,
      fixTxAckCallback: Callback<TxId>,
    ): Tx<`owner`> => {
      const ownerADA = prior.ownerFunds.get(`` as Core.AssetId) ?? 0n;
      const coveredNumTxFees = ownerADA / txFees - 1n; // -1n for the prefunding tx itself
      assert(
        coveredNumTxFees >= minNumTxFees,
        `${name}: not enough ADA to cover fees for 1 + ${minNumTxFees} txes: ${ownerADA} < ${
          (1n + minNumTxFees) * txFees
        }.\nOwner-funds: [${[...prior.ownerFunds.entries()].join(`, `)}]`,
      );

      fixTxAckCallback_ = fixTxAckCallback;

      const prefundNumTxFees_ = min(coveredNumTxFees, prefundNumTxFees);
      return tx.payAssets(
        servitorAddress.blaze,
        new Core.Value(prefundNumTxFees_ * txFees),
      );
    };

    // given that the servitor-precon is being invoked here, we can assume
    // that the subsequent action payload tx has the servitor-wallet as base,
    // so we don't need to explicitly ensure the servitor-utxos are being chained
    // (that is handled by the regular chaining-mechanism).
    const chainUtxos = (_utxos: UtxoSet) => [];

    super(priorGanglion, isMetBy, fixWallet, fixTx, chainUtxos, setFixTxId);
  }
}
