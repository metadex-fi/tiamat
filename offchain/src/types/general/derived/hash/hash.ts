import assert from "assert";
import { Core } from "@blaze-cardano/sdk";
import { PWrapped } from "../../fundamental/container/wrapped";
import { PByteString } from "../../fundamental/primitive/bytestring";
import { asCorePlutusData, Data } from "../../fundamental/type";
import { TraceUtxo } from "../../../../utils/wrappers";

// product from hashing-function
/**
 *
 */
export class Hash {
  public readonly typus = "Hash";
  /**
   *
   * @param bytes
   */
  constructor(public readonly bytes: Core.Hash32ByteBase16) {
    assert(
      bytes.length === Number(Hash.numHalfBytes),
      `hash must be ${Hash.numHalfBytes} bytes, got ${bytes.length}: ${bytes}`,
    );
  }

  /**
   *
   * @param skip
   */
  public hash = (skip = 1n): Hash => {
    let hash = this.bytes;
    for (let i = 0n; i < skip; i++) {
      hash = Core.blake2b_256(hash as string as Core.HexBlob);
    }
    return new Hash(hash);
  };

  /**
   *
   */
  public show = (): string => {
    return `Hash: ${this.toString()}`;
  };

  /**
   *
   */
  public concise = (): string => {
    return this.toString();
  };

  /**
   *
   */
  public toString = (): string => {
    return this.bytes;
  };

  /**
   *
   */
  public toBlaze = (): Core.AssetName => {
    return this.bytes as string as Core.AssetName;
  };

  /**
   *
   * @param other
   */
  public equals = (other: Hash): boolean => {
    const array1 = this.bytes;
    const array2 = other.bytes;
    if (array1.length !== array2.length) {
      return false;
    }

    for (let i = 0; i < array1.length; i++) {
      if (array1[i] !== array2[i]) {
        return false;
      }
    }

    return true;
  };

  /**
   *
   * @param bytes
   */
  static fromBytes(bytes: Uint8Array): Hash {
    if (bytes.length !== 32) {
      throw new Error("Uint8Array must be exactly 32 bytes.");
    }
    const hexString = Core.toHex(bytes);
    return new Hash(hexString as Core.Hash32ByteBase16);
  }

  /**
   *
   * @param hexTokenName
   */
  static fromBlaze(hexTokenName: string): Hash {
    try {
      return Hash.fromString(hexTokenName as Core.Hash32ByteBase16);
    } catch (e) {
      throw new Error(`Hash.fromBlaze ${hexTokenName}:\n${e}`);
    }
  }

  /**
   *
   * @param s
   */
  static fromString(s: Core.Hash32ByteBase16): Hash {
    try {
      return new Hash(s);
    } catch (e) {
      throw new Error(`Hash.fromString ${s}:\n${e}`);
    }
  }

  static fromUtxo(utxo: TraceUtxo): Hash {
    const txId = Core.fromHex(utxo.core.input().transactionId());
    const preimage = new Uint8Array(txId.length + 1);
    preimage[0] = Number(utxo.core.input().index());
    preimage.set(txId, 1);
    return new Hash(Core.blake2b_256(Core.toHex(preimage) as Core.HexBlob));
  }

  static fromData(data: Data): Hash {
    const cbor = asCorePlutusData(data);
    return new Hash(Core.blake2b_256(cbor.toCbor()));
  }

  static numHalfBytes = 64n;
  static dummy = new Hash(
    Core.toHex(
      new Uint8Array(Number(Hash.numHalfBytes / 2n)),
    ) as Core.Hash32ByteBase16,
  );
}

/**
 *
 */
export class PHash extends PWrapped<Hash> {
  /**
   *
   */
  private constructor() {
    super(new PByteString(Hash.numHalfBytes, Hash.numHalfBytes), Hash, "Hash");
  }

  static ptype = new PHash();
  /**
   *
   */
  static override genPType(): PWrapped<Hash> {
    return PHash.ptype;
  }
}
