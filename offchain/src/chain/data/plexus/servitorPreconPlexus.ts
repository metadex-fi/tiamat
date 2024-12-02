import { TiamatUser } from "../../agents/tiamatUser";
import { Ganglion } from "../ganglion";
import {
  ServitorPrecon,
  WalletsFundsStatus,
} from "../../intents/precons/servitorPrecon";
import assert from "assert";
import { Plexus } from "../plexus";
import { WalletFundsPlexus } from "./walletFundsPlexus";
import { PDappConfigT, PDappParamsT } from "../../../types/tiamat/tiamat";
import { WalletFunds } from "../zygote";

export type WalletsFundsGanglion = Ganglion<WalletFunds[], WalletsFundsStatus>;

/**
 *
 */
export class ServitorPreconPlexus<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
> extends Plexus {
  private readonly walletsFundsGanglion: WalletsFundsGanglion;
  public readonly servitorPrecon: ServitorPrecon<DC, DP>;

  constructor(
    user: TiamatUser<DC, DP>,
    numTxFees: bigint,
    private readonly servitorFundsPlexus: WalletFundsPlexus<DC, DP>,
    private readonly ownerFundsPlexus: WalletFundsPlexus<DC, DP>,
  ) {
    super(`${user.name} ServitorPreconPlexus`);
    const ganglionName = `${user.name} WalletsFundsGanglion`;
    const afferents = [
      this.servitorFundsPlexus.walletFundsGanglion,
      this.ownerFundsPlexus.walletFundsGanglion,
    ];
    const procedure = (
      afferentStates: Map<
        Ganglion<WalletFunds[], WalletFunds>,
        WalletFunds | `virginal`
      >,
      _previous: WalletsFundsStatus | `virginal`,
      _signal: AbortSignal,
    ): Promise<WalletsFundsStatus | `virginal`> => {
      const servitorFunds = afferentStates.get(
        this.servitorFundsPlexus.walletFundsGanglion,
      );
      const ownerFunds = afferentStates.get(
        this.ownerFundsPlexus.walletFundsGanglion,
      );
      assert(
        servitorFunds && ownerFunds,
        `${ganglionName} procedure: servitorFunds and/or ownerFunds undefined`,
      );
      if (servitorFunds === `virginal` || ownerFunds === `virginal`) {
        this.log(
          `procedure: servitorFunds (${servitorFunds}) and/or ownerFunds (${ownerFunds}) virginal`,
        );
        return Promise.resolve(`virginal`);
      }
      return Promise.resolve(
        new WalletsFundsStatus(servitorFunds.funds, ownerFunds.funds),
      );
    };

    this.walletsFundsGanglion = new Ganglion<WalletFunds[], WalletsFundsStatus>(
      ganglionName,
      afferents,
      procedure,
    );

    this.servitorPrecon = new ServitorPrecon(
      user.name,
      this.walletsFundsGanglion,
      user.servitorAddress,
      numTxFees,
    );
  }

  myelinate(from: string[]): void {
    const from_ = [...from, `ServitorPreconPlexus`];
    this.walletsFundsGanglion.myelinate(from_);
  }
}
