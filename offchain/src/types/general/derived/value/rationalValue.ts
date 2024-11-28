import assert from "assert";
import { AssocMap, PMap } from "../../fundamental/container/map";
import { Currency, PCurrency } from "../asset/currency";
import { PToken, Token } from "../asset/token";
import { PRational, Rational } from "../rational";
import { Assets, ccysTkns } from "../asset/assets";
import { PWrapped } from "../../fundamental/container/wrapped";
import { Asset } from "../asset/asset";
import { f } from "../../fundamental/type";
import { PositiveValue } from "./positiveValue";

const ccysTknsAmnts = new AssocMap<Currency, AssocMap<Token, Rational>>(
  (currency) => currency.show(),
);
const tknsAmnts = new AssocMap<Token, Rational>((tkn) => tkn.show());

// const conciseAmnt = (amnt: Rational): string =>
//   `${amnt.concise().replace(/\B(?=(\d{3})+(?!\d))/g, "_")}`;

/**
 *
 */
export class RationalValue {
  public readonly typus = "RationalValue";
  /**
   *
   * @param value
   */
  constructor(private value = ccysTknsAmnts.anew) {
    RationalValue.assert(this);
  }

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
          `${tf}${ccy.toString()}_${tkn.hexName}: ${amount.concise()}`,
        );
      }
    }
    if (amounts.length === 0) return `[]`;
    else return `[\n${amounts.join(`,\n`)}\n${tabs}]`;
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
   * @param asset
   * @param amount
   */
  public initAmountOf = (asset: Asset, amount: Rational): void => {
    const tokens = this.value.get(asset.currency);
    if (tokens) {
      assert(
        !tokens.has(asset.token),
        `initAmountOf: amount already set for asset ${asset.show()} in ${this.concise()}`,
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
  public setAmountOf = (asset: Asset, amount: Rational): void => {
    const tokens = this.value.get(asset.currency);
    if (tokens) {
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
  public updateAmountOf = (asset: Asset, amount: Rational): void => {
    const tokens = this.value.get(asset.currency);
    assert(
      tokens,
      `updateAmountOf: tokens not found for asset ${asset.show()}`,
    );
    assert(
      tokens.has(asset.token),
      `updateAmountOf: amount not found for asset ${asset.show()}}`,
    );
    tokens.set(asset.token, amount);
  };

  /**
   *
   * @param asset
   */
  public drop = (asset: Asset): void => {
    const tokens = this.value.get(asset.currency);
    assert(
      tokens,
      `drop: asset not found\n${asset.show()}\nin ${this.concise()}`,
    );
    if (tokens) {
      const found = tokens.delete(asset.token);
      assert(
        found,
        `drop: token not found\n${asset.show()}\nin ${this.concise()}`,
      );
      if (tokens.size === 0) {
        this.value.delete(asset.currency);
      }
    }
  };

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
  public maybeAmountOf = (asset: Asset): Rational | undefined => {
    return this.value.get(asset.currency)?.get(asset.token);
  };

  /**
   *
   * @param asset
   * @param defaultAmnt
   */
  public amountOf = (asset: Asset, defaultAmnt?: Rational): Rational => {
    const amount = this.maybeAmountOf(asset) ?? defaultAmnt;
    assert(
      amount !== undefined,
      `amountOf: amount not found for asset\n${asset.show()}\nin ${this.concise()}`,
    );
    return amount;
  };

  // for pool-invatiants
  /**
   *
   * @param deposits
   */
  public leftAddMultiply = (deposits: PositiveValue): Rational => {
    const acc = Rational.fromInt(1n);
    for (const [currency, tokens] of this.value) {
      for (const [token, amount] of tokens) {
        const asset = new Asset(currency, token);
        const deposit = deposits.amountOf(asset, 0n);
        const liquidity = amount.plusInt(deposit);
        // console.log(
        //   `${asset.concise()}\n${amount.concise()} +\n${deposit} =\n${liquidity.concise()}`,
        // );
        assert(
          !liquidity.isZero,
          `leftAddMultiply: zero liquidity for ${asset.concise()}`,
        );
        acc.multiplyWith(liquidity);
      }
    }
    assert(
      !acc.isZero,
      `leftAddMultiply: zero invariant for ${this.concise()}`,
    );
    return acc;
  };

  // for initial lp-token-emission
  /**
   *
   * @param other
   */
  public leftPickMultiply = (other: PositiveValue): bigint => {
    let agg = 1n;
    for (const [currency, tokens] of this.value) {
      for (const [token, _amount] of tokens) {
        agg *= other.amountOf(new Asset(currency, token), 1n);
      }
    }
    return agg;
  };

  // for initial lp-token-emission
  /**
   *
   * @param other
   */
  public leftCount = (other: PositiveValue): bigint => {
    let agg = 1n;
    for (const [currency, tokens] of this.value) {
      for (const [token, _amount] of tokens) {
        if (other.has(new Asset(currency, token))) {
          agg++;
        }
      }
    }
    return agg;
  };

  /**
   *
   * @param scalar
   */
  public scale = (scalar: Rational): RationalValue => {
    const scaled = new RationalValue();
    this.value.forEach((tokens, currency) => {
      const scaledTokens = tknsAmnts.anew;
      tokens.forEach((amount, token) => {
        scaledTokens.set(token, amount.times(scalar));
      });
      scaled.value.set(currency, scaledTokens);
    });
    return scaled;
  };

  /**
   *
   */
  static generate = (): RationalValue => {
    const assets = Assets.generate();
    const value = new RationalValue();
    assets.forEach((asset) => {
      value.initAmountOf(asset, PRational.ptype.genData());
    });
    return value;
  };

  /**
   *
   * @param value
   */
  static assert(value: RationalValue): void {
    assert(
      value.value instanceof AssocMap,
      `Value must be a AssocMap, not ${value.value}`,
    );
    Assets.assert(value.assets);
  }
}

/**
 *
 */
export class PRationalValue extends PWrapped<RationalValue> {
  /**
   *
   */
  constructor() {
    super(
      new PMap(
        PCurrency.ptype,
        new PMap(PToken.ptype, PRational.ptype, true),
        true,
      ),
      RationalValue,
      `RationalValue`,
    );
  }

  /**
   *
   */
  public override genData = (): RationalValue => {
    return RationalValue.generate();
  };

  static ptype = new PRationalValue();
  /**
   *
   */
  static override genPType(): PRationalValue {
    return PRationalValue.ptype;
  }
}
