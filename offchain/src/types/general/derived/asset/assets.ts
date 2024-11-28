import assert from "assert";
import {
  boundedSubset,
  max,
  nonEmptySubSet,
  randomChoice,
  randomSubset,
} from "../../../../utils/generators";
import { AssocMap, PMap } from "../../fundamental/container/map";
import { PWrapped } from "../../fundamental/container/wrapped";
import { f, t } from "../../fundamental/type";
import { newGenInRange } from "../bounded/bounded";
import { PNonEmptyList } from "../nonEmptyList";
import { Asset, PAsset } from "./asset";
import { Currency, PCurrency } from "./currency";
import { PToken, Token } from "./token";
import { gMaxLength } from "../../../../utils/constants";

export const ccysTkns = new AssocMap<Currency, Token[]>((ccy) => ccy.show());
const PNonEmptyTokenList = new PNonEmptyList(PToken.ptype);

/**
 *
 */
export class Assets {
  public readonly typus = "Assets";
  /**
   *
   * @param assets
   */
  constructor(private assets = ccysTkns.anew) {
    Assets.assert(this);
  }

  /**
   *
   * @param tabs
   */
  public show = (tabs = ""): string => {
    const ttf = tabs + t + f;
    const ttff = ttf + f;
    const ccys = [`Assets:`];
    for (const [currency, tokens] of this.assets) {
      const symbol = currency.toString();
      ccys.push(`${ttf}${symbol === "" ? "ADA" : symbol}:`);
      const tkns = [];
      for (const token of tokens) {
        const token_ = token.toString();
        tkns.push(
          `${ttff}${
            token_ === "" ? (symbol === "" ? "lovelace" : "_") : token_
          }`,
        );
      }
      ccys.push(tkns.join(",\n"));
    }
    return ccys.join(`\n`);
  };

  /**
   *
   * @param other
   */
  public equals = (other: Assets): boolean => {
    return this.subsetOf(other) && other.subsetOf(this);
  };

  /**
   *
   */
  public get clone(): Assets {
    const assets = new Assets();
    for (const [ccy, tkns] of this.assets) {
      assets.assets.set(ccy, tkns.slice());
    }
    return assets;
  }

  /**
   *
   * @param asset
   */
  public insert = (asset: Asset): void => {
    const { currency, token } = asset;
    const ownTkns = this.assets.get(currency) ?? [];
    assert(
      !ownTkns.some((own) => own.hexName === token.hexName),
      `${asset} already in ${this.show()}`,
    );
    ownTkns.push(token);
    this.assets.set(currency, ownTkns);
  };

  /**
   *
   * @param asset
   */
  public add = (asset: Asset): void => {
    const { currency, token } = asset;
    const tkns = this.assets.get(currency);
    if (!tkns) {
      this.assets.set(currency, [token]);
    } else {
      const i = tkns.findIndex((tkn) => tkn.equals(token));
      if (i === -1) {
        tkns.push(token);
      }
    }
  };

  /**
   *
   * @param asset
   */
  public drop = (asset: Asset): Assets => {
    const { currency, token } = asset;
    const tkns = this.assets.get(currency);
    assert(tkns !== undefined, `${asset.show()} not in ${this.show()}`);
    const i = tkns.findIndex((tkn) => tkn.hexName === token.hexName);
    assert(i >= 0, `${asset.show()} not in ${this.show()}`);
    tkns.splice(i, 1);
    if (tkns.length === 0) {
      this.assets.delete(currency);
    }
    return this;
  };

  /**
   *
   * @param asset
   */
  public without = (asset: Asset): Assets => {
    const { currency, token } = asset;
    const tkns = this.assets.get(currency);
    if (!tkns) return this;
    const i = tkns.findIndex((tkn) => tkn.hexName === token.hexName);
    if (i === -1) return this;
    const assets = new Assets();
    for (const [ccy, tkns_] of this.assets) {
      if (ccy.equals(currency)) {
        if (tkns_.length > 1) {
          assets.assets.set(ccy, [...tkns_.slice(0, i), ...tkns_.slice(i + 1)]);
        }
      } else {
        assets.assets.set(ccy, tkns_.slice());
      }
    }
    return assets;
  };

