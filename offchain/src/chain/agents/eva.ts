import assert from "assert";
import { Core, Blaze, Provider, HotWallet } from "@blaze-cardano/sdk";
import { GenesisAction } from "../actions/genesisAction";
import { Asset } from "../../types/general/derived/asset/asset";
import { slotDurationMs } from "../../utils/constants";
import {
  PDappConfigT,
  PDappParamsT,
  TiamatParams,
} from "../../types/tiamat/tiamat";
import { P, Trace, UtxoSet, W } from "../../utils/wrappers";
import { Token } from "../../types/general/derived/asset/token";
import { PLifted } from "../../types/general/fundamental/type";

/**
 *
 */
export class Eva<DC extends PDappConfigT, DP extends PDappParamsT> {
  public blaze?: Blaze<P, W>;
  /**
   *
   * @param provider
   * @param networkId
   * @param chainStartTime
   * @param genesisAlignment
   * @param privateKey
   * @param eigenwert
   * @param initTiamatParams
   */
  constructor(
    public readonly provider: Provider,
    public readonly networkId: Core.NetworkId,
    public readonly chainStartTime: number,
    public readonly genesisAlignment: number, // for a clean delay. Ms. ideally multiple of blocklength
    public readonly privateKey: Core.Bip32PrivateKeyHex,
    public readonly eigenwert: Asset,
    public readonly dappConfig: PLifted<DC>,
    public readonly initDappParams: PLifted<DP>,
    public readonly initTiamatParams: TiamatParams,
    public readonly pdappConfig: DC,
    public readonly pdappParams: DP,
  ) {
    // if (provider instanceof Core.Emulator) {
    //   this.genesisTime = provider.genesisTime;
    // }
  }

  /**
   *
   */
  public async init(): Promise<void> {
    const wallet = await HotWallet.fromMasterkey(
      this.privateKey,
      this.provider,
    );
    this.blaze = await Blaze.from(this.provider, wallet);
    // this.blaze.name = 'Eva';
  }

  /**
   *
   */
  public async genesis(): Promise<{
    nexusID: Token;
    matrixID: Token;
  }> {
    assert(this.blaze, "Eva not initialized");

    const timeElapsed = Date.now() - this.chainStartTime;
    const firstCycleFromMs =
      this.chainStartTime +
      this.genesisAlignment * Math.ceil(timeElapsed / this.genesisAlignment);

    console.log(
      `First cycle starts at time ${firstCycleFromMs} and slot ${
        Number(firstCycleFromMs) / slotDurationMs
      }`,
    );
    assert(
      firstCycleFromMs >= this.chainStartTime,
      `Genesis time is in the past by ${
        this.chainStartTime - Number(firstCycleFromMs)
      }ms: ${firstCycleFromMs} < ${this.chainStartTime}`,
    );

    const genesisAction = new GenesisAction(
      this.blaze,
      this.networkId,
      this.eigenwert,
      this.dappConfig,
      this.initDappParams,
      this.initTiamatParams,
      BigInt(firstCycleFromMs),
      this.pdappConfig,
      this.pdappParams,
    );

    const walletUtxos = UtxoSet.fromList(
      (await this.blaze.wallet.getUnspentOutputs()).map((core) => {
        return {
          core,
          trace: Trace.source(`INPUT`, `Eva.genesis.wallet`),
        };
      }),
    );
    console.log(`Wallet utxos: ${walletUtxos.size}`);

    const genesisChain = await genesisAction.genesisChain(walletUtxos);

    const genesisTxes = await Promise.all(
      genesisChain.transactions.map((tx) => tx.sign()),
    );

    for (const tx of genesisTxes) {
      const txId = await this.blaze.wallet.postTransaction(tx.tx);
      console.log(`Submitted tx: ${txId}`);
    }

    console.log("Genesis complete");

    return {
      nexusID: genesisChain.nexusID,
      matrixID: genesisChain.matrixID,
    };
  }
}
