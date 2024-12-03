import { Core } from "@blaze-cardano/sdk";
import assert from "assert";
import { Currency } from "../../types/general/derived/asset/currency";
import { PositiveValue } from "../../types/general/derived/value/positiveValue";
import { PVoid } from "../../types/general/derived/void";
import { PData, PLifted } from "../../types/general/fundamental/type";
import { PSvmDatum } from "../../types/tiamat/svm/datum";
import { PSvmRedeemer } from "../../types/tiamat/svm/redeemer";
import { PMatrixAction } from "../../types/tiamat/svms/matrix/action";
import { PMatrixConfig } from "../../types/tiamat/svms/matrix/config";
import { PMatrixState } from "../../types/tiamat/svms/matrix/state";
import { PNexusConfig } from "../../types/tiamat/svms/nexus/config";
import { PNexusState } from "../../types/tiamat/svms/nexus/state";
import { PVestingConfig } from "../../types/tiamat/svms/vesting/config";
import { PVestingState } from "../../types/tiamat/svms/vesting/state";
import {
  logUtxoEvents,
  handleInvalidSvms,
  errorTimeoutMs,
} from "../../utils/constants";
import {
  Bech32Address,
  TxId,
  Tx,
  Trace,
  TraceUtxo,
} from "../../utils/wrappers";
import { Callback } from "./callback";
import { TiamatContract } from "./tiamatContract";
import { Sent } from "./utxoSource";
import { TiamatSvmUtxo } from "./tiamatSvmUtxo";
import { Hash } from "../../types/general/derived/hash/hash";
import { Token } from "../../types/general/derived/asset/token";
import { PDappConfigT, PDappParamsT } from "../../types/tiamat/tiamat";
import { SvmStem } from "../data/stem";

/**
 *
 */
export class TiamatSvm<
  // DC extends PDappConfigT,
  // DP extends PDappParamsT,
  PConfig extends PData,
  PState extends PData,
  PAction extends PData,
