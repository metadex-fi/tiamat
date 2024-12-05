import assert from "assert";
import { Core } from "@blaze-cardano/sdk";
import { SocketKupmios } from "../agents/socketKupmios";
import {
  callbackTimeoutMs,
  errorTimeoutMs,
  handleTxSubmissionErrors,
} from "../../utils/constants";
import { Callback, Result } from "./callback";
import { f } from "../../types/general/fundamental/type";
import {
  Bech32Address,
  CoreUtxo,
  Trace,
  TxId,
  TxSigned,
  UtxoSet,
} from "../../utils/wrappers";
import { AssocMap } from "../../types/general/fundamental/container/map";
import { SocketClient } from "../agents/socketClient";
import { CliqueElectionTx, CliqueTippedTx, UtxoEventMsg } from "./messages";
import { ErrorTimeout } from "../../utils/errorTimeout";
import { SocketServer } from "../agents/socketServer";
import { Wallet } from "./wallet";
import { TiamatSvm } from "./tiamatSvm";
import { BlocksStem } from "../data/stem";

export interface UtxoEvent {
  utxo: CoreUtxo;
  type: "create" | "destroy";
}

/**
 *
 */
export class UtxoEvents {
  /**
   *
   * @param events
   * @param timestamp
   * @param source
   */
  constructor(
    public readonly events: UtxoEvent[],
    public readonly timestamp: number,
    public readonly source: string,
  ) {}

  /**
   *
   */
  public concise = (): string => {
    const events = this.events
      .map((event) => {
        const { utxo, type } = event;
        return `${f}${f}${type} @ ${utxo.output().address()}`;
      })
      .join(`,\n`);
    return `UtxoEvents (\n${f}events: [\n${events}\n${f}],\n${f}timestamp: ${this.timestamp},\n${f}source: ${this.source}\n)`;
  };
}

// export class PubSub<T> {
//   private subscribers: Callback<T>[] = [];

//   subscribe(callback: Callback<T>): void {
//     this.subscribers.push(callback);
//   }

//   unsubscribe(callback: Callback<T>): void {
//     this.subscribers = this.subscribers.filter((sub) => sub !== callback);
//   }

//   notify(data: T): void {
//     this.subscribers.forEach((callback) => callback(data));
//   }
// }

/**
 *
 */
export class Sent {
  readonly __brand = `Sent`;
  /**
   *
   * @param txId
   */
  constructor(public readonly txId: TxId) {}

  /**
   *
   * @param tx
   */
  public static fromTransaction = (tx: Core.Transaction): Sent => {
    const txId = TxId.fromTransaction(tx);
    return new Sent(txId);
  };
}

export interface ChainInterface {
  // utxosAt: (address: Bech32Address) => Promise<UtxoSet | undefined>;
  subscribeToAddress: (
    catchUpCallback: Callback<UtxoEvents>, // having this up here because on the bottom it's somehow considered optional
    subscriber: UtxoSource,
    toAddress: Bech32Address,
  ) => void;
  unsubscribeFromAddress: (
    subscriber: UtxoSource,
    fromAddress: Bech32Address,
  ) => void;
  subscribeToNewBlock: (subscriber: UtxoSource) => void;
  // subscribeToAck: (subscriber: UtxoSource) => void;
  submitUntippedTx: (tx: Core.Transaction, trace2: Trace) => Promise<Result>;
  submitTippedTxes: (txes: CliqueTippedTx[], trace2: Trace) => Promise<Result>;
  submitElectionTxes: (
    txes: CliqueElectionTx[],
    trace2: Trace,
  ) => Promise<Result>;
}

const defaultName = `(unnamed) UtxoSource`;

/**
 *
 */
