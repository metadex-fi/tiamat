import assert from "assert";
import { Core, Kupmios } from "@blaze-cardano/sdk";
import {
  ChainInterface,
  UtxoEvent,
  UtxoEvents,
  UtxoSource,
} from "../state/utxoSource";
import { Callback, Result } from "../state/callback";
import { Semaphore } from "./semaphore";
import { Bech32Address, Trace, TxId, UtxoSet } from "../../utils/wrappers";
import { CliqueElectionTx, CliqueTippedTx } from "../state/messages";
import { Emulator, EmulatorProvider } from "@blaze-cardano/emulator";
import { Unwrapped } from "@blaze-cardano/ogmios";
import { errorTimeoutMs, queryLoopTimeoutMs } from "../../utils/constants";

// type TraceUtxo = Core.TransactionUnspentOutput//any; // TODO

interface UtxoDiff {
  created: UtxoSet;
  destroyed: UtxoSet;
}

/**
 *
 * @param olds
 * @param news
 */
const utxoDiff = (olds: UtxoSet, news: UtxoSet): UtxoDiff => {
  const created = UtxoSet.empty();
  const destroyed = UtxoSet.empty();

  // this.log(`utxoDiff olds:`, olds);
  // this.log(`utxoDiff news:`, news);

  // TODO could probably be somwhat more efficient
  for (const a of olds.list) {
    if (!news.has(a.core.input())) destroyed.insertNew(a.core, a.trace);
  }
  for (const a of news.list) {
    if (!olds.has(a.core.input())) created.insertNew(a.core, a.trace);
  }

  // this.log(`utxoDiff created:`, created);
  // this.log(`utxoDiff destroyed:`, destroyed);

  return { created, destroyed };
};

// the created ones will be forwarded by the regular mechanism
/**
 *
 * @param all
 * @param created
 */
const utxosCatchingUp = (all: UtxoSet, created: UtxoSet): UtxoSet => {
  const catchingUp = UtxoSet.empty();

  for (const a of all.list) {
    if (!created.has(a.core.input())) catchingUp.insertNew(a.core, a.trace);
  }

  return catchingUp;
};

/**
 *
 */
export class SocketKupmios implements ChainInterface {
  private static instances = new Map<string, number>();

  // "kupoUtxos" reflects Kupo's view of the chain,
  // "localUtxos" includes our local updates from "applyTxToLedger".
  private readonly kupoUtxos: Map<string, UtxoSet> = new Map();
  private readonly localUtxos = UtxoSet.empty();
  private readonly utxoSubscribers: Map<UtxoSource, Map<string, number>> =
    new Map();
  private readonly catchUpCallbacks: Map<string, Callback<UtxoEvents>[]> =
    new Map();
  private readonly blockSubscribers: Set<UtxoSource> = new Set();
  private queryLoopTimeoutID?: NodeJS.Timeout;
  private queryLoopActive = false;
  private blockHeight = -1;
  private readonly utxoSemaphore: Semaphore;
  private static singleton?: SocketKupmios;

  //////////////////////////////////////////
  // constructors

  /**
   *
   * @param name
   * @param getBlockHeight
   * @param getUnspentOutputs
   * @param provider
   */
  private constructor(
    private readonly name: string,
    private readonly getBlockHeight: () => Promise<number | null>,
    private readonly getUnspentOutputs: (
      address: Bech32Address,
    ) => Promise<UtxoSet>,
    private readonly provider: Kupmios | EmulatorProvider,
    // private readonly kupoUrl?: string,
  ) {
    const instance = SocketKupmios.instances.get(this.name) ?? 0;
    SocketKupmios.instances.set(this.name, instance + 1);
    if (instance) this.name = `${this.name}#${instance}`;
    this.utxoSemaphore = new Semaphore(`${this.name}.utxo`);
  }