> {
  private static instances = new Map<string, number>();
  public readonly name: string;
  public svmUtxos: TiamatSvmUtxo<PConfig, PState, PAction>[] = [];
  // public dormantUtxos: SvmUtxo<PConfig, PState, PAction>[] = [];
  public invalidUtxos: TiamatSvmUtxo<PConfig, PState, PAction>[] = [];
  public readonly address: Bech32Address;
  public readonly currency: Currency;
  public callbacks: Callback<TiamatSvmUtxo<PConfig, PState, PAction>[]>[] = [];
  public subscribed = false;
  private singletonFound = false;

  /**
   *
   * @param contract
   * @param label
   * @param svmValidator
   * @param nftPolicy
   * @param singletonID
   * @param inlineScript
   * @param psvmRedeemer
   * @param psvmDatum
   * @param isSingleton
   */
  constructor(
    public readonly contract: TiamatContract<any, any>, // NOTE we can keep this loose as long as we are not concerned about the dapp-config or dapp-params, which only matters in the nexus
    public readonly label: string,
    public readonly svmValidator: Core.Script,
    public readonly nftPolicy: Core.Script,
    public readonly singletonID: Token | null,
    public readonly inlineScript: boolean,
    public readonly psvmRedeemer: PSvmRedeemer<PAction>,
    public readonly psvmDatum: PSvmDatum<PConfig, PState>,
    public readonly isSingleton: boolean,
  ) {
    this.name = `${contract.name} Svm<${label}>`;
    const instance = TiamatSvm.instances.get(this.name) ?? 0;
    TiamatSvm.instances.set(this.name, instance + 1);
    if (instance) this.name = `${this.name}#${instance}`;

    this.address = Bech32Address.fromScript(
      `${this.label}Svm`,
      contract.networkId,
      this.svmValidator,
    );
    this.log(`address: ${this.address.bech32}`);

    const policyID = nftPolicy.hash();
    this.currency = Currency.fromBlaze(policyID);
  }

  /**
   *
   */
  public get singleton(): TiamatSvmUtxo<PConfig, PState, PAction> {
    assert(
      this.svmUtxos.length === 1,
      `expected exactly 1 utxo, got ${this.svmUtxos.length}`,
    );
    return this.svmUtxos[0]!;
  }

  /**
   *
   */
  public get maybeSingleton(): TiamatSvmUtxo<PConfig, PState, PAction> | null {
    if (this.svmUtxos.length === 0) return null;
    return this.singleton;
  }

  // public awaitSingleton = async (): Promise<
  //   Svm<PConfig, PState, PAction>
  // > => {
  //   let count = 0;
  //   const logEachSeconds = 10;
  //   while (true) {
  //     if (this.svmUtxos.length === 0) {
  //       if (count === 0) {
  //         this.log(`waiting for ${this.name} at ${this.address}`);
  //       }
  //       if (count > logEachSeconds * 1000 / queryLoopTimeoutMs) count = 0;
  //       else count++;
  //     } else {
  //       this.log(`found ${this.name}`);
  //       assert(
  //         this.svmUtxos.length === 1,
  //         `expected exactly 1 utxo, got ${this.svmUtxos.length}`,
  //       );
  //       return this;
  //     }
  //     await new Promise((resolve) => setTimeout(resolve, queryLoopTimeoutMs));
  //   }
  // };

  // public getById = (id: Hash): SvmUtxo<PConfig, PState, PAction> => {
  //   const utxo = this.svmUtxos.find((utxo) =>
  //     utxo.hasNFT && utxo.idNFT.token.equals(id)
  //   );
  //   assert(utxo, `no utxo with id ${id}`);
  //   return utxo;
  // };

  /**
   *
   * @param ackCallback
   * @param svmUtxo
   */
  public subscribeAck = (
    subscriber: TiamatSvmUtxo<PConfig, PState, PAction>,
    ackCallback: Callback<TxId>,
  ) => {
    const callback = this.mkAckCallback(ackCallback, subscriber);
    this.callbacks.push(callback);
    this.ensureSubscription(0);
  };

  /**
   *
   * @param callback
   * @param tolerance
   */
  public subscribe = async (
    subscriber: SvmStem<PConfig, PState, PAction>,
    callback: Callback<TiamatSvmUtxo<PConfig, PState, PAction>[]>,
    tolerance = 0,
  ): Promise<(string | Sent)[]> => {
    assert(
      subscriber instanceof SvmStem,
      `${this.name}.subscribe: subscriber not SvmStem`,
    );
    this.callbacks.push(callback);
    const result = await callback.run(
      this.svmUtxos,
      `${this.name}.subscribe.catchUp`,
      Trace.source(`SUB`, `${this.name}.subscribe`),
    );
    this.ensureSubscription(tolerance);
    return result;
  };

  /**
   *
   * @param seedUtxo
   * @param config
   * @param newState
   * @param newValue
   */
  public start = (
    seedUtxo: TraceUtxo,
    config: PLifted<PConfig>,
    newState: PLifted<PState>,
    newValue: PositiveValue,
  ) => {
    const svmUtxo = TiamatSvmUtxo.start(
      this,
      seedUtxo,
      this.inlineScript,
      config,
      newState,
      newValue,
    );
    return svmUtxo;
  };

  /**
   *
   * @param tolerance
   */
  private ensureSubscription = (tolerance: number) => {
    if (this.subscribed) return;
    this.subscribed = true;
    this.contract.utxoSource.subscribeToAddress(
      this,
      this.address,
      new Callback(
        `always`,
        [this.name, `subscribe(${tolerance})`],
        async (events, trace) => {
          this.log(`subscribe processing`, events.events.length, `events`);
          events.events.forEach((event) => {
            if (logUtxoEvents) {
              this.log(`subscribe: processing event:`, event);
            }
            if (event.type === "create") {
              const exists = this.svmUtxos.some(
                (utxo) =>
                  utxo.utxo.core.input().transactionId() ===
                    event.utxo.input().transactionId() &&
                  utxo.utxo.core.input().index() === event.utxo.input().index(),
              );
              if (exists) {
                assert(tolerance-- > 0, `${this.name}: utxo already exists`);
              } else {
                try {
                  // TODO assert scriptref, and all the other fields if it makes sense
                  const svmUtxo = TiamatSvmUtxo.fromBlaze(
                    this,
                    {
                      core: event.utxo,
                      trace: Trace.source(
                        `SUB`,
                        `${this.label}.ensureSubscription.create`,
                      ),
                    },
                    this.inlineScript,
                    this.singletonID,
                  );
                  if (svmUtxo.nftCheck === `ok` && svmUtxo.svmDatum) {
                    // if (svmUtxo.svmDatum) {
                    this.svmUtxos.push(svmUtxo);
                    // } else {
                    //   this.dormantUtxos.push(svmUtxo); // TODO update this
                    // }
                  } else {
                    const msg = `${svmUtxo.svmDatum ? `` : `no datum; `}nft-check: ${svmUtxo.nftCheck}`;
                    if (handleInvalidSvms) {
                      this.log(msg);
                    } else this.throw(msg);
                    this.invalidUtxos.push(svmUtxo);
                  }
                } catch (e) {
                  if (handleInvalidSvms)
                    this.log(`ensureSubscription ERROR:`, e);
                  else throw e;
                }
              }
            } else {
              assert(
                event.type === "destroy",
                `unexpected event type ${event.type}`,
              );
              let found = 0;
              const a = event.utxo;
              /**
               *
               * @param utxo
               */
              const filterUtxo = (
                utxo: TiamatSvmUtxo<PConfig, PState, PAction>,
              ): boolean => {
                const b = utxo.utxo;
                if (
                  a.input().transactionId() ===
                    b.core.input().transactionId() &&
                  a.input().index() === b.core.input().index()
                ) {
                  found++;
                  return false;
                } else {
                  return true;
                }
              };
              this.svmUtxos = this.svmUtxos.filter(filterUtxo);
              // this.dormantUtxos = this.dormantUtxos.filter(filterUtxo);
              this.invalidUtxos = this.invalidUtxos.filter(filterUtxo);
              assert(found === 1, `expected exactly one utxo, got ${found}`);
            }
          });

          if (this.isSingleton) {
            if (this.singletonFound || this.svmUtxos.length !== 0) {
              this.singletonFound = true;
              assert(
                this.svmUtxos.length,
                `${this.name}: expected exactly 1 utxo, got ${this.svmUtxos.length}\nafter ${events.concise()}`,
              );
            }
          }

          if (this.svmUtxos.length) {
            const callbacks_: Callback<
              TiamatSvmUtxo<PConfig, PState, PAction>[]
            >[] = [];
            const result = (
              await Promise.all(
                this.callbacks.map((callback) => {
                  if (callback.perform === `always`) {
                    callbacks_.push(callback);
                  } else {
                    this.log(`DELETING ${callback.fullName}`);
                  }
                  return callback.run(
                    this.svmUtxos,
                    `${this.name}.subscribe(${tolerance})`,
                    trace,
                  );
                }),
              )
            ).flat();
            this.callbacks = callbacks_;
            result.push(
              `${this.name}: processed ${events.events.length} events`,
            );
            return result;
          } else {
            return [`${this.name}.subscribe: no utxos`];
          }
        },
      ),
    );
  };

  /**
   *
   * @param ackCallback
   * @param svmUtxo
   */
  private mkAckCallback = (
    ackCallback: Callback<TxId>,
    svmUtxo: TiamatSvmUtxo<PConfig, PState, PAction>,
  ) => {
    assert(
      ackCallback.perform === `once`,
      `${this.name}: ackCallback must be once`,
    );
    return new Callback<TiamatSvmUtxo<PConfig, PState, PAction>[]>(
      `once`,
      [this.name, `mkAckCallback`],
      async (svmUtxos, trace) => {
        let result: (string | Sent)[] | null = null;
        for (const svmUtxo_ of svmUtxos) {
          if (svmUtxo_.idNFT.equals(svmUtxo.idNFT)) {
            assert(
              result === null,
              `${this.name}.mkAckCallback: duplicate utxo`,
            );
            result = await ackCallback.run(
              TxId.fromUtxo(svmUtxo_.utxo.core),
              `${this.name}.mkAckCallback`,
              trace,
            );
          } else {
            this.log(
              `mkAckCallback: wrong utxo\n${svmUtxo_.idNFT.concise()}\n!==\n${svmUtxo.idNFT.concise()}`,
            );
          }
        }

        if (result === null) {
          this.throw(`mkAckCallback: no utxo`);
          return [`${this.name}.mkAckCallback: ERROR - no utxo`];
        } else {
          return result;
        }
      },
    );
  };

  /**
   *
   * @param tx
   */
  public cleanUp = (tx: Tx): Tx => {
    // this.dormantUtxos.forEach((utxo) => {
    //   tx = utxo.wipingTx(tx);
    // });
    this.invalidUtxos.forEach((utxo) => {
      tx = utxo.wipingTx(tx);
    });
    return tx;
  };

  /**
   *
   * @param seedUtxo
   */
  static id = (seedUtxo: TraceUtxo) => {
    const seedTxId = Core.fromHex(seedUtxo.core.input().transactionId());
    const svmID = new Uint8Array(seedTxId.length + 1);
    svmID[0] = Number(seedUtxo.core.input().index()); // NOTE wraps around
    svmID.set(seedTxId, 1);
    return Hash.fromBytes(svmID).hash();
  };

  /**
   *
   * @param msg
   * @param {...any} args
   */
  private log = (msg: string, ...args: any) => {
    console.log(`[${this.name}] ${msg}`, ...args, `\n`);
  };

  /**
   *
   * @param msg
   */
  private throw = (msg: string) => {
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

export type MatrixSvm = TiamatSvm<PMatrixConfig, PMatrixState, PMatrixAction>;
export type NexusSvm<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
> = TiamatSvm<PNexusConfig<DC>, PNexusState<DP>, PVoid>;
export type VestingsSvm = TiamatSvm<PVestingConfig, PVestingState, PVoid>;
