import assert from "assert";
import { Simplephore } from "../agents/semaphore";
import { Sent, UtxoEvent, UtxoEvents, UtxoSource } from "./utxoSource";
import { Callback } from "./callback";
import { Bech32Address, Trace, Tx, UtxoSet } from "../../utils/wrappers";
import {
  Blaze,
  Wallet as BlazeWallet,
  Core,
  Provider,
} from "@blaze-cardano/sdk";
import { AssocMap } from "../../types/general/fundamental/container/map";
import { WalletFundsStem, WalletUtxosStem } from "../data/stem";

/**
 *
 */
export class Wallet {
  private static instances = new Map<string, number>();
  public readonly name: string;

  private available = UtxoSet.empty();
  private readonly funds = new Map<Core.AssetId, bigint>();

  private readonly eventsSemaphore: Simplephore;
  private readonly eventQueue: UtxoEvents[] = [];

  private utxoSetCallbacks: Callback<UtxoSet>[] = [];
  private fundsCallbacks: Callback<Map<Core.AssetId, bigint>>[] = [];

  // Abusing AssocMap as set here.
  private readonly walletSubscriptions = new Map<
    BlazeWallet,
    AssocMap<Bech32Address, true>
  >();
  private subscribedToWallets = false;

  /**
   *
   * @param name
   * @param blaze
   * @param walletOrAddress
   * @param contract
   * @param processEvent_
   */
  constructor(
    name: string,
    private readonly blaze: Blaze<Provider, BlazeWallet>,
    forWalletOrAddress: `allWalletAddresses` | Bech32Address,
    private readonly utxoSource: UtxoSource,
  ) {
    this.name = `${name} Wallet`;
    const instance = Wallet.instances.get(name) ?? 0;
    Wallet.instances.set(this.name, instance + 1);
    if (instance) this.name = `${this.name}#${instance}`;

    this.eventsSemaphore = new Simplephore(`${this.name} Events`);

    const callback = new Callback<UtxoEvents>(
      `always`,
      [this.name, `constructor`],
      async (utxoEvents, trace) => {
        if (this.eventsSemaphore.busy) {
          this.eventQueue.push(utxoEvents);
          return await Promise.resolve([`${this.name} - busy`]);
        } else {
          const eventsID = this.eventsSemaphore.latch(
            `${this.name}.constructor.subscribeToWalletUtxos`,
          );
          this.processEvents([utxoEvents]);
          let nextEvents = this.eventQueue.splice(0);
          while (nextEvents.length) {
            this.processEvents(nextEvents);
            nextEvents = this.eventQueue.splice(0);
          }
          this.eventsSemaphore.discharge(eventsID);
          const result = await this.processCallbacks(
            trace.calledFrom(this.name, `constructor`),
          );
          result.push(
            `${this.name}: processed ${utxoEvents.events.length} events`,
          );
          return result;
        }
      },
    );

    if (forWalletOrAddress === `allWalletAddresses`) {
      this.subscribeToWalletUtxos(blaze.wallet, callback);
    } else {
      this.subscribeToAddressUtxos(forWalletOrAddress, callback);
    }
  }

  /**
   *
   * @param callback
   */
  public innervateUtxosStem = async (
    stem: WalletUtxosStem,
    callback: Callback<UtxoSet>,
  ): Promise<(string | Sent)[]> => {
    this.log(`subscribing to utxo set:`, callback.show());
    assert(
      stem instanceof WalletUtxosStem,
      `${this.name}.subscribeToUtxoSet: expected WalletUtxosStem`,
    );
    this.utxoSetCallbacks.push(callback);
    const result = await callback.run(
      this.available,
      `${this.name}.subscribe.catchUp`,
      Trace.source(`SUB`, `${this.name}.subscribe`),
    );
    return result;
  };

  /**
   *
   * @param callback
   */
  public innervateFundsStem = async (
    stem: WalletFundsStem,
    callback: Callback<Map<Core.AssetId, bigint>>,
  ): Promise<(string | Sent)[]> => {
    this.log(`subscribing to funds:`, callback.show());
    assert(
      stem instanceof WalletFundsStem,
      `${this.name}.subscribeToFunds: expected WalletFundsStem`,
    );
    this.fundsCallbacks.push(callback);
    const result = await callback.run(
      this.funds,
      `${this.name}.subscribe.catchUp`,
      Trace.source(`SUB`, `${this.name}.subscribe`),
    );
    return result;
  };

