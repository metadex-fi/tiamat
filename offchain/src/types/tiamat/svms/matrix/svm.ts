import { Core } from "@blaze-cardano/sdk";
import { PSvmDatum } from "../../svm/datum";
import { PSvmRedeemer } from "../../svm/redeemer";
import { PMatrixAction } from "./action";
import { PMatrixConfig } from "./config";
import { PMatrixState } from "./state";
import { V3MatrixSvmValidator } from "../../../../../contract/plutus";
import { PBlueprinted } from "../../../general/fundamental/type";

export const pmatrixDatum = new PSvmDatum(
  PMatrixConfig.ptype,
  PMatrixState.ptype,
);
export const pmatrixRedeemer = new PSvmRedeemer(PMatrixAction.ptype);

type PDatumBP = PBlueprinted<PSvmDatum<PMatrixConfig, PMatrixState>>;
type PRedeemerBP = PBlueprinted<PSvmRedeemer<PMatrixAction>>;
interface PSvmBP {
  new (): Core.Script;
  datum: PDatumBP;
  redeemer: PRedeemerBP;
}

type ConformsToInterface<T extends V3MatrixSvmValidator> = T;
type ValidatedType = ConformsToInterface<PSvmBP>; // ✅ Passes
// type InvalidValidatedType = ConformsToInterface<{ foo: string }>; // ❌ Error
