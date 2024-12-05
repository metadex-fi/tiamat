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
import { WalletFundsStem } from "../stem";

type InZsT = [WalletFunds<`servitor`>, WalletFunds<`owner`>];

export type WalletsFundsGanglion = Ganglion<InZsT, WalletsFundsStatus>;

/**
 *
 */
export class ServitorPreconPlexus<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
  CT extends TiamatContract<DC, DP>,
> extends Plexus {
  public readonly walletsFundsGanglion: WalletsFundsGanglion;
  public readonly servitorPrecon: ServitorPrecon<DC, DP>;

  constructor(
    user: TiamatUser<DC, DP, CT>,
    private readonly servitorFundsPlexus: WalletFundsPlexus<`servitor`>,
    private readonly ownerFundsPlexus: WalletFundsPlexus<`owner`>,
  ) {
    super(`${user.name} ServitorPreconPlexus`);
    const ganglionName = `${user.name} WalletsFundsGanglion`;
    const afferents: [WalletFundsStem<`servitor`>, WalletFundsStem<`owner`>] = [
      this.servitorFundsPlexus.walletFundsStem,
      this.ownerFundsPlexus.walletFundsStem,
    ];
    const procedure = (
      afferentStates: Map<
        Ganglion<InZsT[number][], InZsT[number]>,
        InZsT[number] | `virginal`
      >,
      _previous: WalletsFundsStatus | `virginal`,
      _signal: AbortSignal,
    ): Promise<WalletsFundsStatus | `virginal`> => {
      const servitorFunds = afferentStates.get(
        this.servitorFundsPlexus.walletFundsStem as any,
      );
      const ownerFunds = afferentStates.get(
        this.ownerFundsPlexus.walletFundsStem as any,
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

      assert(ownerFunds.wallet === `owner`, `ownerFunds not owner`);
      assert(servitorFunds.wallet === `servitor`, `servitorFunds not servitor`);

      return Promise.resolve(new WalletsFundsStatus(ownerFunds, servitorFunds));
    };

    this.walletsFundsGanglion = new Ganglion<InZsT, WalletsFundsStatus>(
      ganglionName,
      afferents,
      procedure,
    );

    this.servitorPrecon = new ServitorPrecon(
      user.name,
      this.walletsFundsGanglion,
      user.servitorAddress,
    );
  }

  public myelinate = async (from: string[]): Promise<Result[]> => {
    const from_ = [...from, `ServitorPreconPlexus`];
    return await this.walletsFundsGanglion.myelinate(from_);
  };
}