  public newTx = async (): Promise<Tx> => {
    return new Tx(this.blaze, this.available.clone());
  };

  /**
   *
   * @param walletOrAddress
   * @param callback
   */
  private subscribeToWalletUtxos = (
    wallet: BlazeWallet,
    callback: Callback<UtxoEvents>,
  ) => {
    /*
    if we get a single address, we proceed as before.
    (some wallet types have only one address)

    if we get a full wallet with potentially multiple addresses,
    we instead subscribe to that.
    */
    this.log(`subscribed to utxos of entire wallet`);
    this.subscribeToWalletAddresses(wallet, callback);
  };

  /**
   *
   * @param walletOrAddress
   * @param callback
   */
  private subscribeToAddressUtxos = (
    address: Bech32Address,
    callback: Callback<UtxoEvents>,
  ) => {
    /*
      if we get a single address, we proceed as before.
      (some wallet types have only one address)
  
      if we get a full wallet with potentially multiple addresses,
      we instead subscribe to that.
      */
    this.log(`subscribed to utxos of single address`);
    this.subscribeToAddress(address, callback);
  };

  /**
   *
   * @param wallet
   * @param callback
   */
  private subscribeToWalletAddresses = async (
    wallet: BlazeWallet,
    callback: Callback<UtxoEvents>,
  ) => {
    this.log(`subscribing to addresses of wallet`);
    const alreadySubscribed = this.walletSubscriptions.has(wallet);
    if (alreadySubscribed) {
      this.log(`already subscribed to this wallet's addresses`);
      return;
    }
    const walletAddresses = await wallet.getUsedAddresses();
    const recordedAddresses = new AssocMap<Bech32Address, true>(
      (a) => a.bech32,
    );
    let i = 0;
    for (const walletAddress of walletAddresses) {
      const recordedAddress = Bech32Address.fromBlaze(
        `${this.name} address #${i++}`,
        walletAddress,
      );
      recordedAddresses.set(recordedAddress, true);
      this.subscribeToAddress(recordedAddress, callback);
    }
    this.walletSubscriptions.set(wallet, recordedAddresses);

    if (this.subscribedToWallets) return;
    this.subscribedToWallets = true;
    this.utxoSource.subscribeToNewBlock(
      this,
      new Callback(
        `always`,
        [this.name, `subscribeToWalletAddresses`],
        async (_block, _trace) => {
          let updated = 0;
          let i = 0;
          for (const [wallet, recordedAddresses] of this.walletSubscriptions) {
            const walletAddresses = await wallet.getUsedAddresses();
            let j = 0;
            for (const walletAddress of walletAddresses) {
              const recordedAddress = Bech32Address.fromBlaze(
                `${this.name} subscription #${i++}  address #${j++}`,
                walletAddress,
              );
              if (recordedAddresses.has(recordedAddress)) continue;
              recordedAddresses.set(recordedAddress, true);
              this.subscribeToAddress(recordedAddress, callback);
              updated++;
            }
          }
          return [`added ${updated} wallet address subscriptions`];
        },
      ),
    );
  };

  /**
   *
   * @param address
   * @param callback
   */
  private subscribeToAddress = (
    address: Bech32Address,
    callback: Callback<UtxoEvents>,
  ) => {
    const concise = address.concise();
    this.log(`subscribed to utxos of ${concise}`);
    this.utxoSource.subscribeToAddress(
      this,
      address,
      new Callback(
        callback.perform,
        [this.name, `subscribeToAddress`, concise],
        async (walletUtxos, trace) => {
          return await callback.run(
            walletUtxos,
            `${this.name}.subscribeToAddress(${concise})`,
            trace,
          );
        },
      ),
    );
  };

  /**
   *
   * @param utxoEvents
   */
  private processEvents = (utxoEvents: UtxoEvents[]) => {
    for (const events of utxoEvents) {
      for (const event of events.events) {
        // assert(
        //   event.utxo.address === this.address,
        //   `${this.name} processEvents: wrong address:\n${event.utxo.address}\n!==\n${this.address}`
        // );
        this.processEventUtxos(event);
        this.processEventFunds(event);
      }
    }
  };

