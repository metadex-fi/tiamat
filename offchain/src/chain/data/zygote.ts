import { Core } from "@blaze-cardano/sdk";
import { f, PData } from "../../types/general/fundamental/type";
import { UtxoSet } from "../../utils/wrappers";
import { TiamatSvmUtxo } from "../state/tiamatSvmUtxo";
import { Immutable } from "../../utils/immutable";

export type Zygote = Immutable<Cyst>;

abstract class Cyst {
  abstract equals(other: Zygote): boolean;
  abstract show(tabs: string): string;
}

export class WalletUtxos implements Zygote {
  constructor(public maybeUtxos: UtxoSet | `virginal`) {}
  public equals = (other: WalletUtxos): boolean => {
    if (this.maybeUtxos === `virginal`) {
      return other.maybeUtxos === `virginal`;
    } else if (other.maybeUtxos === `virginal`) {
      return false;
    } else {
      return this.maybeUtxos.equals(other.maybeUtxos);
    }
  };
  public show = (tabs = ``): string => {
    const tf = `${tabs}${f}`;
    return `WalletUtxos: ${this.maybeUtxos === `virginal` ? this.maybeUtxos : this.maybeUtxos.show(tf)}`;
  };
}

export class WalletFunds implements Zygote {
  public readonly funds: Map<Core.AssetId, bigint>;
  constructor(funds: Map<Core.AssetId, bigint>) {
    this.funds = new Map(funds);
  }
  public equals = (other: WalletFunds): boolean => {
    console.log(`comparing`, this.funds, `with`, other.funds);
    if (this.funds === other.funds) {
      console.log(`same instance`);
      return true;
    }
    if (this.funds.size !== other.funds.size) {
      console.log(`different sizes:`, this.funds.size, `vs`, other.funds.size);
      return false;
    }
    console.log(`same sizes:`, this.funds.size, `vs`, other.funds.size);
    for (const [assetID, amount] of this.funds) {
      if (other.funds.get(assetID) !== amount) {
        console.log(
          `different amount for`,
          assetID,
          `:`,
          amount,
          `vs`,
          other.funds.get(assetID),
        );
        return false;
      }
      console.log(
        `same amount for`,
        assetID,
        `:`,
        amount,
        `vs`,
        other.funds.get(assetID),
      );
    }
    console.log(`all amounts are the same`);
    return true;
  };

  public show = (tabs = ``): string => {
    if (this.funds.size === 0) {
      return `WalletFunds: None`;
    }
    const tf = `${tabs}${f}`;
    return `WalletFunds:\n${[...this.funds.entries()].map(([assetID, amount]) => `${tf}"${assetID}": ${amount}`).join(`\n`)}`;
  };
}

export class MaybeSvmUtxo<
  PConfig extends PData,
  PState extends PData,
  PAction extends PData,
> implements Zygote
{
  constructor(
    public readonly maybeUtxo:
      | TiamatSvmUtxo<PConfig, PState, PAction>
      | `utxo not found`
      | `no svmId`
      | `virginal`,
  ) {}

  public equals = (other: MaybeSvmUtxo<PConfig, PState, PAction>): boolean => {
    if (typeof this.maybeUtxo === `string`) {
      return this.maybeUtxo === other.maybeUtxo;
    } else if (typeof other.maybeUtxo === `string`) {
      return false;
    } else {
      return this.maybeUtxo.sameUtxo(other.maybeUtxo);
    }
  };

  public show = (_tabs = ``): string => {
    return `MaybeSvmUtxo: ${this.maybeUtxo === `virginal` ? this.maybeUtxo : `TiamatSvmUtxo`}`;
  };
}

export class BlockHeight implements Zygote {
  constructor(public readonly maybeBlock: number | `virginal`) {}

  public equals = (other: BlockHeight): boolean => {
    return this.maybeBlock === other.maybeBlock;
  };

  public show = (_tabs = ``): string => {
    return `BlockHeight: ${this.maybeBlock}`;
  };
}
