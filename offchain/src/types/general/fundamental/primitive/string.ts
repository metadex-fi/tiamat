import assert from "assert";
import {
  genName,
  genNonNegative,
  maybeNdef,
} from "../../../../utils/generators";
import { PType } from "../type";
import { gMaxStringLength } from "../../../../utils/constants";
import { Core } from "@blaze-cardano/sdk";

/**
 *
 */
export class PString implements PType<Uint8Array, string, string> {
  public readonly population;

  /**
   *
   * @param minLength
   * @param maxLength
   */
  constructor(
    public readonly minLength = 0n,
    public readonly maxLength = gMaxStringLength,
    public readonly hex = false,
  ) {
    assert(
      minLength >= 0n,
      `PString: minLength must be non-negative, got ${minLength}`,
    );
    assert(
      maxLength >= minLength,
      `PString: maxLength must be greater than or equal to minLength, got ${maxLength} < ${minLength}`,
    );
    this.population = maxLength ? undefined : 1n; // NOTE inaccurate, but serves, and quickly
  }

  /**
   *
   * @param s
   */
  public plift = (s: Uint8Array): string => {
    assert(
      s instanceof Uint8Array,
      `PString.plift: expected Uint8Array, got ${s} (${typeof s})`,
    );
    const data = this.hex ? Core.toHex(s) : new TextDecoder().decode(s);
    assert(
      data.length >= this.minLength,
      `PString.plift: data too short: ${data} (${data.length} < ${this.minLength})`,
    );
    assert(
      data.length <= this.maxLength,
      `PString.plift: data too long: ${data} (${data.length} > ${this.maxLength})`,
    );
    return data;
  };

  /**
   *
   * @param data
   */
  public pconstant = (data: string): Uint8Array => {
    assert(
      typeof data === `string`,
      `PString.pconstant: expected string, got ${data} (${typeof data})`,
    );
    assert(
      data.length >= this.minLength,
      `PString.pconstant: data too short: ${data} (${data.length} < ${this.minLength})`,
    );
    assert(
      data.length <= this.maxLength,
      `PString.pconstant: data too long: ${data} (${data.length} > ${this.maxLength})`,
    );
    return this.hex ? Core.fromHex(data) : new TextEncoder().encode(data);
  };

  /**
   *
   * @param data
   */
  public pblueprint = (data: string): string => {
    assert(
      typeof data === `string`,
      `PString.pblueprint: expected string, got ${data} (${typeof data})`,
    );
    assert(
      data.length >= this.minLength,
      `PString.pblueprint: data too short: ${data} (${data.length} < ${this.minLength})`,
    );
    assert(
      data.length <= this.maxLength,
      `PString.pblueprint: data too long: ${data} (${data.length} > ${this.maxLength})`,
    );
    return data;
  };

  /**
   *
   */
  public genData = (): string => {
    return genName(this.minLength, this.maxLength);
  };

  /**
   *
   * @param data
   */
  public showData = (data: string): string => {
    assert(
      typeof data === `string`,
      `PString.showData: expected String, got ${data} (${typeof data})`,
    );
    return `PString: ${data}`;
  };

  /**
   *
   */
  public showPType = (): string => {
    return `PString`;
  };

  static ptype = new PString();

  /**
   *
   */
  static genPType(): PString {
    const minLength = maybeNdef(genNonNegative)?.(gMaxStringLength);
    const maxLength = maybeNdef(
      () =>
        (minLength ?? 0n) +
        genNonNegative(gMaxStringLength - (minLength ?? 0n)),
    )?.();
    return new PString(minLength, maxLength);
  }
}
