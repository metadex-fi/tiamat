import assert from "assert";
import { abs, max, min } from "../../../../utils/generators";
import { AssocMap, PMap } from "../../fundamental/container/map";
import { PWrapped } from "../../fundamental/container/wrapped";
import { f, t } from "../../fundamental/type";
import { Asset } from "../asset/asset";
import { Assets, ccysTkns } from "../asset/assets";
import { Currency, PCurrency } from "../asset/currency";
import { PToken, Token } from "../asset/token";
import { PBounded } from "../bounded/bounded";
import { maxInteger } from "../../../../utils/constants";
import { Rational } from "../rational";

export const ccysTknsAmnts = new AssocMap<Currency, AssocMap<Token, bigint>>(
  (currency) => currency.show(),
);
export const tknsAmnts = new AssocMap<Token, bigint>((tkn) => tkn.show());

/**
 *
 * @param amnt
 */
const showAmnt = (amnt: bigint): string =>
  `${amnt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "_")} (${amnt})`;

/**
 *
 */
export class Value {
  public readonly typus = "Value";
  /**
   *
   * @param value
   */
  constructor(private value = ccysTknsAmnts.anew) {
    Value.assert(this);
  }

  /**
   *
   * @param tabs
   */
  public show = (tabs = ""): string => {
    const ttf = tabs + t + f;
    const ttff = ttf + f;
    const ccys = [`Value:`];
    for (const [currency, tokenMap] of this.value) {
      const symbol = currency.toString();
      ccys.push(`${ttf}${symbol === "" ? "ADA" : symbol}:`);
      const t = [];
      for (const [token, amount] of tokenMap) {
        t.push(
          `${ttff}${
            token.toString() === ""
              ? symbol === ""
                ? "lovelace"
                : "_"
              : token.hexName
          }: ${showAmnt(amount)}`,
        );
      }
      ccys.push(t.join(",\n"));
    }
    return ccys.join(`\n`);
  };

  /**
   *
   * @param tabs
   */
  public concise = (tabs = ""): string => {
    const tf = tabs + f;
    const amounts = [];
    for (const [ccy, tokenMap] of this.value) {
      for (const [tkn, amount] of tokenMap) {
        amounts.push(
          `${tf}${ccy.toString()}_${tkn.hexName}: ${showAmnt(amount)}`,
        );
      }
    }
    if (amounts.length === 0) return `[]`;
    else return `[\n${amounts.join(`,\n`)}\n${tabs}]`;
  };

  /**
   *
   */
  public get zeroed(): Value {
    return Value.newSetAmounts(0n)(this);
  }

  /**
   *
   */
  public get unit(): Value {
    return Value.newSetAmounts(1n)(this);
  }

  /**
   *
   * @param scalar
   */
  public scale = (scalar: bigint): Value => {
    return Value.newMapAmounts((a) => a * scalar)(this);
  };

  /**
   *
   * @param r
   */
  public multiplyRoundUp = (r: Rational): Value => {
    return Value.newMapAmounts((a) => r.timesIntCeil(a))(this);
  };

  /**
   *
   * @param scalar
   */
  public divideByScalar = (scalar: bigint): Value => {
    return Value.newMapAmounts((a) => a / scalar)(this);
  };

  /**
   *
   * @param scalar
   */
  public divideByScalar_ = (scalar: number): Value => {
    return Value.newMapAmounts((a) => BigInt(Math.floor(Number(a) / scalar)))(
      this,
    );
  };

  /**
   *
   */
  public get assets(): Assets {
    const assets = ccysTkns.anew;
    for (const [currencySymbol, tokens] of this.value) {
      assets.set(currencySymbol, [...tokens.keys()]);
    }
    return new Assets(assets);
  }

  /**
   *
   */
  public get normed(): Value {
    const value = ccysTknsAmnts.anew;
    for (const [currency, tokens] of this.value) {
      const tokens_ = tknsAmnts.anew;
      for (const [token, amount] of tokens) {
        if (amount) tokens_.set(token, amount);
      }
      if (tokens_.size) value.set(currency, tokens_);
    }
    return new Value(value);
  }

  /**
   *
   * @param init
   * @param op
   */
  private newFoldWith =
    (init: bigint, op: (a: bigint, b: bigint) => bigint) => (): bigint => {
      let agg = init;
      for (const [_, tokens] of this.value) {
        for (const [_, amount] of tokens) {
          agg = op(agg, amount);
        }
      }
      return agg;
    };

