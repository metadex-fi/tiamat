import { Core } from "@blaze-cardano/sdk";
import { PData } from "../../types/general/fundamental/type";
import { Trace, UtxoSet } from "../../utils/wrappers";
import { Callback } from "../state/callback";
import { TiamatSvm } from "../state/tiamatSvm";
import { TiamatSvmUtxo } from "../state/tiamatSvmUtxo";
import { Wallet } from "../state/wallet";
import { Ganglion } from "./ganglion";
import {
  BlockHeight,
  MaybeSvmUtxo,
  WalletFunds,
  WalletUtxos,
  Zygote,
} from "./zygote";
import { UtxoSource } from "../state/utxoSource";

// export const identityProcedure = async <ZT extends Zygote>(
//   afferentStates: Map<Ganglion<any[], ZT>, ZT | `virginal`>,
//   _previous: ZT | `virginal`,
//   _signal: AbortSignal,
// ): Promise<ZT | `virginal`> => {
//   // await new Promise((resolve) => setTimeout(resolve, 0));

//   const values = afferentStates.values();
//   const next = values.next();
//   assert(!next.done, `identityProcedure: no afferents`);
//   const first = next.value;
//   assert(values.next().done, `identityProcedure: more than one afferent`);
//   return Promise.resolve(first);
// };

const neverProcedure = async <ZT extends Zygote>(
  _afferentStates: Map<Ganglion<any[], ZT>, ZT | `virginal`>,
  _previous: ZT | `virginal`,
  _signal: AbortSignal,
): Promise<ZT | `virginal`> => {
  throw new Error(`neverProcedure should never be executed`);
};

class Stem<PerceptT, ZT extends Zygote> extends Ganglion<ZT[], ZT> {
  constructor(
    name: string,
    private readonly sensing: (percept: PerceptT, trace2: Trace) => Promise<ZT>,
  ) {
    super(name, [], neverProcedure);
  }

  protected sense = async (
    percept: PerceptT,
    trace: Trace,
  ): Promise<string[]> => {
    if (this.processSemaphore.busy) {
      this.doubleTapped = true;
      return [`${this.name}: Busy`];
    }
    const processID = this.processSemaphore.latch(`process`);
    const result: string[] = [];
    const trace_ = trace.via(`${this.name}.sense`);
    while (true) {
      try {
        const trace__ = trace_.compose();
        this.log(`Sensing`, trace__);
        const perception = await this.sensing(percept, trace_);
        if (this.current !== `virginal` && this.current.equals(perception)) {
          this.log(`No change in perception:`, this.current);
          result.push(`${this.name}: No change in perception`);
        } else {
          this.log(
            `Perception changed:\n`,
            this.current,
            `\n\t⬇\n`,
            perception,
          );
          this.current = perception;
          this.induceEfferents(perception, trace_);
          result.push(`${this.name}: Perception changed`);
        }
      } catch (e) {
        if ((e as Error).name === `AbortError`) {
          this.log(`Procedure aborted: ${e}`);
        } else {
          this.throw(`Error during procedure: ${e}`);
        }
        result.push(`${this.name}: Error during procedure`);
      }
      if (this.doubleTapped) {
        this.doubleTapped = false;
      } else {
        this.processSemaphore.discharge(processID);
        return result;
      }
    }
  };
}

export class SvmStem<
  PConfig extends PData,
  PState extends PData,
  PAction extends PData,
> extends Stem<
  TiamatSvmUtxo<PConfig, PState, PAction>[],
  MaybeSvmUtxo<PConfig, PState, PAction>
> {
  readonly __brand = `SvmStem`;
  constructor(
    svm: TiamatSvm<PConfig, PState, PAction>,
    sensing: (
      svmUtxos: TiamatSvmUtxo<PConfig, PState, PAction>[],
      trace2: Trace,
    ) => Promise<MaybeSvmUtxo<PConfig, PState, PAction>>,
    tolerance = 0,
  ) {
    const name = `${svm.name} SvmStem`;
    super(name, sensing);
    const callback = new Callback(`always`, [svm.name, `SvmStem`], this.sense);
    this.addStemInnervation(async () => {
      return await svm.subscribe(this, callback, tolerance);
    });
  }
}

export class WalletUtxosStem extends Stem<UtxoSet, WalletUtxos> {
  readonly __brand = `WalletUtxosStem`;
  constructor(
    wallet: Wallet,
    sensing: (walletUtxos: UtxoSet, trace2: Trace) => Promise<WalletUtxos>,
  ) {
    const name = `${wallet.name} WalletUtxosStem`;
    super(name, sensing);
    const callback = new Callback(
      `always`,
      [wallet.name, `WalletUtxosStem`],
      this.sense,
    );
    this.addStemInnervation(async () => {
      return await wallet.innervateUtxosStem(this, callback);
    });
  }
}

export class WalletFundsStem extends Stem<
  Map<Core.AssetId, bigint>,
  WalletFunds
> {
  readonly __brand = `WalletFundsStem`;
  constructor(
    wallet: Wallet,
    sensing: (
      walletFunds: Map<Core.AssetId, bigint>,
      trace2: Trace,
    ) => Promise<WalletFunds>,
  ) {
    const name = `${wallet.name} WalletFundsStem`;
    super(name, sensing);
    const callback = new Callback(
      `always`,
      [wallet.name, `WalletFundsStem`],
      this.sense,
    );
    this.addStemInnervation(async () => {
      return await wallet.innervateFundsStem(this, callback);
    });
  }
}

export class BlocksStem extends Stem<number, BlockHeight> {
  readonly __brand = `BlocksStem`;
  constructor(
    utxoSource: UtxoSource,
    sensing: (block: number, trace2: Trace) => Promise<BlockHeight>,
  ) {
    const name = `${utxoSource.name} BlocksStem`;
    super(name, sensing);
    const callback = new Callback(
      `always`,
      [utxoSource.name, `NewBlocksStem`],
      this.sense,
    );
    this.addStemInnervation(async () => {
      return await utxoSource.subscribeToNewBlock(this, callback);
    });
  }
}
