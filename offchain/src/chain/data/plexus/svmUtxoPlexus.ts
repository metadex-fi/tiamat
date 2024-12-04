import assert from "assert";
import { Asset } from "../../../types/general/derived/asset/asset";
import { PData } from "../../../types/general/fundamental/type";
import { Trace } from "../../../utils/wrappers";
import { TiamatSvm } from "../../state/tiamatSvm";
import { TiamatSvmUtxo } from "../../state/tiamatSvmUtxo";
import { SvmStem } from "../stem";
import { MaybeSvmUtxo } from "../zygote";
import { Plexus } from "../plexus";
import { Result } from "../../state/callback";

export class SvmUtxoPlexus<
  PConfig extends PData,
  PState extends PData,
  PAction extends PData,
> extends Plexus {
  public readonly svmUtxoStem: SvmStem<PConfig, PState, PAction>;

  constructor(
    svm: TiamatSvm<PConfig, PState, PAction>,
    getSvmId: () => Asset | `no svmId`,
    tolerance = 0,
  ) {
    super(`${svm.name} SvmUtxoPlexus`);

    const senseSvmUtxo = (
      svmUtxos: TiamatSvmUtxo<PConfig, PState, PAction>[],
      _trace: Trace,
    ): Promise<MaybeSvmUtxo<PConfig, PState, PAction>> => {
      const svmId = getSvmId();
      if (svmId === `no svmId`) {
        return Promise.resolve(new MaybeSvmUtxo(`no svmId`));
      }
      const svmUtxos_ = svmUtxos.filter(
        (utxo) => utxo.idNFT.equals(svmId) && utxo.nftCheck === `ok`,
      );
      assert(
        svmUtxos_.length <= 1,
        `SvmUtxoPlexus: more than one utxo found: ${svmUtxos_.length}`,
      );
      if (svmUtxos_.length === 0) {
        return Promise.resolve(new MaybeSvmUtxo(`utxo not found`));
      }
      const svmUtxo = svmUtxos_[0]!;
      return Promise.resolve(new MaybeSvmUtxo(svmUtxo));
    };

    this.svmUtxoStem = new SvmStem(svm, senseSvmUtxo, tolerance);
  }

  public myelinate = async (from: string[]): Promise<Result[]> => {
    const from_ = [...from, `SvmUtxoPlexus`];
    return await this.svmUtxoStem.myelinate(from_);
  };
}
