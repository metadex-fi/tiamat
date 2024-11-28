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
  private constructor(public readonly blaze: Core.Address) {}

  /**
   *
   */
  public get bech32(): Core.PaymentAddress | Core.RewardAccount {
    if (!this.bech32Cache) {
      this.bech32Cache = this.blaze.toBech32();
    }
    return this.bech32Cache;
  }

  /**
   *
   * @param address
   */
  static fromBlaze = (address: Core.Address) => {
    return new Bech32Address(address);
  };

  /**
   *
   * @param bech32
   */
  static fromBech32 = (bech32: string) => {
    const address = Core.Address.fromBech32(bech32);
    return this.fromBlaze(address);
  };

  /**
   *
   * @param wallet
   */
  static fromHotWallet = async (wallet: HotWallet): Promise<Bech32Address> => {
    const addresses = await wallet.getUsedAddresses();
    assert(
      addresses.length === 1,
      `Bech32Address.fromHotWallet: expected exactly one address, got ${addresses.length}`,
    );
    const address = addresses[0]!;
    return this.fromBlaze(address);
  };

  /**
   *
   * @param networkId
   * @param script
   */
  static fromScript = (
    networkId: Core.NetworkId,
    script: Core.Script,
  ): Bech32Address => {
    const address = Core.addressFromValidator(networkId, script);
    return this.fromBlaze(address);
  };

  /**
   *
   * @param utxo
   */
  static fromUtxo = (utxo: CoreUtxo): Bech32Address => {
    const address = utxo.output().address();
    return this.fromBlaze(address);
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
