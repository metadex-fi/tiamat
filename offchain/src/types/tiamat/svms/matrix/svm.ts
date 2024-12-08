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

type DatumTarget = {
  id: { currency: string; token: string };
  config: { eigenwert: { currency: string; token: string } };
  state: {
    params: {
      minStake: bigint;
      cycleDuration: bigint;
      marginDuration: bigint;
      hingeLock: bigint;
      numEigenvectors: bigint;
      numSupportVectors: bigint;
      suggestedTip: bigint;
      vestingPolicy: string;
      vestingRate: { numerator: bigint; denominator: bigint };
    };
    eigenValues: Array<{
      start: bigint;
      end: bigint;
      vector: string;
      ip: string;
      port: bigint;
    }>;
  };
};

type Conforms2<T extends DatumTarget> = T;
type Validated2 = Conforms2<PDatumBP>;

type ConformsBack2<T extends PDatumBP> = T;
type ValidatedBack2 = ConformsBack2<DatumTarget>;

type RedeemerTarget =
  | {
      Revolve: {
        action: {
          vector: string;
          action:
            | { RegisterVector: { ip: string; port: bigint } }
            | "DeregisterVector"
            | "ChangeStake"
            | { UpdateVector: { ip: string; port: bigint } }
            | "ChangeProtocolParams";
        };
      };
    }
  | {
      Halt: {
        action: {
          vector: string;
          action:
            | { RegisterVector: { ip: string; port: bigint } }
            | "DeregisterVector"
            | "ChangeStake"
            | { UpdateVector: { ip: string; port: bigint } }
            | "ChangeProtocolParams";
        };
      };
    }
  | "Wipe";

type Conforms3<T extends RedeemerTarget> = T;
type Validated3 = Conforms3<PRedeemerBP>;

type ConformsBack3<T extends PRedeemerBP> = T;
type ValidatedBack3 = ConformsBack3<RedeemerTarget>;

type Conforms<T extends V3MatrixSvmValidator> = T;
type Validated = Conforms<PSvmBP>; // ✅ Passes
// type Invalid = Conforms<{ foo: string }>; // ❌ Error

type ConformsBack<T extends PSvmBP> = T;
type ValidatedBack = ConformsBack<V3MatrixSvmValidator>;
