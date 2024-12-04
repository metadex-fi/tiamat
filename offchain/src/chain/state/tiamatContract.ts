import { Core } from "@blaze-cardano/sdk";
// import { type Script } from '@blaze-cardano/core';
import { Currency } from "../../types/general/derived/asset/currency";
import { MatrixSvm, NexusSvm, TiamatSvm, VestingsSvm } from "./tiamatSvm";
import { CliqueElectionTx, CliqueTippedTx } from "./messages";
import {
  V3MatrixNftPolicy,
  V3MatrixSvmValidator,
  V3NexusNftPolicy,
  V3NexusSvmValidator,
  V3VestingNftPolicy,
  V3VestingSvmValidator,
} from "../../../contract/plutus";
import { Asset, PAsset } from "../../types/general/derived/asset/asset";
import { Trace, TxSigned } from "../../utils/wrappers";
import { PAddress, Address } from "../../types/general/derived/address";
import {
  pmatrixRedeemer,
  pmatrixDatum,
} from "../../types/tiamat/svms/matrix/svm";
import {
  pnexusRedeemer,
  mkPNexusDatum,
} from "../../types/tiamat/svms/nexus/svm";
import {
  pvestingRedeemer,
  pvestingDatum,
} from "../../types/tiamat/svms/vesting/svm";
import {
  errorTimeoutMs,
  matrixLabel,
  nexusLabel,
  vestingLabel,
} from "../../utils/constants";
import { UtxoSource } from "./utxoSource";
import { Token } from "../../types/general/derived/asset/token";
import { PDappConfigT, PDappParamsT } from "../../types/tiamat/tiamat";
import { Result } from "./callback";

export interface MintingPolicy {
  policy: Core.Script;
  currency: Currency;
}

export interface BPAddress {
  paymentCredential: { VerificationKey: [string] } | { Script: [string] };
  stakeCredential:
    | {
        Inline: [
          | {
              VerificationKey: [string];
            }
          | { Script: [string] },
        ];
      }
    | {
        Pointer: {
          slotNumber: bigint;
          transactionIndex: bigint;
          certificateIndex: bigint;
        };
      }
    | null;
}

/**
 *
 */
export class TiamatContract<DC extends PDappConfigT, DP extends PDappParamsT> {
  protected static instances = new Map<string, number>();
  public readonly name: string;
  public readonly matrix: MatrixSvm;
  public readonly nexus: NexusSvm<DC, DP>;
  public readonly vestings: VestingsSvm;
  protected readonly bpNexus: {
    policy: string;
    name: string;
  };
  protected subscribedToWallets = false;

  /**
   *
   * @param name
   * @param networkId
   * @param utxoSource
   * @param nexusID
   * @param matrixID
   * @param matrixNexusTolerance
   */
  constructor(
    name: string,
    public readonly networkId: Core.NetworkId,
    public readonly utxoSource: UtxoSource, // TODO make protected and adjust
    public readonly nexusID: Token,
    public readonly matrixID: Token,
    public readonly matrixNexusTolerance: number, // because of the initialNotify in user
    public readonly pdappConfig: DC,
    public readonly pdappParams: DP,
  ) {
    this.name = `${name} TiamatContract`;
    const instance = TiamatContract.instances.get(this.name) ?? 0;
    TiamatContract.instances.set(this.name, instance + 1);
    if (instance) this.name = `${this.name}#${instance}`;
    this.log(`initializing ${this.name}`);

    this.log(`initializing nexus`);
    const nexusSvmValidator: Core.Script = new V3NexusSvmValidator();
    const nexusAddress = PAddress.ptype.pblueprint(
      Address.fromBlaze(
        Core.addressFromValidator(networkId, nexusSvmValidator),
      ),
    ) as BPAddress;
    this.log(`nexusAddress: ${JSON.stringify(nexusAddress)}`);
    this.log(`nexusID.toBlaze(): ${JSON.stringify(nexusID.toBlaze())}`);
    const nexusNftPolicy: Core.Script = new V3NexusNftPolicy(
      nexusAddress,
      nexusID.toBlaze(),
    );
    // const alwaysTrueScript = Core.Script.newPlutusV2Script(
    //   new Core.PlutusV2Script(Core.HexBlob("510100003222253330044a229309b2b2b9a1")),
    // );

    this.nexus = new TiamatSvm(
      this,
      nexusLabel,
      nexusSvmValidator,
      nexusNftPolicy,
      nexusID,
      false,
      pnexusRedeemer,
      mkPNexusDatum(pdappConfig, pdappParams),
      true,
    );

    const nexus = new Asset(this.nexus.currency, nexusID);
    this.bpNexus = PAsset.ptype.pblueprint(nexus);

    const matrixSvmValidator: Core.Script = new V3MatrixSvmValidator();
    const matrixAddress = PAddress.ptype.pblueprint(
      Address.fromBlaze(
        Core.addressFromValidator(networkId, matrixSvmValidator),
      ),
    ) as BPAddress;
    const matrixNftPolicy: Core.Script = new V3MatrixNftPolicy(
      matrixAddress,
      this.bpNexus,
    );
    this.matrix = new TiamatSvm(
      this,
      matrixLabel,
      matrixSvmValidator,
      matrixNftPolicy,
      matrixID,
      false,
      pmatrixRedeemer,
      pmatrixDatum,
      true,
    );

    const vestingSvmValidator: Core.Script = new V3VestingSvmValidator(
      this.bpNexus,
    );
    const vestingAddress = PAddress.ptype.pblueprint(
      Address.fromBlaze(
        Core.addressFromValidator(networkId, vestingSvmValidator),
      ),
    ) as BPAddress;
    const vestingNftPolicy: Core.Script = new V3VestingNftPolicy(
      vestingAddress,
    );
    this.vestings = new TiamatSvm(
      this,
      vestingLabel,
      vestingSvmValidator,
      vestingNftPolicy,
      null,
      false,
      pvestingRedeemer,
      pvestingDatum,
      false,
    );
  }

  /**
   *
   * @param tx
   * @param spentSvms
   * @param trace
   */
  public submitUntippedTx = async (
    tx: TxSigned,
    trace: Trace,
  ): Promise<Result> => {
    this.log(`submitting to pubsub`);
    return await this.utxoSource.submitUntippedTx(
      tx,
      trace.via(`${this.name}.submitUntippedTx`),
    );
  };

  /**
   *
   * @param txes
   * @param spentSvms
   * @param trace
   */
  public submitTippedTxes = async (
    txes: CliqueTippedTx[],
    trace: Trace,
  ): Promise<Result> => {
    return await this.utxoSource.submitTippedTxes(
      txes,
      trace.via(`${this.name}.submitTippedTxes`),
    );
  };

  /**
   *
   * @param txes
   * @param spentSvms
   * @param trace
   */
  public submitElectionTxes = async (
    txes: CliqueElectionTx[],
    trace: Trace,
  ): Promise<Result> => {
    return await this.utxoSource.submitElectionTxes(
      txes,
      trace.via(`${this.name}.submitElectionTxes`),
    );
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
