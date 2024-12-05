import { Core } from "@blaze-cardano/sdk";
import { Data as CoreData } from "@blaze-cardano/tx";
import assert from "assert";
import { Asset } from "../../types/general/derived/asset/asset";
import { PositiveValue } from "../../types/general/derived/value/positiveValue";
import { PVoid } from "../../types/general/derived/void";
import {
  PData,
  PLifted,
  ConstrData,
  Data,
  asCorePlutusData,
  fromCorePlutusDatum,
} from "../../types/general/fundamental/type";
import { SvmDatum } from "../../types/tiamat/svm/datum";
import { Revolve, Halt, Wipe } from "../../types/tiamat/svm/redeemer";
import { PThreadNFTRedeemer, MintSvm } from "../../types/tiamat/threadNFT";
import { PMatrixAction } from "../../types/tiamat/svms/matrix/action";
import { PMatrixConfig } from "../../types/tiamat/svms/matrix/config";
import { PMatrixState } from "../../types/tiamat/svms/matrix/state";
import { PNexusConfig } from "../../types/tiamat/svms/nexus/config";
import { PNexusState } from "../../types/tiamat/svms/nexus/state";
import { PVestingConfig } from "../../types/tiamat/svms/vesting/config";
import { PVestingState } from "../../types/tiamat/svms/vesting/state";
import {
  Trace,
  TraceUtxo,
  Tx,
  TxCompleat,
  TxId,
  UtxoSet,
} from "../../utils/wrappers";
import { Callback } from "./callback";
import { TiamatSvm } from "./tiamatSvm";
import { Token } from "../../types/general/derived/asset/token";
import { nexusLabel } from "../../utils/constants";
import { PDappConfigT, PDappParamsT } from "../../types/tiamat/tiamat";

/**
 *
 */
export class TiamatSvmUtxo<
  // DC extends PDappConfigT,
  // DP extends PDappParamsT,
  PConfig extends PData,
  PState extends PData,
  PAction extends PData,
