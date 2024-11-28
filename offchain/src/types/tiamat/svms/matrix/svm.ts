import { PSvmDatum } from "../../svm/datum";
import { PSvmRedeemer } from "../../svm/redeemer";
import { PMatrixAction } from "./action";
import { PMatrixConfig } from "./config";
import { PMatrixState } from "./state";

export const pmatrixDatum = new PSvmDatum(
  PMatrixConfig.ptype,
  PMatrixState.ptype,
);
export const pmatrixRedeemer = new PSvmRedeemer(PMatrixAction.ptype);
