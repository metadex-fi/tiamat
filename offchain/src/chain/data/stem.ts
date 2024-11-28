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
import assert from "assert";
import { UtxoSource } from "../state/utxoSource";

export const identityProcedure = async <ZT extends Zygote>(
  afferentStates: Map<Ganglion<any[], ZT>, ZT | `virginal`>,
  _signal: AbortSignal,
): Promise<ZT | `virginal`> => {
  // await new Promise((resolve) => setTimeout(resolve, 0));

  const values = afferentStates.values();
  const next = values.next();
  assert(!next.done, `identityProcedure: no afferents`);
  const first = next.value;
  assert(values.next().done, `identityProcedure: more than one afferent`);
  return Promise.resolve(first);
};

export class SvmStem<
  PConfig extends PData,
  PState extends PData,
  PAction extends PData,
> {
  readonly __brand = `SvmStem`;
  constructor(
    svm: TiamatSvm<PConfig, PState, PAction>,
    ganglion: Ganglion<
      MaybeSvmUtxo<PConfig, PState, PAction>[],
      MaybeSvmUtxo<PConfig, PState, PAction>
    >,
    sense: (
      svmUtxos: TiamatSvmUtxo<PConfig, PState, PAction>[],
      trace: Trace,
    ) => Promise<MaybeSvmUtxo<PConfig, PState, PAction>>,
    tolerance = 0,
  ) {
    const sensing = async (
      svmUtxos: TiamatSvmUtxo<PConfig, PState, PAction>[],
      trace: Trace,
    ) => {
      const percept = await sense(svmUtxos, trace);
      ganglion.induce(ganglion, percept, trace); // NOTE slightly abusive, setting the ganglion as its own afferent
      return [`${svm.name} SvmStem: percept induced`];
    };
    const callback = new Callback(`always`, [svm.name, `SvmStem`], sensing);
    ganglion.addStemInnervation(async () => {
      return await svm.subscribe(this, callback, tolerance);
    });
  }
}

export class WalletUtxosStem {
  readonly __brand = `WalletUtxosStem`;
  constructor(
    wallet: Wallet,
    ganglion: Ganglion<WalletUtxos[], WalletUtxos>,
    sense: (walletUtxos: UtxoSet, trace: Trace) => Promise<WalletUtxos>,
  ) {
    const sensing = async (walletUtxos: UtxoSet, trace: Trace) => {
      const percept = await sense(walletUtxos, trace);
      ganglion.induce(ganglion, percept, trace); // NOTE slightly abusive, setting the ganglion as its own afferent
      return [`${wallet.name} WalletUtxosStem: percept induced`];
    };
    const callback = new Callback(
      `always`,
      [wallet.name, `WalletUtxosStem`],
      sensing,
    );
    ganglion.addStemInnervation(async () => {
      return await wallet.innervateUtxosStem(this, callback);
    });
  }
}

export class WalletFundsStem {
  readonly __brand = `WalletFundsStem`;
  constructor(
    wallet: Wallet,
    ganglion: Ganglion<WalletFunds[], WalletFunds>,
    sense: (
      walletFunds: Map<Core.AssetId, bigint>,
      trace: Trace,
    ) => Promise<WalletFunds>,
  ) {
    const sensing = async (
      walletUtxos: Map<Core.AssetId, bigint>,
      trace: Trace,
    ) => {
      const percept = await sense(walletUtxos, trace);
      ganglion.induce(ganglion, percept, trace); // NOTE slightly abusive, setting the ganglion as its own afferent
      return [`${wallet.name} WalletFundsStem: percept induced`];
    };
    const callback = new Callback(
      `always`,
      [wallet.name, `WalletFundsStem`],
      sensing,
    );
    ganglion.addStemInnervation(async () => {
      return await wallet.innervateFundsStem(this, callback);
    });
  }
}

export class BlocksStem {
  readonly __brand = `BlocksStem`;
  constructor(
    utxoSource: UtxoSource,
    ganglion: Ganglion<BlockHeight[], BlockHeight>,
    sense: (block: number, trace: Trace) => Promise<BlockHeight>,
  ) {
    const sensing = async (block: number, trace: Trace) => {
      const percept = await sense(block, trace);
      ganglion.induce(ganglion, percept, trace); // NOTE slightly abusive, setting the ganglion as its own afferent
      return [`${utxoSource.name} NewBlocksStem: percept induced`];
    };
    const callback = new Callback(
      `always`,
      [utxoSource.name, `NewBlocksStem`],
      sensing,
    );
    ganglion.addStemInnervation(async () => {
      return await utxoSource.subscribeToNewBlock(this, callback);
    });
  }
}

// export class TimeStem {
//   readonly __brand = `TimeStem`;
//   constructor(
//     ganglion: Ganglion<BlockHeight[], BlockHeight>,
//     sense: (block: number, trace: Trace) => Promise<BlockHeight>,
//   ) {
//     const sensing = async (block: number, trace: Trace) => {
//       const percept = await sense(block, trace);
//       ganglion.induce(ganglion, percept, trace); // NOTE slightly abusive, setting the ganglion as its own afferent
//       return [`${utxoSource.name} NewBlocksStem: percept induced`];
//     };
//     const callback = new Callback(
//       `always`,
//       [utxoSource.name, `NewBlocksStem`],
//       sensing,
//     );
//     ganglion.addStemInnervation(async () => {
//       return await utxoSource.subscribeToNewBlock(this, callback);
//     });
//   }
// }
