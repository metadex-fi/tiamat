import assert from "assert";
import {
  genByteString,
  genNonNegative,
  maybeNdef,
} from "../../../../utils/generators";
import { PType } from "../type";
import { gMaxStringBytes } from "../../../../utils/constants";
import { Core } from "@blaze-cardano/sdk";

/**
 *
 */
export class PByteString implements PType<Uint8Array, Uint8Array, string> {
  public readonly population;

  /**
   *
   * @param minBytes
   * @param maxBytes
   */
  constructor(
    public readonly minBytes = 0n,
    public readonly maxBytes = gMaxStringBytes,
  ) {
    assert(
      minBytes >= 0n,
      `PByteString: minBytes must be non-negative, got ${minBytes}`,
    );
    assert(
      maxBytes >= minBytes,
      `PByteString: maxBytes must be greater than or equal to minBytes, got ${maxBytes} < ${minBytes}`,
    );
    this.population = maxBytes ? undefined : 1n; // NOTE inaccurate, but serves, and quickly
  }

  /**
   *
   * @param s
   */
  public plift = (s: Uint8Array): Uint8Array => {
    assert(
      s instanceof Uint8Array,
      `PByteString.plift: expected Uint8Array, got ${s} (${typeof s})`,
    );
    return s;
  };

  /**
   *
   * @param data
   */
  public pconstant = (data: Uint8Array): Uint8Array => {
    assert(
      data instanceof Uint8Array,
      `PByteString.pconstant: expected Uint8Array, got ${data} (${typeof data})`,
    );
    return new Uint8Array(data);
  };

  /**
   *
   * @param data
   */
  public pblueprint = (data: Uint8Array): string => {
    assert(
      data instanceof Uint8Array,
      `PByteString.pblueprint: expected Uint8Array, got ${data} (${typeof data})`,
    );
    return Core.toHex(data);
  };

  /**
   *
   */
  public genData = (): Uint8Array => {
    return genByteString(this.minBytes, this.maxBytes);
  };

  /**
   *
   * @param data
   */
  public showData = (data: Uint8Array): string => {
    assert(
      data instanceof Uint8Array,
      `PByteString.showData: expected Uint8Array, got ${data} (${typeof data})`,
    );
    return `ByteString: ${data}`;
  };

  /**
   *
   */
  public showPType = (): string => {
    return `PByteString`;
  };

  static ptype = new PByteString();

  /**
   *
   */
  static genPType(): PByteString {
    const minBytes = maybeNdef(genNonNegative)?.(gMaxStringBytes);
    const maxBytes = maybeNdef(
      () =>
        (minBytes ?? 0n) + genNonNegative(gMaxStringBytes - (minBytes ?? 0n)),
    )?.();
    return new PByteString(minBytes, maxBytes);
  }

  /**
   *
   * @param a
   * @param b
   */
  static equal = (a: Uint8Array, b: Uint8Array): boolean => {
    return a.byteLength === b.byteLength && a.every((byte, i) => byte === b[i]);
  };
}
