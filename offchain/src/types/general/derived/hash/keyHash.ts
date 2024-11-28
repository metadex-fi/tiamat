import assert from "assert";
import { Core } from "@blaze-cardano/sdk";
import { PWrapped } from "../../fundamental/container/wrapped";
import { Hash } from "./hash";
import { PString } from "../../fundamental/primitive/string";

/**
 *
 */
export class KeyHash {
  public readonly typus = "KeyHash";
  /**
   *
   * @param keyHash
   */
  constructor(public readonly keyHash: Core.Ed25519KeyHashHex) {
    assert(
      keyHash.length === Number(KeyHash.numChars),
      `keyHash must be ${KeyHash.numChars} chars, got ${keyHash.length}`,
    );
  }
  /**
   *
   */
  public hash = (): Hash =>
    new Hash(
      Core.blake2b_256(
        new TextDecoder().decode(Core.fromHex(this.keyHash)) as Core.HexBlob,
      ),
    );

  /**
   *
   */
  public concise = (): string => {
    return this.keyHash;
  };

  /**
   *
   */
  public toString = (): string => {
    return this.keyHash;
  };

  /**
   *
   */
  public toBlaze = (): Core.Ed25519KeyHashHex => {
    return this.keyHash;
  };

  // NOTE this should be ok here
  /**
   *
   */
  public toBlazeDowncast = (): Core.Hash28ByteBase16 => {
    return Core.Hash28ByteBase16.fromEd25519KeyHashHex(this.keyHash);
  };

  /**
   *
   * @param _tabs
   */
  public show = (_tabs = ``): string => {
    return `KeyHash: ${this.concise()}`;
  };

  /**
   *
   * @param other
   */
  public equals = (other: KeyHash): boolean => {
    return this.keyHash === other.keyHash;
    // const array1 = this.keyHash;
    // const array2 = other.keyHash;
    // if (array1.length !== array2.length) {
    //   return false;
    // }

    // for (let i = 0; i < array1.length; i++) {
    //   if (array1[i] !== array2[i]) {
    //     return false;
    //   }
    // }

    // return true;
  };

  public clone = (): KeyHash => {
    return new KeyHash(this.keyHash);
  };

  /**
   *
   * @param keyHash
   */
  static fromBlaze(keyHash: Core.Ed25519KeyHashHex): KeyHash {
    return new KeyHash(keyHash);
  }

  /**
   *
   * @param credential
   */
  static fromBlazeCredential(credential: Core.Credential): KeyHash {
    return new KeyHash(
      credential.toCore().hash as string as Core.Ed25519KeyHashHex,
    );
  }

  // static fromPrivateKey(privateKey: string): KeyHash {
  //   const priv = Core.Bip32PrivateKeyHex.from_bech32(privateKey);
  //   const pub = priv.to_public().hash().to_bytes();
  //   return new KeyHash(pub);
  // }

  static numBytes = 28n;
  static numChars = KeyHash.numBytes * 2n;
}

/**
 *
 */
export class PKeyHash extends PWrapped<KeyHash> {
  /**
   *
   */
  private constructor() {
    super(
      new PString(KeyHash.numChars, KeyHash.numChars, true),
      KeyHash,
      `KeyHash`,
    );
  }

  static ptype = new PKeyHash();
  /**
   *
   */
  static override genPType(): PWrapped<KeyHash> {
    return PKeyHash.ptype;
  }
}
