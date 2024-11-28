import assert from "assert";
import { PMatrixAction } from "../../../types/tiamat/svms/matrix/action";
import { PMatrixConfig } from "../../../types/tiamat/svms/matrix/config";
import { PMatrixState } from "../../../types/tiamat/svms/matrix/state";
import { PNexusAction } from "../../../types/tiamat/svms/nexus/action";
import { PNexusConfig } from "../../../types/tiamat/svms/nexus/config";
import { PNexusState } from "../../../types/tiamat/svms/nexus/state";
import { ElectionPrecon } from "../../intents/precons/electionPrecon";
import { TiamatContract } from "../../state/tiamatContract";
import { Ganglion } from "../ganglion";
import { Plexus } from "../plexus";
import { SvmSingletonPlexus } from "./svmSingletonPlexus";
import { MatrixUtxo, NexusUtxo } from "../../state/tiamatSvmUtxo";
import { Asset } from "../../../types/general/derived/asset/asset";
import { ElectionData } from "../../state/electionData";
import { BlockHeight, MaybeSvmUtxo, Zygote } from "../zygote";
import { PDappConfigT, PDappParamsT } from "../../../types/tiamat/tiamat";
import { BlocksGanglion, BlocksPlexus } from "./blocksPlexus";

type MC = PMatrixConfig;
type MS = PMatrixState;
type MA = PMatrixAction;
type NC<DC extends PDappConfigT> = PNexusConfig<DC>;
type NS<DP extends PDappParamsT> = PNexusState<DP>;
type NA = PNexusAction;

export type MatrixPlexus = SvmSingletonPlexus<MC, MS, MA>;
export type NexusPlexus<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
> = SvmSingletonPlexus<NC<DC>, NS<DP>, NA>;

export type MaybeMatrix = MaybeSvmUtxo<MC, MS, MA>;
export type MaybeNexus<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
> = MaybeSvmUtxo<NC<DC>, NS<DP>, NA>;

export type MatrixGanglion = Ganglion<any[], MaybeMatrix>;
export type NexusGanglion<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
> = Ganglion<any, MaybeNexus<DC, DP>>;

type InZsT<DC extends PDappConfigT, DP extends PDappParamsT> = [
  MaybeMatrix,
  MaybeNexus<DC, DP>,
  BlockHeight,
];

class MatrixNexusBlock<DC extends PDappConfigT, DP extends PDappParamsT>
  implements Zygote
{
  constructor(
    public readonly matrix: MatrixUtxo,
    public readonly nexus: NexusUtxo<DC, DP>,
    public readonly block: number,
  ) {}

  public equals = (other: MatrixNexusBlock<DC, DP>): boolean => {
    return (
      this.matrix === other.matrix &&
      this.nexus === other.nexus &&
      this.block === other.block
    );
  };
}

class MatrixNexusBlocksGanglion<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
> extends Ganglion<InZsT<DC, DP>, MatrixNexusBlock<DC, DP>> {
  constructor(
    name: string,
    matrixGanglion: MatrixGanglion,
    nexusGanglion: NexusGanglion<DC, DP>,
    blocksGanglion: BlocksGanglion,
  ) {
    name = `${name} MatrixNexusBlocksGanglion`;

    const afferents: [MatrixGanglion, NexusGanglion<DC, DP>, BlocksGanglion] = [
      matrixGanglion,
      nexusGanglion,
      blocksGanglion,
    ];

    const procedure = (
      afferentStates: Map<
        Ganglion<any[], InZsT<DC, DP>[number]>,
        InZsT<DC, DP>[number] | "virginal"
      >,
      _signal: AbortSignal,
    ): Promise<MatrixNexusBlock<DC, DP> | `virginal`> => {
      const maybeMatrix = afferentStates.get(matrixGanglion as any);
      const maybeNexus = afferentStates.get(nexusGanglion as any);
      const maybeBlock = afferentStates.get(blocksGanglion as any);
      assert(
        maybeMatrix && maybeNexus && maybeBlock,
        `${name} procedure: matrixUtxo (${maybeMatrix}) and/or nexusUtxo (${maybeNexus}) and/or blockHeight (${maybeBlock}) undefined`,
      );
      if (
        maybeMatrix === `virginal` ||
        maybeNexus === `virginal` ||
        maybeBlock === `virginal`
      ) {
        return Promise.resolve(`virginal`);
      }
      const matrix = maybeMatrix as MaybeMatrix;
      const nexus = maybeNexus as MaybeNexus<DC, DP>;
      const block = maybeBlock as BlockHeight;
      assert(
        typeof matrix.maybeUtxo !== `string` &&
          typeof nexus.maybeUtxo !== `string` &&
          typeof block.maybeBlock !== `string`,
        `ElectionPreconPlexus: matrix (${matrix.maybeUtxo}) and/or nexus (${nexus.maybeUtxo})  and/or block (${block.maybeBlock}) not valid`,
      );

      return Promise.resolve(
        new MatrixNexusBlock(
          matrix.maybeUtxo,
          nexus.maybeUtxo,
          block.maybeBlock,
        ),
      );
    };
    super(name, afferents, procedure);
  }
}