  public sumAmounts = this.newFoldWith(0n, (a, b) => a + b);
  public mulAmounts = this.newFoldWith(1n, (a, b) => a * b);
  /**
   *
   * @param a
   * @param b
   */
  private euclidean(a: bigint, b: bigint) {
    a = abs(a);
    b = abs(b);
    if (b > a) {
      const temp = a;
      a = b;
      b = temp;
    }
    while (true) {
      if (b === 0n) return a;
      a %= b;
      if (a === 0n) return b;
      b %= a;
    }
  }
  /**
   *
   * @param init
   */
  public gcd = (init = 0n) =>
    this.newFoldWith(init, (a, b) => this.euclidean(a, b))();

  /**
   *
   */
  public get maxAmount(): bigint {
    return this.newFoldWith(this.unsortedHeadAmount, max)();
  }

  /**
   *
   * @param {...any} values
   */
  public cleanReduce(...values: Value[]): Value[] {
    const gcd = values.reduce((a, b) => b.gcd(a), this.gcd());
    return [this, ...values].map((v) => v.divideByScalar(gcd));
  }

  /**
   *
   * @param {...any} values
   */
  public dirtyReduce(...values: Value[]): Value[] {
    const maxAmnt = values.reduce(
      (a, b) => max(a, b.maxAmount),
      this.maxAmount,
    );
    const values_ = [this, ...values];
    if (maxAmnt <= maxInteger) return values_;
    const divisor = Number(maxAmnt) / Number(maxInteger);
    return values_.map((v) => v.divideByScalar_(divisor));
  }

  /**
   *
   * @param assets
   */
  public exactAssets = (assets: Assets): boolean => {
    return this.assets.equals(assets);
  };

  /**
   *
   * @param asset
   */
  public maybeAmountOf = (asset: Asset): bigint | undefined => {
    return this.value.get(asset.currency)?.get(asset.token);
  };

  /**
   *
   * @param asset
   * @param defaultAmnt
   */
  public amountOf = (asset: Asset, defaultAmnt?: bigint): bigint => {
    const amount = this.maybeAmountOf(asset) ?? defaultAmnt;
    assert(
      amount !== undefined,
      `amountOf: amount not found for asset\n${asset.show()}\nin ${this.concise()}`,
    );
    return amount;
  };

  /**
   *
   * @param asset
   * @param amount
   */
  public updateAmountOf = (asset: Asset, amount: bigint): void => {
    const tokens = this.value.get(asset.currency);
    assert(
      tokens,
      `updateAmountOf: tokens not found for asset ${asset.show()} in ${this.show()}`,
    );
    assert(
      tokens.has(asset.token),
      `updateAmountOf: amount not found for asset ${asset.show()} in ${this.show()}`,
    );
    tokens.set(asset.token, amount);
  };

  /**
   *
   * @param asset
   * @param amount
   */
  public initAmountOf = (asset: Asset, amount: bigint): void => {
    const tokens = this.value.get(asset.currency);
    if (tokens) {
      assert(
        !tokens.has(asset.token),
        `initAmountOf: amount already set for asset ${asset.show()} in ${this.show()}`,
      );
      tokens.set(asset.token, amount);
    } else {
      const tokens = tknsAmnts.anew;
      tokens.set(asset.token, amount);
      this.value.set(asset.currency, tokens);
    }
  };

  /**
   *
   * @param asset
   * @param amount
   */
  public setAmountOf = (asset: Asset, amount: bigint): void => {
    const tokens = this.value.get(asset.currency);
    if (tokens) {
      tokens.set(asset.token, amount);
    } else {
      const tokens = tknsAmnts.anew;
      tokens.set(asset.token, amount);
      this.value.set(asset.currency, tokens);
    }
  };

  // TODO not sure if correct or still needed
  // public fillAmountOf = (asset: Asset, amount: bigint): void => {
  //   const tokens = this.value.get(asset.currency);
  //   if (tokens) {
  //     if (!tokens.has(asset.token)) {
  //       tokens.set(asset.token, amount);
  //     }
  //   } else {
  //     const tokens = tknsAmnts.anew;
  //     tokens.set(asset.token, amount);
  //     this.value.set(asset.currency, tokens);
  //   }
  // };

  /**
   *
   * @param asset
   * @param amount
   */
  public addAmountOf = (asset: Asset, amount: bigint): void => {
    this.updateAmountOf(asset, this.amountOf(asset) + amount);
  };

