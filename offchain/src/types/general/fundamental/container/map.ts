import assert from "assert";
import {
  Generators,
  genNonNegative,
  maybeNdef,
  min,
  randomChoice,
} from "../../../../utils/generators";
import {
  f,
  PConstanted,
  PData,
  PLifted,
  PType,
  PBlueprinted,
  t,
} from "../type";
import { PList } from "./list";
import { gMaxLength, maxShowDepth } from "../../../../utils/constants";

/**
 *
 * @param numKeys
 * @param numValues
 * @param size
 */
function census(numKeys: bigint, numValues: bigint, size: bigint): bigint {
  let population = 1n;
  let remaining = numKeys;
  for (let i = 0; i < size; i++) {
    population *= numValues * remaining--;
  }
  return population;
}

/**
 *
 */
export class AssocMap<K, V> {
  private inner = new Map<string, [K, V]>();

  private sorted = true;

  /**
   *
   * @param showKey
   */
  constructor(private readonly showKey: (k: K, tabs?: string) => string) {}

  /**
   *
   */
  public sort(): void {
    if (!this.sorted) {
      this.inner = new Map(
        [...this.inner.entries()].sort((a, b) => a[0].localeCompare(b[0])),
      );
      this.sorted = true;
    }
  }

  // TODO check this notation works
  /**
   *
   */
  public get size(): number {
    return this.inner.size;
  }

  // TODO check this notation works
  /**
   *
   */
  public get anew(): AssocMap<K, V> {
    return new AssocMap(this.showKey);
  }

  /**
   *
   */
  public get last(): V | undefined {
    if (this.size === 0) return undefined;
    const ks = [...this.keys()];
    if (ks) return this.get(ks[ks.length - 1]!);
    else return undefined;
  }

  /**
   *
   */
  public get clone(): AssocMap<K, V> {
    const m = new AssocMap<K, V>(this.showKey);
    m.sorted = this.sorted;
    for (const [k, v] of this.inner) {
      m.inner.set(k, v);
    }
    return m;
  }

  /**
   *
   * @param k
   * @param v
   */
  public set = (k: K, v: V): void => {
    this.inner.set(this.showKey(k), [k, v]);
    this.sorted = false;
  };

  /**
   *
   * @param k
   */
  public get = (k: K): V | undefined => {
    return this.inner.get(this.showKey(k))?.[1];
  };

  /**
   *
   * @param k
   */
  public has = (k: K): boolean => {
    return this.inner.has(this.showKey(k));
  };

  /**
   *
   * @param k
   */
  public delete = (k: K): boolean => {
    return this.inner.delete(this.showKey(k));
  };

  /**
   *
   */
  public clear = (): void => {
    this.inner.clear();
    this.sorted = true;
  };

  // TODO check this notation works
  /**
   *
   */
  public *keys(): Generator<K> {
    for (const [_, entry] of this.inner) {
      yield entry[0];
    }
  }

  // TODO check this notation works
  /**
   *
   */
  public *values(): Generator<V> {
    for (const [_, entry] of this.inner) {
      yield entry[1];
    }
  }

  // TODO check this notation works
  /**
   *
   */
  public *entries(): Generator<[K, V]> {
    for (const [_, entry] of this.inner) {
      yield entry;
    }
  }

  // TODO check this notation works
  /**
   *
   */
  public *[Symbol.iterator](): Generator<[K, V]> {
    yield* this.entries();
  }

  /**
   *
   * @param callbackfn
   * @param thisArg
   */
  public forEach = (
    callbackfn: (value: V, key: K, map: AssocMap<K, V>) => void,
    thisArg?: any,
  ): void => {
    for (const [k, v] of this) {
      callbackfn.call(thisArg, v, k, this);
    }
  };

  /**
   *
   * @param f
   */
  public map = <V1>(f: (v: V) => V1 | undefined): AssocMap<K, V1> => {
    const result = new AssocMap<K, V1>(this.showKey);
    for (const [k, v] of this) {
      const v1 = f(v);
      if (v1) result.set(k, v1);
    }
    return result;
  };