  /**
   *
   * @param event
   */
  private processEventUtxos = (event: UtxoEvent) => {
    this.log(`processing event`, event);
    if (event.type === `create`) {
      const exists = this.available.list.some(
        (utxo) =>
          utxo.core.input().transactionId() ===
            event.utxo.input().transactionId() &&
          utxo.core.input().index() === event.utxo.input().index(),
      );
      assert(
        !exists,
        `${this.name}: utxo already exists: ${event.utxo.input().transactionId()}:${event.utxo.input().index()}`,
      );
      this.available.insertNew(
        event.utxo,
        Trace.source(`INPUT`, `Wallet.processEvent.create`),
      );
    } else {
      assert(event.type === "destroy", `unexpected event type ${event.type}`);
      const available = this.available.except([event.utxo.input()]);
      this.available = available.posterior;
      assert(
        available.deleted.size === 1,
        `${this.name}: expected exactly one utxo, but found ${available.deleted.size} in available`,
      );
    }
  };

  private processEventFunds = (event: UtxoEvent) => {
    const value = event.utxo.output().amount();
    const assets = value.multiasset();
    if (assets) {
      for (const [asset, delta] of assets) {
        // if (asset.startsWith(lpTokenCurrency)) {
        //   this.log(`subscribeToOwnerFunds: ignoring lp-token`); // TODO handle this
        //   continue;
        // }
        const balance = this.funds.get(asset) ?? 0n;
        if (event.type === `create`) {
          const newBalance = balance + delta;
          this.funds.set(asset, newBalance);
        } else {
          assert(
            balance >= delta,
            `${this.name} - subscribeToOwnerFunds: negative balance: ${
              balance - delta
            }`,
          );
          const newBalance = balance - delta;
          assert(
            newBalance >= 0n,
            `${this.name} - subscribeToOwnerFunds: negative balance: ${newBalance}`,
          );
          if (newBalance) this.funds.set(asset, newBalance);
          else this.funds.delete(asset);
        }
      }
    }
  };

  private processCallbacks = async (
    trace: Trace,
  ): Promise<(string | Sent)[]> => {
    return (
      await Promise.all([
        this.processUtxoSetCallbacks(trace),
        this.processFundsCallbacks(trace),
      ])
    ).flat();
  };

  private processUtxoSetCallbacks = async (
    trace: Trace,
  ): Promise<(string | Sent)[]> => {
    this.log(`processing ${this.utxoSetCallbacks.length} utxoSetCallbacks`);
    const callbacks_: Callback<UtxoSet>[] = [];
    const result = (
      await Promise.all(
        this.utxoSetCallbacks.map((callback) => {
          if (callback.perform === `always`) {
            callbacks_.push(callback);
          }
          return callback.run(
            this.available,
            `${this.name}.processUtxoSetCallbacks`,
            trace,
          );
        }),
      )
    ).flat();
    this.utxoSetCallbacks = callbacks_;
    this.log(`keeping ${this.utxoSetCallbacks.length} utxoSetCallbacks`);
    return result;
  };

  private processFundsCallbacks = async (
    trace: Trace,
  ): Promise<(string | Sent)[]> => {
    this.log(`processing ${this.fundsCallbacks.length} fundsCallbacks`);
    const callbacks_: Callback<Map<Core.AssetId, bigint>>[] = [];
    const result = (
      await Promise.all(
        this.fundsCallbacks.map((callback) => {
          if (callback.perform === `always`) {
            callbacks_.push(callback);
          }
          return callback.run(
            this.funds,
            `${this.name}.processFundsCallbacks`,
            trace,
          );
        }),
      )
    ).flat();
    this.fundsCallbacks = callbacks_;
    this.log(`keeping ${this.fundsCallbacks.length} fundsCallbacks`);
    return result;
  };

  /**
   *
   * @param msg
   * @param {...any} args
   */
  private log = (msg: string, ...args: any) => {
    console.log(`[${this.name}] ${msg}`, ...args, `\n`);
  };

  // /**
  //  *
  //  * @param msg
  //  */
  // private throw = (msg: string) => {
  //   this.log(`ERROR: ${msg}\n`);
  //   if (errorTimeoutMs === null) {
  //     throw new Error(`${this.name} ERROR: ${msg}\n`);
  //   } else {
  //     setTimeout(() => {
  //       throw new Error(`${this.name} ERROR: ${msg}\n`);
  //     }, errorTimeoutMs);
  //   }
  // };
}