export class UtxoSource {
  private static instances = new Map<string, number>();
  public name = defaultName;
  private addressCallbacks: AssocMap<Bech32Address, Callback<UtxoEvents>[]> =
    new AssocMap((b) => b.bech32);
  private addressMsgsIDs: AssocMap<Bech32Address, Set<string>> = new AssocMap(
    (b) => b.bech32,
  );
  private idMsgsCallbacks: Map<string, Callback<string>> = new Map(); // TODO a way to delete entries
  private newBlockCallbacks: Callback<number>[] = [];
  // private ackCallbacks: AssocMap<TxId, Callback<TxId>[]> = new AssocMap((
  //   h,
  // ) => h.txId);
  private subscribedToNewBlock = false;
  // private initialUtxos?: UtxoSet;
  private static socketSingleton?: UtxoSource;
  private static kupmiosSingleton?: UtxoSource;

  /**
   *
   * @param chainInterface
   */
  private constructor(private readonly chainInterface?: ChainInterface) {
    // this.chainInterface?.subscribeToAck(this);
  }

  /**
   *
   * @param chainInterface
   */
  public static newTestingInstance(chainInterface: ChainInterface): UtxoSource {
    return new UtxoSource(chainInterface);
  }

  /**
   *
   * @param socketClient
   */
  public static createSocketSingleton(socketClient: SocketClient): UtxoSource {
    assert(
      !UtxoSource.socketSingleton,
      `UtxoSource: socketSingleton already exists`,
    );
    UtxoSource.socketSingleton = new UtxoSource(socketClient);
    return UtxoSource.socketSingleton;
  }

  /**
   *
   * @param socketKupmios
   */
  public static createKupmiosSingleton(
    socketKupmios: SocketKupmios,
  ): UtxoSource {
    assert(
      !UtxoSource.kupmiosSingleton,
      `UtxoSource: kupmiosSingleton already exists`,
    );
    UtxoSource.kupmiosSingleton = new UtxoSource(socketKupmios);
    return UtxoSource.kupmiosSingleton;
  }

  /**
   *
   */
  public static getSocketSingleton(): UtxoSource {
    assert(
      UtxoSource.socketSingleton,
      `UtxoSource: vectorSingleton does not exist`,
    );
    return UtxoSource.socketSingleton;
  }

  /**
   *
   */
  public static getKupmiosSingleton(): UtxoSource {
    assert(
      UtxoSource.kupmiosSingleton,
      `UtxoSource: kupmiosSingleton does not exist`,
    );
    return UtxoSource.kupmiosSingleton;
  }

  /**
   *
   * @param name
   */
  public setName(name: string): void {
    assert(
      this.name === defaultName,
      `${this.name}: name already changed from default "${defaultName}"`,
    );
    this.name = `${name} UtxoSource`;
    const instance = UtxoSource.instances.get(this.name) ?? 0;
    UtxoSource.instances.set(this.name, instance + 1);
    if (instance) this.name = `${this.name}#${instance}`;
  }

  // for genesis-action (there's nothing to subscribe to yet)
  /**
   *
   */
  public static get dummy(): UtxoSource {
    return new UtxoSource();
  }

  /**
   *
   * @param address
   * @param callback
   */
  public subscribeToAddress = (
    subscriber: TiamatSvm<any, any, any> | Wallet<any>,
    address: Bech32Address,
    callback: Callback<UtxoEvents>,
  ) => {
    const concise = address.concise();
    this.log(`subscribeToAddress:`, concise);
    assert(
      subscriber instanceof TiamatSvm || subscriber instanceof Wallet,
      `${this.name}.subscribeToAddress: subscriber neither TiamatSvm nor Wallet`,
    );
    assert(
      this.chainInterface,
      `${this.name}: no socketClient in dummy UtxoSource`,
    );
    const addressCallbacks = this.addressCallbacks.get(address);
    if (addressCallbacks) {
      this.log(`already subscribed to ${concise}`);
      addressCallbacks.push(callback);
    } else {
      this.addressCallbacks.set(address, [callback]);
      this.chainInterface.subscribeToAddress(callback, this, address);
    }
  };

  // TODO update before use
  // public unsubscribeFromAddress = (
  //   address: Bech32Address,
  // ) => {
  //   this.log(`unsubscribeFromAddress:`, address);
  //   assert(this.chainInterface, "no socketClient in dummy UtxoSource");
  //   const found = this.addressCallbacks.delete(address);
  //   assert(found, `no subscriptions to ${address}`);
  //   if (!this.addressMsgsIDs.has(address)) {
  //     this.chainInterface.unsubscribeFromAddress(this, address);
  //   }
  // };

