import { Blaze, Core } from "@blaze-cardano/sdk";
import assert from "assert";
import { EigenValue } from "../../types/tiamat/tiamat";
import { errorTimeoutMs } from "../../utils/constants";
import {
  Bech32Address,
  Tx,
  TxId,
  TxCompleat,
  P,
  W,
} from "../../utils/wrappers";
import { CliqueTippedTx } from "../state/messages";

/**
 *
 * @param eigenValues
 */
function deduplicate(eigenValues: EigenValue[]): EigenValue[] {
  const seen: Set<string> = new Set();
  const deduplicated: EigenValue[] = [];
  for (const eigenValue of eigenValues) {
    const key = eigenValue.vector.toBlaze();
    if (!seen.has(key)) {
      deduplicated.push(eigenValue);
      seen.add(key);
    }
  }
  return deduplicated;
}

// TODO ensure this works
/**
 *
 * @param of
 * @param size
 */
export function computeSubsets(of: EigenValue[], size: number): EigenValue[][] {
  of = deduplicate(of); // TODO this
  if (of.length <= size) {
    return [of];
  }
  const subsets: EigenValue[][] = [];

  /**
   *
   * @param path
   * @param index
   * @param remaining
   */
  const findSubsets = (
    path: EigenValue[],
    index: number,
    remaining: number,
  ) => {
    if (remaining === 0) {
      subsets.push(path);
      return;
    }

    for (let i = index; i <= of.length - remaining; i++) {
      findSubsets([...path, of[i]!], i + 1, remaining - 1);
    }
  };

  findSubsets([], 0, size);
  return subsets;
}

/**
 *
 */
export class TippingAction {
  public readonly supportVectorSets: EigenValue[][];
  public readonly tips: bigint;

  /**
   *
   * @param networkId
   * @param servitor The address of the servitor (if payload-tx already belongs to the servitor), servitor-blaze otherwise.
   * @param eigenvectors
   * @param numSupportVectors
   * @param tip
   * @param payloadTx
   */
  constructor(
    public readonly networkId: Core.NetworkId,
    public readonly servitor: Bech32Address | Blaze<P, W>, // Bech32Address if tipped action already belongs to the servitor, so we make use of the chaining-caching
    public readonly eigenvectors: EigenValue[],
    public readonly numSupportVectors: bigint,
    public readonly tip: bigint,
    public readonly payloadTx: Tx<`servitor`>,
  ) {
    // assert(userUtxos.length, `TippingAction: userUtxos empty`);
    assert(
      eigenvectors.length >= numSupportVectors,
      `TippingAction: eigenvectors.length ${eigenvectors.length} < numSupportVectors ${numSupportVectors}`,
    );

    this.tips = tip * numSupportVectors;
    this.supportVectorSets = computeSubsets(
      eigenvectors,
      Number(numSupportVectors),
    );
  }

