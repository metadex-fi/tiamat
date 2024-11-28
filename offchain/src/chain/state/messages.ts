import assert from "assert";
import { Core } from "@blaze-cardano/sdk";
import { EigenValue } from "../../types/tiamat/tiamat";
import { Address, VerificationKey } from "../../types/general/derived/address";
import { hashPublicKeyHex } from "../../utils/conversions";

// data-update from vector to webapp
export interface NewBlockMsg {
  readonly payload: number;
  readonly tag: `new block`;
}

// data-update from vector to webapp
export interface UtxoEventMsg {
  readonly payload: Core.HexBlob; // cbor
  readonly tag: `create` | `destroy`;
}

// tx-submission from webapp to vector, or heads-up from vector to vector
export interface UntippedTxMsg {
  readonly payload: Core.TxCBOR;
  readonly tag: `untipped tx`;
}

// tx-submission from webapp to vector
export interface TippedTxMsg {
  readonly payload: TippedTxCBOR;
  readonly tag: `tipped tx`;
}

// tx-submission from webapp to vector
export interface ElectionTxMsg {
  readonly payload: ElectionTxCBOR;
  readonly tag: `election-tx`;
}

// export interface AckMsg {
//   readonly payload: Core.TxId;
//   readonly tag: `ACK`;
// }

export interface AddressSubscriptionMsg {
  readonly payload: string[];
  readonly tag: `subscribedAddresses`;
}

// export interface BlockSubscriptionMsg {
//   readonly payload: true;
//   readonly tag: `subscribeToNewBlock`;
// }

export interface CliqueTippedTx {
  readonly supportVectorSet: EigenValue[];
  readonly tx: TippedTx;
}

export interface CliqueElectionTx {
  readonly supportVectorSet: EigenValue[];
  readonly tx: ElectionTx;
}

export interface TippedTxCBOR {
  readonly partiallySignedPayloadTxCBOR: Core.TxCBOR;
  readonly signedTippingTxCBOR: Core.TxCBOR;
}

export interface ElectionTxCBOR {
  readonly partiallySignedElectionTxCBOR: Core.TxCBOR;
}

export interface TippedTx {
  readonly partiallySignedPayloadTx: Core.Transaction;
  readonly signedTippingTx: Core.Transaction;
}

export interface ElectionTx {
  readonly partiallySignedElectionTx: Core.Transaction;
}

/**
 *
 * @param tx
 */
export function parseTippedTx(tx: TippedTxCBOR): TippedTx {
  const partiallySignedPayloadTx = Core.Transaction.fromCbor(
    tx.partiallySignedPayloadTxCBOR,
  );
  const signedTippingTx = Core.Transaction.fromCbor(tx.signedTippingTxCBOR);

  return {
    partiallySignedPayloadTx,
    // payloadTxPartialWitnessSet,
    signedTippingTx,
  };
}

/**
 *
 * @param tx
 */
export function parseElectionTx(tx: ElectionTxCBOR): ElectionTx {
  const partiallySignedElectionTx = Core.Transaction.fromCbor(
    tx.partiallySignedElectionTxCBOR,
  );

  return {
    partiallySignedElectionTx,
    // electionTxPartialWitnessSet,
  };
}

/**
 *
 * @param tx
 */
export function cborTippedTx(tx: TippedTx): TippedTxCBOR {
  return {
    partiallySignedPayloadTxCBOR: tx.partiallySignedPayloadTx.toCbor(),
    signedTippingTxCBOR: tx.signedTippingTx.toCbor(),
  };
}

/**
 *
 * @param tx
 */
export function cborElectionTx(tx: ElectionTx): ElectionTxCBOR {
  return {
    partiallySignedElectionTxCBOR: tx.partiallySignedElectionTx.toCbor(),
  };
}

// keyhashes
export interface TxClique {
  supportVectorSet: string[];
  signedBy: Core.Ed25519KeyHashHex[];
  outstanding: Core.Ed25519KeyHashHex[];
}

/**
 *
 * @param tip
 * @param tx
 */