  /**
   *
   * @param address
   * @param id
   * @param callback
   */
  public subscribeToAddressMsgs = (
    subscriber: SocketServer<any, any, any>,
    address: Bech32Address,
    id: string,
    callback: Callback<string>,
  ) => {
    this.log(`subscribeToAddressMsgs:`, address, id);
    assert(
      subscriber instanceof SocketServer,
      `${this.name}.subscribeToAddressMsgs: subscriber not a SocketServer`,
    );
    assert(this.chainInterface, `no socketClient in dummy UtxoSource`);
    this.idMsgsCallbacks.set(id, callback);
    const addressMsgsIDs = this.addressMsgsIDs.get(address);
    if (addressMsgsIDs) {
      this.log(`already subscribed to ${address}`);
      if (!addressMsgsIDs.has(id)) {
        addressMsgsIDs.add(id);
      } else {
        return;
      }
    } else {
      this.log(`newly subscribing to ${address}`);
      this.addressMsgsIDs.set(address, new Set([id]));
    }
    const catchUpCallback = new Callback(
      callback.perform,
      [
        `${this.name}`,
        `subscribeToAddressMsgs`,
        `catchUpCallback`,
        id,
        address.bech32,
      ],
      async (events: UtxoEvents, trace: Trace) => {
        const msgs: UtxoEventMsg[] = events.events.map((event) => {
          const msg: UtxoEventMsg = {
            payload: event.utxo.toCbor(),
            tag: event.type,
          };
          return msg;
          // return JSON.stringify(msg);
        });
        if (msgs.length === 0) return [];
        else {
          return [
            await callback.run(
              JSON.stringify(msgs),
              `${this.name}.subscribeToAddressMsgs`,
              trace,
            ),
          ];
        }
      },
    );
    this.chainInterface.subscribeToAddress(catchUpCallback, this, address);
  };

  // TODO update before use
  /**
   *
   * @param address
   * @param id
   */
  public unsubscribeFromAddressMsgs = (
    subscriber: SocketServer<any, any, any>,
    address: Bech32Address,
    id: string,
  ) => {
    this.log(`unsubscribeFromAddress:`, address, id);
    assert(
      subscriber instanceof SocketServer,
      `${this.name}.subscribeToAddressMsgs: subscriber not a SocketServer`,
    );
    assert(
      this.chainInterface,
      `${this.name}: no socketClient in dummy UtxoSource`,
    );
    const addressMsgsIDs = this.addressMsgsIDs.get(address);
    assert(addressMsgsIDs, `${this.name}: no subscriptions to ${address}`);
    const found = addressMsgsIDs.delete(id);
    if (found) this.chainInterface.unsubscribeFromAddress(this, address);
    if (addressMsgsIDs.size === 0) {
      this.addressMsgsIDs.delete(address);
    }
  };

  /**
   *
   * @param callback
   */
  public subscribeToNewBlock = (
    subscriber: Wallet<any> | BlocksStem | SocketServer<any, any, any>,
    callback: Callback<number>,
  ): Promise<Result> => {
    this.log(`subscribeToNewBlock`);
    assert(
      subscriber instanceof Wallet ||
        subscriber instanceof BlocksStem ||
        subscriber instanceof SocketServer,
      `${this.name}.subscribeToAddress: subscriber neither TiamatSvm nor Wallet nor BlocksStem nor SocketServer`,
    );
    this.newBlockCallbacks.push(callback);

    if (this.subscribedToNewBlock)
      return Promise.resolve(
        new Result(
          [`already subscribed to new block`],
          this.name,
          `subscribeToNewBlock`,
          Trace.source(
            `SUB`,
            `${this.name}.subscribeToNewBlock from ${subscriber.name} (already subscribed)`,
          ),
        ),
      );

    this.subscribedToNewBlock = true;
    assert(
      this.chainInterface,
      `${this.name}: no socketClient in dummy UtxoSource`,
    );
    this.chainInterface.subscribeToNewBlock(this);
    return Promise.resolve(
      new Result(
        [`successfully subscribed to new block`],
        this.name,
        `subscribeToNewBlock`,
        Trace.source(
          `SUB`,
          `${this.name}.subscribeToNewBlock from ${subscriber.name} (new subscription)`,
        ),
      ),
    );
  };

