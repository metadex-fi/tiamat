/*
PType - for parser-type. Also a nod to Plutarch.
It's basically a crude runtime type system for data parsing.
Each class represents a mechanism to create the corresponding
non-P-type, not actual data.
plift parses, pconstant composes.
T is the equivalent concrete type.
*/

import { Core } from "@blaze-cardano/sdk";
import { assert } from "console";
import { Inline } from "../derived/address";

export class ConstrData<DataTs extends Data[]> {
  /**
   *
   * @param index
   * @param fields
   */
  constructor(
    public index: keyof DataTs,
    public fields: { [Index in keyof DataTs]: DataTs[Index] }, // Enforces alignment with DataTs
  ) {}
}

export type Data =
  | Uint8Array
  | bigint
  | Array<Data>
  | Map<Data, Data>
  | ConstrData<Data[]>;

/**
 *
 * @param data
 */
export function asCorePlutusData(data: Data): Core.PlutusData {
  if (data instanceof Uint8Array) {
    return Core.PlutusData.newBytes(data);
  } else if (typeof data === "bigint") {
    return Core.PlutusData.newInteger(data);
  } else if (data instanceof Array) {
    const list = new Core.PlutusList();
    for (const elem of data) {
      list.add(asCorePlutusData(elem));
    }
    return Core.PlutusData.newList(list);
  } else if (data instanceof Map) {
    const map = new Core.PlutusMap();
    for (const [k, v] of data.entries()) {
      map.insert(asCorePlutusData(k), asCorePlutusData(v));
    }
    return Core.PlutusData.newMap(map);
  } else if (data instanceof ConstrData) {
    const list = new Core.PlutusList();
    for (const elem of data.fields) {
      list.add(asCorePlutusData(elem));
    }
    const constr = new Core.ConstrPlutusData(
      BigInt(data.index as number),
      list,
    );
    return Core.PlutusData.newConstrPlutusData(constr);
  } else {
    throw new Error(`asCorePlutusData: unknown data type ${data}`);
  }
}

// /**
//  *
//  * @param constr
//  */
// export function fromCorePlutusDatum<DataTs extends Data[]>(
//   constr: Core.ConstrPlutusData,
// ): ConstrData<DataTs> {
//   const list: { [Index in keyof DataTs]: DataTs[Index] } = [];
//   const fields = constr.getData();
//   for (let i = 0; i < fields.getLength(); i++) {
//     const aa = fields.get(i);
//     const bb = fromCorePlutusData(aa);
//     list.push(bb);
//   }
//   return new ConstrData<DataTs>(Number(constr.getAlternative()), list);
// }

/**
 *
 * @param constr
 */
function fromCorePlutusTuple<DataTs extends Data[]>(
  plutusList: Core.PlutusList,
): { [Index in keyof DataTs]: DataTs[Index] } {
  const dataList: Core.PlutusData[] = [];
  for (let i = 0; i < plutusList.getLength(); i++) {
    dataList.push(plutusList.get(i));
  }

  const list = dataList.map((x, i) =>
    fromCorePlutusData<DataTs[typeof i]>(x),
  ) as { [Index in keyof DataTs]: DataTs[Index] };

  return list;
}

export function fromCorePlutusConstr<DataTs extends Data[]>(
  data: Core.PlutusData,
): ConstrData<DataTs> {
  const constr = data.asConstrPlutusData();
  if (!constr) {
    throw new Error(
      `fromCorePlutusConstr: expected Constr, got ${data} (${data.toCbor()})`,
    );
  }

  const fields = constr.getData();
  const list = fromCorePlutusTuple<DataTs>(fields);

  return new ConstrData<DataTs>(Number(constr.getAlternative()), list);
}

/**
 *
 * @param constr
 */
