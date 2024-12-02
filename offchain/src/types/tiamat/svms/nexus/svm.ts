import { PSvmDatum } from "../../svm/datum";
import { PSvmRedeemer } from "../../svm/redeemer";
import { PDappConfigT, PDappParamsT } from "../../tiamat";
import { PNexusAction } from "./action";
import { PNexusConfig } from "./config";
import { PNexusState } from "./state";

export const mkPNexusDatum = <DC extends PDappConfigT, DP extends PDappParamsT>(
  pdappConfig: DC,
  pdappParams: DP,
) => new PSvmDatum(new PNexusConfig(pdappConfig), new PNexusState(pdappParams));
export const pnexusRedeemer = new PSvmRedeemer(PNexusAction.ptype);