  // private subscribeToAck = (callback: Callback<number>) => {
  //   this.log(`ubscribeToAck`);
  //   this.ackCallbacks.push(callback);
  //   if (this.subscribedToAck) return;

  //   this.subscribedToAck = true;
  //   assert(this.chainInterface, "no socketClient in dummy UtxoSource");
  //   this.chainInterface.subscribeToAck(this);
  // };

  // private getInitialUtxos = () => {
  //   return this.initialUtxos;
  // };

  /**
   *
   * @param from
   * @param events
   * @param trace_
   */
  public notifyUtxoEvents = async (
    from: ChainInterface,
    events: UtxoEvents,
    trace: Trace,
  ): Promise<Result> => {
    assert(
      from === this.chainInterface,
      `${this.name}: notifyUtxoEvents from wrong chainInterface`,
    );
    const trace_ = trace.via(`${this.name}.notifyUtxoEvents`);
    const promises: Promise<Result>[] = [];
    // const result: string[] = [];

    const id_ = Math.floor(Math.random() * 1000).toString();
    this.log(`notifyUtxoEvents ${id_}: ${events.concise()}`);

    const timestamp = Date.now();
    const addressEvents = new AssocMap<Bech32Address, UtxoEvents>(
      (b) => b.bech32,
    );
    let i = 0;
    for (const event of events.events) {
      const address = Bech32Address.fromUtxo(
        `from UtxoEvent ${i++}`,
        event.utxo,
      );
      const events_ = addressEvents.get(address);
      if (events_) {
        events_.events.push(event);
      } else {
        addressEvents.set(
          address,
          new UtxoEvents([event], timestamp, `${this.name}.notifyUtxoEvents`),
        );
      }
    }

    this.log(`notifyUtxoEvents ${id_}:`, addressEvents.size, `addressEvents`);
    for (const [address, callbacks] of this.addressCallbacks) {
      const events_ = addressEvents.get(address);
      if (!events_) continue;
      this.log(
        `notifyUtxoEvents ${id_}:\n`,
        address,
        `\n =>`,
        callbacks.length,
        `callbacks:\n`,
        callbacks.map((cb) => cb.show(f)).join(`\n`),
        `\n`,
      );
      // for (const callback of callbacks) {
      //   result.push(...(await callback.run(events_)));
      // }
      callbacks.forEach((callback) =>
        promises.push(
          callback.run(events_, `${this.name}.notifyUtxoEvents`, trace_),
        ),
      );
    }
    this.log(`notifyUtxoEvents ${id_}: addressEvents done`);

    const idMsgsStaging = new Map<string, UtxoEventMsg[]>();
    this.log(
      `notifyUtxoEvents ${id_}:`,
      this.addressMsgsIDs.size,
      `addressMsgsIDs`,
    );
    for (const [address, ids] of this.addressMsgsIDs) {
      const events_ = addressEvents.get(address);
      if (!events_) continue;
      // this.log(`notifyUtxoEvents ${id_}:`, address, ...ids.values());
      const msgs: UtxoEventMsg[] = events_.events.map((event) => {
        const msg: UtxoEventMsg = {
          payload: event.utxo.toCbor(),
          tag: event.type,
        };
        return msg;
        // return JSON.stringify(msg);
      });

      for (const id of ids) {
        // this.log(`notifyUtxoEvents ${id_}:`, msgs.length, `msgs`);
        const stagedIdMsgs = idMsgsStaging.get(id);
        if (stagedIdMsgs) {
          // staged.callbacks.push(callback);
          stagedIdMsgs.push(...msgs);
        } else {
          idMsgsStaging.set(id, msgs);
        }
      }
      // this.log(`notifyUtxoEvents ${id_}:`, address, `done`);
    }

    this.log(`notifyUtxoEvents ${id_}:`, idMsgsStaging.size, `idMsgsStaging`);
    for (const [id, msgs] of idMsgsStaging) {
      // this.log(`notifyUtxoEvents:`, id, msgs);
      const msg = JSON.stringify(msgs);
      const callback = this.idMsgsCallbacks.get(id);
      assert(callback, `${this.name}:.no callback`);
      // result.push(...(await callback.run(msg)));
      promises.push(callback.run(msg, `${this.name}.notifyUtxoEvents`, trace_));
    }
    const result = (await Promise.all(promises)).flat(); // TODO what about this?
    // result.push(...(await Promise.all(promises)).flat());
    this.log(`notifyUtxoEvents ${id_}:`, result.length, `results`);
    return new Result(result, this.name, `notifyUtxoEvents`, trace_);
  };

