import { Core } from "@blaze-cardano/sdk";
import { PBlueprinted } from "../../../general/fundamental/type";
import { PSvmDatum } from "../../svm/datum";
import { PSvmRedeemer } from "../../svm/redeemer";
import { PVestingAction } from "./action";
import { PVestingConfig } from "./config";
import { PVestingState } from "./state";
import { V3VestingSvmValidator } from "../../../../../contract/plutus";

export const pvestingDatum = new PSvmDatum(
  PVestingConfig.ptype,
  PVestingState.ptype,
);
export const pvestingRedeemer = new PSvmRedeemer(PVestingAction.ptype);

type PDatumBP = PBlueprinted<PSvmDatum<PVestingConfig, PVestingState>>;
type PRedeemerBP = PBlueprinted<PSvmRedeemer<PVestingAction>>;
interface PSvmBP {
  new (nexus: { currency: string; token: string }): Core.Script;
  datum: PDatumBP;
  redeemer: PRedeemerBP;
}

type Conforms<T extends V3VestingSvmValidator> = T;
type Validated = Conforms<PSvmBP>; // ✅ Passes
// type Invalid = Conforms<{ foo: string }>; // ❌ Error

type ConformsBack<T extends PSvmBP> = T;
type ValidatedBack = ConformsBack<V3VestingSvmValidator>;