  /**
   *
   * @param asset
   * @param amount
   */
  public increaseAmountOf = (asset: Asset, amount: bigint): void => {
    const tokens = this.value.get(asset.currency);
    if (tokens) {
      const oldAmount = tokens.get(asset.token) ?? 0n;
      tokens.set(asset.token, oldAmount + amount);
    } else {
      const tokens = tknsAmnts.anew;
      tokens.set(asset.token, amount);
      this.value.set(asset.currency, tokens);
    }
  };

  /**
   *
   * @param assets
   */
  public ofAssets = (assets: Assets): Value => {
    const value = new Value();
    assets.intersect(this.assets).forEach((asset) => {
      const amount = this.amountOf(asset);
      value.initAmountOf(asset, amount);
    });
    return value;
  };

  /**
   *
   * @param other
   */
  public intersect = (other: Value): Value => {
    const value = new Value();
    for (const [currency, tknAmnts] of this.value) {
      const tknAmnts_ = other.value.get(currency);
      if (tknAmnts_) {
        for (const [token, amount] of tknAmnts) {
          const amount_ = tknAmnts_.get(token);
          if (amount_) {
            value.initAmountOf(
              new Asset(currency, token),
              min(amount, amount_),
            );
          }
        }
      }
    }
    return value;
  };

  /**
   *
   */
  public get toMap(): AssocMap<Currency, AssocMap<Token, bigint>> {
    const map = this.value.anew;
    for (const [currencySymbol, tokens] of this.value) {
      const tokens_ = tknsAmnts.anew;
      for (const [tokenName, amount] of tokens) {
        tokens_.set(tokenName, amount);
      }
      map.set(currencySymbol, tokens_);
    }
    return map;
  }

  /**
   *
   */
  public get size(): bigint {
    let size = 0n;
    for (const [_, tokens] of this.value) {
      size += BigInt(tokens.size);
    }
    return size;
  }

  /**
   *
   */
  public get headAsset(): Asset {
    assert(this.value.size > 0, `no currencies in value: ${this.show()}`);
    const ccy = [...this.value.keys()].sort()[0]!;
    const tkns = this.value.get(ccy);
    assert(tkns, `no tokens for currency ${ccy}`);
    assert(tkns.size > 0, `no tokens for currency ${ccy}`);
    const tkn = [...tkns.keys()].sort()[0]!;
    return new Asset(ccy, tkn);
  }

  /**
   *
   */
  public get unsortedHeadAmount(): bigint {
    for (const [_, tokens] of this.value) {
      for (const [_, amount] of tokens) {
        return amount;
      }
    }
    throw new Error(`no amounts in value: ${this.show()}`);
  }

  /**
   *
   */
  public get clone(): Value {
    return new Value(this.toMap);
  }

  /**
   *
   * @param asset
   */
  public has = (asset: Asset): boolean => {
    const tokens = this.value.get(asset.currency);
    return tokens ? tokens.has(asset.token) : false;
  };

  /**
   *
   * @param asset
   */
  public drop = (asset: Asset): void => {
    const tokens = this.value.get(asset.currency);
    assert(
      tokens,
      `drop: tokens not found for asset ${asset.show()} in ${this.show()}`,
    );
    assert(
      tokens.has(asset.token),
      `drop: amount not found for asset ${asset.show()} in ${this.show()}`,
    );
    tokens.delete(asset.token);
    if (tokens.size === 0) {
      this.value.delete(asset.currency);
    }
  };

  // public fill = (assets: Assets, amount: bigint): Value => {
  //   const value = this.clone;
  //   assets.forEach((asset) => {
  //     value.fillAmountOf(asset, amount);
  //   });
  //   return value;
  // };

  /**
   *
   */
  public get smallestAmount(): bigint {
    let smallest: bigint | undefined = undefined;
    for (const amounts of this.value.values()) {
      for (const amount of amounts.values()) {
        if (!smallest || amount < smallest) {
          smallest = amount;
        }
      }
    }
    assert(smallest, `smallestAmount: no smallest found in ${this.concise()}`);
    return smallest;
  }

  /**
   *
   */
  public get biggestAmount(): bigint {
    let biggest: bigint | undefined = undefined;
    for (const amounts of this.value.values()) {
      for (const amount of amounts.values()) {
        if (!biggest || biggest < amount) {
          biggest = amount;
        }
      }
    }
    assert(biggest, `biggestAmount: no biggest found in ${this.concise()}`);
    return biggest;
  }

