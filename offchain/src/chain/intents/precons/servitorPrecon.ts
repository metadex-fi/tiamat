import { Core } from "@blaze-cardano/sdk";
import { Bech32Address, Tx, UtxoSet } from "../../../utils/wrappers";
import { Precon } from "../precon";
import assert from "assert";
import { txFees } from "../../../utils/constants";
import { Ganglion } from "../../data/ganglion";
import { Zygote } from "../../data/zygote";
import { PDappConfigT, PDappParamsT } from "../../../types/tiamat/tiamat";

export class WalletsFundsStatus implements Zygote {
  public readonly ownerFunds: Map<Core.AssetId, bigint>;
  public readonly servitorFunds: Map<Core.AssetId, bigint>;
  constructor(
    ownerFunds: Map<Core.AssetId, bigint>,
    servitorFunds: Map<Core.AssetId, bigint>,
  ) {
    this.ownerFunds = new Map(ownerFunds);
    this.servitorFunds = new Map(servitorFunds);
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
}

export class ServitorPrecon<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
> extends Precon<DC, DP, WalletsFundsStatus> {
  constructor(
    name: string,
    priorGanglion: Ganglion<any[], WalletsFundsStatus>,
    servitorAddress: Bech32Address,
    numTxFees: bigint, // how many txes to fund.
  ) {
    name = `${name} ServitorPrecon`;

    // check if servitor has enough ADA.
    const isMetBy = (prior: WalletsFundsStatus): boolean => {
      const servitorADA = prior.servitorFunds.get(`` as Core.AssetId) ?? 0n;
      return servitorADA >= numTxFees * txFees;
    };

    // funds to fund the servitor-wallet come from the owner-wallet, naturally.
    const fixWallet = `owner`;

    // send some ADA from the owner-wallet to the servitor-wallet.
    const fixTx = (tx: Tx, prior: WalletsFundsStatus): Tx => {
      const ownerADA = prior.ownerFunds.get(`` as Core.AssetId);
      assert(
        ownerADA && ownerADA >= (1n + numTxFees) * txFees,
        `${name}: not enough ADA to cover fees for 1 + ${numTxFees} txes: ${ownerADA} < ${
          (1n + numTxFees) * txFees
        }.\nOwner-funds: [${[...prior.ownerFunds.entries()].join(`, `)}]`,
      );
      return tx.payAssets(
        servitorAddress.blaze,
        new Core.Value(numTxFees * txFees),
      );
    };

    // given that the servitor-precon is being invoked here, we can assume
    // that the subsequent action payload tx has the servitor-wallet as base,
    // so we don't need to explicitly ensure the servitor-utxos are being chained
    // (that is handled by the regular chaining-mechanism).
    const chainUtxos = (_utxos: UtxoSet) => [];

    super(priorGanglion, isMetBy, fixWallet, fixTx, chainUtxos);
  }
}
