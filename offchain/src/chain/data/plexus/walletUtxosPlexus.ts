import { Ganglion } from "../ganglion";
import { identityProcedure, WalletUtxosStem } from "../stem";
import { Trace, UtxoSet } from "../../../utils/wrappers";
import { Wallet } from "../../state/wallet";
import { WalletUtxos } from "../zygote";
import { Plexus } from "../plexus";
import { PDappConfigT, PDappParamsT } from "../../../types/tiamat/tiamat";
import { Sent } from "../../state/utxoSource";

export type WalletUtxosGanglion = Ganglion<WalletUtxos[], WalletUtxos>;

/**
 *
 */
export class WalletUtxosPlexus<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
> extends Plexus {
  public readonly walletUtxosGanglion: WalletUtxosGanglion;
  //@ts-ignore
  private readonly walletUtxosStem: WalletUtxosStem<DC, DP, WalletUtxos>;

  constructor(wallet: Wallet) {
    super(`${wallet.name} WalletUtxosPlexus`);
    this.walletUtxosGanglion = new Ganglion<WalletUtxos[], WalletUtxos>(
      `${wallet.name} WalletUtxosGanglion`,
      [], // no afferents for stem-ganglia
      identityProcedure,
    );

    const senseWalletUtxos = (
      walletUtxos: UtxoSet,
      _trace: Trace,
    ): Promise<WalletUtxos> => {
      return Promise.resolve(new WalletUtxos(walletUtxos));
    };

    this.walletUtxosStem = new WalletUtxosStem(
      wallet,
      this.walletUtxosGanglion,
      senseWalletUtxos,
    );
  }
  public myelinate = async (from: string[]): Promise<(string | Sent)[]> => {
    const from_ = [...from, `WalletUtxosPlexus`];
    return await this.walletUtxosGanglion.myelinate(from_);
  };
}
