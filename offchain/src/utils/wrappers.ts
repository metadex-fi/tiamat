import { Core, Provider, Wallet, HotWallet } from "@blaze-cardano/sdk";
import assert from "assert";
import {
  Trace,
  Tx as OilTx,
  TxCompleat as OilTxCompleat,
  TxId,
  TxSigned,
  UtxoSet,
  TraceUtxo,
  CoreUtxo,
} from "../../../../oil/src/🕯️";
export { Trace, TxId, TxSigned, UtxoSet, TraceUtxo, CoreUtxo };

/**
 *
 */
export class Bech32Address {
  private bech32Cache: Core.PaymentAddress | Core.RewardAccount | undefined;
  /**
   *
   * @param blaze
   */
  private constructor(
    public readonly name: string,
    public readonly blaze: Core.Address,
  ) {}

  /**
   *
   */
  public get bech32(): Core.PaymentAddress | Core.RewardAccount {
    if (!this.bech32Cache) {
      this.bech32Cache = this.blaze.toBech32();
    }
    return this.bech32Cache;
  }

  public concise = () => {
    const bech32 = this.bech32.toString();
    return `${this.name} (${bech32.slice(0, 4)}...${bech32.slice(-4)})`;
  };

  /**
   *
   * @param address
   */
  static fromBlaze = (name: string, address: Core.Address) => {
    return new Bech32Address(name, address);
  };

  /**
   *
   * @param bech32
   */
  static fromBech32 = (name: string, bech32: string) => {
    const address = Core.Address.fromBech32(bech32);
    return this.fromBlaze(name, address);
  };

  /**
   *
   * @param wallet
   */
  static fromHotWallet = async (
    name: string,
    wallet: HotWallet,
  ): Promise<Bech32Address> => {
    const addresses = await wallet.getUsedAddresses();
    assert(
      addresses.length === 1,
      `Bech32Address.fromHotWallet: expected exactly one address, got ${addresses.length}`,
    );
    const address = addresses[0]!;
    return this.fromBlaze(name, address);
  };

  /**
   *
   * @param networkId
   * @param script
   */
  static fromScript = (
    name: string,
    networkId: Core.NetworkId,
    script: Core.Script,
  ): Bech32Address => {
    const address = Core.addressFromValidator(networkId, script);
    return this.fromBlaze(name, address);
  };

  /**
   *
   * @param utxo
   */
  static fromUtxo = (name: string, utxo: CoreUtxo): Bech32Address => {
    const address = utxo.output().address();
    return this.fromBlaze(name, address);
  };
}

export type P = Provider;
export type W = Wallet;

/**
 *
 */
export class Tx extends OilTx<P, W> {}
/**
 *
 */
export class TxCompleat extends OilTxCompleat<P, W> {}
