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
import { TiamatContract } from "../../state/tiamatContract";
import { Result } from "../../state/callback";

export type WalletsFundsGanglion = Ganglion<WalletFunds[], WalletsFundsStatus>;

/**
 *
 */
export class ServitorPreconPlexus<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
  CT extends TiamatContract<DC, DP>,
> extends Plexus {
  private readonly walletsFundsGanglion: WalletsFundsGanglion;
  public readonly servitorPrecon: ServitorPrecon<DC, DP>;

  constructor(
    user: TiamatUser<DC, DP, CT>,
    numTxFees: bigint,
    private readonly servitorFundsPlexus: WalletFundsPlexus,
    private readonly ownerFundsPlexus: WalletFundsPlexus,
  ) {
    super(`${user.name} ServitorPreconPlexus`);
    const ganglionName = `${user.name} WalletsFundsGanglion`;
    const afferents = [
      this.servitorFundsPlexus.walletFundsStem,
      this.ownerFundsPlexus.walletFundsStem,
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
        this.servitorFundsPlexus.walletFundsStem,
      );
      const ownerFunds = afferentStates.get(
        this.ownerFundsPlexus.walletFundsStem,
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

  public myelinate = async (from: string[]): Promise<Result[]> => {
    const from_ = [...from, `ServitorPreconPlexus`];
    return await this.walletsFundsGanglion.myelinate(from_);
  };
}