  /**
   *
   * @param setAckTxIds
   */
  public tippingTxes = async (
    setAckTxIds: ((txId: TxId) => void)[],
  ): Promise<CliqueTippedTx[]> => {
    // NOTE: We are including everything in the intermediate utxo to prevent any cancellation trickery
    const tips = new Core.Value(this.tips);

    let servitorAddress: Core.Address;
    if (this.servitor instanceof Bech32Address) {
      servitorAddress = this.servitor.blaze;
    } else {
      // NOTE we do it this way for the assert. We don't want to lose funds by sending them all over the place
      // to various servitor-addresses. This would in principle not be an issue, but would require extra handling.
      const servitorAddresses = await this.servitor.wallet.getUsedAddresses();
      assert(
        servitorAddresses.length === 1,
        `TippingAction: expected exactly one servitorAddress, got ${servitorAddresses.length}`,
      );
      servitorAddress = servitorAddresses[0]!;
    }
    let payloadTx = this.payloadTx.payAssets(servitorAddress, tips);
    // .addRequiredSigner(servitorAddress); // TODO likely redundant
    /*
      - we need to ensure the account-utxos have enough for the fees amd tips
      - if we're halting, the change-address is the owner-address
      - otherwise - what then? Can we simply create a new account-svm with the same datum?
        -> probably yes
    */

    // const changeAddress: Bech32Address = this.servitorAddress;
    // const changeDatum: Core.OutputData | undefined = undefined;

    /*

    TODO

    it appears increasingly fucked up trying to use the account-utxos for fixed fees:

    - they require a redeemer, and how do we ensure blaze handles that correctly?
    - how can we use them as collateral? What would be the consequences? Is that even possible?
    - the potential exploit in case of a compromised servitor of draining all ADA as fixedFees
    - the mechanism of refunding leftovers to the owner is slightly wasteful too


    instead let's consider using nativeScript to create special tip-utxos that can be spent both
    by the servitor and owner (to account for the case when servitor-keys are lost). This allows

    - for limiting the ADA for fees separately from the ADA for trading
    - easy handling of fees irrespective of the account-complexities
    - using the primitive address-based mechanisms


    this requires various new mechanisms to handle those tipping-utxos; for example
    - keeping track of them (analogously to servitor- and owner-wallet-utxos)
    - cleaning them up if servitor-keys are lost
    - making sure there are enough, and creatinng them otherwise
    - the native script and address thereof


    alternative without native script:
    - derive the servitor-private-key from the owner-private-key by having the latter sign
      a given fixed piece of data, and then derive the former from that deterministically

    implications:
    - We need to prompt the user twice for a signature (once for the servitor creation,
    once for the initial funding of it and the accounts)

    ---> for now we simply use the naive approach of having an independent servitor-wallet

    */

    const tippedTxes: CliqueTippedTx[] = [];

    // NOTE we only use the first supportVectorSet to build the payload-tx,
    // as the required signatories are not part of the tx-body, and we only
    // need them here to ensure CML builds without error in the first place
    // (the plutus-check might fail if we don't require some support-vector-set)

    assert(
      this.supportVectorSets.length,
      `TippingAction: supportVectorSets empty`,
    );
    const supportVectorSet = this.supportVectorSets[0]!;
    supportVectorSet.forEach((supportVector) => {
      // TODO ensure this works with multiple copies of the same EV
      const vectorSignerKey = supportVector.vector.toBlaze();
      console.log(`TippingAction: adding signerKey\n    ${vectorSignerKey}`);
      payloadTx = payloadTx.addRequiredSigner(vectorSignerKey);
    });
    let tippedActionCompleat: TxCompleat<`servitor`>;
    try {
      tippedActionCompleat = await payloadTx.compleat();
    } catch (e) {
      console.log(`TippingAction: error completing payload-tx:\n`, e);
      await new Promise((resolve) => setTimeout(resolve, errorTimeoutMs ?? 0));
      throw e;
    }

    console.log(`TippingAction: completed payload-tx`);
    const txId = TxId.fromTransaction(tippedActionCompleat.tx);
    setAckTxIds.forEach((setTxId) => setTxId(txId));

    const tippedActionSigned = await tippedActionCompleat.sign();

    const tippingTx = await tippedActionCompleat.chain(
      this.servitor instanceof Bech32Address ? `same` : this.servitor,
      // [
      //   (utxos: UtxoSet) => {
      //     // TODO probably reundant...?
      //     return utxos.list.flatMap((utxo) => {
      //       if (
      //         utxo.core.output().address() === this.blazeServitorAddress.blaze
      //       ) {
      //         return [
      //           {
      //             utxo,
      //             redeemer: `coerce`,
      //           },
      //         ];
      //       } else {
      //         return [];
      //       }
      //     });
      //   },
      // ]
    );
    for (const supportVectorSet of this.supportVectorSets) {
      let tippingTx_ = tippingTx.clone();

      supportVectorSet.forEach((supportVector) => {
        // TODO ensure this works with multiple copies of the same EV
        // const vectorCredential = Core.Credential.fromCore //= {
        //   type: Core.CredentialType.KeyHash,
        //   hash: supportVector.vector.toBlaze(),
        // };
        // TODO: check we are doing this everywhere (make vector-addresses from twice the same credential,
        // so they can stake, and we have the same addresses)
        const vectorAddress = new Core.Address({
          paymentPart: {
            hash: supportVector.vector.toBlazeDowncast(),
            type: Core.CredentialType.KeyHash,
          },
          delegationPart: {
            hash: supportVector.vector.toBlazeDowncast(),
            type: Core.CredentialType.KeyHash,
          }, // TODO keep?
          type: Core.AddressType.BasePaymentKeyStakeKey,
          networkId: this.networkId,
        });
        tippingTx_ = tippingTx_.payAssets(
          vectorAddress,
          new Core.Value(this.tip),
        );
      });

      const tippingTxCompleat = await tippingTx_.compleat();
      const tippingTxSigned = await tippingTxCompleat.sign();

      const allKeyHashes = tippedActionSigned.tx
        .witnessSet()
        .vkeys()
        ?.values()
        .map((vkey) => vkey.vkey());
      assert(
        allKeyHashes,
        `TippingAction: allVKeys not found (supportVectorSet)`,
      );
      console.log(
        `TippingAction: tippedAction supportVectorSet keyHashes:\n    ${allKeyHashes.join(
          `\n    `,
        )}`,
      );

      const requiredSigners = tippedActionSigned.tx
        .body()
        .requiredSigners()
        ?.values()
        .map((signer) => signer.value());
      assert(
        requiredSigners,
        `TippingAction: requiredSigners not found (supportVectorSet)`,
      );
      console.log(
        `TippingAction: tippedAction supportVectorSet requiredSigners:\n    ${requiredSigners.join(
          `\n    `,
        )}`,
      );

      tippedTxes.push({
        supportVectorSet,
        tx: {
          partiallySignedPayloadTx: tippedActionSigned.tx,
          // payloadTxPartialWitnessSetHex: tippedActionWitness,
          signedTippingTx: tippingTxSigned.tx,
        },
      });
    }

    return tippedTxes;
  };
}
