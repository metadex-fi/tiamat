import { Blaze, Core, HotWallet } from "@blaze-cardano/sdk";
import { UtxoSource } from "../src/chain/state/utxoSource";
import { Token } from "../src/types/general/derived/asset/token";
import { TiamatContract } from "../src/chain/state/tiamatContract";
import {
  PDappConfigT,
  PDappParamsT,
  TiamatParams,
} from "../src/types/tiamat/tiamat";
import { Emulator, EmulatorProvider } from "@blaze-cardano/emulator";
import { SocketServer } from "../src/chain/agents/socketServer";
import { SocketKupmios } from "../src/chain/agents/socketKupmios";
import {
  blockDurationMs,
  lovelacePerAda,
  slotDurationMs,
  slotsPerBlock,
} from "../src/utils/constants";
import { Rational } from "../src/types/general/derived/rational";
import { Currency } from "../src/types/general/derived/asset/currency";
import { genNonNegative } from "../src/utils/generators";
import { TiamatUser } from "../src/chain/agents/tiamatUser";
import { Bech32Address } from "../src/utils/wrappers";
import { formatTrace } from "../src/utils/conversions";
import { Asset } from "../src/types/general/derived/asset/asset";
import { Assets } from "../src/types/general/derived/asset/assets";
import { PositiveValue } from "../src/types/general/derived/value/positiveValue";
import { Eva } from "../src/chain/agents/eva";
import { PLifted } from "../🕯️";

const slotDurationMs_ = BigInt(slotDurationMs);
const blockDurationMs_ = BigInt(blockDurationMs);

export interface EmulatorPhase<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
  CT extends TiamatContract<DC, DP>,
  UT extends TiamatUser<DC, DP, CT>,
> {
  name: string;
  numBlocks: number;
  mkFn?: (users: UT[]) => () => Promise<void>;
}

export interface EmulatorParams {
  networkId: Core.NetworkId;
  numTrials: number;
  minNumVectors: bigint;
  maxNumVectors: bigint;
  minNumUsers: bigint;
  maxNumUsers: bigint;
  minNumAssets: bigint;
  maxNumAssets: bigint;
  numBlocksPerCycle: bigint;
  numInitialBlocks: number;
  numTerminalBlocks: number;
}

export class TiamatEmulator<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
  CT extends TiamatContract<DC, DP>,
  UT extends TiamatUser<DC, DP, CT>,
