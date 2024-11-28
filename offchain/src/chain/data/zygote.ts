import { Core } from "@blaze-cardano/sdk";
import { PData } from "../../types/general/fundamental/type";
import { UtxoSet } from "../../utils/wrappers";
import { TiamatSvmUtxo } from "../state/tiamatSvmUtxo";
import { Immutable } from "../../utils/immutable";

export type Zygote = Immutable<Cyst>;

abstract class Cyst {
  abstract equals(other: Zygote): boolean;
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
}

export class WalletFunds implements Zygote {
  public readonly funds: Map<Core.AssetId, bigint>;
  constructor(funds: Map<Core.AssetId, bigint>) {
    this.funds = new Map(funds);
  }
  public equals = (other: WalletFunds): boolean => {
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
}

export class BlockHeight implements Zygote {
  constructor(public readonly maybeBlock: number | `virginal`) {}

  public equals = (other: BlockHeight): boolean => {
    return this.maybeBlock === other.maybeBlock;
  };
}
