import { PDappConfigT, PDappParamsT } from "../../types/tiamat/tiamat";
import { BlocksPlexus } from "../data/plexus/blocksPlexus";
import {
  ElectionsPlexus,
  MatrixPlexus,
  NexusPlexus,
} from "../data/plexus/electionsPlexus";
import { SvmSingletonPlexus } from "../data/plexus/svmSingletonPlexus";
import { Result } from "./callback";
import { TiamatContract } from "./tiamatContract";

export class TiamatCortex<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
  ContractT extends TiamatContract<DC, DP>,
> {
  public readonly name: string;
  public readonly matrixPlexus: MatrixPlexus;
  public readonly nexusPlexus: NexusPlexus<DC, DP>;
  public readonly blocksPlexus: BlocksPlexus;
  public readonly electionsPlexus: ElectionsPlexus<DC, DP>;

  constructor(name: string, contract: ContractT) {
    this.name = `${name} TiamatCortex`;
    this.nexusPlexus = new SvmSingletonPlexus(contract.nexus);
    this.matrixPlexus = new SvmSingletonPlexus(contract.matrix);
    this.blocksPlexus = new BlocksPlexus(contract.utxoSource);

    this.electionsPlexus = new ElectionsPlexus(
      contract,
      this.matrixPlexus,
      this.nexusPlexus,
      this.blocksPlexus,
    );
  }

  public myelinate = async (from: string[]): Promise<Result[]> => {
    const from_ = [...from, `TiamatCortex: ${this.name}`];
    const result = await Promise.all([
      this.matrixPlexus.myelinate(from_),
      this.nexusPlexus.myelinate(from_),
      this.blocksPlexus.myelinate(from_),
      this.electionsPlexus.myelinate(from_),
    ]);
    return result.flat();
  };
}