  /**
   *
   * @param name
   * @param kupoUrl
   * @param ogmiosUrl
   */
  private static async newSocketKupmios(
    name: string,
    kupoUrl: string,
    ogmiosUrl: string,
  ): Promise<SocketKupmios> {
    const ogmios = await Unwrapped.Ogmios.new(ogmiosUrl);
    const kupmiosProvider = new Kupmios(kupoUrl, ogmios);
    /**
     *
     */
    const getBlockHeight = async (): Promise<number | null> => {
      const res = await fetch(`${kupoUrl}/blocks`);
      const blocks: any = await res.json();
      return blocks.length ? blocks[0].height : null;
    };
    /**
     *
     * @param address
     */
    const getUnspentOutputs = async (
      address: Bech32Address,
    ): Promise<UtxoSet> => {
      const res = await fetch(`${kupoUrl}/matches/${address.bech32}?unspent`);
      return res.json() as Promise<UtxoSet>;
    };
    return new SocketKupmios(
      `${name} SocketKupmios`,
      getBlockHeight,
      getUnspentOutputs,
      kupmiosProvider,
      // kupoUrl
    );
  }

  //////////////////////////////////////////
  // public endpoints

  /**
   *
   * @param name
   * @param emulator
   */
  public static newSocketEmulator(
    name: string,
    emulator: Emulator,
  ): SocketKupmios {
    const provider = new EmulatorProvider(emulator);
    /**
     *
     */
    const getBlockHeight = async (): Promise<number | null> => {
      return emulator.clock.block;
    };
    /**
     *
     * @param address
     */
    const getUnspentOutputs = async (
      address: Bech32Address,
    ): Promise<UtxoSet> => {
      const trace = Trace.source(`INPUT`, `SocketKupmios.getUnspentOutputs`);
      return UtxoSet.fromList(
        (await provider.getUnspentOutputs(address.blaze)).map((core) => {
          return {
            core,
            trace,
          };
        }),
      );
    };
    const socketEmulator = new SocketKupmios(
      `${name} SocketEmulator`,
      getBlockHeight,
      getUnspentOutputs,
      provider,
    );
    socketEmulator.startQueryLoop();
    return socketEmulator;
  }

  /**
   *
   * @param name
   * @param kupoUrl
   * @param ogmiosUrl
   */
  public static async newTestingInstance(
    name: string,
    kupoUrl: string,
    ogmiosUrl: string,
  ): Promise<SocketKupmios> {
    return await SocketKupmios.newSocketKupmios(name, kupoUrl, ogmiosUrl);
  }

  /**
   *
   * @param name
   * @param kupoUrl
   * @param ogmiosUrl
   */
  public static async createSingleton(
    name: string,
    kupoUrl: string,
    ogmiosUrl: string,
  ): Promise<SocketKupmios> {
    assert(!SocketKupmios.singleton, `singleton already exists`);
    SocketKupmios.singleton = await SocketKupmios.newSocketKupmios(
      name,
      kupoUrl,
      ogmiosUrl,
    );
    return SocketKupmios.singleton;
  }

  /**
   *
   */
  public static getSingleton(): SocketKupmios {
    assert(SocketKupmios.singleton, `singleton does not exist`);
    return SocketKupmios.singleton;
  }

  // public utxosAt = async (
  //   address: Bech32Address,
  // ): Promise<UtxoSet | undefined> => {
  //   const utxo = this.kupoUtxos.get(address);
  //   if (utxo === undefined) return undefined;
  //   return await this.kupmiosProvider.kupmiosUtxosToUtxos(coreUtxos);
  // };