export function parseTippedSupportVectorSet(
  tip: bigint,
  tx: TippedTx,
): TxClique {
  /*
  relevant factors:
  - required signers in payload-tx
  - existing signers in payload-tx-witness-set
  - tip-recipients in tipping-tx

  need to:
  - filter servitor-address from those (for change) - DONE
  - convert all three into the same - suitable - format - DONE
    -> keyHashes:
      - can be gotten from addresses via paymentKeyHash (or anathis.logue function in CML)
      - can be gotten from payload-tx via required_signers
      - can be gotten from payload-tx-witness-set via vkeys, which then are hashed
  - assert that the existing signers are subset of required signers - DONE
  - assert that the tipped vectors and required signers are identical - DONE
  - collect the remaining signers
  */

  // TODO: ensure tipping-tx is valid (otherwise clients can cheat a way around the tipping part)

  // get the servitor from the tipping-tx
  const tippingTxSigners = tx.signedTippingTx.witnessSet().vkeys()?.values();
  assert(tippingTxSigners, `no signers in tipping-tx`);
  assert(
    tippingTxSigners.length === 1,
    `expected exactly 1 signer (the servitor) in tipping-tx, got ${tippingTxSigners.length}`,
  );
  const servitorKeyHash = hashPublicKeyHex(tippingTxSigners[0]!.vkey());
  console.log(`servitorKeyHash:`, servitorKeyHash);

  // process required signers
  const requiredSignersKeyHashes_ = tx.partiallySignedPayloadTx
    .body()
    .requiredSigners()
    ?.values();
  assert(requiredSignersKeyHashes_, `no required signers in payload-tx`);
  const requiredSignerHashes: Core.Ed25519KeyHashHex[] = [];
  let servitorRequired = false;
  for (const signerKeyHash of requiredSignersKeyHashes_) {
    if (signerKeyHash.value() === servitorKeyHash) {
      servitorRequired = true;
    } else {
      console.log(`required signer:`, signerKeyHash);
      requiredSignerHashes.push(signerKeyHash.value());
    }
  }
  assert(servitorRequired, `servitor not required in payload-tx`); // TODO FIXME

  // process existing signers
  // const existingSignersVKeys = tx.payloadTxPartialWitnessSet.vkeys();
  const existingSignersVKeys = tx.partiallySignedPayloadTx
    .witnessSet()
    .vkeys()
    ?.values();
  assert(existingSignersVKeys, `no existing signers in payload-tx-witness-set`);
  const existingSignerHashes: Core.Ed25519KeyHashHex[] = [];
  let servitorSigned = false;
  for (const signerVKey_ of existingSignersVKeys) {
    const signerVKey = signerVKey_.vkey();
    const signerVKeyHash = hashPublicKeyHex(signerVKey);
    existingSignerHashes.push(signerVKeyHash);
    if (signerVKeyHash === servitorKeyHash) {
      servitorSigned = true;
    } else {
      assert(
        requiredSignerHashes.includes(signerVKeyHash),
        `unexpected signer in payload-tx-witness-set`,
      );
    }
  }
  assert(servitorSigned, `servitor not signed in payload-tx-witness-set`);

  // process tips
  const tippingOutputs = tx.signedTippingTx.body().outputs();
  const receivedTips: Map<Core.Ed25519KeyHashHex, bigint> = new Map();
  for (const output of tippingOutputs) {
    const outputCredential = Address.fromBlaze(
      output.address(),
    ).paymentCredential;
    assert(
      outputCredential instanceof VerificationKey,
      `expected VerificationKey credential`,
    );
    const outputKeyHash = outputCredential.keyHash.toBlaze();
    console.log(`outputKeyHash:`, outputKeyHash);
    if (outputKeyHash !== servitorKeyHash) {
      assert(
        output.amount().multiasset() === undefined,
        `expected only tips in lovelace,  but got multiasset`,
      );

      const oldTips = receivedTips.get(outputKeyHash) ?? 0n;
      const newTips = oldTips + output.amount().coin();
      console.log(
        outputKeyHash,
        `\n`,
        oldTips,
        `+`,
        output.amount().coin(),
        `=`,
        newTips,
      );
      receivedTips.set(outputKeyHash, newTips);
    }
  }
  // const tipValencies: Map<Core.Ed25519KeyHashHex, bigint> = new Map();
  const untippedSigners = requiredSignerHashes.slice();
  console.log(`receivedTips:`, receivedTips);
  for (const [keyHash, tip_] of receivedTips) {
    // const valency = tip_ / tip;
    // assert(valency > 0n, `tip valency must be positive, got ${valency}`);
    // assert(valency * tip === tip_, `${valency} * ${tip} != ${tip_}`);
    // tipValencies.set(address, valency);

    const index = untippedSigners.indexOf(keyHash);
    assert(index >= 0, `unexpected tip recipient: ${keyHash}`);
    untippedSigners.splice(index, 1);

    assert(tip === tip_, `expected tip amount of ${tip}, got ${tip_}`);
  }
  assert(
    untippedSigners.length === 0,
    `not all required signers received tips, missing:\n    ${untippedSigners.join(
      `\n    `,
    )}`,
  );

  // collect outstanding signers
  const outstandingSignerHashes = requiredSignerHashes.filter((signerHash) => {
    return !existingSignerHashes.includes(signerHash);
  });

  return {
    supportVectorSet: requiredSignerHashes,
    signedBy: existingSignerHashes,
    outstanding: outstandingSignerHashes,
  };
}

/**
 *
 * @param tx
 */
export function parseElectedSupportVectorSet(tx: ElectionTx): TxClique {
  // NOTE: here we are not removing the servitor from the required signers,
  // simply because it would be a hassle to do so atm

  // process required signers
  const requiredSignerHashes = tx.partiallySignedElectionTx
    .body()
    .requiredSigners()
    ?.values()
    .map((signer) => signer.value());
  assert(requiredSignerHashes, `no required signers in election-tx`);

  // process existing signers
  // const existingSignersVKeys = tx.electionTxPartialWitnessSet.vkeys();
  const existingSignersVKeys = tx.partiallySignedElectionTx
    .witnessSet()
    .vkeys()
    ?.values();
  assert(
    existingSignersVKeys,
    `no existing signers in election-tx-witness-set`,
  );
  const existingSignerHashes: Core.Ed25519KeyHashHex[] = [];
  let maybeUserSigner: Core.Ed25519PublicKeyHex | undefined;
  for (const vkey_ of existingSignersVKeys) {
    const vkey = vkey_.vkey();
    const keyHash = hashPublicKeyHex(vkey);
    if (maybeUserSigner) {
      if (maybeUserSigner === vkey) {
        continue;
      } else {
        assert(
          requiredSignerHashes.includes(keyHash),
          `unexpected signer in payload-tx-witness-set`,
        );
      }
    } else if (!requiredSignerHashes.includes(keyHash)) {
      maybeUserSigner = vkey;
      console.log(`found maybe user signer:`, maybeUserSigner);
      continue;
    }
    existingSignerHashes.push(keyHash);
  }

  // collect outstanding signers
  const outstandingSignerHashes = requiredSignerHashes.filter((signerHash) => {
    return !existingSignerHashes.includes(signerHash);
  });

  return {
    supportVectorSet: requiredSignerHashes,
    signedBy: existingSignerHashes,
    outstanding: outstandingSignerHashes,
  };
}
