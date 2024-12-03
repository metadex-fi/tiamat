import { Provider, Blockfrost } from "@blaze-cardano/query";
import {
  Core,
  Wallet as BlazeWallet,
  HotWallet,
  Blaze,
} from "@blaze-cardano/sdk";
import assert from "assert";
import { Wallet } from "../state/wallet";
import { SocketClient } from "./socketClient";
import { Sent, UtxoSource } from "../state/utxoSource";
import { Token } from "../../types/general/derived/asset/token";
import { Bech32Address, UtxoSet, Trace, Tx, P, W } from "../../utils/wrappers";
import { TiamatContract } from "../state/tiamatContract";
import { errorTimeoutMs, numTxFees } from "../../utils/constants";
import { WalletFundsPlexus } from "../data/plexus/walletFundsPlexus";
import { ServitorPreconPlexus } from "../data/plexus/servitorPreconPlexus";
import { PDappConfigT, PDappParamsT } from "../../types/tiamat/tiamat";
import { Semaphore } from "./semaphore";
import { Effector } from "../data/effector";
import { Callback } from "../state/callback";
import { BlockHeight } from "../data/zygote";
import { ElectionData } from "../state/electionData";
import { TiamatCortex } from "../state/tiamatCortex";

type MkContractT<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
  CT extends TiamatContract<DC, DP>,
> = (
  name: string,
  networkId: Core.NetworkId,
  utxoSource: UtxoSource,
  nexusID: Token,
  matrixID: Token,
  matrixNexusTolerance: number,
  pdappConfig: DC,
  pdappParams: DP,
) => CT;

type MkUserT<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
  CT extends TiamatContract<DC, DP>,
  UT extends TiamatUser<DC, DP, CT>,
  WT extends BlazeWallet,
> = (
  name: string,
  contract: CT,
  socketClient: SocketClient,
  blockfrost: Provider,
  ownerBlaze: Blaze<Provider, WT>,
  servitorBlaze: Blaze<Provider, HotWallet>,
  servitorAddress: Bech32Address,
) => UT;

type AsyncMkUserT<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
  CT extends TiamatContract<DC, DP>,
  UT extends TiamatUser<DC, DP, CT>,
  WT extends BlazeWallet,
> = (
  name: string,
  socketClient: SocketClient,
  utxoSource: UtxoSource,
  networkId: Core.NetworkId,
  blockfrost: Provider,
  ownerBlaze: Blaze<Provider, WT>,
  servitorBlaze: Blaze<Provider, HotWallet>,
  nexusID: Token,
  matrixID: Token,
  pdappConfig: DC,
  pdappParams: DP,
  mkContract: MkContractT<DC, DP, CT>,
  mkUser: MkUserT<DC, DP, CT, UT, WT>,
) => Promise<UT>;

export abstract class TiamatUser<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
  CT extends TiamatContract<DC, DP>,