  // public get positivesOnly(): PositiveValue {
  //   const postitives = ccysTknsAmnts.anew;
  //   for (const [currency, tokens] of this.value) {
  //     const tokens_ = tknsAmnts.anew;
  //     for (const [token, amount] of tokens) {
  //       if (amount > 0n) {
  //         tokens_.set(token, amount);
  //       }
  //     }
  //     if (tokens_.size) postitives.set(currency, tokens_);
  //   }
  //   return new PositiveValue(new Value(postitives));
  // }

  /**
   *
   * @param assets
   */
  static nullOfAssets = (assets: Assets): Value => {
    const value = ccysTknsAmnts.anew;
    for (const [currencySymbol, tokens] of assets.toMap) {
      const tokens_ = tknsAmnts.anew;
      for (const tokenName of tokens) {
        tokens_.set(tokenName, 0n);
      }
      value.set(currencySymbol, tokens_);
    }
    return new Value(value);
  };

  /**
   *
   * @param value
   */
  static assert(value: Value): void {
    assert(
      value.value instanceof AssocMap,
      `Value must be a AssocMap, not ${value.value}`,
    );
    Assets.assert(value.assets);
  }

  /**
   *
   * @param bounded
   */
  static generateWith = (bounded: PBounded): Value => {
    const assets = Assets.generate();
    const value = new Value();
    assets.forEach((asset) => {
      value.initAmountOf(asset, bounded.genData());
    });
    return value;
  };

  /**
   *
   * @param op
   * @param defaultOut
   * @param {...any} defaultIns
   */
  static newUnionWith = (
    op: (arg: bigint, ...args: Array<bigint>) => bigint,
    defaultOut?: bigint,
    ...defaultIns: Array<bigint | undefined>
  ) => {
    // assert( // TODO FIXME
    //   defaultIns.length <= op.arguments.length,
    //   "more defaultIns than op arguments",
    // );
    return (
      arg: Value = new Value(),
      ...args: Array<Value | undefined>
    ): Value => {
      // assert( TODO FIXME
      //   1 + args.length === op.arguments.length,
      //   "args length must match op arguments length",
      // );
      try {
        const args_ = args.map((v) => v ?? new Value());
        const assets = Value.assetsOf(arg, ...args_);
        const result = new Value();
        assets.forEach((asset) => {
          const amountsIn = new Array<bigint>();
          [arg, ...args_].forEach((v, i) => {
            const defaultIn = defaultIns[i];
            amountsIn.push(v.amountOf(asset, defaultIn));
          });
          const amountOut = op(amountsIn[0]!, ...amountsIn.slice(1));
          if (amountOut !== defaultOut) {
            result.initAmountOf(asset, amountOut);
          }
        });
        return result;
      } catch (e) {
        throw new Error(
          `newUnionWith:\n${op}\n${[arg, ...args]
            .map((v) => v?.concise())
            .join(",\n")}\nfailed: ${e}`,
        );
      }
    };
  };

  static add = Value.newUnionWith((a, b) => a + b);
  static normedAdd = Value.newUnionWith((a, b) => a + b, 0n, 0n, 0n);
  static subtract = Value.newUnionWith((a, b) => a - b);
  static normedSubtract = Value.newUnionWith((a, b) => a - b, 0n, 0n, 0n);
  static hadamard = Value.newUnionWith((a, b) => a * b);
  // static hadamard_ = Value.newUnionWith((a, b) => a * b, undefined, 0n);
  static divide = Value.newUnionWith((a, b) => a / b); // reverse hadamard-product
  static normedDivide = Value.newUnionWith((a, b) => a / b, 0n, 0n, 0n);

  // upper bound is strict
  /**
   *
   * @param lower
   * @param upper
   */
  static genBetween = (lower: Value, upper: Value) =>
    Value.newUnionWith((a, b) => new PBounded(a, b - 1n).genData())(
      lower,
      upper,
    );

  /**
   *
   * @param {...any} values
   */
  private static assetsOf(...values: Value[]): Assets {
    const assets = ccysTkns.anew;
    for (const value of values) {
      for (const [currencySymbol, tokenMap] of value.toMap) {
        const tokens = assets.get(currencySymbol) ?? [];
        for (const token of tokenMap.keys()) {
          if (!tokens.some((t) => t.hexName === token.hexName)) {
            tokens.push(token);
          }
        }
        assets.set(currencySymbol, tokens);
      }
    }
    return new Assets(assets);
  }

