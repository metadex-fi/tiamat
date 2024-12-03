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
import { Callback } from "../../state/callback";
import { Effector } from "../effector";
import { Trace } from "../../../utils/wrappers";
import { Sent } from "../../state/utxoSource";

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
      _previous: MatrixNexusBlock<DC, DP> | `virginal`,
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

export class ElectionGanglion<
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
      previous: ElectionData<DC, DP> | `virginal`,
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
        previous,
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

/**
 *
 * if the current election updates (which should only happen during inital setup), and the next election is more than double margin away, we connect to the eigenvectors.
 * NOTE: That should however never happen beyond initial setup -> TODO: asserts etc
 */
export class CurrentElectionEffector<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
> extends Effector<ElectionData<DC, DP>> {
  constructor(
    name: string,
    updateConnections: (
      election: ElectionData<DC, DP>,
      trace: Trace,
    ) => Promise<(string | Sent)[]>, // TODO
  ) {
    name = `${name} CurrentElectionEffector`;
    const connect = async (
      data: ElectionData<DC, DP>,
      trace: Trace,
    ): Promise<(string | Sent)[]> => {
      const phase = data.phase.type;
      if (
        phase === `within single margin` ||
        phase === `within double margin`
      ) {
        return [`${name}: within double margin or less, not connecting`];
      } else {
        return await updateConnections(data, trace);
      }
    };
    const currentElectionEffect = new Callback(
      `always`,
      [name, `connect`],
      connect,
    );
    super(currentElectionEffect);
  }
}

/**
 *
 * if the next election is less than a block away, we do different things, depending on how far the next election is away:
 * if we are more than two margins away, we simply start a timer for the two-margin effects.
 * if we are within less than two margins, we start being open for connection requests (server) and stop sending transactions (client).
 *  * if we are between one and two margins, we start a timer for the one-margin effects.
 * if we are within a single margin, we start connecting to the next cycle's eigenvectors.
 */
export class NextElectionEffector<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
> extends Effector<ElectionData<DC, DP>> {
  private doubleMarginTimeout?: NodeJS.Timeout;
  private singleMarginTimeout?: NodeJS.Timeout;
  constructor(
    name: string,
    prepareForConnections: (
      election: ElectionData<DC, DP>,
    ) => Promise<(string | Sent)[]>, // TODO
    updateConnections: (
      election: ElectionData<DC, DP>,
      trace: Trace,
    ) => Promise<(string | Sent)[]>, // TODO
  ) {
    name = `${name} NextElectionEffector`;
    const discernMargins = async (
      data: ElectionData<DC, DP>,
      trace: Trace,
    ): Promise<(string | Sent)[]> => {
      clearTimeout(this.doubleMarginTimeout);
      clearTimeout(this.singleMarginTimeout);

      const phase = data.phase;
      switch (phase.type) {
        case `more than one block`:
          return [
            `${name}: more than one block from next cycle, doing nothing`,
          ];
        case `less than one block`:
          this.doubleMarginTimeout = setTimeout(
            () => prepareForConnections(data),
            phase.untilDoubleMarginMs,
          );
          this.singleMarginTimeout = setTimeout(
            () => updateConnections(data, trace),
            phase.untilSingleMarginMs,
          );
          return [`${name}: less than one block from next cycle`];
        case `within double margin`:
          this.singleMarginTimeout = setTimeout(
            () => updateConnections(data, trace),
            phase.untilSingleMarginMs,
          );
          return await prepareForConnections(data);
        case `within single margin`:
          return (
            await Promise.all([
              prepareForConnections(data),
              updateConnections(data, trace),
            ])
          ).flat();
      }
    };

    const currentElectionEffect = new Callback(
      `always`,
      [name, `connect`],
      discernMargins,
    );
    super(currentElectionEffect);
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
  private electionEffectors?: {
    currentElectionEffector: CurrentElectionEffector<DC, DP>;
    nextElectionEffector: NextElectionEffector<DC, DP>;
  };

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

  public innervateMarginEffectors = (
    prepareForConnections: (
      election: ElectionData<DC, DP>,
    ) => Promise<(string | Sent)[]>,
    updateConnections: (
      election: ElectionData<DC, DP>,
      trace: Trace,
    ) => Promise<(string | Sent)[]>,
  ) => {
    assert(
      !this.electionEffectors,
      `ElectionPreconPlexus: effectors already innervated`,
    );

    const currentElectionEffector = new CurrentElectionEffector(
      this.name,
      updateConnections,
    ) as Effector<ElectionData<DC, DP>>;

    const nextElectionEffector = new NextElectionEffector(
      this.name,
      prepareForConnections,
      updateConnections,
    ) as Effector<ElectionData<DC, DP>>;

    this.electionEffectors = {
      currentElectionEffector,
      nextElectionEffector,
    };

    this.currentElectionGanglion.innervateEffector(currentElectionEffector);
    this.nextElectionGanglion.innervateEffector(nextElectionEffector);
  };

  public myelinate = (from: string[]): void => {
    const from_ = [...from, `ElectionPreconPlexus`];
    this.matrixNexusBlocksGanglion.myelinate(from_);
    this.currentElectionGanglion.myelinate(from_);
    this.nextElectionGanglion.myelinate(from_);
  };
}