> {
  protected static instances = new Map<string, number>();
  protected static singleton?: TiamatUser<any, any, any>;

  public readonly ownerWallet: Wallet;
  public readonly servitorWallet: Wallet;

  public readonly cortex: TiamatCortex<DC, DP, CT>;
  public readonly servitorFundsPlexus: WalletFundsPlexus<DC, DP>;
  public readonly ownerFundsPlexus: WalletFundsPlexus<DC, DP>;
  public readonly servitorPreconPlexus: ServitorPreconPlexus<DC, DP, CT>;

  // mainly for blocking during election-margins
  public readonly actionSemaphore = new Semaphore(`Action`);

  private marginLockId?: string;

  /**
   *
   * @param provider
   * @param networkId
   * @param blockfrostNetworkId
   * @param blockfrostProjectId
   * @param nexusID
   * @param matrixID
   * @param ownerWallet
   * @param servitorPKey
   */
  protected static async createSingleton<
    DC extends PDappConfigT,
    DP extends PDappParamsT,
    CT extends TiamatContract<DC, DP>,
    UT extends TiamatUser<DC, DP, CT>,
    WT extends BlazeWallet,
  >(
    name: string,
    provider: Provider,
    networkId: Core.NetworkId,
    blockfrostNetworkId:
      | "cardano-preview"
      | "cardano-preprod"
      | "cardano-mainnet"
      | "cardano-sanchonet",
    blockfrostProjectId: string,
    nexusID: Token,
    matrixID: Token,
    ownerWallet: WT,
    servitorPKey: Core.Bip32PrivateKeyHex,
    pdappConfig: DC,
    pdappParams: DP,
    mkContract: MkContractT<DC, DP, CT>,
    mkUser: MkUserT<DC, DP, CT, UT, WT>,
    asyncMkUser: AsyncMkUserT<DC, DP, CT, UT, WT>,
  ): Promise<UT> {
    assert(!TiamatUser.singleton, `singleton already exists`);

    const servitorWallet = await HotWallet.fromMasterkey(
      servitorPKey,
      provider,
      networkId,
    );
    const [ownerBlaze, servitorBlaze] = await Promise.all([
      Blaze.from(provider, ownerWallet),
      Blaze.from(provider, servitorWallet),
    ]);

    const socketClient = SocketClient.createSingleton(name);
    const utxoSource = UtxoSource.createSocketSingleton(socketClient);

    const blockfrost = new Blockfrost({
      network: blockfrostNetworkId,
      projectId: blockfrostProjectId,
    });
    TiamatUser.singleton = await asyncMkUser(
      name,
      socketClient,
      utxoSource,
      networkId,
      blockfrost,
      ownerBlaze,
      servitorBlaze,
      nexusID,
      matrixID,
      pdappConfig,
      pdappParams,
      mkContract,
      mkUser,
    );
    return TiamatUser.singleton as UT;
  }

  /**
   *
   */
  public static getSingleton<
    DC extends PDappConfigT,
    DP extends PDappParamsT,
    CT extends TiamatContract<DC, DP>,
  >(): TiamatUser<DC, DP, CT> {
    assert(TiamatUser.singleton, `singleton does not exist`);
    return TiamatUser.singleton;
  }

  /**
   *
   * @param provider
   * @param networkId
   * @param blockfrost
   * @param nexusID
   * @param matrixID
   * @param ownerPKey
   * @param servitorPKey
   * @param port
   */
  protected static newTestingInstance = async <
    DC extends PDappConfigT,
    DP extends PDappParamsT,
    CT extends TiamatContract<DC, DP>,
    UT extends TiamatUser<DC, DP, CT>,
  >(
    name: string,
    provider: Provider,
    networkId: Core.NetworkId,
    blockfrost: Provider, // for the initial utxos required to bootstrap the rest of the system
    nexusID: Token,
    matrixID: Token,
    ownerPKey: Core.Bip32PrivateKeyHex,
    servitorPKey: Core.Bip32PrivateKeyHex,
    port: number,
    pdappConfig: DC,
    pdappParams: DP,
    mkContract: MkContractT<DC, DP, CT>,
    mkUser: MkUserT<DC, DP, CT, UT, HotWallet>,
    asyncMkUser: AsyncMkUserT<DC, DP, CT, UT, HotWallet>,
  ): Promise<UT> => {
    const [ownerWallet, servitorWallet] = await Promise.all([
      HotWallet.fromMasterkey(ownerPKey, provider, networkId),
      HotWallet.fromMasterkey(servitorPKey, provider, networkId),
    ]);
    const [ownerBlaze, servitorBlaze] = await Promise.all([
      Blaze.from(provider, ownerWallet),
      Blaze.from(provider, servitorWallet),
    ]);
    const socketClient = SocketClient.newTestingInstance(name, port);
    const utxoSource = UtxoSource.newTestingInstance(socketClient);
    return await asyncMkUser(
      name,
      socketClient,
      utxoSource,
      networkId,
      blockfrost,
      ownerBlaze,
      servitorBlaze,
      nexusID,
      matrixID,
      pdappConfig,
      pdappParams,
      mkContract,
      mkUser,
    );
  };

  /**
   *
   * @param ownerBlaze
   * @param servitorBlaze
   * @param socketClient
   * @param utxoSource
   * @param blockfrost
   * @param nexusID
   * @param matrixID
   * @param networkId
   */
  protected static asyncNew = async <
    DC extends PDappConfigT,
    DP extends PDappParamsT,
    CT extends TiamatContract<DC, DP>,
    UT extends TiamatUser<DC, DP, CT>,
    WT extends BlazeWallet,
  >(
    name: string,
    socketClient: SocketClient,
    utxoSource: UtxoSource,
    networkId: Core.NetworkId,
    blockfrost: Provider,
    ownerBlaze: Blaze<Provider, WT>,
    servitorBlaze: Blaze<Provider, HotWallet>,
    nexusID: Token,
    matrixID: Token,
    pdappConfig: DC,
    pdappParams: DP,
    mkContract: MkContractT<DC, DP, CT>,
    mkUser: MkUserT<DC, DP, CT, UT, WT>,
  ): Promise<UT> => {
    // TODO we can't rely on addresses, we need to switch to wallets (multiple addresses per wallet)
    // const [blazeOwnerAddresses, blazeServitorAddresses] = await Promise.all([
    //   ownerBlaze.wallet.getUsedAddresses(),
    //   servitorBlaze.wallet.getUsedAddresses(),
    // ]);

    // let name = `${blazeOwnerAddresses[0]!.toBech32().slice(-4)}.${blazeServitorAddresses[0]!
    //   .toBech32()
    //   .slice(-4)} User`;
    const instance = TiamatUser.instances.get(name) ?? 0;
    TiamatUser.instances.set(name, instance + 1);
    if (instance) name = `${name}#${instance}`;

    utxoSource.setName(name);

    const contract = mkContract(
      name,
      networkId,
      utxoSource,
      nexusID,
      matrixID,
      1, // TODO 0 might break it, but maybe the error was somewhere else so we don't need this tolerance mechanism
      pdappConfig,
      pdappParams,
    );

    const servitorAddresses = await servitorBlaze.wallet.getUsedAddresses();
    assert(
      servitorAddresses.length === 1,
      `servitorAddresses.length !== 1: ${servitorAddresses.length}`,
    );
    const servitorAddress = await Bech32Address.fromHotWallet(
      `servitor`,
      servitorBlaze.wallet,
    );

    const user = mkUser(
      name,
      contract,
      socketClient,
      blockfrost,
      ownerBlaze,
      servitorBlaze,
      servitorAddress,
    );

    return user;
  };

  public initBlockfrostMatrixNexus = async () => {
    const [matrixUtxos, nexusUtxos] = await Promise.all([
      this.blockfrost.getUnspentOutputs(this.contract.matrix.address.blaze),
      this.blockfrost.getUnspentOutputs(this.contract.nexus.address.blaze),
    ]);
    assert(
      matrixUtxos.length === 1,
      `${this.name}: expected exactly one matrix utxo, got ${matrixUtxos.length}`,
    );
    assert(
      nexusUtxos.length === 1,
      `${this.name}: expected exactly one nexus utxo, got ${nexusUtxos.length}`,
    );

    await this.contract.utxoSource.initialNotifyUtxoEvents(
      UtxoSet.fromList([
        {
          core: matrixUtxos[0]!,
          trace: Trace.source(`INIT`, this.name),
        },
        {
          core: nexusUtxos[0]!,
          trace: Trace.source(`INIT`, this.name),
        },
      ]),
      Trace.source(`INIT`, `${this.name}.initBlockfrostMatrixNexus`),
    );
  };

  /**
   *
   * @param contract
   * @param ownerBlaze
   * @param servitorBlaze
   * @param name
   * @param servitorAddress
   */
  protected constructor(
    public readonly name: string,
    public readonly contract: TiamatContract<DC, DP>,
    socketClient: SocketClient,
    private readonly blockfrost: Provider, // for initial matrix and nexus
    protected readonly ownerBlaze: Blaze<P, W>,
    protected readonly servitorBlaze: Blaze<P, W>,
    public readonly servitorAddress: Bech32Address,
  ) {
    // this.actionSemaphore = new Semaphore(`${this.name} Action`);
    this.servitorWallet = new Wallet(
      `${name} Servitor`,
      servitorBlaze,
      servitorAddress, //servitorBlaze.wallet,//blazeServitorAddress,
      contract.utxoSource,
    );

    this.ownerWallet = new Wallet(
      `${name} Owner`,
      ownerBlaze,
      `allWalletAddresses`, //blazeOwnerAddress,
      contract.utxoSource,
    );

    this.servitorFundsPlexus = new WalletFundsPlexus(this.servitorWallet);
    this.ownerFundsPlexus = new WalletFundsPlexus(this.ownerWallet);
    this.servitorPreconPlexus = new ServitorPreconPlexus(
      this,
      numTxFees,
      this.servitorFundsPlexus,
      this.ownerFundsPlexus,
    );

    this.cortex = new TiamatCortex(name, contract);

    this.cortex.blocksPlexus.blocksGanglion.innervateEffector(
      new Effector(
        new Callback(
          `always`,
          [`${this.name}`, `unlockAfterMargins`],
          (_data: BlockHeight, _trace: Trace) => {
            if (this.marginLockId) {
              this.actionSemaphore.discharge(this.marginLockId);
              this.marginLockId = undefined;
              return Promise.resolve([
                `${this.name}.unlockAfterMargins: margin lock discharged`,
              ]);
            } else {
              return Promise.resolve([
                `${this.name}.unlockAfterMargins: no margin lock to discharge`,
              ]);
            }
          },
        ),
      ),
    );

    this.cortex.electionsPlexus.innervateMarginEffectors(
      this.lockDuringMargins,
      socketClient.updateConnections,
    );
  }

  protected myelinate = async (from: string[]): Promise<(string | Sent)[]> => {
    const from_ = [...from, `TiamatUser: ${this.name}`];
    const result = await Promise.all([
      this.servitorFundsPlexus.myelinate(from_),
      this.ownerFundsPlexus.myelinate(from_),
      this.servitorPreconPlexus.myelinate(from_),
      this.cortex.myelinate(from_),
    ]);
    return result.flat();
  };

  protected lockDuringMargins = async (_election: ElectionData<DC, DP>) => {
    assert(
      !this.marginLockId,
      `${this.name}.lockDuringMargins: margin lock already latched`,
    );
    this.marginLockId = await this.actionSemaphore.latch(`lockDuringMargins`);
    return [`${this.name}.lockDuringMargins: margin lock latched`];
  };

  public newTx = async (ofWallet: `servitor` | `owner`): Promise<Tx> => {
    return ofWallet === `servitor`
      ? this.servitorWallet.newTx()
      : this.ownerWallet.newTx();
  };

  public getBlaze = (ofWallet: `servitor` | `owner`): Blaze<P, W> => {
    return ofWallet === `servitor` ? this.servitorBlaze : this.ownerBlaze;
  };

  /**
   *
   * @param msg
   * @param {...any} args
   */
  protected log = (msg: string, ...args: any) => {
    console.log(`[${this.name}] ${msg}`, ...args, `\n`);
  };

  /**
   *
   * @param msg
   */
  protected throw = (msg: string) => {
    this.log(`ERROR: ${msg}\n`);
    if (errorTimeoutMs === null) {
      throw new Error(`${this.name} ERROR: ${msg}\n`);
    } else {
      setTimeout(() => {
        throw new Error(`${this.name} ERROR: ${msg}\n`);
      }, errorTimeoutMs);
    }
  };
}