  /**
   *
   * @param catchUpCallback
   * @param subscriber
   * @param toAddress
   */
  public subscribeToAddress = (
    catchUpCallback: Callback<UtxoEvents>,
    subscriber: UtxoSource,
    toAddress: Bech32Address,
  ) => {
    let subscriptions = this.utxoSubscribers.get(subscriber);
    if (!subscriptions) {
      subscriptions = new Map();
      this.utxoSubscribers.set(subscriber, subscriptions);
    }
    const address = toAddress.bech32;
    const count = subscriptions.get(address) ?? 0;
    subscriptions.set(address, count + 1);

    if (!this.kupoUtxos.has(address)) {
      this.kupoUtxos.set(address, UtxoSet.empty());
    }

    const catchUpCallbacks = this.catchUpCallbacks.get(address);
    if (catchUpCallbacks) {
      catchUpCallbacks.push(catchUpCallback);
    } else {
      this.catchUpCallbacks.set(address, [catchUpCallback]);
    }
  };

  /**
   *
   * @param subscriber
   * @param fromAddress
   */
  public unsubscribeFromAddress = (
    subscriber: UtxoSource,
    fromAddress: Bech32Address,
  ) => {
    const subscriptions = this.utxoSubscribers.get(subscriber);
    assert(subscriptions, `${this.name}: no subscriptions for ${subscriber}`);
    const address = fromAddress.bech32;
    const count = subscriptions.get(address);
    assert(
      count,
      `${this.name}: no subscriptions from ${subscriber} for ${address}`,
    );
    if (count === 1) {
      subscriptions.delete(address);
      if (subscriptions.size === 0) {
        this.utxoSubscribers.delete(subscriber);
      }
    } else {
      subscriptions.set(address, count - 1);
    }
  };

  /**
   *
   * @param subscriber
   */
  public subscribeToNewBlock = (subscriber: UtxoSource) => {
    this.blockSubscribers.add(subscriber);
    this.log(
      `subscribeToBlockHeight: ${this.blockSubscribers.size} subscribers`,
    );
  };

  /**
   *
   * @param _subscriber
   */
  public subscribeToAck = (_subscriber: UtxoSource) => {
    this.log(`subscribeToAck: ignored by SocketKupmios`);
  };

  /**
   *
   * @param tx
   * @param trace
   */
  public submitUntippedTx = async (
    tx: Core.Transaction, // common denominator of TxSigned (our own) and Core.TxCBOR (from the wire)
    trace: Trace,
  ): Promise<Result> => {
    this.log("submitting untipped tx");
    const trace_ = trace.via(`${this.name}.submitUntippedTx`);
    try {
      // const txHex = Core.toHex(tx.to_bytes());
      const txId = await this.provider.postTransactionToChain(tx);
      // await this.provider.awaitTransactionConfirmation(txId); // NOTE waits for a new block (in kupmios as well) which is too slow
      this.log(`submitUntippedTx - submitted ${txId}`);
      return new Result(
        [`submitted ${txId}`],
        this.name,
        `submitUntippedTx`,
        trace_,
      );
    } catch (err) {
      const msg = `submitUntippedTx: ERROR\n${trace_.toString()}\n${err}`;
      this.throw(msg);
      return new Result([msg], this.name, `submitUntippedTx`, trace_);
    }
  };

  /**
   *
   * @param _txes
   * @param _trace
   */
  public submitTippedTxes = (
    _txes: CliqueTippedTx[],
    _trace: Trace,
  ): Promise<Result> => {
    // TODO inelegant
    throw new Error(
      `${this.name}.submitTippedTxes: don't submit unfinished txes to chain`,
    );
  };

  /**
   *
   * @param _txes
   * @param _trace
   */
  public submitElectionTxes = (
    _txes: CliqueElectionTx[],
    _trace: Trace,
  ): Promise<Result> => {
    // TODO inelegant
    throw new Error(
      `${this.name}.submitElectionTxes: don't submit unfinished txes to chain`,
    );
  };