  /**
   *
   * @param other
   * @param f
   */
  public zipWith = <V0, V1>(
    other: AssocMap<K, V0>,
    f: (v: V, v0: V0) => V1,
  ): AssocMap<K, V1> => {
    const result = new AssocMap<K, V1>(this.showKey);
    for (const [k, v] of this) {
      const v0 = other.get(k);
      if (v0) result.set(k, f(v, v0));
    }
    return result;
  };

  /**
   *
   * @param showValue
   * @param tabs
   */
  public show = (
    showValue: (v: V, tabs?: string) => string,
    tabs = "",
  ): string => {
    const tt = t + tabs;
    const ttf = tt + f;
    return `AssocMap {
${ttf}sorted: ${this.sorted},
${[...this.inner.values()]
  .map(
    ([key, value]) =>
      `${ttf}${this.showKey(key, ttf)} => ${showValue(value, ttf)}`,
  )
  .join(",\n")}
${tt}}`;
  };
}

/**
 *
 */
export class PMap<PKey extends PData, PValue extends PData>
  implements
    PType<
      Map<PConstanted<PKey>, PConstanted<PValue>>,
      AssocMap<PLifted<PKey>, PLifted<PValue>>,
      Map<PBlueprinted<PKey>, PBlueprinted<PValue>>
    >
{
  public readonly population: bigint | undefined;
  private readonly dataKeys?: PConstanted<PKey>[];

  /**
   *
   * @param pkey
   * @param pvalue
   * @param sorted
   * @param size
   * @param keys
   */
  constructor(
    public readonly pkey: PKey,
    public readonly pvalue: PValue,
    public readonly sorted = false, //NOTE this only refers to the onchain-data being sorted (used for "Value")
    public readonly size?: bigint,
    public readonly keys?: PLifted<PKey>[],
  ) {
    if (keys) {
      this.dataKeys = keys.map((k) => pkey.pconstant(k) as PConstanted<PKey>);
      const length = BigInt(keys.length);
      if (size) {
        assert(length === size, `PMap: wrong size`);
      } else {
        this.size = length;
      }
      if (keys.length) {
        this.population = pvalue.population
          ? pvalue.population ** length
          : undefined; //if keys given, their ordering is fixed
      } else {
        this.population = 1n;
      }
    } else if (size) {
      assert(
        !pkey.population || size <= pkey.population,
        `PMap: not enough keys for size ${size} in\n${pkey.showPType()}`,
      );
      this.population =
        pkey.population && pvalue.population
          ? census(pkey.population, pvalue.population, size)
          : undefined; // if keys not given, their ordering matters
    } else this.population = 1n; // worst case, consider preventing this by setting minimum size, or using undefined
    assert(
      !this.population || this.population > 0,
      `Population not positive in ${this.showPType()}`,
    );
  }

  /**
   *
   * @param m
   */
  public plift = (
    m: Map<PConstanted<PKey>, PConstanted<PValue>>,
  ): AssocMap<PLifted<PKey>, PLifted<PValue>> => {
    assert(m instanceof Map, `plift: expected Map`);
    assert(!this.size || this.size === BigInt(m.size), `plift: wrong size`);

    const data = new AssocMap<PLifted<PKey>, PLifted<PValue>>(
      this.pkey.showData,
    );
    let i = 0;
    m.forEach((value, key) => {
      const k = this.pkey.plift(key) as PLifted<PKey>;
      assert(
        !this.dataKeys ||
          this.pkey.showData(this.dataKeys[i++]) === this.pkey.showData(key),
        `PMap.plift: wrong key of ptype
        ${this.pkey.showPType("", maxShowDepth)}
        =!= ${key.toString()}`,
      );
      data.set(k, this.pvalue.plift(value) as PLifted<PValue>);
    });
    return data;
  };

  /**
   *
   * @param data
   */
  public pconstant = (
    data: AssocMap<PLifted<PKey>, PLifted<PValue>>,
  ): Map<PConstanted<PKey>, PConstanted<PValue>> => {
    assert(data instanceof AssocMap, `AssocMap.pconstant: expected AssocMap`);
    assert(
      !this.size || this.size === BigInt(data.size),
      `AssocMap.pconstant: wrong size: ${this.size} vs. ${data.size} of ${this.showData(
        data,
        "",
        maxShowDepth,
      )}`,
    );
    if (this.sorted) data.sort(); //NOTE this tricks our type-tests, but that's ok

    const m = new Map<PConstanted<PKey>, PConstanted<PValue>>();
    let i = 0;
    data.forEach((value, key) => {
      const k = this.pkey.pconstant(key);
      assert(
        !this.dataKeys ||
          this.pkey.showData(this.dataKeys[i++]) === this.pkey.showData(k),
        `PMap.pconstant: wrong key of ptype
        ${this.pkey.showPType("", maxShowDepth)}
        =!= ${k.toString()}`,
      );
      m.set(
        k as PConstanted<PKey>,
        this.pvalue.pconstant(value) as PConstanted<PValue>,
      );
    });
    return m;
  };

  /**
   *
   * @param data
   */
  public pblueprint = (
    data: AssocMap<PLifted<PKey>, PLifted<PValue>>,
  ): Map<PBlueprinted<PKey>, PBlueprinted<PValue>> => {
    assert(data instanceof AssocMap, `AssocMap.pblueprint: expected AssocMap`);
    assert(
      !this.size || this.size === BigInt(data.size),
      `AssocMap.pblueprint: wrong size: ${this.size} vs. ${data.size} of ${this.showData(
        data,
        "",
        maxShowDepth,
      )}`,
    );
    if (this.sorted) data.sort(); //NOTE this tricks our type-tests, but that's ok

    const m = new Map<PBlueprinted<PKey>, PBlueprinted<PValue>>();
    let i = 0;
    data.forEach((value, key) => {
      const k = this.pkey.pblueprint(key);
      assert(
        !this.dataKeys ||
          this.pkey.showData(this.dataKeys[i++]) === this.pkey.showData(k),
        `PMap.pblueprint: wrong key of ptype
        ${this.pkey.showPType("", maxShowDepth)}
        =!= ${k ? k.toString() : k}`,
      );
      m.set(
        k as PBlueprinted<PKey>,
        this.pvalue.pblueprint(value) as PBlueprinted<PValue>,
      );
    });
    return m;
  };

  /**
   *
   * @param pkey
   * @param size
   */
  static genKeys<PKey extends PData>(
    pkey: PKey,
    size?: bigint,
  ): PLifted<PKey>[] {
    // console.log(`PMap.genKeys: ${pkey.showPType()}, size: ${Number(size)}`);
    let timeout = gMaxLength + 100n;

    /**
     *
     */
    function genKey(): void {
      const key = pkey.genData();
      const keyString = pkey.showData(key);

      if (!keyStrings.has(keyString)) {
        keyStrings.set(keyString, 1);
        keys.push(key as PLifted<PKey>);
      } else {
        keyStrings.set(keyString, keyStrings.get(keyString)! + 1);
        // console.log(
        //   `PMap.genKeys: duplicate key: ${keyString}, timeout: ${
        //     Number(timeout)
        //   }`,
        // );
        if (timeout-- < 0n) {
          throw new Error(
            `Map.genKeys: timeout with
${t}size: ${Number(size)},
${t}keyStrings: ${[...keyStrings.entries()]
              .map(([key, value]) => `${value} x ${key}`)
              .join(`,\n${t + f}`)},
${t}pkey: ${pkey.showPType(t)}`,
          );
        }
      }
    }

    const keys = new Array<PLifted<PKey>>();
    const keyStrings = new Map<string, number>();

    const maxKeys = pkey.population;
    if (size) {
      assert(
        !maxKeys || size <= maxKeys,
        `PMap.genKeys: size too big: ${Number(size)} vs. ${maxKeys}`,
      );
      while (keys.length < size) genKey();
    } else {
      const size_ = genNonNegative(
        maxKeys ? min(gMaxLength, maxKeys) : gMaxLength,
      );
      for (let i = 0; i < size_; i++) genKey();
    }
    return keys;
  }

  /**
   *
   * @param pkey
   * @param pvalue
   * @param size
   */
  static genMap<PKey extends PData, PValue extends PData>(
    pkey: PKey,
    pvalue: PValue,
    size: bigint,
  ): AssocMap<PLifted<PKey>, PLifted<PValue>> {
    assert(
      !pkey.population || size <= pkey.population,
      `PMap: not enough keys for size ${Number(size)} in ${pkey.showPType()}`,
    );
    const m = new AssocMap<PLifted<PKey>, PLifted<PValue>>(pkey.showData);
    const keys = PMap.genKeys(pkey, size);
    // console.log(`generating Map with keys: ${JSON.stringify(keys)}`);
    keys.forEach((key) => {
      m.set(key, pvalue.genData() as PLifted<PValue>);
    });
    return m;
  }

  /**
   *
   */
  public genData = (): AssocMap<PLifted<PKey>, PLifted<PValue>> => {
    if (this.keys) {
      // console.log(`populating Map with keys: ${JSON.stringify(this.keys)}`);
      const m = new AssocMap<PLifted<PKey>, PLifted<PValue>>(
        this.pkey.showData,
      );
      this.keys.forEach((key) => {
        m.set(key, this.pvalue.genData() as PLifted<PValue>);
      });
      return m;
    } else {
      // console.log(`generating Data for ${this.showPType()}`);
      const size = this.size
        ? this.size
        : genNonNegative(
            this.pkey.population
              ? min(gMaxLength, this.pkey.population)
              : gMaxLength,
          );
      // console.log(`generating Map with size: ${Number(size)}`);
      return PMap.genMap(this.pkey, this.pvalue, size);
    }
  };

  /**
   *
   * @param data
   * @param tabs
   * @param maxDepth
   */
  public showData = (
    data: AssocMap<PLifted<PKey>, PLifted<PValue>>,
    tabs = "",
    maxDepth?: bigint,
  ): string => {
    if (maxDepth !== undefined && maxDepth <= 0n) return "AssocMap { … }";
    assert(
      data instanceof AssocMap,
      `PMap.showData: expected AssocMap, got ${data}`,
    );
    const tt = tabs + t;
    const ttf = tt + f;

    // data.sort();

    return `AssocMap {
${[...data.entries()]
  .map(
    ([key, value]) =>
      `${ttf}${this.pkey.showData(
        key,
        ttf,
        maxDepth ? maxDepth - 1n : maxDepth,
      )} => ${this.pvalue.showData(
        value,
        ttf,
        maxDepth ? maxDepth - 1n : maxDepth,
      )}`,
  )
  .join(",\n")}
${tt}}`;
  };

  /**
   *
   * @param tabs
   * @param maxDepth
   */
  public showPType = (tabs = "", maxDepth?: bigint): string => {
    if (maxDepth !== undefined && maxDepth <= 0n) return "PMap ( … )";
    const tt = tabs + t;
    const ttf = tt + f;
    const ttft = ttf + t;

    const keys = this.keys
      ? new PList(this.pkey).showData(this.keys, ttft)
      : "undefined";

    return `PMap (
${ttf}population: ${this.population},
${ttf}pkey: ${this.pkey.showPType(ttf, maxDepth ? maxDepth - 1n : maxDepth)},
${ttf}pvalue: ${this.pvalue.showPType(
      ttf,
      maxDepth ? maxDepth - 1n : maxDepth,
    )},
${ttf}size?: ${this.size},
${ttf}keys?: ${keys}
${tt})`;
  };

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static genPType<PKey extends PData, PValue extends PData>(
    gen: Generators,
    maxDepth: bigint,
  ): PMap<PKey, PValue> {
    // additional maxDepth - 1n intentional
    const pkey: PKey = gen.generate(maxDepth - 1n) as PKey;
    const pvalue: PValue = gen.generate(maxDepth - 1n) as PValue;
    const sorted = randomChoice([true, false, undefined]);
    const keys: PLifted<PKey>[] | undefined = maybeNdef(() =>
      PMap.genKeys(pkey),
    )?.();
    if (keys && sorted) {
      keys.sort((a, b) => pkey.showData(a).localeCompare(pkey.showData(b)));
    }
    const size = maybeNdef(
      BigInt(
        keys?.length ??
          genNonNegative(
            pkey.population ? min(gMaxLength, pkey.population) : gMaxLength,
          ),
      ),
    );

    return new PMap<PKey, PValue>(pkey, pvalue, sorted, size, keys);
  }
}
