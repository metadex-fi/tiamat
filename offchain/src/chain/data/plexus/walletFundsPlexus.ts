import { Core } from "@blaze-cardano/sdk";
import { WalletFundsStem } from "../stem";
import { Trace } from "../../../utils/wrappers";
import { Wallet } from "../../state/wallet";
import { Plexus } from "../plexus";
import { WalletFunds } from "../zygote";
import { Sent } from "../../state/utxoSource";

/**
 *
 */
export class WalletFundsPlexus extends Plexus {
  public readonly walletFundsStem: WalletFundsStem;

  constructor(private readonly wallet: Wallet) {
    super(`${wallet.name} WalletFundsPlexus`);

    const senseWalletFunds = (
      walletFunds: Map<Core.AssetId, bigint>,
      _trace: Trace,
    ): Promise<WalletFunds> => {
      return Promise.resolve(new WalletFunds(walletFunds));
    };

    this.walletFundsStem = new WalletFundsStem(wallet, senseWalletFunds);
  }

  public myelinate = async (from: string[]): Promise<(string | Sent)[]> => {
    const from_ = [...from, `WalletFundsPlexus: ${this.wallet.name}`];
    return await this.walletFundsStem.myelinate(from_);
  };
}
