import assert from "assert";
import { Core } from "@blaze-cardano/sdk";
import { randomChoice } from "../../../../utils/generators";
import { PObject } from "../../fundamental/container/object";
import { PRecord } from "../../fundamental/container/record";
import { Currency, PCurrency } from "./currency";
import { PToken, Token } from "./token";
// import { Hash } from '../hash/hash';

/**
 *
 */
export class Asset {
  public readonly typus = "Asset";
  /**
   *
   * @param currency
   * @param token
   */
  constructor(
    public readonly currency: Currency,
    public readonly token: Token, // | Hash
  ) {
    if (!Asset.assertADAlovelace(this)) Asset.assertFormat(this);
  }

  /**
   *
   */
  public show = (): string => {
    return `Asset(${this.currency.toString()}, ${this.token.toString()})`;
  };

  /**
   *
   */
  public concise = (): string => {
    return `${this.currency.concise()}.${this.token.concise()}`;
  };

  /**
   *
   * @param other
   */
  public equals = (other: Asset): boolean => {
    if (!this.currency.equals(other.currency)) return false;
    // if (this.token instanceof Token && other.token instanceof Token) {
    return this.token.equals(other.token);
    // }
    // if (this.token instanceof Hash && other.token instanceof Hash) {
    //   return this.token.equals(other.token);
    // }
    // return false;
  };

  /**
   *
   */
  public toBlaze = (): Core.AssetId => {
    if (this.currency.symbol.length === 0) return "" as Core.AssetId;
    else
      return Core.AssetId.fromParts(
        this.currency.toBlaze(),
        this.token.toBlaze(),
      );
  };

  /**
   *
   * @param amount
   */
  public toBlazeWith(amount: bigint): Core.Value {
    const assetId = this.toBlaze();
    const multiasset = new Map<Core.AssetId, bigint>();
    multiasset.set(assetId, amount);
    return new Core.Value(0n, multiasset);
  }

  /**
   *
   * @param asset
   */
  static fromBlaze(asset: Core.AssetId): Asset {
    return new Asset(
      Currency.fromBlaze(Core.AssetId.getPolicyId(asset)),
      Token.fromBlaze(Core.AssetId.getAssetName(asset)),
    );
  }

  /**
   *
   * @param asset
   * @returns if asset is ADA
   */
  static assertADAlovelace(asset: Asset): boolean {
    if (asset.currency.toString() === "") {
      assert(
        asset.token.toString() === "",
        `ADA must have lovelace, got ${asset.show()}`,
      );
      return true;
    }
    return false;
  }

  /**
   *
   * @param asset
   */
  static assertFormat(asset: Asset): void {
    try {
      Core.AssetId.fromParts(asset.currency.toBlaze(), asset.token.toBlaze());
    } catch (error) {
      throw new Error(
        `Asset.assertFormat:\nccy: "${asset.currency.toBlaze()}"\ntkn: "${asset.token.toBlaze()}"\nerror: ${error}`,
      );
    }
  }

  // static maxLength = 64n;
  // static assertLength(asset: Asset): void {
  //   const ccy = asset.currency.symbol.length * 2;
  //   const tkn = asset.token.name.length;
  //   const ass = ccy + tkn;

  //   assert(
  //     ass <= Asset.maxLength,
  //     `Asset too long: ${asset.show()}, ${ass} = ${ccy} + ${tkn}`,
  //   );
  // }

  static ADA = new Asset(Currency.ADA, Token.lovelace);

  /**
   *
   */
  private static generateNonADA = (): Asset => {
    const ccy = PCurrency.ptype.genData();
    const tkn = PToken.ptype.genData();
    return new Asset(ccy, tkn);
  };

  /**
   *
   */
  static generate(): Asset {
    return randomChoice([() => Asset.ADA, Asset.generateNonADA])();
  }
}

// export interface BPAsset {
//   policy: string;
//   name: string;
// }

/**
 *
 */
export class PAsset extends PObject<Asset> {
  /**
   *
   */
  private constructor() {
    super(
      new PRecord({
        currency: PCurrency.ptype,
        token: PToken.ptype,
      }),
      Asset,
      `Asset`,
    );
  }

  // /**
  //  *
  //  * @param data
  //  */
  // public override pblueprint = (
  //   data: Asset,
  // ): {
  //   policy: string;
  //   name: string;
  // } => {
  //   return {
  //     policy: data.currency.toBlaze(),
  //     name: data.token.toBlaze(),
  //   };
  // };

  public override genData = Asset.generate;

  /**
   *
   * @param data
   */
  public override showData = (data: Asset): string => {
    assert(
      data instanceof Asset,
      `PAsset.showData: expected Asset, got ${data}`,
    );
    return data.show();
  };

  /**
   *
   */
  public override showPType = (): string => {
    return `PObject: PAsset`;
  };

  static ptype = new PAsset();
  /**
   *
   */
  static override genPType(): PObject<Asset> {
    return PAsset.ptype;
  }
}