  /**
   *
   * @param utxos
   * @param trace_
   */
  public initialNotifyUtxoEvents = async (
    utxos: UtxoSet,
    trace: Trace,
  ): Promise<Result> => {
    this.log(`INITIAL NOTIFY`);
    const trace_ = trace.via(`${this.name}.initialNotifyUtxoEvents`);
    // this.initialUtxos = utxos;
    const promises: Promise<Result>[] = [];
    this.addressCallbacks.forEach((callbacks, address) => {
      const events: UtxoEvent[] = [];

      utxos.list.forEach((utxo) => {
        if (utxo.core.output().address().toBech32() === address.bech32) {
          const event: UtxoEvent = {
            utxo: utxo.core,
            type: "create",
          };
          events.push(event);
        }
      });
      if (events.length) {
        const concise = address.concise();
        const events_ = new UtxoEvents(
          events,
          Date.now(),
          `${this.name}.initialNotifyUtxoEvents.${concise}`,
        );
        callbacks.forEach((callback) =>
          promises.push(
            callback.run(
              events_,
              `${this.name}.initialNotifyUtxoEvents.${concise}`,
              trace_,
            ),
          ),
        );
      }
    });
    return new Result(
      (await Promise.all(promises)).flat(),
      this.name,
      `initialNotifyUtxoEvents`,
      trace_,
    );
  };

  /**
   *
   * @param from
   * @param block
   * @param trace_
   */
  public notifyNewBlock = async (
    from: ChainInterface,
    block: number,
    trace: Trace,
  ): Promise<Result> => {
    assert(
      from === this.chainInterface,
      `${this.name}: notifyNewBlock from wrong chainInterface`,
    );
    const trace_ = trace.via(`${this.name}.notifyNewBlock`);
    const promises = this.newBlockCallbacks.map((callback) =>
      callback.run(block, `${this.name}.notifyNewBlock`, trace_),
    );
    return new Result(
      (await Promise.all(promises)).flat(),
      this.name,
      `initalNotifyUtxoEvents`,
      trace_,
    );
  };

  // public notifyAck = async (
  //   from: ChainInterface,
  //   txId: TxId,
  //   trace2: Trace,
  // ): Promise<Result> => {
  //   // throw new Error(
  //   //   `TODO FIXME (the Acks should be not all in one indiscriminate bag but per utxo/svm)`,
  //   // );
  //   assert(
  //     from === this.chainInterface,
  //     `${this.name}: notifyNewBlock from wrong chainInterface`,
  //   );
  //   let callbacks = this.ackCallbacks.get(txId)?.splice(0);
  //   const result: Result = [];
  //   while (callbacks?.length) {
  //     const promises = callbacks.map((callback) =>
  //       callback.run(txId, `${this.name}.notifyAck`, trace)
  //     );
  //     const results = await Promise.all(promises);
  //     for (const results_ of results) {
  //       result.push(...results_);
  //     }
  //     callbacks = this.ackCallbacks.get(txId)?.splice(0);
  //   }
  //   return result;
  // };