> {
  protected static genesisAckExceptions = 2; // for nexus and matrix we can't have ackCallbacks because of dummy-svm
  protected readonly scriptRef?: Core.Script;
  protected spent = false;
  /**
   *
   * @param svm
   * @param utxo
   * @param inlineScript
   * @param hasNFT
   * @param idNFT
   * @param svmValue
   * @param svmDatum
   */
  protected constructor(
    public readonly svm: TiamatSvm<PConfig, PState, PAction>,
    public readonly utxo: TraceUtxo, // when starting, this is the seed-utxo
    public readonly inlineScript: boolean,
    public readonly nftCheck: string,
    public readonly idNFT: Asset, //HashAsset,
    public readonly svmValue: PositiveValue, // without id-NFT
    public readonly svmDatum?: SvmDatum<PLifted<PConfig>, PLifted<PState>>, // does not exist on non-stated svms
  ) {
    if (inlineScript) {
      this.scriptRef = svm.svmValidator;
    }
  }

  public sameUtxo = (
    other: TiamatSvmUtxo<PConfig, PState, PAction>,
  ): boolean => {
    const thisInput = this.utxo.core.input();
    const otherInput = other.utxo.core.input();
    return (
      thisInput.transactionId() === otherInput.transactionId() &&
      thisInput.index() === otherInput.index()
    );
  };

  /**
   *
   * @param svm
   * @param utxo
   * @param inlineScript
   * @param singletonID
   */
  static fromBlaze<
    // DC extends PDappConfigT,
    // DP extends PDappParamsT,
    PConfig extends PData,
    PState extends PData,
    PAction extends PData,
  >(
    svm: TiamatSvm<PConfig, PState, PAction>,
    utxo: TraceUtxo,
    inlineScript: boolean,
    singletonID: Token | null,
  ): TiamatSvmUtxo<PConfig, PState, PAction> {
    const datum = utxo.core
      .output()
      .datum()
      ?.asInlineData()
      ?.asConstrPlutusData();
    assert(
      datum,
      `SvmUtxo<${svm.label}>.parse: no constr inline datum in utxo`,
    );
    const svmDatum = svm.psvmDatum.plift(fromCorePlutusDatum(datum));

    const blazeNFT = svmDatum.id.toBlaze();
    const numNFTs = utxo.core.output().amount().multiasset()?.get(blazeNFT);
    // assert(
    //   numNFTs <= 1n,
    //   `expected <= 1 id-"NFT"s, got ${numNFTs}`,
    // );
    // TODO various treatments if some of those below are violated
    const numNFTsCheck = numNFTs === 1n;
    const nftCurrencyCheck = svmDatum.id.currency.equals(svm.currency);
    const nftTokenCheck =
      singletonID === null || singletonID.equals(svmDatum.id.token);
    const hasNFT = numNFTsCheck && nftCurrencyCheck && nftTokenCheck;
    const nftCheck = hasNFT
      ? `ok`
      : `numNFTs: ${numNFTs}, currency ${nftCurrencyCheck ? `ok` : `WRONG`}, token ${nftTokenCheck ? `ok` : `WRONG: ${singletonID.concise()} !== ${svmDatum.id.token.concise()}`}`;

    const assets = utxo.core.output().amount();
    // const { [blazeNFT]: _, ...withoutNFT } = utxo.assets;
    const svmValue = PositiveValue.fromBlaze(assets, blazeNFT);
    // svmValue.increaseAmountOf(Asset.ADA, -lockedLovelace); // TODO this should come from onchain params
    return new TiamatSvmUtxo<PConfig, PState, PAction>(
      svm,
      utxo,
      inlineScript,
      nftCheck,
      svmDatum.id,
      svmValue,
      svmDatum,
    );
  }

  /**
   *
   * @param svm
   * @param utxo
   * @param tx
   * @param inlineScript
   * @param singletonID
   */
  static singletonAfterTx<
    // DC extends PDappConfigT,
    // DP extends PDappParamsT,
    PConfig extends PData,
    PState extends PData,
    PAction extends PData,
  >(
    svm: TiamatSvm<PConfig, PState, PAction>,
    tx: TxCompleat<`servitor` | `owner`>,
    inlineScript: boolean,
    singletonID: Token | null,
  ): TiamatSvmUtxo<PConfig, PState, PAction> {
    let utxo: TiamatSvmUtxo<PConfig, PState, PAction> | undefined;
    let txId = TxId.fromTransaction(tx.tx);
    for (const [i, output] of tx.tx.body().outputs().entries()) {
      if (output.address() === svm.address.blaze) {
        assert(
          !utxo,
          `${this.name}.singletonAfterTx: expected at most one output to svm address but got a second one`,
        );
        const input = new Core.TransactionInput(txId.txId, BigInt(i));
        const traceUtxo = {
          core: new Core.TransactionUnspentOutput(input, output),
          trace: Trace.source(`CHAIN`, `${this.name}.singletonAfterTx`),
        };
        utxo = TiamatSvmUtxo.fromBlaze(
          svm,
          traceUtxo,
          inlineScript,
          singletonID,
        );
      }
    }
    assert(
      utxo,
      `${this.name}.singletonAfterTx: expected at least one output to svm address but got none`,
    );
    return utxo;
  }

  /**
   *
   * @param svm
   * @param seedUtxo
   * @param inlineScript
   * @param config
   * @param newState
   * @param newValue
   */
  static start<
    // DC extends PDappConfigT,
    // DP extends PDappParamsT,
    PConfig extends PData,
    PState extends PData,
    PAction extends PData,
  >(
    svm: TiamatSvm<PConfig, PState, PAction>,
    seedUtxo: TraceUtxo,
    inlineScript: boolean,
    config: PLifted<PConfig>,
    newState: PLifted<PState>,
    newValue: PositiveValue,
  ): TiamatSvmUtxo<PConfig, PState, PAction> {
    const id = Token.fromUtxo(svm.label, seedUtxo);
    const idNFT = new Asset(svm.currency, id);
    const newDatum = new SvmDatum(idNFT, config, newState);
    return new TiamatSvmUtxo<PConfig, PState, PAction>(
      svm,
      seedUtxo,
      inlineScript,
      `ok`,
      idNFT,
      newValue,
      newDatum,
    );
  }

  /**
   *
   * @param tx
   * @param ackCallback
   * @param extraUtxos
   * @param nexusUtxo
   */
  public startingTx = <WT extends `servitor` | `owner`>(
    tx: Tx<WT>,
    ackCallback: Callback<TxId> | `genesis`,
    extraUtxos: UtxoSet,
    nexusUtxo?: TraceUtxo,
  ): Tx<WT> => {
    assert(
      this.svmDatum,
      `SvmUtxo<${this.svm.label}>.quickStartTx: no svmDatum`,
    );
    if (ackCallback === `genesis`) {
      assert(
        TiamatSvmUtxo.genesisAckExceptions-- > 0,
        `SvmUtxo<${this.svm.label}>.startingTx: no more genesis ack exceptions`,
      );
    } else {
      this.svm.subscribeAck(this, ackCallback);
    }

    // console.log(`SvmUtxo<${this.svm.label}>.svmDatum: ${this.svmDatum.toString()}`);

    let newDatum: ConstrData<Data>;
    try {
      newDatum = this.svm.psvmDatum.pconstant(this.svmDatum);
    } catch (err) {
      throw new Error(
        `SvmUtxo<${this.svm.label}>.startingTx.svm.psvmDatum.pconstant: ${err}`,
      );
    }

    // console.log(`newDatum: ${newDatum.toString()}`);

    // const mintedNFT = this.idNFT.toBlazeWith(1n);

    if (nexusUtxo) {
      tx = tx.addReferenceInput(nexusUtxo);
    }

    const newValue = this.svmValue.clone;
    newValue.initAmountOf(this.idNFT, 1n);
    // newValue.addAmountOf(Asset.ADA, lockedLovelace); // TODO this should ideally come from onchain-params
    const newValue_ = newValue.toBlaze;
    const idNFT = this.idNFT.toBlaze();
    console.log(`SvmUtxo<${this.svm.label}>.startingTx: idNFT =`, idNFT);
    console.log(`SvmUtxo<${this.svm.label}>.startingTx: newValue =`, newValue_);

    const utxos = extraUtxos.clone();
    // utxos.insertNew(
    //   this.utxo.core,
    //   this.utxo.trace.via(`${this.svm.label}.startingTx`),
    // );
    console.log(
      `starting tx with utxos:\n`,
      utxos.list
        .map(
          (utxo) =>
            `input: ${utxo.core.input().transactionId()}:${utxo.core.input().index()}\noutput coin: ${utxo.core.output().amount().coin()}\noutput assets: ${utxo.core.output().amount().multiasset()}\ntrace: ${utxo.trace.compose()}`,
        )
        .join(`,\n\n`),
    );
    console.log(`...paying to contract:`, newValue_.toCore());

    return tx
      .addInput(this.utxo)
      .addUnspentOutputs(utxos.list)
      .addMint(
        this.idNFT.currency.toBlaze(),
        new Map([[this.idNFT.token.toBlaze(), 1n]]),
        CoreData.void(), // NOTE the CoreData.void() redeemer is crucial
      )
      .provideScript(this.svm.nftPolicy)
      .lockAssets(
        this.svm.address.blaze,
        newValue_,
        asCorePlutusData(newDatum),
        this.scriptRef,
      );
  };

  /**
   *
   * @param tx
   * @param ackCallback
   * @param type
   * @param action
   * @param newState
   * @param newValue
   * @param nexusUtxo
   */
  public revolvingTx = (
    tx: Tx<`servitor`>,
    ackCallback: Callback<TxId>,
    type: "unhinged" | "revolve",
    action: PLifted<PAction>,
    newState: PLifted<PState>,
    newValue: PositiveValue,
    nexusUtxo: TraceUtxo | `isNexus`, // nexus does not have to read itself in addition to spending itself
  ): Tx<`servitor`> => {
    assert(
      this.svmDatum,
      `SvmUtxo<${this.svm.label}>.revolvingTx: no svmDatum`,
    );
    assert(this.utxo, `SvmUtxo<${this.svm.label}>.revolvingTx: no utxo`);
    assert(
      !this.spent,
      `SvmUtxo<${this.svm.label}>.revolvingTx: utxo already spent`,
    );
    this.spent = true;
    this.svm.subscribeAck(this, ackCallback);

    let revolvingRedeemer: ConstrData<Data>;
    try {
      revolvingRedeemer = this.svm.psvmRedeemer.pconstant(
        // type === "unhinged" ? new Unhinged(action) :
        new Revolve(action),
      );
    } catch (err) {
      throw new Error(
        `${type} SvmUtxo.revolvingTx.svm.psvmRedeemer.pconstant: ${err}`,
      );
    }
    let newDatum: ConstrData<Data>;
    try {
      newDatum = this.svm.psvmDatum.pconstant(
        new SvmDatum(this.svmDatum.id, this.svmDatum.config, newState),
      );
    } catch (err) {
      throw new Error(
        `${type} SvmUtxo.revolvingTx.svm.psvmDatum.pconstant: ${err}`,
      );
    }

    const redeemerData = asCorePlutusData(revolvingRedeemer);

    if (!this.inlineScript) {
      tx = tx.provideScript(this.svm.svmValidator);
    }

    if (nexusUtxo === `isNexus`) {
      assert(
        this.svm.label === nexusLabel,
        `nexusUtxo === 'isNexus' but svm is not nexus. Labels mismatch: ${this.svm.label} !== ${nexusLabel}`,
      );
    } else {
      tx = tx.addReferenceInput(nexusUtxo);
    }

    const newValue_ = newValue.clone;
    newValue_.initAmountOf(this.idNFT, 1n);
    // newValue_.addAmountOf(Asset.ADA, lockedLovelace); // TODO this should ideally come from obchain-params

    return tx
      .addInput(
        {
          core: this.utxo.core,
          trace: this.utxo.trace.via(`${this.svm.label}.revolvingTx`),
        },
        redeemerData,
      )
      .lockAssets(
        this.svm.address.blaze,
        newValue_.toBlaze,
        asCorePlutusData(newDatum),
        this.scriptRef,
      );
  };

  /**
   *
   * @param tx
   * @param ackCallback
   * @param action
   * @param nexusUtxo
   */
  public haltingTx = <WT extends `servitor` | `owner`>(
    tx: Tx<WT>,
    // submitCallback: Callback<TxId>,
    ackCallback: Callback<TxId>,
    action: PLifted<PAction>,
    nexusUtxo?: TraceUtxo, // not required for all svms
  ): Tx<WT> => {
    assert(this.utxo, `SvmUtxo<${this.svm.label}>.haltingTx: no utxo`);
    assert(
      !this.spent,
      `SvmUtxo<${this.svm.label}>.revolvingTx: utxo already spent`,
    );
    this.spent = true;
    this.svm.subscribeAck(this, ackCallback);

    const threadNFTRedeemer = PThreadNFTRedeemer.ptype.pconstant(
      new MintSvm(), // NOTE/TODO cannot burn nexus nft, catch that somewhere
    );
    const haltingRedeemer = this.svm.psvmRedeemer.pconstant(new Halt(action));
    // const burnedNFT = this.idNFT.toBlazeWith(-1n);

    const redeemerData = asCorePlutusData(haltingRedeemer);

    if (nexusUtxo) {
      tx = tx.addReferenceInput(nexusUtxo);
    }

    if (!this.inlineScript) {
      tx = tx.provideScript(this.svm.svmValidator);
    }

    return tx
      .addInput(this.utxo, redeemerData)
      .addMint(
        this.idNFT.currency.toBlaze(),
        new Map([[this.idNFT.token.toBlaze(), -1n]]),
        asCorePlutusData(threadNFTRedeemer),
      )
      .provideScript(this.svm.nftPolicy);
  };

  /**
   *
   * @param tx
   */
  public wipingTx = <WT extends `servitor` | `owner`>(tx: Tx<WT>): Tx<WT> => {
    assert(this.utxo, `SvmUtxo<${this.svm.label}>.wipingTx: no utxo`);
    const wipingRedeemer = this.svm.psvmRedeemer.pconstant(new Wipe());

    // if (this.hasNFT) {
    //   // TODO check/assert somewhere that in this case we have the null-datum

    //   const threadNFTRedeemer = PThreadNFTRedeemer.ptype.pconstant(
    //     new MintSvm(), // NOTE/TODO cannot burn nexus nft, catch that somewhere
    //   );
    //   const burnedNFT = this.idNFT.toBlazeWith(-1n);
    //   tx = tx
    //     .addMint(burnedNFT, asCorePlutusData(threadNFTRedeemer))
    //     .provideScript(this.svm.policy);
    // }

    const redeemerData = asCorePlutusData(wipingRedeemer);
    let tx_ = tx.addInput(this.utxo, redeemerData);

    if (!this.inlineScript) {
      tx_ = tx_.provideScript(this.svm.svmValidator);
    }

    return tx_;
  };

  //   public show = (tabs = ""): string => {
  //     const tt = tabs + t;
  //     const ttf = tt + f;
  //     return `SvmUtxo<${this.svm.label}> (
  // ${tt})`;
  //   };
}

export type MatrixUtxo = TiamatSvmUtxo<
  PMatrixConfig,
  PMatrixState,
  PMatrixAction
>;
export type NexusUtxo<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
> = TiamatSvmUtxo<PNexusConfig<DC>, PNexusState<DP>, PVoid>;
export type VestingUtxo = TiamatSvmUtxo<PVestingConfig, PVestingState, PVoid>;
