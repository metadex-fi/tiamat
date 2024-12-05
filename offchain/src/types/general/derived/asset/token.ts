import assert from "assert";
import { Core } from "@blaze-cardano/sdk";
import { PWrapped } from "../../fundamental/container/wrapped";
import { PByteString } from "../../fundamental/primitive/bytestring";
import { TraceUtxo } from "../../../../utils/wrappers";

/**
 *
 */
export class Token {
  public readonly typus = "Token";
  // TODO only temporarily private for refactor (name is now a hex)
  /**
   *
   * @param hexName
   */
  constructor(public readonly hexName: Uint8Array) {
    assert(
      hexName.length <= Token.maxBytes, // 32 bytes/chars equates 64 hex symbols
      `Token too long (${hexName.length} > ${Token.maxBytes}): ${hexName}`,
    );
  }

  /**
   *
   */
  public show = (): string => {
    return `Token(${this.hexName})`;
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
    return Core.toHex(this.hexName);
  };

  /**
   *
   * @param other
   */
  public equals = (other: Token): boolean => {
    const array1 = this.hexName;
    const array2 = other.hexName;
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

  public valueOf = this.show;

  /**
   *
   */
  public toBlaze = (): Core.AssetName => {
    return Core.toHex(this.hexName) as Core.AssetName;
  };

  // /**
  //  * PHASED OUT (this was used to determine lp-token name from thread-nft name, but we use a dedicated function for that now)
  //  * @param skip
  //  */
  // public hash = (skip = 1n): Token => {
  //   let hash = this.toString();
  //   for (let i = 0n; i < skip; i++) {
  //     hash = Core.blake2b_256(hash as Core.HexBlob);
  //   }
  //   return new Token(hash);
  // };

  /**
   *
   * @param utf8TokenName
   */
  static fromString(utf8TokenName: string): Token {
    const hexTokenName = new TextEncoder().encode(utf8TokenName);
    return new Token(hexTokenName);
  }

  /**
   * Creates a special label token-name. The first half is a regular hex encoded string carrying the
   * descriptor. The second half is a raw bytestring half-hash derived from the provided utxo. Attempting
   * to decode that second half into utf8 (regular behaviour) will result in non-reversible garbage output.
   * @param label As we want to arrive at a token with 32 bytes/chars (each utf8-character equates one byte),
   * and the label takes half of that (16 bytes/chars), and our label boilerplate is 5 bytes
   * (2 x 2-byte-chars (λλ) + 1-byte-char (.)), the provided label needs to be less than 11 bytes/chars.
   * @param utxo
   */
  static fromUtxo(label: string, utxo: TraceUtxo): Token {
    const txId = Core.fromHex(utxo.core.input().transactionId());
    const preimage = new Uint8Array(txId.length + 1);
    preimage[0] = Number(utxo.core.input().index());
    preimage.set(txId, 1);
    console.log(
      `Token.fromUtxo: preimage ${Core.toHex(preimage)} from ${utxo.core.input().transactionId()} ${utxo.core.input().index()}`,
    );
    // Core.Hash32ByteBase16 is a hex string
    const utxoHashHex: Core.Hash32ByteBase16 = Core.blake2b_256(
      Core.toHex(preimage) as Core.HexBlob,
    );

    const numCharsBytes: number = Number(Token.maxBytes);
    const halfNumCharsBytes: number = numCharsBytes / 2;

    const numHexChars: number = numCharsBytes * 2;
    const halfNumHexChars: number = numCharsBytes;

    assert(
      utxoHashHex.length === numHexChars,
      `utxoHash length ${utxoHashHex.length} !== ${numHexChars}`,
    );
    label = `λλ.${label}`.padEnd(halfNumCharsBytes - 2, `.:`); // -2 because each λ takes 2 bytes, so 2 extra bytes (each regular utf8-character takes one byte)
    assert(
      label.length === halfNumCharsBytes - 2, // -2 because each λ takes 2 bytes, so 2 extra bytes (each regular utf8-character takes one byte)
      `label wrong size: ${label} length ${label.length} !== ${halfNumCharsBytes - 2}`,
    );
    const hexLabel: string = Core.toHex(new TextEncoder().encode(label));
    assert(
      hexLabel.length <= halfNumHexChars,
      `hexLabel too long: ${hexLabel} length ${hexLabel.length} > ${halfNumHexChars}`,
    );
    const halfHash: string = utxoHashHex.slice(halfNumHexChars);
    const hexName: string = hexLabel + halfHash;
    assert(
      hexName.length <= numHexChars,
      `hexName too long: ${hexName} length ${hexName.length} > ${numHexChars}`,
    );
    const byteName: Uint8Array = Core.fromHex(hexName);
    assert(
      byteName.length === numCharsBytes,
      `byteName wrong size: ${byteName} length ${byteName.length} !== ${numCharsBytes}`,
    );
    return new Token(byteName);
  }

  // /** (Not a priority rn)
  //  * Creates a new token from a "labeled" token (label + some hash), changing the label.
  //  * @param newLabel
  //  * @param labeled
  //  */
  // static relabel(newLabel: string, labeled: Token): Token {

  // }

  /**
   *
   * @param hexTokenName
   */
  static fromBlaze(hexTokenName: Core.AssetName): Token {
    return new Token(Core.fromHex(hexTokenName));
  }

  // static fromOwner = (owner: KeyHash) => {
  //   return new Token(toText_(Core.toHex(owner.keyHash)));
  // };

  static maxBytes = 32n; // 32 bytes/chars equates 64 hex symbols
  static lovelace = new Token(new Uint8Array(0));
}

/**
 *
 */
export class PToken extends PWrapped<Token> {
  /**
   *
   */
  constructor() {
    super(new PByteString(0n, Token.maxBytes), Token, "Token");
  }

  static ptype = new PToken();
  /**
   *
   */
  static override genPType(): PWrapped<Token> {
    return PToken.ptype;
  }
}
