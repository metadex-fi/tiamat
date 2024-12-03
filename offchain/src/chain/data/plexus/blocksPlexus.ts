import { Trace } from "../../../utils/wrappers";
import { Sent, UtxoSource } from "../../state/utxoSource";
import { Ganglion } from "../ganglion";
import { Plexus } from "../plexus";
import { BlocksStem } from "../stem";
import { BlockHeight } from "../zygote";

export type BlocksGanglion = Ganglion<BlockHeight[], BlockHeight>;

/**
 *
 */
export class BlocksPlexus extends Plexus {
  public readonly blocksStem: BlocksStem;

  constructor(utxoSource: UtxoSource) {
    super(`${utxoSource.name} BlocksPlexus`);
    const senseBlock = (block: number, _trace: Trace): Promise<BlockHeight> => {
      return Promise.resolve(new BlockHeight(block));
    };

    this.blocksStem = new BlocksStem(utxoSource, senseBlock);
  }
  public myelinate = async (from: string[]): Promise<(string | Sent)[]> => {
    const from_ = [...from, `BlocksPlexus`];
    return await this.blocksStem.myelinate(from_);
  };
}