  /**
   *
   * @param tx
   * @param updateOutputs
   * @param trace
   */
  public applyTxToLedger = async (
    tx: Core.Transaction, // common denominator of TxSigned (our own) and Core.TxCBOR (from the wire)
    updateOutputs: boolean, // for tipping-tx we got ambiguity, so we don't create utxos here
    trace: Trace,
  ): Promise<Result> => {
    const trace_ = trace.via(`${this.name}.applyTxToLedger`);
    const destroyed = UtxoSet.empty();
    const inputs = tx.body().inputs().values();
    for (const input of inputs) {
      const utxo = this.localUtxos.get(input);
      assert(
        utxo,
        `${this.name}.applyTxToLedger: input not found in ledger: ${input.transactionId()}:${input.index()}`,
      );
      destroyed.insertNew(utxo.core, utxo.trace);
    }

    const created = UtxoSet.empty();
    if (updateOutputs) {
      const txId = TxId.fromTransaction(tx);
      for (const [index, output] of tx.body().outputs().entries()) {
        created.insertNew(
          new Core.TransactionUnspentOutput(
            new Core.TransactionInput(txId.txId, BigInt(index)),
            output,
          ),
          trace_,
        );
      }
    }

    const events = this.updateLedger({ created, destroyed }, true);
    if (events.length) {
      const promises: Promise<Result>[] = [];
      const events_ = new UtxoEvents(
        events,
        Date.now(),
        `${this.name}.applyTxToLedger`,
      );
      for (const [sub, _] of this.utxoSubscribers) {
        promises.push(
          sub.notifyUtxoEvents(
            this,
            events_,
            trace_.via(`${this.name}.applyTxToLedger.notifyUtxoEvents`),
          ),
        );
      }
      return new Result(
        (await Promise.all(promises)).flat(),
        this.name,
        `applyTxToLedger`,
        trace_,
      );
    }
    return new Result([], this.name, `applyTxToLedger`, trace_);
  };

  /**
   *
   * @param from
   */
  public latchUtxoSemaphore = async (from: string): Promise<string> => {
    // assert(!this.utxoSemaphore, `utxoSemaphore busy`);
    // this.log(`SocketEmulator.latchUtxoSemaphore`);
    // this.utxoSemaphore = true;
    const id = await this.utxoSemaphore.latch(from);
    return id;
  };

  /**
   *
   * @param id
   */
  public dischargeUtxoSemaphore = (id: string) => {
    // assert(this.utxoSemaphore, `utxoSemaphore free`);
    // this.log(`SocketEmulator.dischargeUtxoSemaphore`);
    // this.utxoSemaphore = false;
    this.utxoSemaphore.discharge(id);
  };

  /**
   *
   */
  public startQueryLoop = async () => {
    this.queryLoopActive = true;
    while (this.queryLoopActive) {
      // const result = await Promise.all([
      //   this.queryNewBlock(),
      //   this.queryAddressUtxos(),
      // ]);
      // result.forEach((r) => r.forEach((r_) => this.log(r_)));

      this.queryNewBlock().then((result) =>
        result.burn().forEach((r) => this.log(r)),
      );
      this.queryAddressUtxos().then((result) =>
        result.burn().forEach((r) => this.log(r)),
      );

      await new Promise(
        (resolve) =>
          (this.queryLoopTimeoutID = setTimeout(resolve, queryLoopTimeoutMs)),
      );
    }
  };

  /**
   *
   */
  public stopQueryLoop = () => {
    this.queryLoopActive = false;
    clearTimeout(this.queryLoopTimeoutID);
    this.queryLoopTimeoutID = undefined;
  };

  //////////////////////////////////////////
  // internal methods

  /**
   *
   */
  private queryNewBlock = async (): Promise<Result> => {
    const blockHeight = await this.getBlockHeight();
    const trace = Trace.source(`CHAIN`, `${this.name}.queryNewBlock`);
    if (blockHeight === null) {
      return new Result(
        ["not connected or synced"],
        this.name,
        `queryNewBlock`,
        trace,
      );
    }
    if (blockHeight !== this.blockHeight) {
      this.blockHeight = blockHeight;
      const promises: Promise<Result>[] = [];
      this.blockSubscribers.forEach((sub) =>
        promises.push(sub.notifyNewBlock(this, blockHeight, trace)),
      );
      return new Result(
        (await Promise.all(promises)).flat(),
        this.name,
        `queryNewBlock`,
        trace,
      );
    }
    return new Result([], this.name, `queryNewBlock`, trace);
  };