  // NOTE commented out because we don't appreciate sorting anymore (refined indexOf, etc etc)
  // public get head(): Asset {
  //   assert(this.assets.size > 0, "empty assets have no head");
  //   const ccy = [...this.assets.keys()].sort()[0];
  //   const tkn = this.assets.get(ccy)!.slice(0).sort()[0];
  //   return new Asset(ccy, tkn);
  // }

  // public get tail(): Assets {
  //   assert(this.assets.size > 0, "empty assets tell no tails");
  //   const tail = this.assets.anew;
  //   let first = true;
  //   for (const ccy of [...this.assets.keys()].sort()) {
  //     const tkns = this.assets.get(ccy)!.slice(0).sort();
  //     if (first) {
  //       assert(tkns.length > 0, "empty token map");
  //       if (tkns.length > 1) {
  //         const tail_ = tkns.slice(1);
  //         tail.set(ccy, tail_);
  //       }
  //       first = false;
  //     } else tail.set(ccy, tkns);
  //   }
  //   const tail_ = new Assets(tail);
  //   assert(tail_.add(this.head).equals(this), "tail is not tail");
  //   return tail_;
  // }

  /**
   *
   */
  public randomChoice = (): Asset => {
    const ccy = randomChoice([...this.assets.keys()]);
    const tkn = randomChoice(this.assets.get(ccy)!);
    return new Asset(ccy, tkn);
  };

  /**
   *
   */
  public randomSubset = (): Assets => {
    const assets_ = new Assets();
    const ccys = randomSubset([...this.assets.keys()]);
    for (const ccy of ccys) {
      const tkns = nonEmptySubSet(this.assets.get(ccy)!);
      assets_.assets.set(ccy, tkns);
    }
    return assets_;
  };

  /**
   *
   * @param minSize
   * @param maxSize
   */
  public boundedSubset = (minSize?: bigint, maxSize?: bigint): Assets => {
    return Assets.fromList(boundedSubset(this.toList, minSize, maxSize));
  };

  /**
   *
   * @param asset
   */
  public has = (asset: Asset): boolean => {
    const { currency, token } = asset;
    const tkns = this.assets.get(currency);
    if (!tkns) {
      // console.log(
      //   currency.concise(),
      //   `not in`,
      //   [...this.assets.keys()].map((ccy) => ccy.concise()),
      // );
      return false;
    }
    if (tkns.some((tkn) => tkn.equals(token))) {
      return true;
    } else {
      // console.log(token.concise(), `not in`, tkns.map((tkn) => tkn.concise()));
      return false;
    }
  };

  /**
   *
   */
  public get toMap(): AssocMap<Currency, Token[]> {
    const assets = ccysTkns.anew;
    for (const [ccy, tkns] of this.assets) {
      assets.set(ccy, tkns.slice());
    }
    return assets;
  }

  /**
   *
   */
  public get empty(): boolean {
    return this.assets.size === 0;
  }

  /**
   *
   */
  public get size(): bigint {
    let size = 0n;
    for (const tkns of this.assets.values()) {
      size += BigInt(tkns.length);
    }
    return size;
  }

  /**
   *
   * @param other
   */
  public subsetOf = (other: Assets): boolean => {
    for (const [ccy, ownTkns] of this.assets) {
      const otherTkns = other.toMap.get(ccy);
      if (otherTkns === undefined) return false;
      for (const own of ownTkns) {
        if (!otherTkns.some((other) => own.hexName === other.hexName))
          return false;
      }
    }
    return true;
  };

  // NOTE set to private because we don't want to use this anymore
  /**
   *
   */
  private get toList(): Asset[] {
    const assets: Asset[] = [];
    for (const [ccy, tkns] of this.assets) {
      for (const tkn of tkns) {
        assets.push(new Asset(ccy, tkn));
      }
    }
    return assets;
  }

  /**
   *
   * @param asset
   */
  public indexOf(asset: Asset): number {
    let index = 0;
    for (const [ccy, tkns] of this.assets) {
      if (ccy.equals(asset.currency)) {
        for (const tkn of tkns) {
          if (tkn.equals(asset.token)) {
            return index;
          } else {
            index++;
          }
        }
      } else {
        index += tkns.length;
      }
    }
    return -1;
  }