  /**
   *
   * @param asset
   * @param amount
   */
  static singleton(asset: Asset, amount: bigint): Value {
    const value = ccysTknsAmnts.anew;
    const tokens = tknsAmnts.anew;
    tokens.set(asset.token, amount);
    value.set(asset.currency, tokens);
    return new Value(value);
  }

  /**
   *
   * @param op
   * @param {...any} defaultIns
   */
  private static newCompareWith = (
    op: (arg: bigint, ...args: Array<bigint>) => boolean,
    ...defaultIns: Array<bigint | undefined>
  ) => {
    // assert( // TODO FIXME
    //   defaultIns.length <= op.arguments.length,
    //   "more defaultIns than op arguments",
    // );
    return (arg = new Value(), ...args: Array<Value | undefined>): boolean => {
      // assert( // TODO FIXME
      //   1 + args.length === op.arguments.length,
      //   "args length must match op arguments length",
      // );
      const args_ = args.map((v) => v ?? new Value());
      const assets = Value.assetsOf(arg, ...args_);
      for (const [currencySymbol, tokens] of assets.toMap) {
        for (const tokenName of tokens) {
          const asset = new Asset(currencySymbol, tokenName);
          const amountsIn = new Array<bigint>();
          [arg, ...args_].forEach((v, i) => {
            const defaultIn = defaultIns[i];
            const amountIn = v.amountOf(asset, defaultIn);
            amountsIn.push(amountIn);
          });
          if (!op(amountsIn[0]!, ...amountsIn.slice(1))) {
            return false;
          }
        }
      }
      return true;
    };
  };

  // TODO better "infinity" values. Maybe use onchain maximum?
  // export const lt = newCompareWith(
  //   (a, b) => a < b || bothExtreme(a, b),
  //   -BigInt(maxInteger),
  //   BigInt(maxInteger),
  // );
  static leq = Value.newCompareWith(
    (a, b) => a <= b,
    // no defaults, as we use it to assert assets match as well
  );

  static leq_ = Value.newCompareWith((a, b) => a <= b, undefined, 0n);

  static lt = Value.newCompareWith(
    (a, b) => a < b,
    // no defaults, as we use it to assert assets match as well
  );

  static lt_ = Value.newCompareWith((a, b) => a < b, 0n);

  /**
   *
   * @param op
   */
  private newAmountsCheck = (op: (arg: bigint) => boolean) =>
    Value.newCompareWith((a) => op(a))(this);

  /**
   *
   */
  public get nonnegative() {
    return this.newAmountsCheck((a) => a >= 0n);
  }
  /**
   *
   */
  public get positive() {
    return this.newAmountsCheck((a) => a > 0n);
  }
  /**
   *
   */
  public get leqMaxInteger() {
    return this.newAmountsCheck((a) => a <= maxInteger);
  }

  /**
   *
   * @param bounds
   */
  static newBoundedWith =
    (bounds: PBounded) =>
    (value: Value): Value => {
      const bounded = new Value();
      for (const [currencySymbol, tokens] of value.toMap) {
        for (const [tokenName, amount] of tokens) {
          bounded.initAmountOf(
            new Asset(currencySymbol, tokenName),
            amount < bounds.lowerBound
              ? bounds.lowerBound
              : amount > bounds.upperBound
                ? bounds.upperBound
                : amount,
          );
        }
      }
      return bounded;
    };

  /**
   *
   * @param op
   */
  private static newMapAmounts = (op: (arg: bigint) => bigint) =>
    Value.newUnionWith((a) => op(a));

  /**
   *
   * @param amount
   */
  private static newSetAmounts(amount: bigint): (value: Value) => Value {
    return Value.newMapAmounts(() => amount);
  }
}

/**
 *
 */
export class PValue extends PWrapped<Value> {
  /**
   *
   * @param pbounded
   */
  constructor(public pbounded: PBounded) {
    super(
      new PMap(PCurrency.ptype, new PMap(PToken.ptype, pbounded, true), true),
      Value,
      `Value`,
    );
  }

  /**
   *
   */
  public override genData = (): Value => {
    return Value.generateWith(this.pbounded);
  };

  /**
   *
   */
  static override genPType(): PWrapped<Value> {
    return new PValue(PBounded.genPType() as PBounded);
  }
}
