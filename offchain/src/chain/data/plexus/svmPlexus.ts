import { PData } from "../../../types/general/fundamental/type";
import { Trace } from "../../../utils/wrappers";
import { TiamatSvm } from "../../state/tiamatSvm";
import { TiamatSvmUtxo } from "../../state/tiamatSvmUtxo";
import { SvmStem } from "../stem";
import { SvmUtxos } from "../zygote";
import { Plexus } from "../plexus";
import { Result } from "../../state/callback";

export class SvmPlexus<
  PConfig extends PData,
  PState extends PData,
  PAction extends PData,
> extends Plexus {
  public readonly svmStem: SvmStem<
    PConfig,
    PState,
    PAction,
    SvmUtxos<PConfig, PState, PAction>
  >;

  constructor(svm: TiamatSvm<PConfig, PState, PAction>, tolerance = 0) {
    super(`${svm.name} SvmPlexus`);

    const senseSvm = (
      svmUtxos: TiamatSvmUtxo<PConfig, PState, PAction>[],
      _trace: Trace,
    ): Promise<SvmUtxos<PConfig, PState, PAction>> => {
      return Promise.resolve(new SvmUtxos(svmUtxos));
    };

    this.svmStem = new SvmStem(svm, senseSvm, tolerance);
  }

  public myelinate = async (from: string[]): Promise<Result[]> => {
    const from_ = [...from, `SvmUtxoPlexus`];
    return await this.svmStem.myelinate(from_);
  };
}