  /**
   *
   * @param f
   */
  public forEach = (f: (value: Asset, index: number) => void) => {
    let index = 0;
    for (const [ccy, tkns] of this.assets) {
      for (const tkn of tkns) {
        const asset = new Asset(ccy, tkn);
        f(asset, index++);
      }
    }
  };

  // public [Symbol.iterator](): Iterator<Asset> {
  //   let index = 0;
  //   for (const [ccy, tkns] of this.assets) {
  //     for (const tkn of tkns) {
  //       const asset = new Asset(ccy, tkn);
  //       f(asset, index++);
  //     }
  //   }

  //   return {
  //     next(): IteratorResult<Asset> {
  //       if (index < items.length) {
  //         return { value: items[index++], done: false };
  //       } else {
  //         return { value: undefined, done: true };
  //       }
  //     }
  //   };
  // }

  // Implementing entries for both index and value iteration
  /**
   *
   */
  *entries(): IterableIterator<[number, Asset]> {
    let index = 0;
    for (const [ccy, tkns] of this.assets) {
      for (const tkn of tkns) {
        const asset = new Asset(ccy, tkn);
        yield [index++, asset];
      }
    }
  }

  /**
   *
   * @param assets
   */
  static fromList(assets: Asset[]): Assets {
    const assets_ = new Assets();
    for (const asset of assets) {
      assets_.insert(asset);
    }
    return assets_;
  }

  /**
   *
   * @param assets
   */
  public intersect = (assets: Assets): Assets => {
    const shared = this.assets.anew;
    const other = assets.toMap;
    for (const [ccy, ownTkns] of this.assets) {
      const otherTkns = other.get(ccy);
      if (otherTkns) {
        const sharedTkns = ownTkns.filter((own) =>
          otherTkns.some((other) => other.hexName === own.hexName),
        );
        if (sharedTkns.length) shared.set(ccy, sharedTkns);
      }
    }
    return new Assets(shared);
  };

  /**
   *
   * @param assets
   */
  public union = (assets: Assets): Assets => {
    const union = this.assets.anew;
    const other = assets.toMap;
    for (const [ccy, ownTkns] of this.assets) {
      const otherTkns = other.get(ccy);
      if (otherTkns) {
        const unionTkns = ownTkns.concat(
          otherTkns.filter((other) => {
            return !ownTkns.some((own) => own.hexName === other.hexName);
          }),
        );
        union.set(ccy, unionTkns);
      } else union.set(ccy, ownTkns);
    }
    for (const [ccy, otherTkns] of other) {
      if (!this.assets.has(ccy)) union.set(ccy, otherTkns);
    }
    return new Assets(union);
  };

  // public toBlazeWith = (amount: bigint): Core.Value => {
  //   const assets: Core.Value = {};
  //   this.forEach((asset) => (assets[asset.toBlaze()] = amount));
  //   return assets;
  // };

  /**
   *
   * @param assets
   */
  static assert(assets: Assets): void {
    for (const [ccy, tkns] of assets.assets) {
      assert(tkns.length > 0, `empty token list for ${ccy}`);
    }
    assets.forEach((asset) => Asset.assertADAlovelace(asset));
  }

  /**
   *
   * @param minLength
   * @param maxLength
   */
  static generate = (minLength = 0n, maxLength?: bigint): Assets => {
    const assets = PMap.genKeys(
      PAsset.ptype,
      newGenInRange(minLength, maxLength ?? max(minLength, gMaxLength))(),
    );
    assert(assets.length >= minLength, `generated ${assets} too small`);
    const assets_ = Assets.fromList(assets);
    assert(assets_.size >= minLength, `generated ${assets_.show()} too small`);
    return assets_;
  };

  /**
   *
   * @param asset
   */
  static singleton = (asset: Asset): Assets => {
    const assets = new Assets();
    assets.insert(asset);
    return assets;
  };
}

/**
 *
 */
export class PAssets extends PWrapped<Assets> {
  /**
   *
   */
  private constructor() {
    super(new PMap(PCurrency.ptype, PNonEmptyTokenList), Assets, `Assets`);
  }

  public override genData = Assets.generate;

  static ptype = new PAssets();
  /**
   *
   */
  static override genPType(): PWrapped<Assets> {
    return PAssets.ptype;
  }
}
