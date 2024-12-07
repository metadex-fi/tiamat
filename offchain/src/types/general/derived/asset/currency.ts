import assert from "assert";
import { Core } from "@blaze-cardano/sdk";
import { PWrapped } from "../../fundamental/container/wrapped";
import { PByteString } from "../../fundamental/primitive/bytestring";
import { Wrapper } from "../../fundamental/type";

/**
 *
 */
export class Currency implements Wrapper<`symbol`, Uint8Array> {
  public readonly typus = "Currency";
  __wrapperBrand: `symbol` = `symbol`;
  /**
   *
   * @param symbol
   */
  constructor(public readonly symbol: Uint8Array) {
    assert(
      // TODO reactivate if true
      symbol.length === 0 || symbol.length === Number(Currency.numBytes),
      `Currency wrong size - ${symbol}: ${symbol.length}`,
    );
  }

  /**
   *
   */
  public toString = (): string => {
    return Core.toHex(this.symbol);
  };

  /**
   *
   */
  public show = (): string => {
    return `Currency(${this.toString()})`;
  };

  /**
   *
   */
  public concise = (): string => {
    if (this.symbol.length === 0) {
      return "ADA";
    } else {
      return this.toString();
    }
  };

  /**
   *
   * @param other
   */
  public equals = (other: Currency): boolean => {
    const array1 = this.symbol;
    const array2 = other.symbol;
    if (array1.length !== array2.length) {
      return false;
    }

    for (let i = 0; i < array1.length; i++) {
      if (array1[i] !== array2[i]) {
        return false;
      }
    }

    return true;
  };

  public valueOf = this.show;

  /**
   *
   */
  public toBlaze = (): Core.PolicyId => {
    return Core.toHex(this.symbol) as Core.PolicyId;
  };

  /**
   *
   * @param hexCurrencySymbol
   */
  static fromBlaze(hexCurrencySymbol: string): Currency {
    return new Currency(Core.fromHex(hexCurrencySymbol));
  }

  /**
   *
   * @param hex
   */
  static fromHex = (hex: string): Currency => {
    return new Currency(Core.fromHex(hex));
  };

  static numBytes = 28n;
  static ADA = new Currency(new Uint8Array(0));
  static dummy = new Currency(
    Core.fromHex("cc".repeat(Number(Currency.numBytes))),
  );
}

/**
 *
 */
export class PCurrency extends PWrapped<`symbol`, PByteString, Currency> {
  /**
   *
   */
  constructor() {
    super(
      new PByteString(Currency.numBytes, Currency.numBytes),
      Currency,
      "Currency",
    );
  }

  // custom showData for correct sorting (default compares stringified ByteStrings)
  /**
   *
   * @param data
   * @param _tabs
   * @param _maxDepth
   */
  public override showData = (
    data: Currency,
    _tabs = "",
    _maxDepth?: bigint,
  ): string => {
    return data.show();
  };

  static ptype = new PCurrency();
  /**
   *
   */
  static override genPType(): PWrapped<`symbol`, PByteString, Currency> {
    return PCurrency.ptype;
  }
}
