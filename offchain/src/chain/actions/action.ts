import { Core } from "@blaze-cardano/sdk";
import { Tx, TxId, UtxoSet, TraceUtxo } from "../../utils/wrappers";
import { Callback } from "../state/callback";
import { NexusUtxo } from "../state/tiamatSvmUtxo";
import { PDappConfigT, PDappParamsT } from "../../types/tiamat/tiamat";

export interface StartingAction<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
  _SvmUtxoT,
> {
  startingTx(
    tx: Tx,
    // submitCallback: Callback<TxId>,
    ackCallback: Callback<TxId>,
    utxos: UtxoSet,
    nexus?: NexusUtxo<DC, DP>,
  ): Tx;
}

export interface UnhingedAction<_SvmUtxoT> {
  unhingedTx(
    tx: Tx,
    // submitCallback: Callback<TxId>,
    ackCallback: Callback<TxId>,
    nexusUtxo: TraceUtxo,
  ): Tx;
}

export interface RevolvingAction<_SvmUtxoT> {
  revolvingTx(
    tx: Tx,
    // submitCallback: Callback<TxId>,
    ackCallback: Callback<TxId>,
    nexusUtxo: TraceUtxo,
  ): Tx;
}

export interface HaltingAction<_SvmUtxoT> {
  haltingTx(
    tx: Tx | Core.Transaction,
    // submitCallback: Callback<TxId>,
    ackCallback: Callback<TxId>,
    nexusUtxo?: TraceUtxo,
  ): Tx;
}

// type ActionType<T> = new (...args: any[]) => T;

// export const genesisAction: ActionType<GenesisAction<P, W>>[] = [
//   GenesisAction, // evangelion
// ];
// export const startingActions: ActionType<StartingAction<VestingUtxo>>[] = [
//   LockStakeAction, // vector
// ];
// export const unhingedActions: ActionType<UnhingedAction<MatrixUtxo>>[] = [
//   DeregisterVectorAction, // vector
//   RegisterVectorAction, // vector
//   UpdateVectorAction, // vector
//   ChangeStakeAction, // vector
// ];
// export const revolvingActions: ActionType<RevolvingAction<>>[] = [];
// export const haltingActions: ActionType<HaltingAction>[] = [
//   ClaimStakeAction, // vector
// ];

// export const tippingAction: ActionType<TippingAction>[] = [
//   TippingAction, // servitor
// ];

// export const electAction: ActionType<ElectAction>[] = [
//   ElectAction, // servitor
// ];

// // TODO: add vesting actions here
