import { Core } from "@blaze-cardano/sdk";
import { WalletFundsStem } from "../stem";
import { Trace } from "../../../utils/wrappers";
import { Wallet } from "../../state/wallet";
import { Plexus } from "../plexus";
import { WalletFunds } from "../zygote";
import { Result } from "../../state/callback";

/**
 *
 */
export class WalletFundsPlexus<WT extends `servitor` | `owner`> extends Plexus {
  public readonly walletFundsStem: WalletFundsStem<WT>;

  constructor(private readonly wallet: Wallet<WT>) {
    super(`${wallet.name} WalletFundsPlexus`);

    const senseWalletFunds = (
      walletFunds: Map<Core.AssetId, bigint>,
      _trace: Trace,
    ): Promise<WalletFunds<WT>> => {
      return Promise.resolve(new WalletFunds(wallet.type, walletFunds));
    };

    this.walletFundsStem = new WalletFundsStem(wallet, senseWalletFunds);
  }

  public myelinate = async (from: string[]): Promise<Result[]> => {
    const from_ = [...from, `WalletFundsPlexus: ${this.wallet.name}`];
    return await this.walletFundsStem.myelinate(from_);
  };
}
