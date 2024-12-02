import { Core } from "@blaze-cardano/sdk";
// import { type Script } from '@blaze-cardano/core';
import { Currency } from "../../types/general/derived/asset/currency";
import { MatrixSvm, NexusSvm, TiamatSvm, VestingsSvm } from "./tiamatSvm";
import { ElectionPraetor } from "../agents/electionPraetor";
import { Callback } from "./callback";
import { ErrorTimeout } from "../../utils/errorTimeout";
import { CliqueElectionTx, CliqueTippedTx } from "./messages";
import { ElectionData } from "./electionData";
import {
  V3MatrixNftPolicy,
  V3MatrixSvmValidator,
  V3NexusNftPolicy,
  V3NexusSvmValidator,
  V3VestingNftPolicy,
  V3VestingSvmValidator,
} from "../../../contract/plutus";
import assert from "assert";
import { Asset, PAsset } from "../../types/general/derived/asset/asset";
import { Trace, TxSigned } from "../../utils/wrappers";
import { PAddress, Address } from "../../types/general/derived/address";
import {
  pmatrixRedeemer,
  pmatrixDatum,
} from "../../types/tiamat/svms/matrix/svm";
import {
  pnexusRedeemer,
  mkPnexusDatum,
} from "../../types/tiamat/svms/nexus/svm";
import {
  pvestingRedeemer,
  pvestingDatum,
} from "../../types/tiamat/svms/vesting/svm";
import {
  callbackTimeoutMs,
  blockDurationMs,
  errorTimeoutMs,
  matrixLabel,
  nexusLabel,
  vestingLabel,
} from "../../utils/constants";
import { UtxoSource, Sent } from "./utxoSource";
import { Token } from "../../types/general/derived/asset/token";
import { PDappConfigT, PDappParamsT } from "../../types/tiamat/tiamat";
import {
  ElectionsPlexus,
  MatrixPlexus,
  NexusPlexus,
} from "../data/plexus/electionsPlexus";
import { SvmSingletonPlexus } from "../data/plexus/svmSingletonPlexus";
import { BlocksPlexus } from "../data/plexus/blocksPlexus";

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

// TODO needs a way to handle the support-vector-mechanism
/**
 *
 */
