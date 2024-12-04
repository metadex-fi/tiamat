import { Ganglion } from "../ganglion";
import { WalletUtxosStem } from "../stem";
import { Trace, UtxoSet } from "../../../utils/wrappers";
import { Wallet } from "../../state/wallet";
import { WalletUtxos } from "../zygote";
import { Plexus } from "../plexus";
import { Result } from "../../state/callback";

export type WalletUtxosGanglion = Ganglion<WalletUtxos[], WalletUtxos>;

/**
 *
 */
export class WalletUtxosPlexus extends Plexus {
  public readonly walletUtxosStem: WalletUtxosStem;

  constructor(wallet: Wallet) {
    super(`${wallet.name} WalletUtxosPlexus`);

    const senseWalletUtxos = (
      walletUtxos: UtxoSet,
      _trace: Trace,
    ): Promise<WalletUtxos> => {
      return Promise.resolve(new WalletUtxos(walletUtxos));
    };

    this.walletUtxosStem = new WalletUtxosStem(wallet, senseWalletUtxos);
  }
  public myelinate = async (from: string[]): Promise<Result[]> => {
    const from_ = [...from, `WalletUtxosPlexus`];
    return await this.walletUtxosStem.myelinate(from_);
  };
}
