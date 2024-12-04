import assert from "assert";
import { Conflux } from "./conflux";
import { Effector } from "../data/effector";
import { Ganglion } from "../data/ganglion";
import { Zygote } from "../data/zygote";
import {
  Trace,
  TraceUtxo,
  Tx,
  TxCompleat,
  TxId,
  UtxoSet,
} from "../../utils/wrappers";
import { TiamatUser } from "../agents/tiamatUser";
import { Core } from "@blaze-cardano/sdk";
import { FixFoldPhase, Precon } from "./precon";
import { Callback, Result } from "../state/callback";
import { errorTimeoutMs } from "../../utils/constants";
import { PDappConfigT, PDappParamsT } from "../../types/tiamat/tiamat";
import { TiamatContract } from "../state/tiamatContract";

/**
 * Handler to apply the various potential fixes for some intended user action, and produce a tx to fix them,
 * then, chain the actual action after that.
 */
export abstract class Intent<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
  CT extends TiamatContract<DC, DP>,
  ChoicesT extends Zygote,
  StatusT extends Zygote,
> {
  public readonly name: string;
  private conflux: Conflux<ChoicesT, StatusT>; // user choices & feedback to user from relevant chain state
  private status: `choosing` | `pending` | `success` | `failure` | `retrying` =
    `choosing`;

  constructor(
    private readonly user: TiamatUser<DC, DP, CT>, // TODO better type
    chainGanglion: Ganglion<any, StatusT>, // The "summary" of all chain updates
    private readonly mkDefaultChoices: () => ChoicesT,
    defaultStatus: StatusT,
    private readonly mkConflux: (
      userChoices: ChoicesT,
      chainStatus: StatusT,
    ) => Conflux<ChoicesT, StatusT>, // constructor for Conflux
    private readonly updateDisplay: (
      conflux: Conflux<ChoicesT, StatusT>,
      status: `choosing` | `pending` | `success` | `failure` | `retrying`,
    ) => void, // callback to update frontend
    private readonly precons: Precon<DC, DP, any>[], // preconditions for the action-tx & their fixes if not met
    private readonly actionWallet: `servitor` | `owner`, // the wallet required to execute the payload of the action
    private readonly fixTxAckCallback: Callback<TxId> | `no fix ACK`,
    private readonly sendActionTx: (
      fixTx: TxCompleat | null, // in case we need something from there, i.e. the new nexus
      actionBaseTx: Tx,
      actionTxAckCallback: Callback<TxId>, // for status updates
      setAckTxId: (txId: TxId) => void, // for the ack-callback
      conflux: Conflux<ChoicesT, StatusT>,
      trace: Trace,
    ) => Promise<Result>, // construct action-tx, add tips (if applicable), compleat, sign, submit, etc.
  ) {
    this.name = `${user.name} Intent`;
    this.conflux = this.mkConflux(mkDefaultChoices(), defaultStatus);
    const effect = new Callback(
      `always`,
      [this.name, `updateDisplay`],
      (status: StatusT, _trace: Trace) => {
        this.conflux = this.mkConflux(this.conflux.userChoices, status);
        this.updateDisplay(this.conflux, this.status);
        return Promise.resolve([`${this.name}: updated display`]);
      },
    );
    const chainEffector = new Effector<StatusT>(`IntentChainEffector`, effect);
    chainGanglion.innervateEffector(chainEffector);
  }

  public userInput = (userChoices: ChoicesT): void => {
    assert(
      this.status === `choosing`,
      `${this.name}.userInput: status ${this.status} !== choosing`,
    );
    this.conflux = this.mkConflux(userChoices, this.conflux.chainStatus);
    this.updateDisplay(this.conflux, this.status);
  };

  public execute = async (): Promise<Result> => {
    assert(
      this.status === `choosing`,
      `${this.name}.execute: status ${this.status} !== choosing`,
    );
    return await this.execute_();
  };

  private execute_ = async (): Promise<Result> => {
    assert(
      this.conflux.state === `valid`,
      `${this.name}.execute_: state ${this.conflux.state} !== valid`,
    );
    this.status = `pending`;
    this.updateDisplay(this.conflux, this.status);

    // for blocking during election-margins
    const actionId = await this.user.actionSemaphore.latch(this.name);
    this.user.actionSemaphore.discharge(actionId);

    let fix: FixFoldPhase<DC, DP> = {
      fixWallet: `ok` as `ok` | `servitor` | `owner`,
      fixTx: (tx: Tx) => tx,
      utxoChainers: [] as ((utxos: UtxoSet) => {
        utxo: TraceUtxo;
        redeemer: Core.PlutusData | `coerce` | `supply`;
      }[])[],
    };
    this.precons.forEach((precon) => {
      fix = precon.fixFold(fix, this.fixTxAckCallback);
    });
    let fixTx: Tx | null = null;
    switch (fix.fixWallet) {
      case `ok`:
        break;
      case `servitor`:
        fixTx = fix.fixTx(await this.user.newTx(`servitor`));
        break;
      case `owner`:
        fixTx = fix.fixTx(await this.user.newTx(`owner`));
        break;
      default:
        throw new Error(`Unexpected fixWallet: ${fix.fixWallet}`);
    }

    const result: Result[] = [];
    // const trace = Trace.source(`SUB`, this.name);

    // TODO some sort of timeout
    let expectedTxId: TxId | null = null;
    const setAckTxId = (txId: TxId) => {
      assert(
        expectedTxId === null,
        `${this.name}.setAckTxId: expected txId already set to ${expectedTxId} but tried to set it to ${txId}`,
      );
      this.log(`setAckTxId: setting expectedTxId to`, txId);
      expectedTxId = txId;
    };
    const actionAckCallbackFn = async (
      txId: TxId,
      trace: Trace,
    ): Promise<[Result]> => {
      this.log(`actionAckCallbackFn: received ACK:\n <~~`, txId.txId);
      const result = new Result([`ACK: ${txId.txId}`], trace);
      assert(
        expectedTxId,
        `${this.name}.actionAckCallbackFn: expectedTxId not set`,
      );
      if (expectedTxId.txId === txId.txId) {
        this.status = `success`;
      } else {
        this.status = `failure`; // TODO retry
      }
      this.updateDisplay(this.conflux, this.status);
      return await Promise.resolve([result]);
    };
    const actionAckCallback: Callback<TxId> = new Callback<TxId>(
      `once`,
      [this.name, `actionAckCallback`, `receiveAck`],
      actionAckCallbackFn,
    );

    const trace = Trace.source(`SUB`, `${this.name}.execute_`);
    if (fixTx) {
      if (fix.divergentFixSubmit) {
        const { fixTxCompleat, submitFixTx } = await fix.divergentFixSubmit(
          fixTx,
          this.user.contract,
          trace,
        );
        const actionBaseTx = await fixTxCompleat.chain(
          this.user.getBlaze(this.actionWallet),
          fix.utxoChainers,
        );
        result.push(await submitFixTx());
        result.push(
          await this.sendActionTx(
            fixTxCompleat,
            actionBaseTx,
            actionAckCallback,
            setAckTxId,
            this.conflux,
            trace,
          ),
        );
      } else {
        // default fix tx submit
        const fixTxCompleat = await fixTx.compleat();
        const actionBaseTx = await fixTxCompleat.chain(
          this.user.getBlaze(this.actionWallet),
          fix.utxoChainers,
        );
        const fixTxSigned = await fixTxCompleat.sign();
        result.push(
          await this.user.contract.submitUntippedTx(fixTxSigned, trace),
        );
        result.push(
          await this.sendActionTx(
            fixTxCompleat,
            actionBaseTx,
            actionAckCallback,
            setAckTxId,
            this.conflux,
            trace,
          ),
        );
      }
    } else {
      const actionBaseTx = await this.user.newTx(this.actionWallet);
      result.push(
        await this.sendActionTx(
          null,
          actionBaseTx,
          actionAckCallback,
          setAckTxId,
          this.conflux,
          trace,
        ),
      );
    }
    return new Result(result, trace);
  };

  public cancel = async (): Promise<void> => {
    assert(
      this.status === `retrying`,
      `${this.name}.cancel: status ${this.status} !== retrying`,
    );
    throw new Error(`Not implemented`);
  };

  public reset = async (): Promise<void> => {
    assert(
      this.status === `choosing` ||
        this.status === `success` ||
        this.status === `failure`,
      `${this.name}.reset: status ${this.status} !== retrying/success/failure`,
    );
    this.conflux = this.mkConflux(
      this.mkDefaultChoices(),
      this.conflux.chainStatus,
    );
    this.status = `choosing`;
    this.updateDisplay(this.conflux, this.status);
  };

  public retry = async (): Promise<Result> => {
    assert(
      this.status === `failure`,
      `${this.name}.retry: status ${this.status} !== failure`,
    );
    this.status = `retrying`;
    this.updateDisplay(this.conflux, this.status);
    throw new Error(`Not implemented`);
    // return await this.execute_();
  };

  /**
   *
   * @param msg
   * @param {...any} args
   */
  protected log = (msg: string, ...args: any) => {
    console.log(`[${this.name}] ${msg}`, ...args, `\n`);
  };

  /**
   *
   * @param msg
   */
  protected throw = (msg: string) => {
    this.log(`ERROR: ${msg}\n`);
    if (errorTimeoutMs === null) {
      throw new Error(`${this.name} ERROR: ${msg}\n`);
    } else {
      setTimeout(() => {
        throw new Error(`${this.name} ERROR: ${msg}\n`);
      }, errorTimeoutMs);
    }
  };
}
