import assert from "assert";
import { Core } from "@blaze-cardano/sdk";
import { AssocMap } from "../../fundamental/container/map";
import { PWrapped } from "../../fundamental/container/wrapped";
import { Asset } from "../asset/asset";
import { Assets } from "../asset/assets";
import { Currency } from "../asset/currency";
import { Token } from "../asset/token";
import { PValue, Value } from "./value";
import { PNonneg } from "../bounded/nonneg";

/**
 *
 */
export class NonnegValue {
  public readonly typus = "NonnegValue";
  /**
   *
   * @param value
   */
  constructor(private value = new Value()) {
    assert(value.nonnegative, `value must be nonnegative: ${value.show()}`);
  }

  /**
   *
   * @param asset
   * @param amount
   */
  public initAmountOf = (asset: Asset, amount: bigint): void => {
    assert(
      amount >= 0n,
      `initAmountOf: amount must be nonnegative, got ${amount} for asset ${asset.show()}`,
    );
    this.value?.initAmountOf(asset, amount);
  };

  /**
   *
   * @param tabs
   */
  public concise = (tabs = ""): string => `+${this.value.concise(tabs)}`;
  /**
   *
   * @param tabs
   */
  public show = (tabs = ""): string =>
    `NonnegValue (\n${this.value.show(tabs)}\n)`;
  /**
   *
   */
  public get toMap() {
    return this.value.toMap;
  }
  /**
   *
   */
  public get assets(): Assets {
    return this.value.assets;
  }
  /**
   *
   */
  public get unsigned(): Value {
    return new Value(this.value.toMap);
  }
  /**
   *
   */
  public get unit(): Value {
    return this.value.unit;
  }
  /**
   *
   */
  public get zeroed(): Value {
    return this.value.zeroed;
  }
  /**
   *
   */
  public get size(): bigint {
    return this.value.size;
  }
  /**
   *
   */
  public get headAsset(): Asset {
    return this.value.headAsset;
  }
  /**
   *
   */
  public get smallestAmount(): bigint {
    return this.value.smallestAmount;
  }
  /**
   *
   */
  public get biggestAmount(): bigint {
    return this.value.biggestAmount;
  }

  /**
   *
   * @param asset
   * @param defaultAmnt
   */
  public amountOf = (asset: Asset, defaultAmnt?: bigint): bigint =>
    this.value.amountOf(asset, defaultAmnt);
  /**
   *
   * @param asset
   */
  public drop = (asset: Asset): void => this.value.drop(asset);
  /**
   *
   * @param assets
   */
  public ofAssets = (assets: Assets): NonnegValue => {
    return new NonnegValue(this.value.ofAssets(assets));
  };
  /**
   *
   * @param other
   */
  public intersect = (other: NonnegValue): NonnegValue => {
    return new NonnegValue(this.value.intersect(other.value));
  };
  /**
   *
   * @param asset
   * @param amount
   */
  public updateAmountOf = (asset: Asset, amount: bigint): void => {
    assert(
      amount >= 0n,
      `updateAmountOf: amount must be nonnegative, got ${amount}`,
    );
    this.value.updateAmountOf(asset, amount);
  };

  /**
   *
   */
  public get clone(): NonnegValue {
    return new NonnegValue(this.value.clone);
  }
  /**
   *
   * @param asset
   */
  public has = (asset: Asset): boolean => this.value.has(asset);

  // public fill = (assets: Assets, amount: bigint): NonnegValue => {
  //   assert(amount >= 0n, `fill: amount must be nonnegative, got ${amount}`);
  //   return new NonnegValue(this.value.fill(assets, amount));
  // };

  /**
   *
   * @param asset
   * @param amount
   */
  public addAmountOf = (asset: Asset, amount: bigint): void => {
    if (this.has(asset)) this.increaseAmountOf(asset, amount);
    else this.initAmountOf(asset, amount);
  };

  /**
   *
   * @param asset
   * @param amount
   */
  public increaseAmountOf = (asset: Asset, amount: bigint): void => {
    const newAmount = this.amountOf(asset) + amount;
    assert(
      newAmount >= 0n,
      `addAmountOf: newAmount must be nonnegative, got ${this.amountOf(
        asset,
      )} - ${amount} = ${newAmount}`,
    );
    if (newAmount === 0n) {
      this.value.drop(asset);
    } else {
      this.value.updateAmountOf(asset, newAmount);
    }
  };

  /**
   *
   * @param other
   */
  public plus = (other: NonnegValue): NonnegValue => {
    return new NonnegValue(Value.add(this.unsigned, other.unsigned));
  };
  /**
   *
   * @param other
   */
  public normedPlus = (other: NonnegValue): NonnegValue => {
    return new NonnegValue(Value.normedAdd(this.unsigned, other.unsigned));
  };
  /**
   *
   * @param other
   */
  public minus = (other: NonnegValue): NonnegValue => {
    return new NonnegValue(Value.subtract(this.unsigned, other.unsigned));
  };
  /**
   *
   * @param other
   */
  public normedMinus = (other: NonnegValue): NonnegValue => {
    return new NonnegValue(Value.normedSubtract(this.unsigned, other.unsigned));
  };
  /**
   *
   * @param other
   */
  public hadamard = (other: NonnegValue): NonnegValue => {
    return new NonnegValue(Value.hadamard(this.unsigned, other.unsigned));
  };
  // reverse hadamard product
  /**
   *
   * @param other
   */
  public divideBy = (other: NonnegValue): NonnegValue => {
    return new NonnegValue(Value.divide(this.unsigned, other.unsigned));
  };

