import { Trace } from "../../../utils/wrappers";
import { Sent, UtxoSource } from "../../state/utxoSource";
import { Ganglion } from "../ganglion";
import { Plexus } from "../plexus";
import { BlocksStem, identityProcedure } from "../stem";
import { BlockHeight } from "../zygote";

export type BlocksGanglion = Ganglion<BlockHeight[], BlockHeight>;

/**
 *
 */
export class BlocksPlexus extends Plexus {
  public readonly blocksGanglion: BlocksGanglion;
  //@ts-ignore
  private readonly blocksStem: BlocksStem<BlockHeight>;

  constructor(utxoSource: UtxoSource) {
    super(`${utxoSource.name} BlocksPlexus`);
    this.blocksGanglion = new Ganglion<BlockHeight[], BlockHeight>(
      `${utxoSource.name} BlocksGanglion`,
      [], // no afferents for stem-ganglia
      identityProcedure,
    );

    const senseBlock = (block: number, _trace: Trace): Promise<BlockHeight> => {
      return Promise.resolve(new BlockHeight(block));
    };

    this.blocksStem = new BlocksStem(
      utxoSource,
      this.blocksGanglion,
      senseBlock,
    );
  }
  public myelinate = async (from: string[]): Promise<(string | Sent)[]> => {
    const from_ = [...from, `BlocksPlexus`];
    return await this.blocksGanglion.myelinate(from_);
  };
}