export function fromCorePlutusMap<KeyDT extends Data, ValueDT extends Data>(
  data: Core.PlutusData,
): Map<KeyDT, ValueDT> {
  const map = data.asMap();
  if (!map) {
    throw new Error(
      `fromCorePlutusMap: expected Map, got ${data} (${data.toCbor()}`,
    );
  }
  const mapData = new Map<KeyDT, ValueDT>();
  const keys = map.getKeys();
  for (let i = 0; i < map.getLength(); i++) {
    const key_ = keys.get(i);
    const key = fromCorePlutusData<KeyDT>(key_);
    const value_ = map.get(key_);
    assert(
      value_,
      `fromCorePlutusMap: expected value, got ${value_} (${data.toCbor()}`,
    );
    const value = fromCorePlutusData<ValueDT>(value_!);
    mapData.set(key, value);
  }
  return mapData;
}

/**
 *
 * @param constr
 */
export function fromCorePlutusList<ElemT extends Data>(
  data: Core.PlutusData,
): Array<ElemT> {
  const plutusList = data.asList();
  if (!plutusList) {
    throw new Error(
      `fromCorePlutusList: expected List, got ${data} (${data.toCbor()}`,
    );
  }
  const list: ElemT[] = [];
  for (let i = 0; i < plutusList.getLength(); i++) {
    const elem = plutusList.get(i);
    list.push(fromCorePlutusData<ElemT>(elem));
  }
  return list;
}

/**
 *
 * @param constr
 */
export function fromCorePlutusInteger(data: Core.PlutusData): bigint {
  const integer = data.asInteger();
  if (!integer) {
    throw new Error(
      `fromCorePlutusInteger: expected Bytes, got ${data} (${data.toCbor()}`,
    );
  }
  return integer;
}

/**
 *
 * @param constr
 */
export function fromCorePlutusBytes(data: Core.PlutusData): Uint8Array {
  const bytes = data.asBoundedBytes();
  if (!bytes) {
    throw new Error(
      `fromCorePlutusBytes: expected Bytes, got ${data} (${data.toCbor()}`,
    );
  }
  return bytes;
}

function isConstrData<T>(): T extends ConstrData<Data[]> ? true : false {
  return true as any;
}

function isMapData<T>(): T extends Map<Data, Data> ? true : false {
  return true as any;
}

function isListData<T>(): T extends Data[] ? true : false {
  return true as any;
}

function isBigIntData<T>(): T extends bigint ? true : false {
  return true as any;
}

function isUint8ArrayData<T>(): T extends Uint8Array ? true : false {
  return true as any;
}

/**
 *
 * @param data
 */
export function fromCorePlutusData<DataT extends Data>(
  data: Core.PlutusData,
): DataT {
  const kind = data.getKind();
  switch (kind) {
    case Core.PlutusDataKind.ConstrPlutusData:
      if (!isConstrData<DataT>()) {
        throw new Error(`DataT must be ConstrData when kind is Constr`);
      }
      return fromCorePlutusConstr(data) as DataT;

    case Core.PlutusDataKind.Map:
      if (!isMapData<DataT>()) {
        throw new Error(`DataT must be Map when kind is Map`);
      }
      return fromCorePlutusMap(data) as DataT;

    case Core.PlutusDataKind.List:
      if (!isListData<DataT>()) {
        throw new Error(`DataT must be Array when kind is List`);
      }
      return fromCorePlutusList(data) as DataT;

    case Core.PlutusDataKind.Integer:
      if (!isBigIntData<DataT>()) {
        throw new Error(`DataT must be bigint when kind is Integer`);
      }
      return fromCorePlutusInteger(data) as DataT;

    case Core.PlutusDataKind.Bytes:
      if (!isUint8ArrayData<DataT>()) {
        throw new Error(`DataT must be Uint8Array when kind is Bytes`);
      }
      return fromCorePlutusBytes(data) as DataT;

    default:
      throw new Error(`fromCorePlutusData: unknown kind ${kind}`);
  }
}

export type RecordOfMaybe<T> = Record<string, T | undefined>;