  /**
   *
   */
  private queryAddressUtxos = async (): Promise<Result> => {
    const promises: Promise<Result[]>[] = [];
    const events = new UtxoEvents(
      [],
      Date.now(),
      `${this.name}.queryAddressUtxos`,
    );
    for (const [address, currentUtxos] of this.kupoUtxos) {
      // this.log(`queryAddressUtxos: ${address}`);
      promises.push(
        this.getUnspentOutputs(
          Bech32Address.fromBech32(`${this.name}.queryAddressUtxos`, address),
        ).then(async (kupoUtxos: UtxoSet) => {
          // this.log(`coreUtxos: ${coreUtxos.length} at ${address}`);
          const diff = utxoDiff(currentUtxos, kupoUtxos);

          let catchUpResult: Result[] = [];
          const catchUpCallbacks = this.catchUpCallbacks.get(address);
          if (catchUpCallbacks) {
            const catchingUp = utxosCatchingUp(kupoUtxos, diff.created);
            // const utxos = await this.provider.kupmiosUtxosToUtxos(catchingUp);

            const events_ = new UtxoEvents(
              catchingUp.list.map((utxo) => ({
                utxo: utxo.core,
                type: "create",
              })),
              Date.now(),
              `${this.name}.queryAddressUtxos.catchUpCallbacks`,
            );
            const trace = Trace.source(
              `CHAIN`,
              `${this.name}.queryAddressUtxos.catchUpCallbacks`,
            );
            const catchUpPromises: Promise<Result>[] = [];
            catchUpCallbacks.forEach((cb) =>
              catchUpPromises.push(
                cb.run(events_, `${this.name}.queryAddressUtxos`, trace),
              ),
            );
            this.catchUpCallbacks.delete(address);
            catchUpResult = await Promise.all(catchUpPromises);
          }

          if (diff.created.size || diff.destroyed.size) {
            this.kupoUtxos.set(address, kupoUtxos);
            // const [created, destroyed] = await Promise.all([
            //   this.provider.kupmiosUtxosToUtxos(diff.created),
            //   this.provider.kupmiosUtxosToUtxos(diff.destroyed),
            // ]);

            this.log(
              `queryAddressUtxos: ${diff.created.size} created, ${diff.destroyed.size} destroyed at ${address.slice(
                -4,
              )}`,
            );
            events.events.push(...this.updateLedger(diff, false));
          }

          return catchUpResult;
        }),
      );
    }

    // this.log(
    //   `queryAddressUtxos: ${promises.length} promises, ${this.coreUtxos.size} addresses`,
    // );

    const result: Result[] = (await Promise.all(promises)).flat();
    if (events.events.length) {
      this.log(
        `queryAddressUtxos: ${events.events.length} events, ${this.utxoSubscribers.size} subscribers`,
      );
      const promises_: Promise<Result>[] = [];
      const trace = Trace.source(
        `CHAIN`,
        `${this.name}.queryAddressUtxos.notifyUtxoEvents`,
      );
      for (const [sub, _] of this.utxoSubscribers) {
        promises_.push(sub.notifyUtxoEvents(this, events, trace));
      }
      const result_ = await Promise.all(promises_);
      result.push(...result_);
    }

    // if (this.queryLoopActive) {
    //   this.queryLoopTimeoutID = setTimeout(
    //     () =>
    //       this.queryAddressUtxos().then((result) =>
    //         result.forEach((r) => this.log(r))
    //       ),
    //     queryLoopTimeoutMs,
    //   );
    // }
    return new Result(
      result,
      this.name,
      `queryAddressUtxos`,
      Trace.source(`CHAIN`, `${this.name}.queryAddressUtxos`),
    );
  };