export abstract class TiamatContract<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
> {
  // public readonly idNFT: MintingPolicy;
  protected static instances = new Map<string, number>();
  public readonly name: string;
  public readonly matrix: MatrixSvm;
  public readonly nexus: NexusSvm<DC, DP>;
  public readonly vestings: VestingsSvm;
  protected readonly bpNexus: {
    policy: string;
    name: string;
  };

  // protected withinElectionMargin = false;
  protected readonly electionCallbacks: Callback<ElectionData<DC, DP>>[] = [];

  protected currentCheckTimeouts: NodeJS.Timeout[] = [];
  protected nextCheckTimeouts: NodeJS.Timeout[] = [];
  protected electionLoopActive = false;
  protected blocksUntilNextCheck = 0;
  protected untilNextCheckMs = -1;
  protected marginDurationMs = -1;

  public readonly electionData: ElectionPraetor<DC, DP>;
  protected readonly startElectionLoopTimeout?: ErrorTimeout;

  protected subscribedToWallets = false;

  public readonly matrixPlexus: MatrixPlexus;
  public readonly nexusPlexus: NexusPlexus<DC, DP>;
  public readonly blocksPlexus: BlocksPlexus;
  public readonly electionsPlexus: ElectionsPlexus<DC, DP>;

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
    this.name = `${name} Contract`;
    const instance = TiamatContract.instances.get(this.name) ?? 0;
    TiamatContract.instances.set(this.name, instance + 1);
    if (instance) this.name = `${this.name}#${instance}`;
    this.log(`initializing ${this.name}`);

    this.electionData = new ElectionPraetor(this.name);
    // TODO This entire mess with nexusID/nexusData etc etc

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
      mkPnexusDatum(pdappConfig, pdappParams),
      true,
    );
    this.nexusPlexus = new SvmSingletonPlexus(this.nexus);

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
    this.matrixPlexus = new SvmSingletonPlexus(this.matrix);

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

    // if (!utxoSource.isDummy) {
    //   this.startElectionLoopTimeout = new ErrorTimeout(
    //     this.name,
    //     `startWatchingElection.startElectionLoopTimeout`,
    //     slotDurationMs,
    //     Trace.source(`INIT`, `Contract`),
    //   );
    // }

    this.blocksPlexus = new BlocksPlexus(this.utxoSource);

    this.electionsPlexus = new ElectionsPlexus(
      this,
      this.matrixPlexus,
      this.nexusPlexus,
      this.blocksPlexus,
    );
  }

  public myelinate = (from: string[]) => {
    const from_ = [...from, `TiamatContract: ${this.name}`];
    this.matrixPlexus.myelinate(from_);
    this.nexusPlexus.myelinate(from_);
    this.blocksPlexus.myelinate(from_);
    this.electionsPlexus.myelinate(from_);
  };

  /**
   *
   */
  protected clearTimeouts = () => {
    let [currentTimeout, nextTimeout] = [
      this.currentCheckTimeouts.shift(),
      this.nextCheckTimeouts.shift(),
    ];
    while (currentTimeout || nextTimeout) {
      clearTimeout(currentTimeout);
      clearTimeout(nextTimeout);
      [currentTimeout, nextTimeout] = [
        this.currentCheckTimeouts.shift(),
        this.nextCheckTimeouts.shift(),
      ];
    }
  };

  /**
   *
   * @param matrix
   * @param nexus
   * @param forCycle
   * @param trace
   */
  protected processMatrixAndNexus = async (
    election: ElectionData<DC, DP>,
    trace: Trace,
  ): Promise<(string | Sent)[]> => {
    const [previous, id] = await this.electionData.latch(
      `processMatrixAndNexus`,
      election.forCycle,
      callbackTimeoutMs ? callbackTimeoutMs / 2 : undefined,
    );
    if (
      previous &&
      previous.seed === election.seed &&
      previous.matrixUtxoString === election.matrixUtxoString &&
      previous.fromMs === election.fromMs
    ) {
      assert(
        previous.toMs === election.toMs,
        `${this.name}: previous.toMs !== toMs: ${previous.toMs} !== ${election.toMs}`,
      );
      this.electionData.discharge(null, election.forCycle, id);
      return [`skipping redundant ${election.forCycle} election`];
    }

    this.electionData.discharge(election, election.forCycle, id);

    // TODO this await might cause trouble -> it does indeed
    const result: (string | Sent)[] = (
      await Promise.all(
        this.electionCallbacks.map((callback) =>
          callback.run(election, `${this.name}.processMatrixAndNexus`, trace),
        ),
      )
    ).flat();

    this.marginDurationMs = Number(election.tiamatParams.margin_duration);
    assert(
      this.marginDurationMs > 0,
      `${this.name}.processMatrixAndNexus: marginDurationMs ${this.marginDurationMs} <= 0`,
    );
    let untilNextCycleMs = Number(election.toMs) - Date.now();

    if (untilNextCycleMs < 0) {
      const cycleDurationMs = Number(election.tiamatParams.cycle_duration);
      untilNextCycleMs +=
        Math.ceil(-untilNextCycleMs / cycleDurationMs) * cycleDurationMs;
    }

    if (election.forCycle === "current") {
      this.blocksUntilNextCheck = Math.floor(
        untilNextCycleMs / blockDurationMs,
      );
    }
    this.log(
      `${election.forCycle} - blocks until next check: ${this.blocksUntilNextCheck}`,
    );
    if (this.blocksUntilNextCheck === 0) {
      assert(
        untilNextCycleMs > 0,
        `${this.name}: ${election.forCycle} - untilNextCycleMs is negative: ${untilNextCycleMs}`,
      );
      this.log(`${election.forCycle} - untilNextCycleMs: ${untilNextCycleMs}`);
      this.log(
        `${election.forCycle} - marginDurationMs: ${this.marginDurationMs}`,
      );
      const untilNextCheckMs = untilNextCycleMs - this.marginDurationMs;
      if (untilNextCheckMs > 0) {
        this.queueElectionCheck(untilNextCheckMs, "next", trace);
      } else {
        await this.electionCheck("next", trace);
      }
    } else {
      this.untilNextCheckMs = blockDurationMs - this.marginDurationMs;
    }

    result.push(`processed matrix and nexus for ${election.forCycle} cycle`);

    return result;
  };

  /**
   *
   * @param forCycle
   * @param trace
   */
  protected electionCheck = async (
    forCycle: "current" | "next",
    trace: Trace,
  ): Promise<(string | Sent)[]> => {
    this.log(`${forCycle} election check`);
    this.clearTimeouts();
    // NOTE this is to prevent double-updates.
    // We don't want to have both checks for current and next election queued,
    // as one triggers the other in turn.
    if (this.electionLoopActive) {
      // this.setWithinElectionMargin(forCycle === "next");
      const electionGanglion =
        forCycle === "current"
          ? this.electionsPlexus.currentElectionGanglion
          : this.electionsPlexus.nextElectionGanglion;
      const electionData = electionGanglion.scion;
      assert(
        electionData !== `virginal`,
        `${this.name}: electionData is virginal`,
      );
      return await this.processMatrixAndNexus(electionData, trace);
    } else {
      return [`election loop inactive, skipping check`];
    }
  };

  /**
   *
   * @param untilCheckMs
   * @param forCycle
   * @param trace
   */
  protected queueElectionCheck = (
    untilCheckMs: number,
    forCycle: "current" | "next",
    trace: Trace,
  ) => {
    if (this.electionLoopActive) {
      assert(
        untilCheckMs > 0,
        `expected positive untilCheckMs, got ${untilCheckMs}`,
      );
      this.clearTimeouts();
      // NOTE this is to prevent double-updates.
      // We don't want to have both checks for current and next election queued,
      // as one triggers the other in turn.
      const timeouts =
        forCycle === "current"
          ? this.currentCheckTimeouts
          : this.nextCheckTimeouts;
      timeouts.push(
        setTimeout(
          () =>
            this.electionCheck(forCycle, trace).then((result) =>
              result.forEach((r) => {
                if (typeof r === "string") this.log(`RESULT`, r);
                else this.log(`RESULT SENT:`, r.txId.txId);
              }),
            ),
          untilCheckMs,
        ),
      );
    }
  };

  /**
   *
   * @param callback
   */
  public subscribeToElection = (callback: Callback<ElectionData<DC, DP>>) => {
    this.electionCallbacks.push(callback);
  };

  /**
   *
   * @param tx
   * @param spentSvms
   * @param trace
   */
  public submitUntippedTx = async (
    tx: TxSigned,
    trace: Trace,
  ): Promise<(string | Sent)[]> => {
    this.log(`submitting to pubsub`);
    return await this.utxoSource.submitUntippedTx(tx, trace);
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
  ): Promise<(string | Sent)[]> => {
    return await this.utxoSource.submitTippedTxes(txes, trace);
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
  ): Promise<(string | Sent)[]> => {
    return await this.utxoSource.submitElectionTxes(txes, trace);
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
