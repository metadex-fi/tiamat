import { Blaze, Core } from "@blaze-cardano/sdk";
import assert from "assert";
import { Asset } from "../../types/general/derived/asset/asset";
import { Interval } from "../../types/general/derived/interval";
import { PositiveValue } from "../../types/general/derived/value/positiveValue";
import {
  PDappConfigT,
  PDappParamsT,
  TiamatParams,
} from "../../types/tiamat/tiamat";
import { MatrixConfig } from "../../types/tiamat/svms/matrix/config";
import { MatrixState } from "../../types/tiamat/svms/matrix/state";
import { NexusConfig } from "../../types/tiamat/svms/nexus/config";
import { NexusState } from "../../types/tiamat/svms/nexus/state";
import { TxCompleat, Tx, P, W, UtxoSet, Trace } from "../../utils/wrappers";
import { TiamatContract } from "../state/tiamatContract";
import { UtxoSource } from "../state/utxoSource";
import { Token } from "../../types/general/derived/asset/token";
import { nexusLabel, matrixLabel } from "../../utils/constants";
import { PLifted } from "../../types/general/fundamental/type";

/**
 *
 */
export class GenesisAction<DC extends PDappConfigT, DP extends PDappParamsT> {
  /**
   *
   * @param blaze
   * @param networkId
   * @param eigenwert
   * @param initTiamatParams
   * @param dappParams
   * @param firstCycleFrom
   */
  constructor(
    public readonly blaze: Blaze<P, W>,
    public readonly networkId: Core.NetworkId,
    public readonly eigenwert: Asset,
    public readonly dappConfig: PLifted<DC>,
    public readonly initDappParams: PLifted<DP>,
    public readonly initTiamatParams: TiamatParams,
    public readonly firstCycleFrom: bigint, // because we want to align with chain times
    public readonly pdappConfig: DC,
    public readonly pdappParams: DP,
  ) {}

  /*
  We need to do the following, in that order:
  1. start the nexus svm
  2. start the matrix svm

  We can do this using tx-chaining, but each step requires the previous one's output as input.

  Regarding the seeds, we need to:
  1. set one utxo aside to seed the matrix
  2. use the remaining ones to start the nexus, choosing one of them as the seed
  3. use the set-aside seed to start the matrix
  */
  /**
   *
   * @param walletUtxos
   */
  public genesisChain = async (
    walletUtxos: UtxoSet,
  ): Promise<{
    nexusID: Token;
    matrixID: Token;
    transactions: TxCompleat<`owner`>[];
  }> => {
    // const utxos = await this.blaze.wallet.getUtxos(); //NOTE making an exception here
    const utxos = walletUtxos.clone();
    assert(utxos.size > 1, `GenesisAction: ${utxos.size} < 2 utxos`);
    const matrixSeed = utxos.removeHead();
    const nexusSeed = utxos.removeHead();
    const nexusID = Token.fromUtxo(nexusLabel, nexusSeed);
    const matrixID = Token.fromUtxo(matrixLabel, matrixSeed);

    console.log(`nexusID: ${nexusID.toString()}`);
    console.log(`matrixID: ${matrixID.toString()}`);

    const dummyPubSub = UtxoSource.dummy;
    const contract = new TiamatContract(
      "genesis",
      this.networkId, //this.blaze.utils,
      dummyPubSub,
      nexusID,
      matrixID,
      0,
      this.pdappConfig,
      this.pdappParams,
    );
    const initTiamatParams = this.initTiamatParams.withVestingPolicy(
      contract.vestings.currency,
    );

    console.log(`contract.nexus.address: ${contract.nexus.address}`);

    // const matrixNFT = new HashAsset(contract.matrix.currency, matrixID);
    const matrixNFT = new Asset(contract.matrix.currency, matrixID);

    console.log(`matrixNFT: ${matrixNFT.toString()}`);

    const nexusConfig = new NexusConfig(matrixNFT, this.dappConfig);

    console.log(`nexusConfig: ${nexusConfig.toString()}`);

    const initNexusState = new NexusState(
      initTiamatParams,
      this.initDappParams,
      [],
      Interval.inclusive(
        this.firstCycleFrom,
        this.firstCycleFrom + initTiamatParams.cycle_duration,
      ),
    );

    console.log(`initNexusState: ${initNexusState.toString()}`);

    const nexus = contract.nexus.start(
      // nexusStartCallback,
      nexusSeed,
      nexusConfig,
      initNexusState,
      new PositiveValue(),
    );

    console.log(`nexus: ${nexus.toString()}`);

    const nexusTx = nexus.startingTx(
      new Tx(this.blaze, utxos.clone()),
      `genesis`,
      UtxoSet.empty(),
    );

    console.log(`nexusTx: ${nexusTx.toString()}`);

    // below "chained" because of collectTxInputsFrom above
    const nexusCompleat = await nexusTx.compleat();

    console.log(`nexusCompleat: ${nexusCompleat.toString()}`);

    const index = nexusCompleat.tx
      .body()
      .outputs()
      .findIndex(
        (utxo) => utxo.address().toBech32() === contract.nexus.address.bech32,
      );
    assert(index !== -1, `expected nexus utxo`);
    const nexusInput = new Core.TransactionInput(
      nexusCompleat.tx.getId(),
      BigInt(index),
    );
    const nexusOutput = nexusCompleat.tx.body().outputs()[index]!;
    const nexusUtxo = {
      core: new Core.TransactionUnspentOutput(nexusInput, nexusOutput),
      trace: Trace.source(`CHAIN`, `GenesisAction.nexusUtxo`),
    };
    console.log(`nexusUtxo: ${nexusUtxo.toString()}`);

    const initMatrixConfig = new MatrixConfig(this.eigenwert);

    console.log(`initMatrixConfig: ${initMatrixConfig.toString()}`);

    const initMatrixState = new MatrixState(initTiamatParams, []);

    console.log(`initMatrixState: ${initMatrixState.toString()}`);

    const matrix = contract.matrix.start(
      matrixSeed,
      initMatrixConfig,
      initMatrixState,
      new PositiveValue(),
    );

    const matrixTx = matrix.startingTx(
      new Tx(this.blaze, UtxoSet.empty()),
      `genesis`,
      UtxoSet.empty(),
      nexusUtxo,
    );

    console.log(`matrixTx: ${matrixTx.toString()}`);

    const matrixCompleat = await matrixTx.compleat();

    console.log(`matrixCompleat: ${matrixCompleat.toString()}`);

    return {
      nexusID,
      matrixID,
      transactions: [nexusCompleat, matrixCompleat],
    };
  };
}
