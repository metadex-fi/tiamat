// TODO consider generating wrong cases as well

import assert from "assert";
import { PData } from "../types/general/fundamental/type";
import { gMaxStringBytes, gMaxStringLength, maxInteger } from "./constants";

const letters = `abcdefghijklmnopqrstuvwxyz`;
// const symbols = "!@#$%^&*()_-+={[}]|\\;:'\",<.>/?`~";
const dropChance = 0.5;

/**
 *
 */
export class Generators {
  /**
   *
   * @param primitives
   * @param containers
   */
  constructor(
    public primitives: Array<() => PData>,
    public containers: Array<(gen: Generators, maxDepth: bigint) => PData>,
  ) {}

  /**
   *
   * @param maxDepth
   */
  public generate(maxDepth: bigint): PData {
    const generator =
      maxDepth > 0
        ? randomChoice([...this.primitives, ...this.containers])
        : randomChoice(this.primitives);
    return generator(this, max(maxDepth - 1n, 0n));
  }
}

/**
 *
 * @param a
 * @param b
 */
export function max(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}
/**
 *
 * @param a
 * @param b
 */
export function min(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

/**
 *
 * @param n
 */
export function abs(n: bigint): bigint {
  return n < 0n ? -n : n;
}

/**
 *
 * @param a
 * @param b
 */
export function ceilDiv(a: bigint, b: bigint): bigint {
  const bonus = a % b === 0n ? 0n : a > 0n ? 1n : -1n;
  return a / b + bonus;
}

/**
 *
 * @param a
 * @param b
 */
export function strictDiv(a: bigint, b: bigint): bigint {
  const malus = a % b === 0n ? 1n : 0n;
  return a / b - malus;
}

/**
 *
 * @param alternatives
 */
export function randomChoice<T>(alternatives: T[]): T {
  return randomIndexedChoice(alternatives)[0];
}

/**
 *
 * @param alternatives
 */
export function randomIndexedChoice<T>(alternatives: T[]): [T, number] {
  assert(
    alternatives.length > 0,
    `randomIndexedChoice: alternatives.length <= 0`,
  );
  const choice = Math.floor(Math.random() * alternatives.length);
  return [alternatives[choice]!, choice];
}

/**
 *
 * @param set
 */
export function randomSubset<T>(set: T[]): T[] {
  const subset = new Array<T>();
  set.forEach((elem) => {
    if (Math.random() > dropChance) {
      subset.push(elem);
    }
  });
  return subset;
}

/**
 *
 * @param array
 */
export function shuffle<T>(array: T[]): T[] {
  const original = array.slice();
  const shuffled = [];
  while (original.length) {
    const [elem, index] = randomIndexedChoice(original);
    shuffled.push(elem);
    original.splice(index, 1);
  }
  assert(shuffled.length === array.length, `shuffle: length mismatch`);
  return shuffled;
}

/**
 *
 * @param set
 */
export function nonEmptySubSet<T>(set: T[]): T[] {
  const subset = randomSubset(set);
  if (subset.length === 0) {
    subset.push(randomChoice(set));
  }
  return subset;
}

/**
 *
 * @param set
 * @param minSize
 * @param maxSize
 */
export function boundedSubset<T>(
  set: T[],
  minSize = 0n,
  maxSize?: bigint,
): T[] {
  assert(minSize <= set.length, `minSizedSubset: ${minSize} > ${set.length}`);
  const subset = [];
  const pickedIndices: number[] = [];
  const maxSize_ = maxSize
    ? min(maxSize, BigInt(set.length))
    : BigInt(set.length);
  const size = minSize + genNonNegative(maxSize_ - minSize);
  while (subset.length < size) {
    const [elem, index] = randomIndexedChoice(set);
    if (!pickedIndices.includes(index)) {
      subset.push(elem);
      pickedIndices.push(index);
    }
  }
  return subset;
}

/**
 *
 * @param value
 */
export function maybeNdef<T>(value: T) {
  return randomChoice([value, undefined]);
}

/**
 *
 * @param maxValue
 */
export function genNonNegative(maxValue = maxInteger): bigint {
  assert(maxValue >= 0n, `genNonNegative: maxValue < 0: ${maxValue}`);
  const n = Math.floor(Math.random() * Number(maxValue));
  let n_;
  try {
    n_ = BigInt(n);
  } catch (_e) {
    // TODO isFinite does not work, but this is excessive
    n_ = maxValue;
  }
  return randomChoice([0n, n_, maxValue]);
}

/**
 *
 * @param maxValue
 */
export function genPositive(maxValue = maxInteger): bigint {
  assert(maxValue >= 1n, `genPositive: maxValue < 1: ${maxValue}`);
  return 1n + genNonNegative(maxValue - 1n);
}

/**
 *
 * @param maxValue
 */
export function genNumber(maxValue = maxInteger): bigint {
  const n = genNonNegative(maxValue);
  return randomChoice([n, -n]);
}

/**
 *
 * @param alph
 * @param minLength
 * @param maxLength
 * @param stepSize
 */
function genString(
  alph: string,
  minLength: bigint,
  maxLength: bigint,
  stepSize: bigint,
): string {
  assert(minLength >= 0n, `genString: minBytes < 0`);
  assert(gMaxStringLength >= maxLength, `genString: maxStringBytes < minBytes`);
  assert(maxLength >= minLength, `genString: maxBytes < minBytes`);
  /**
   *
   */
  function genChar(): string {
    const choice = Math.floor(Math.random() * (alph.length + 10));
    if (choice < alph.length) {
      return alph.charAt(choice);
    } else {
      return Math.floor(Math.random() * 10).toString();
    }
  }
  const l: string[] = [];
  const maxi = stepSize * (minLength + genNonNegative(maxLength - minLength));
  for (let i = 0n; i < maxi; i++) {
    l.push(genChar());
  }
  const s = l.join("");
  return s;
}

/**
 *
 * @param minBytes
 * @param maxBytes
 */
export function genByteString(
  minBytes = 0n,
  maxBytes = gMaxStringBytes,
): Uint8Array {
  const length = Number(minBytes) + Number(genNonNegative(maxBytes - minBytes));
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

/**
 *
 * @param minLength
 * @param maxLength
 */
export function genName(minLength = 0n, maxLength = gMaxStringLength): string {
  const lower = letters;
  const upper = lower.toUpperCase();
  const alph = lower + upper; //+ symbols; TODO reactivate symbols (apparently sometimes breaks something onchain in tokenNames)
  return genString(alph, minLength, maxLength, 1n);
}
