import { Core } from "@blaze-cardano/sdk";
import { Ganglion } from "../ganglion";
import { identityProcedure, WalletFundsStem } from "../stem";
import { Trace } from "../../../utils/wrappers";
import { Wallet } from "../../state/wallet";
import { Plexus } from "../plexus";
import { PDappConfigT, PDappParamsT } from "../../../types/tiamat/tiamat";
import { WalletFunds } from "../zygote";
import { Sent } from "../../state/utxoSource";

/**
 *
 */
export class WalletFundsPlexus<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
> extends Plexus {
  public readonly walletFundsGanglion: Ganglion<WalletFunds[], WalletFunds>;
  //@ts-ignore
  private readonly walletFundsStem: WalletFundsStem<DC, DP, WalletFunds>;

  constructor(private readonly wallet: Wallet) {
    super(`${wallet.name} WalletFundsPlexus`);
    this.walletFundsGanglion = new Ganglion<WalletFunds[], WalletFunds>(
      `${wallet.name} WalletFundsGanglion`,
      [], // no afferents for stem-ganglia
      identityProcedure,
    );

    const senseWalletFunds = (
      walletFunds: Map<Core.AssetId, bigint>,
      _trace: Trace,
    ): Promise<WalletFunds> => {
      return Promise.resolve(new WalletFunds(walletFunds));
    };

    this.walletFundsStem = new WalletFundsStem(
      wallet,
      this.walletFundsGanglion,
      senseWalletFunds,
    );
  }

  public myelinate = async (from: string[]): Promise<(string | Sent)[]> => {
    const from_ = [...from, `WalletFundsPlexus: ${this.wallet.name}`];
    return await this.walletFundsGanglion.myelinate(from_);
  };
}
