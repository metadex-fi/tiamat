import assert from "assert";
import { PData } from "../../../types/general/fundamental/type";
import { Trace } from "../../../utils/wrappers";
import { TiamatSvm } from "../../state/tiamatSvm";
import { TiamatSvmUtxo } from "../../state/tiamatSvmUtxo";
import { Ganglion } from "../ganglion";
import { identityProcedure, SvmStem } from "../stem";
import { Plexus } from "../plexus";
import { MaybeSvmUtxo } from "../zygote";

export class SvmSingletonPlexus<
  PConfig extends PData,
  PState extends PData,
  PAction extends PData,
> extends Plexus {
  public readonly svmUtxoGanglion: Ganglion<
    any,
    MaybeSvmUtxo<PConfig, PState, PAction>
  >;
  //@ts-ignore
  private readonly svmUtxoStem: SvmStem<PConfig, PState, PAction>;

  constructor(svm: TiamatSvm<PConfig, PState, PAction>, tolerance = 0) {
    super(`${svm.name} SvmSingletonPlexus`);
    this.svmUtxoGanglion = new Ganglion<
      any,
      MaybeSvmUtxo<PConfig, PState, PAction>
    >(
      `${svm.name} SvmSingletonGanglion`,
      [], // no afferents for stem-ganglia
      identityProcedure,
    );

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

    this.svmUtxoStem = new SvmStem(
      svm,
      this.svmUtxoGanglion,
      senseSvmUtxo,
      tolerance,
    );
  }

  public myelinate = (from: string[]): void => {
    const from_ = [...from, `SvmSingletonPlexus`];
    this.svmUtxoGanglion.myelinate(from_);
  };
}
