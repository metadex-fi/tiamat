import assert from "assert";
import { PData } from "../../../types/general/fundamental/type";
import { Trace } from "../../../utils/wrappers";
import { TiamatSvm } from "../../state/tiamatSvm";
import { TiamatSvmUtxo } from "../../state/tiamatSvmUtxo";
import { SvmStem } from "../stem";
import { Plexus } from "../plexus";
import { MaybeSvmUtxo } from "../zygote";
import { Sent } from "../../state/utxoSource";

export class SvmSingletonPlexus<
  PConfig extends PData,
  PState extends PData,
  PAction extends PData,
> extends Plexus {
  public readonly svmUtxoStem: SvmStem<PConfig, PState, PAction>;

  constructor(svm: TiamatSvm<PConfig, PState, PAction>, tolerance = 0) {
    super(`${svm.name} SvmSingletonPlexus`);

    const senseSvmUtxo = (
      svmUtxos: TiamatSvmUtxo<PConfig, PState, PAction>[],
      _trace: Trace,
    ): Promise<MaybeSvmUtxo<PConfig, PState, PAction>> => {
      assert(
        svmUtxos.length <= 1,
        `SvmSingletonPlexus: more than one utxo found: ${svmUtxos.length}`,
      );
      if (svmUtxos.length === 0) {
        return Promise.resolve(new MaybeSvmUtxo(`utxo not found`));
      }
      const svmUtxo = svmUtxos[0]!;
      return Promise.resolve(new MaybeSvmUtxo(svmUtxo));
    };

    this.svmUtxoStem = new SvmStem(svm, senseSvmUtxo, tolerance);
  }

  public myelinate = async (from: string[]): Promise<(string | Sent)[]> => {
    const from_ = [...from, `SvmSingletonPlexus`];
    return await this.svmUtxoStem.myelinate(from_);
  };
}