> {
  private readonly tiamatParams: TiamatParams;
  private readonly eigenBlaze: Core.AssetId;

  constructor(
    private readonly phases: EmulatorPhase<DC, DP, CT, UT>[],
    private readonly mkContract: (
      name: string,
      networkId: Core.NetworkId,
      utxoSource: UtxoSource,
      nexusID: Token,
      matrixID: Token,
      matrixNexusTolerance: number,
    ) => CT,
    private readonly mkTestingUser: (
      name: string,
      provider: EmulatorProvider,
      networkId: Core.NetworkId,
      blockfrost: EmulatorProvider,
      nexusID: Token,
      matrixID: Token,
      ownerPKey: Core.Bip32PrivateKeyHex,
      servitorPKey: Core.Bip32PrivateKeyHex,
      port: number,
    ) => Promise<UT>,
    private readonly dappConfig: PLifted<DC>,
    private readonly dappParams: PLifted<DP>,
    private readonly pdappConfig: DC,
    private readonly pdappParams: DP,
    private readonly emulatorParams: EmulatorParams,
    // default protocol parameters
    private readonly min_stake = 1000n,
    cycle_duration = emulatorParams.numBlocksPerCycle * blockDurationMs_, // milliseconds
    margin_duration = 1n * slotDurationMs_, // milliseconds
    hinge_lock = cycle_duration * 3n, // milliseconds
    num_eigenvectors = 3n,
    num_support_vectors = 2n,
    suggested_tip = lovelacePerAda, //969750n; <- this is what we pay empirically (due to minimum locked ada)
    vesting_rate = new Rational(1n, 1n), // one token per second
    vesting_policy = Currency.dummy, // will be replaced in genesisChain
    private readonly eigenwert = new Asset(
      Currency.dummy,
      Token.fromString("eigenwert"),
    ),
    private readonly vectorEigenFunds = 10000n,
  ) {
    this.tiamatParams = new TiamatParams(
      min_stake,
      cycle_duration,
      margin_duration,
      hinge_lock,
      num_eigenvectors,
      num_support_vectors,
      suggested_tip,
      vesting_policy,
      vesting_rate,
    );
    this.eigenBlaze = eigenwert.toBlaze();
  }

  private generateAddresses = async (
    n: bigint,
  ): Promise<
    {
      address: Bech32Address;
      privateKey: Core.Bip32PrivateKeyHex;
    }[]
  > => {
    const addresses = [];
    for (let i = 0n; i < n; i++) {
      const mnemonic = Core.generateMnemonic(Core.wordlist);
      const entropy = Core.mnemonicToEntropy(mnemonic, Core.wordlist);
      const privateKey = Core.Bip32PrivateKey.fromBip39Entropy(
        Buffer.from(entropy),
        "",
      );
      const address = await HotWallet.generateAccountAddressFromMasterkey(
        privateKey,
        this.emulatorParams.networkId,
      );
      addresses.push({
        address: Bech32Address.fromBlaze(
          `Emulator Address #${i}`,
          address.address,
        ),
        privateKey: privateKey.hex(),
      });
    }
    return addresses;
  };

  private generateVector = async (
    emulator: Emulator,
    nexusID: Token,
    matrixID: Token,
    privateKeyHex: Core.Bip32PrivateKeyHex,
    targetIP: string,
    targetPort: number,
    minStake: bigint,
    maxStake: bigint,
  ): Promise<SocketServer<DC, DP, CT>> => {
    const name = `${targetIP}:${targetPort}`;
    const socketEmulator = SocketKupmios.newSocketEmulator(name, emulator);
    console.log("created socketEmulator");
    const utxoSource = UtxoSource.newTestingInstance(socketEmulator);
    utxoSource.setName(name);
    console.log("created utxoSource");
    const provider = new EmulatorProvider(emulator);
    console.log("created EmulatorProvider");
    const wallet = await HotWallet.fromMasterkey(privateKeyHex, provider);
    console.log("created wallet");
    const blaze = await Blaze.from(provider, wallet);
    console.log("created blaze");
    const contract = this.mkContract(
      name,
      this.emulatorParams.networkId,
      utxoSource,
      nexusID,
      matrixID,
      0,
    );
    // someVectorContract = contract;
    console.log(
      "Created contract with nexusID:",
      nexusID.toString(),
      "and matrixID:",
      matrixID.toString(),
    );

    const targetStake = minStake + genNonNegative(maxStake - minStake);
    const privateKey = Core.Bip32PrivateKey.fromHex(privateKeyHex);
    const socketServer = await SocketServer.newTestingInstance<DC, DP, CT>(
      privateKey,
      targetIP,
      targetPort,
      targetStake,
      utxoSource,
      socketEmulator,
      contract,
      blaze,
    );
    console.log("Created socketServer");

    return socketServer;
  };

  private generateUser = async (
    name: string,
    emulator: Emulator,
    nexusID: Token,
    matrixID: Token,
    ownerPKey: Core.Bip32PrivateKeyHex,
    port: number,
  ): Promise<UT> => {
    console.log(`creating EmulatorProvider`);
    const provider = new EmulatorProvider(emulator);
    console.log(`creating servitor mnemonic`);
    const servitorMnemonic = Core.generateMnemonic(Core.wordlist);
    console.log(`creating servitor entropy`);
    const servitorEntropy = Core.mnemonicToEntropy(
      servitorMnemonic,
      Core.wordlist,
    );
    console.log(`creating servitor private key`);
    const servitorPKey = Core.Bip32PrivateKey.fromBip39Entropy(
      Buffer.from(servitorEntropy),
      "",
    );
    console.log(`creating blockfrost`);
    const blockfrost = provider;
    console.log(`creating user`);
    const user = await this.mkTestingUser(
      name,
      provider,
      this.emulatorParams.networkId,
      blockfrost,
      nexusID,
      matrixID,
      ownerPKey,
      servitorPKey.hex(),
      port,
    );
    console.log(`created user`);
    return user;
  };

  private runNTimes = async (
    emulator: Emulator,
    trial: number,
    numBlocks: number,
    fn?: () => Promise<void>,
  ) => {
    for (let i = 0; i < numBlocks; i++) {
      console.log(
        "trial:",
        trial,
        "block:",
        emulator.clock.block,
        "slot:",
        emulator.clock.slot,
        "\n",
      );
      if (fn) await fn();
      await emulator.awaitNextBlock();
    }
  };

  public run = async () => {
    // const nativeUplc = true; // TODO check the impact of this

    let trial = 0;
    const actionCounts_ = new Map<string, number>();
    const errors = new Map<string, number>();
    while (trial < this.emulatorParams.numTrials) {
      try {
        console.log(`trials left: ${this.emulatorParams.numTrials - trial}`);

        const numVectors =
          this.emulatorParams.minNumVectors +
          genNonNegative(
            this.emulatorParams.maxNumVectors -
              this.emulatorParams.minNumVectors,
          );
        let numUsers = 0n;
        if (this.emulatorParams.maxNumUsers) {
          numUsers =
            this.emulatorParams.minNumUsers +
            genNonNegative(
              this.emulatorParams.maxNumUsers - this.emulatorParams.minNumUsers,
            );
        }
        console.log(`numVectors: ${numVectors}`);
        console.log(`numUsers: ${numUsers}`);
        const addresses = await this.generateAddresses(
          numUsers + numVectors + 1n,
        );

        const evaAddress = addresses[0]!;
        const evaAssets = new Core.Value(lovelacePerAda * 100n);
        const evaAccount = {
          address: evaAddress.address,
          assets: evaAssets,
        };

        // twice "evaAccount" because two utxos required
        const accounts = [evaAccount, evaAccount];
        const feesLovelace = 100n * lovelacePerAda; // TODO excessive

        // generate vector accounts
        for (let i = 1n; i < numVectors + 1n; i++) {
          const vectorAddress = addresses[Number(i)]!;
          const vectorAssets = new Core.Value(
            feesLovelace,
            new Map([[this.eigenBlaze, this.vectorEigenFunds * 2n]]),
          );
          const vectorAccount = {
            address: vectorAddress.address,
            assets: vectorAssets,
          };
          accounts.push(vectorAccount);
        }
        let allAssets = Assets.generate(
          this.emulatorParams.minNumAssets,
          this.emulatorParams.maxNumAssets,
        );
        while (!allAssets.has(Asset.ADA)) {
          allAssets = Assets.generate(
            this.emulatorParams.minNumAssets,
            this.emulatorParams.maxNumAssets,
          );
        }

        // generate user accounts
        for (let i = numVectors + 1n; i < addresses.length; i++) {
          const ownerAddress = addresses[Number(i)]!;
          const balance = new PositiveValue();
          allAssets.forEach((asset) => {
            balance.initAmountOf(asset, 10000n * lovelacePerAda);
          });

          const ownerAssets = balance.toBlaze;
          const ownerAccount = {
            address: ownerAddress.address,
            assets: ownerAssets,
          };
          accounts.push(ownerAccount);
        }

        // start test environment and initialize protocol
        const chainStartTime =
          Math.ceil(Date.now() / slotDurationMs) * slotDurationMs;
        await new Promise((resolve) =>
          setTimeout(resolve, Date.now() - chainStartTime),
        );
        const genesisOutputs = accounts.map(
          (account) =>
            new Core.TransactionOutput(account.address.blaze, account.assets),
        );
        const emulator = new Emulator(genesisOutputs, undefined, {
          slotConfig: {
            zeroSlot: 0,
            zeroTime: Date.now(),
            slotLength: slotDurationMs,
          },
        });
        const genesisAlignment = blockDurationMs;
        const provider = new EmulatorProvider(emulator);
        const neon = new Eva(
          provider,
          this.emulatorParams.networkId,
          chainStartTime,
          genesisAlignment,
          evaAddress.privateKey,
          this.eigenwert,
          this.dappConfig,
          this.dappParams,
          this.tiamatParams,
          this.pdappConfig,
          this.pdappParams,
        );
        await neon.init();
        const seed = await neon.genesis();

        let waitingSlots = 0;
        for (let i = this.emulatorParams.numBlocksPerCycle; i >= 0; i--) {
          console.log(`${i}..`);
          await emulator.awaitNextBlock();
          waitingSlots += slotsPerBlock;
        }

        // generate servers
        const vectors: SocketServer<DC, DP, CT>[] = [];
        const vectorAddresses: Bech32Address[] = [];
        let port = 8080;
        for (let i = 1; i < numVectors + 1n; i++) {
          const socketServer = await this.generateVector(
            emulator,
            seed.nexusID,
            seed.matrixID,
            addresses[i]!.privateKey,
            "127.0.0.1",
            port++,
            this.min_stake,
            this.vectorEigenFunds,
          );
          vectors.push(socketServer);
          vectorAddresses.push(addresses[Number(i)]!.address);
        }

        console.log(`STARTING SERVERS\n`);

        // start servers
        for (const vector of vectors) {
          vector.serve();
        }
        await this.runNTimes(
          emulator,
          trial,
          this.emulatorParams.numInitialBlocks,
        );

        console.log(`GENERATING USERS\n`);
        // generate users
        const users: UT[] = [];
        for (let i = numVectors + 1n; i < addresses.length; i++) {
          console.log(`generating user #${users.length + 1}`);
          const user = await this.generateUser(
            `U${users.length + 1}`,
            emulator,
            seed.nexusID,
            seed.matrixID,
            addresses[Number(i)]!.privateKey,
            port++,
          );
          users.push(user);
        }

        for (let i = 0; i < this.phases.length; i++) {
          const phase = this.phases[i]!;
          console.log(
            `RUNNING TRIAL`,
            trial + 1,
            `PHASE`,
            i,
            `-`,
            phase.name,
            `\n`,
          );
          const fn = phase.mkFn ? phase.mkFn(users) : undefined;
          await this.runNTimes(emulator, trial, phase.numBlocks, fn);
        }

        console.log(`CONCLUDING TRIAL`, trial + 1, `\n`);
        await this.runNTimes(
          emulator,
          trial,
          this.emulatorParams.numTerminalBlocks,
        );

        console.log(`\nENDING TRIAL`, trial + 1, `\n`);
      } catch (e: any) {
        throw formatTrace(e.toString());
        // const e_ = e.toString();
        // errors.set(e_, (errors.get(e_) || 0) + 1);
      }

      console.log(`trial`, trial + 1, `DONE\n`);
      trial++;

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log("--- DONE ---");
    for (const [type, count] of actionCounts_) {
      console.log(`${type}: ${count}`);
    }
    console.log(`errors: ${errors.size}`);
    for (const e of errors) {
      console.warn("---");
      console.warn(e[1], `x`, e[0]);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // await new Promise((resolve) =>
    //   setTimeout(
    //     resolve,
    //     1 + Math.max(semaphoreTimeoutMs ?? 0, callbackTimeoutMs ?? 0),
    //   )
    // );
  };
}
