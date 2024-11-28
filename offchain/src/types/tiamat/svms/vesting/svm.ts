import { PSvmDatum } from "../../svm/datum";
import { PSvmRedeemer } from "../../svm/redeemer";
import { PVestingAction } from "./action";
import { PVestingConfig } from "./config";
import { PVestingState } from "./state";

export const pvestingDatum = new PSvmDatum(
  PVestingConfig.ptype,
  PVestingState.ptype,
);
export const pvestingRedeemer = new PSvmRedeemer(PVestingAction.ptype);