  /**
   *
   * @param tx
   * @param spentSvms
   * @param trace_
   */
  public submitUntippedTx = async <WT extends `servitor` | `owner`>(
    tx: TxSigned<WT>,
    // ackCallback: Callback<TxId>,
    trace: Trace,
  ): Promise<Result> => {
    this.log(`submitUntippedTx`);
    this.log(`submitting to chain interface`);
    assert(
      this.chainInterface,
      `${this.name}: no socketClient in dummy UtxoSource`,
    );
    const trace_ = trace.via(`${this.name}.submitUntippedTx`);
    // const txId = TxId.fromCoreBody(tx.txSigned.body());
    // const ackCallbacks = this.ackCallbacks.get(txId);
    // if (ackCallbacks) {
    //   ackCallbacks.push(ackCallback);
    // } else {
    //   this.ackCallbacks.set(txId, [ackCallback]);
    // }
    try {
      return await this.chainInterface.submitUntippedTx(tx.tx, trace_);
    } catch (e) {
      const msg = `untipped tx submission error: ${e}`;
      if (!handleTxSubmissionErrors) {
        this.throw(msg);
      }
      return new Result([msg], this.name, `submitUntippedTx`, trace_);
    }
  };

  /**
   *
   * @param txes
   * @param spentSvms
   * @param trace_
   */
  public submitTippedTxes = async (
    txes: CliqueTippedTx[],
    // ackCallback: Callback<TxId>,
    trace: Trace,
  ): Promise<Result> => {
    this.log(`submitTippedTxes`);
    assert(
      this.chainInterface,
      `${this.name}: no socketClient in dummy UtxoSource`,
    );
    const trace_ = trace.via(`${this.name}.submitTippedTxes`);
    // for (const tx of txes) {
    //   const vkeys = tx.tx.partiallySignedPayloadTx.witnessSet().vkeys()?.values();
    //   assert(vkeys, `submitTippedTxes: no vkeys in tipped tx`);
    //   for (const vkey of vkeys) {
    //     const vkey = vkeys.get(i).signature().to_bech32();
    //     this.log(`submitTippedTxes: payload vkey:`, vkey);
    //   }
    // }
    try {
      return await this.chainInterface.submitTippedTxes(txes, trace_);
    } catch (e) {
      const msg = `tipped tx submission error: ${e}`;
      if (!handleTxSubmissionErrors) {
        this.throw(msg);
      }
      return new Result([msg], this.name, `submitTippedTxes`, trace_);
    }
  };

  /**
   *
   * @param txes
   * @param spentSvms
   * @param trace_
   */
  public submitElectionTxes = async (
    txes: CliqueElectionTx[],
    trace: Trace,
  ): Promise<Result> => {
    this.log(`submitElectionTxes`);
    const trace_ = trace.via(`${this.name}.submitElectionTxes`);
    const errorTimeout = new ErrorTimeout(
      this.name,
      `submitElectionTxes`,
      callbackTimeoutMs! / 2,
      trace_.via(`${this.name}.submitElectionTxes`),
    );
    assert(
      this.chainInterface,
      `${this.name}: no socketClient in dummy UtxoSource`,
    );
    // for (const tx of txes) {
    //   const txId = TxId.fromCoreBody(
    //     tx.tx.partiallySignedElectionTx.body(),
    //   );
    //   const ackCallbacks = this.ackCallbacks.get(txId);
    //   if (ackCallbacks) {
    //     ackCallbacks.push(ackCallback);
    //   } else {
    //     this.ackCallbacks.set(txId, [ackCallback]);
    //   }
    // }
    try {
      const result = await this.chainInterface.submitElectionTxes(txes, trace_);
      errorTimeout.clear();
      return result;
    } catch (e) {
      const msg = `election-tx submission error: ${e}`;
      if (!handleTxSubmissionErrors) {
        this.throw(msg);
      }
      return new Result([msg], this.name, `submitElectionTxes`, trace_);
    }
  };

  /**
   *
   */
  public get isDummy(): boolean {
    return this.chainInterface === undefined;
  }

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