// we need two types here, because we can both map multiple Data-types onto the same
// Lifted-type, and vice versa; examples (Data -> LIfted):
// 1. Array maps to Array (via PList), Record (via PRecord) and Object (via PObject)
// 2. Array (via PObject) and Constr (via PSum) map to Object
export interface PType<D extends Data, L, BPType> {
  readonly population: bigint | undefined; // undefined means infinite TODO better way?
  plift(data: D): L;
  pconstant(data: L): D;
  pblueprint(data: L): BPType;
  genData(): L;
  showData(data: L, tabs?: string, maxDepth?: bigint): string;
  showPType(tabs?: string, maxDepth?: bigint): string;
}

export type PData<Depth extends number = MaxDepth> = PType<
  Data,
  unknown,
  PBlueprint<Depth>
>;
export type PLifted<
  P extends PData<Depth>,
  Depth extends number = MaxDepth,
> = ReturnType<P["plift"]>;
export type PConstanted<
  P extends PData<Depth>,
  Depth extends number = MaxDepth,
> = ReturnType<P["pconstant"]>;
export type PBlueprinted<
  P extends PData<Depth>,
  Depth extends number = MaxDepth,
> = ReturnType<P["pblueprint"]>;
// export type PBlueprinted<P extends PData> = ReturnType<P['pblueprint']>;

type PBlueprint<Depth extends number> = Depth extends never
  ? never
  :
      | Record<string, PBlueprint<Decrement<Depth>>>
      | Array<PBlueprint<Decrement<Depth>>>
      | Map<PBlueprint<Decrement<Depth>>, PBlueprint<Decrement<Depth>>>
      | bigint
      | string
      | boolean
      | null
      | undefined;

export type DataBP<DataT extends Data> = DataBP_<DataT, 5>;
type DataBP_<
  DataT extends Data,
  Depth extends number,
> = DataT extends Uint8Array
  ? string
  : DataT extends bigint
    ? bigint
    : DataT extends Array<infer E extends Data>
      ? Array<DataBP_<E, Decrement<Depth>>>
      : DataT extends Map<infer K extends Data, infer V extends Data>
        ? Map<DataBP_<K, Decrement<Depth>>, DataBP_<V, Decrement<Depth>>>
        : DataT extends ConstrData<infer D extends Data[]>
          ? Record<string, DataBP_<D[number], Decrement<Depth>>>
          : // Record<string, any>
            never;

export interface TObject extends Object {
  typus: string;
}

export type Wrapper<K extends string, InnerT> = { [P in K]: InnerT } & {
  __wrapperBrand: K;
};

type NonNever<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
};

type ExcludeTypus<T> = {
  [K in keyof T as K extends "typus" ? never : K]: T[K];
};

type Clean<T> = NonNever<ExcludeTypus<T>>;

export type SumBP<Os extends TObject[]> = {
  [Index in keyof Os]: ConstituentBP<Os[Index], MaxDepth>;
}[number];

type Freeze<T> = { __type: T }; // to prevent premature splitting of unions

type IsUnion<T, U = T> = T extends any
  ? [U] extends [T]
    ? false // Not a union, as `U` is not distributed
    : true // It's a union
  : never;

type SpecialBP<O extends TObject, T, Depth extends number> = T extends "Void"
  ? undefined
  : T extends "VerificationKey"
    ? {
        VerificationKey: [string];
      }
    : T extends "Script"
      ? {
          Script: [string];
        }
      : T extends "Inline"
        ? O extends Inline<infer Of>
          ? [FieldBP<Freeze<Of>, Decrement<Depth>>]
          : never
        : never;

type ConstituentBP<O extends TObject, Depth extends number> = O extends {
  typus: infer T;
}
  ? SpecialBP<O, T, Depth> extends never
    ? keyof Clean<O> extends never
      ? Extract<T, string>
      : {
          [K in Extract<T, string>]: CleanTObjectBP<O, Decrement<Depth>>;
        }
    : SpecialBP<O, T, Depth>
  : never;