  /**
   *
   * @param other
   */
  public normedDivideBy = (other: NonnegValue): NonnegValue => {
    return new NonnegValue(Value.normedDivide(this.unsigned, other.unsigned));
  };

  /**
   *
   * @param scalar
   */
  public scale = (scalar: bigint): NonnegValue => {
    return new NonnegValue(this.value.scale(scalar));
  };

  /**
   *
   * @param other
   */
  public leq = (other: NonnegValue): boolean => {
    return Value.leq(this.unsigned, other.unsigned);
  };

  // public halfRandomAmount = (): void => {
  //   const asset = this.assets.randomChoice();
  //   this.value.updateAmountOf(
  //     asset,
  //     max(1n, this.value.amountOf(asset) / 2n),
  //   );
  // };

  // public divideByScalar = (scalar: bigint): NonnegValue => {
  //   return new NonnegValue(this.value.divideByScalar(scalar));
  // }

  /**
   *
   */
  public get toBlaze(): Core.Value {
    let coin = 0n;
    const multiasset = new Map<Core.AssetId, bigint>();
    for (const [ccy, tknAmnts] of this.toMap) {
      const ccyBlaze = ccy.toBlaze();
      for (const [tkn, amnt] of tknAmnts) {
        const tknBlaze = tkn.toBlaze();
        try {
          if (ccyBlaze === "") {
            assert(
              tknBlaze === "",
              `not lovelace:\nccyBlaze: "${ccyBlaze}", tknBlaze: "${tknBlaze}"`,
            );
            assert(coin === 0n, `coin already set: ${coin}`);
            coin = amnt;
          } else {
            const assetId = Core.AssetId.fromParts(ccyBlaze, tknBlaze);
            multiasset.set(assetId, amnt);
          }
        } catch (error) {
          throw new Error(
            `PositiveValue.toBlaze:\nccy: "${ccyBlaze}"\ntkn: "${tkn.toBlaze()}"\namnt: ${amnt}\nerror: ${error}`,
          );
        }
      }
    }
    const value = new Core.Value(coin, multiasset);
    return value;
  }

  /**
   *
   * @param value
   * @param idNFT
   */
  static fromBlaze(value: Core.Value, idNFT?: Core.AssetId): NonnegValue {
    const value_ = new Value();

    const lovelace = value.coin();
    if (lovelace) {
      value_.initAmountOf(Asset.ADA, lovelace);
    }

    const assets = value.multiasset();
    if (assets) {
      for (const [assetId, amount] of assets) {
        if (idNFT && assetId === idNFT) {
          continue;
        }
        const asset = Asset.fromBlaze(assetId);
        value_.initAmountOf(asset, amount);
      }
    }
    return new NonnegValue(value_);

    // try {
    //   const value = new Value();
    //   Object.entries(value).forEach(([name, amount]) => {
    //     if (name !== idNFT) {
    //       const asset = Asset.fromBlaze(name);
    //       value.initAmountOf(asset, amount);
    //     }
    //   });
    //   return new PositiveValue(value);
    // } catch (e) {
    //   throw new Error(
    //     `Amounts.fromBlaze ${Object.entries(value).map(
    //       ([ass, amnt]) => `${ass}: ${amnt}\n`
    //     )}:${e}`
    //   );
    // }
  }

  /**
   *
   * @param m
   */
  static maybeFromMap = (
    m?: AssocMap<Currency, AssocMap<Token, bigint>>,
  ): NonnegValue | undefined => {
    if (m === undefined) return undefined;
    else return new NonnegValue(new Value(m));
  };

  /**
   *
   * @param assets
   * @param pnonneg
   */
  static genOfAssets = (
    assets: Assets,
    pnonneg = new PNonneg(),
  ): NonnegValue => {
    const value = new Value();
    assets.forEach((asset) => {
      value.initAmountOf(asset, pnonneg.genData());
    });
    return new NonnegValue(value);
  };

  /**
   *
   * @param value
   */
  static normed(value: Value): NonnegValue {
    return new NonnegValue(value.normed);
  }

  /**
   *
   * @param asset
   * @param amount
   */
  static singleton(asset: Asset, amount: bigint): NonnegValue {
    return new NonnegValue(Value.singleton(asset, amount));
  }
}

export const boundNonneg = Value.newBoundedWith(new PNonneg());

/**
 *
 */
export class PNonnegValue extends PWrapped<NonnegValue> {
  /**
   *
   */
  constructor() {
    super(new PValue(new PNonneg()), NonnegValue, `NonnegValue`);
  }

  static ptype = new PNonnegValue();
  /**
   *
   */
  static override genPType(): PNonnegValue {
    return PNonnegValue.ptype;
  }
}