class ElectionGanglion<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
> extends Ganglion<[MatrixNexusBlock<DC, DP>], ElectionData<DC, DP>> {
  constructor(
    name: string,
    matrixNexusBlocksGanglion: MatrixNexusBlocksGanglion<DC, DP>,
    forCycle: `current` | `next`,
  ) {
    name = `${name} (${forCycle})ElectionGanglion`;

    const afferents: [MatrixNexusBlocksGanglion<DC, DP>] = [
      matrixNexusBlocksGanglion,
    ];

    const procedure = (
      afferentStates: Map<
        Ganglion<any[], MatrixNexusBlock<DC, DP>>,
        MatrixNexusBlock<DC, DP> | "virginal"
      >,
      _signal: AbortSignal,
    ): Promise<ElectionData<DC, DP> | `virginal`> => {
      const matrixNexusUtxos = afferentStates.get(
        matrixNexusBlocksGanglion as any,
      );
      assert(matrixNexusUtxos, `${name} procedure: matrixNexusUtxos undefined`);
      if (matrixNexusUtxos === `virginal`) {
        return Promise.resolve(`virginal`);
      }
      const electionData = ElectionData.compute(
        name,
        matrixNexusUtxos.matrix,
        matrixNexusUtxos.nexus,
        forCycle,
      );

      return Promise.resolve(electionData);
    };

    super(name, afferents, procedure);
  }
}

export class ElectionsPlexus<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
> extends Plexus {
  private readonly matrixNexusBlocksGanglion: MatrixNexusBlocksGanglion<DC, DP>;
  public readonly currentElectionGanglion: ElectionGanglion<DC, DP>;
  public readonly nextElectionGanglion: ElectionGanglion<DC, DP>;
  public readonly currentElectionPrecon: ElectionPrecon<DC, DP>;
  public readonly nextElectionPrecon: ElectionPrecon<DC, DP>;

  constructor(
    contract: TiamatContract<DC, DP>,
    matrixPlexus: MatrixPlexus,
    nexusPlexus: NexusPlexus<DC, DP>,
    blocksPlexus: BlocksPlexus,
  ) {
    super(`${contract.name} ElectionPreconPlexus`);
    this.matrixNexusBlocksGanglion = new MatrixNexusBlocksGanglion(
      contract.name,
      matrixPlexus.svmUtxoGanglion,
      nexusPlexus.svmUtxoGanglion,
      blocksPlexus.blocksGanglion,
    );

    this.currentElectionGanglion = new ElectionGanglion(
      contract.name,
      this.matrixNexusBlocksGanglion,
      `current`,
    );

    this.nextElectionGanglion = new ElectionGanglion(
      contract.name,
      this.matrixNexusBlocksGanglion,
      `next`,
    );

    /*
    TODO:
    - we want some new sort of ganglion that has as afferents some sort of election-ganglion, and the blocks-ganglion.
    - the idea is that whenever there's a new block, it will check if the next election cycle will start next block.
    - we can't use the election-ganglia directly, because due to the equals-method of ElectionData they won't normally update when the block changes.
    - if this electionImminentGanglion detects that the next election-cyle will start next block, it starts a timer/timeout, such that the election-imminent-subscriptions can be triggered.

    - TODO: check again how the socketServer and socketClient handle this, and ponder at which times we want what to happen.


    */

    const nexusID = new Asset(
      contract.nexus.currency,
      contract.nexusID,
    ).toBlaze();

    this.currentElectionPrecon = new ElectionPrecon(
      contract.name,
      this.currentElectionGanglion,
      nexusID,
      `current`,
    );

    this.nextElectionPrecon = new ElectionPrecon(
      contract.name,
      this.nextElectionGanglion,
      nexusID,
      `next`,
    );
  }

  myelinate(from: string[]): void {
    const from_ = [...from, `ElectionPreconPlexus`];
    this.matrixNexusBlocksGanglion.myelinate(from_);
    this.currentElectionGanglion.myelinate(from_);
    this.nextElectionGanglion.myelinate(from_);
  }
}
