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

export class WalletFunds<WT extends `servitor` | `owner`> implements Zygote {
  public readonly funds: Map<Core.AssetId, bigint>;
  constructor(
    public readonly wallet: WT,
    funds: Map<Core.AssetId, bigint>,
  ) {
    this.funds = new Map(funds);
  }
  public equals = (other: WalletFunds<WT>): boolean => {
    if (this.funds === other.funds) {
      return true;
    }
    if (this.funds.size !== other.funds.size) {
      return false;
    }
    for (const [assetID, amount] of this.funds) {
      if (other.funds.get(assetID) !== amount) {
        return false;
      }
    }
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

export class SvmUtxos<
  PConfig extends PData,
  PState extends PData,
  PAction extends PData,
> implements Zygote
{
  constructor(
    public readonly utxos: TiamatSvmUtxo<PConfig, PState, PAction>[],
  ) {}

  public equals = (other: SvmUtxos<PConfig, PState, PAction>): boolean => {
    if (this.utxos === other.utxos) {
      return true;
    } else if (this.utxos.length !== other.utxos.length) {
      return false;
    } else {
      for (let i = 0; i < this.utxos.length; i++) {
        if (!this.utxos[i]!.sameUtxo(other.utxos[i]!)) {
          return false;
        }
      }
      return true;
    }
  };

  public show = (_tabs = ``): string => {
    return `SvmUtxos: ${this.utxos}`;
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
