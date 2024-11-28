import { Core } from "@blaze-cardano/sdk";
import { f } from "../types/general/fundamental/type";

/**
 *
 * @param publicKey
 */
export async function getEd25519KeyHashHex(
  publicKey: Core.Bip32PublicKey,
): Promise<Core.Ed25519KeyHashHex> {
  const keyHash = Core.Hash28ByteBase16.fromEd25519KeyHashHex(
    (await publicKey.toRawKey().hash()).hex(),
  );
  return keyHash as string as Core.Ed25519KeyHashHex;
}

/**
 *
 * @param publicKeyHex
 */
export function hashPublicKeyHex(
  publicKeyHex: Core.Ed25519PublicKeyHex,
): Core.Ed25519KeyHashHex {
  const publicKeyBlob: Core.HexBlob = publicKeyHex as string as Core.HexBlob;
  const keyHashBlob: Core.Hash28ByteBase16 = Core.blake2b_224(publicKeyBlob);
  return keyHashBlob as string as Core.Ed25519KeyHashHex;
}

export function formatTrace(input: string): string {
  let indentLevel = 0;
  let formatted = "";
  let skipNext = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const second = input[i + 1];
    const third = input[i + 2];

    if (skipNext) {
      skipNext--;
      continue;
    }

    if (char === "(" && second === "[") {
      indentLevel++;
      if (third === "_") {
        formatted += "([_" + "\n" + f.repeat(indentLevel);
        skipNext = 2;
      } else {
        formatted += "([" + "\n" + f.repeat(indentLevel);
        skipNext = 1;
      }
    } else if (char === "]" && second === ")") {
      indentLevel--;
      formatted += "\n" + f.repeat(indentLevel) + " ])";
      skipNext = 1;
    } else if (indentLevel && char === ",") {
      formatted += char + "\n" + f.repeat(indentLevel);
    } else {
      formatted += char;
    }
  }

  return formatted;
}