  // TODO messy as fuck
  // private queryAddressUtxos = async (retries = 1000) => {
  //   const promises: Promise<void>[] = [];
  //   const events: UtxoEvents = [];

  //   for (const [address, currentUtxos] of this.coreUtxos) {
  //     const url = `${this.kupoUrl}/matches/${address}?unspent`;

  //     const fetchWithRetry = async (url: string, attempt = 1): Promise<UtxoSet> => {
  //       try {
  //         this.log(`Attempt ${attempt}: Fetching UTXOs from ${url}`);
  //         const response = await fetch(url);
  //         const responseBody = await response.text(); // Get response body as text to handle different content types

  //         if (!response.ok) {
  //           this(`HTTP error! Status: ${response.status}, Response: ${responseBody}`);
  //         }

  //         try {
  //           return JSON.parse(responseBody); // Try to parse the response body as JSON
  //         } catch (parseError) {
  //           this(`Failed to parse JSON response: ${responseBody}`);
  //         }
  //       } catch (error) {
  //         this.error(`Attempt ${attempt} failed: ${error.message}`);
  //         if (attempt < retries) {
  //           this.log(`Retrying... (${attempt + 1}/${retries})`);
  //           await new Promise(resolve => setTimeout(resolve, 1000)); // wait for 1 second before retrying
  //           return fetchWithRetry(url, attempt + 1);
  //         } else {
  //           this(`Failed to fetch after ${retries} attempts. Last error: ${error.message}`);
  //         }
  //       }
  //     };

  //     promises.push(
  //       fetchWithRetry(url).then(async (coreUtxos: UtxoSet) => {
  //         const utxoDiff = utxoDiff(currentUtxos, coreUtxos);
  //         if (utxoDiff.created.length || utxoDiff.destroyed.length) {
  //           this.coreUtxos.set(address, coreUtxos);
  //           const [created, destroyed] = await Promise.all([
  //             this.kupmiosProvider.kupmiosUtxosToUtxos(utxoDiff.created),
  //             this.kupmiosProvider.kupmiosUtxosToUtxos(utxoDiff.destroyed),
  //           ]);

  //           events.push(...this.updateLedger(destroyed, created));
  //         }
  //       })
  //     );
  //   }

  //   await Promise.all(promises);

  //   if (events.length) {
  //     this.log(`queryAddressUtxos: ${events.length} events, ${this.subscribers.size} subscribers`);
  //     this.subscribers.forEach((sub) => sub.notify(this, events));
  //   }
  // };

  // private semaphoreOpen = (): boolean => {
  //   return !this.utxoSemaphore;
  // };

  /**
   *
   * @param diff
   * @param strict
   */
  private updateLedger = (diff: UtxoDiff, strict: boolean): UtxoEvent[] => {
    const events: UtxoEvent[] = [];

    this.log(
      `updateLedger: ${diff.created.size} created, ${diff.destroyed.size} destroyed`,
    );

    diff.destroyed.list.forEach((utxo) => {
      // it can happen that a local update deletes an utxo that kupo
      // then also tries to delete once it updates, to account for that
      // we allow some slack.
      const deleted = this.localUtxos.delete(utxo.core.input());
      if (deleted) {
        events.push({
          utxo: utxo.core,
          type: "destroy",
        });
      } else if (strict) {
        this.throw(
          `updateLedger.destroyed - input not found: ${utxo.core.input().transactionId()}:${utxo.core.input().index()}`,
        );
      }
    });

    diff.created.list.forEach((utxo) => {
      // same here.
      const inserted = this.localUtxos.insert(utxo.core, utxo.trace);
      if (inserted) {
        events.push({
          utxo: utxo.core,
          type: "create",
        });
      } else if (strict) {
        this.throw(
          `updateLedger.created - input exists: ${utxo.core.input().transactionId()}:${utxo.core.input().index()}`,
        );
      }
    });

    return events;
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