type TObjectOrSpecialBP<O extends TObject, Depth extends number> = O extends {
  typus: infer T;
}
  ? SpecialBP<O, T, Depth> extends never
    ? keyof Clean<O> extends never
      ? T
      : CleanTObjectBP<O, Decrement<Depth>>
    : SpecialBP<O, T, Depth>
  : never;

export type TObjectBP<
  O extends TObject,
  Depth extends number = MaxDepth,
> = TObjectOrSpecialBP<O, Depth>;

type UnOpaqueString<T> = T extends string & { __opaqueString: infer _ }
  ? string
  : T;

type CleanTObjectBP<O extends TObject, Depth extends number> = Clean<
  UncleanTObjectBP<O, Depth>
>;

type UncleanTObjectBP<
  O extends TObject,
  Depth extends number,
> = Depth extends never
  ? never
  : O extends Wrapper<infer K, infer V>
    ? FieldBP<WrapperBP<O[`__wrapperBrand`], O>, Decrement<Depth>>
    : {
        [K in keyof O]: FieldBP<Freeze<O[K]>, Decrement<Depth>>;
      };

type WrapperBP<K extends string, W extends Wrapper<any, any>> = Freeze<W[K]>;
type FieldBP<
  Frozen extends Freeze<any>,
  Depth extends number,
> = Depth extends never
  ? never
  : Frozen extends Freeze<infer F>
    ? IsUnion<F> extends true
      ? F extends (...args: any[]) => any
        ? never // Filter functions
        : F extends Wrapper<infer K, infer V>
          ? FieldBP<WrapperBP<F[`__wrapperBrand`], F>, Decrement<Depth>>
          : F extends TObject
            ? ConstituentBP<F, Decrement<Depth>>
            : BaseTransform<F, Decrement<Depth>>
      : F extends (...args: any[]) => any
        ? never // Filter functions
        : F extends Wrapper<infer K, infer V>
          ? FieldBP<WrapperBP<F[`__wrapperBrand`], F>, Decrement<Depth>>
          : F extends TObject
            ? TObjectOrSpecialBP<F, Decrement<Depth>>
            : BaseTransform<F, Decrement<Depth>>
    : never;

type BaseTransform<T, Depth extends number> = T extends Uint8Array
  ? string
  : T extends bigint
    ? bigint
    : T extends Array<infer E>
      ? Array<FieldBP<Freeze<E>, Decrement<Depth>>>
      : T extends Map<infer K, infer V>
        ? Map<
            FieldBP<Freeze<K>, Decrement<Depth>>,
            FieldBP<Freeze<V>, Decrement<Depth>>
          >
        : T extends string
          ? UnOpaqueString<T>
          : // : T extends Record<string, infer F>
            //   ? Record<string, PFieldBP<F, Decrement<Depth>>>
            T;

export type Decrement<N extends number> = [
  never, // 0
  0, // 1
  1, // 2
  2, // 3
  3, // 4
  4, // 5
  5, // 6
  6, // 7
  7, // 8
  8, // 9
  9, // 10
  10, // 11
  11, // 12
  12, // 13
  13, // 14
  14, // 15
  15, // 16
  16, // 17
  17, // 18
  18, // 19
  19, // 20
  20, // 21
  21, // 22
  22, // 23
  23, // 24
  24, // 25
  25, // 26
  26, // 27
  27, // 28
  28, // 29
  29, // 30
  30, // 31
  31, // 32
  32, // 33
  33, // 34
  34, // 35
  35, // 36
  36, // 37
  37, // 38
  38, // 39
  39, // 40
  40, // 41
  41, // 42
  42, // 43
  43, // 44
  44, // 45
  45, // 46
  46, // 47
  47, // 48
  48, // 49
  49, // 50
  50, // 51
  51, // 52
  // Add more as needed
][N];
export type MaxDepth = 20;

export const f = "+  ";
export const t = "   ";
export const arr = "  -~> ";
export const rra = " <~-  ";
