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
import { Currency } from "../derived/asset/currency";
import { Asset } from "../derived/asset/asset";

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

// export type DataSum = { [Index in keyof any[]]: Data };
// export type Data = Data_<5>;

// type Data_<Depth extends number> =
//   | Uint8Array
//   | bigint
//   | Array<Data_<Decrement<Depth>>>
//   | Map<Data_<Decrement<Depth>>, Data_<Decrement<Depth>>>
//   | ConstrData<Data_<Decrement<Depth>>[]>;

export type Data =
  | Uint8Array
  | bigint
  | Array<Data>
  | Map<Data, Data>
  | ConstrData<Data[]>;

// export const Data_ = {
//   to: (data: Data): Core.Datum | Core.Redeemer => {
//     return Core.asCorePlutusData(Data.blaze(data));
//   },
//   from: (raw: Core.Datum | Core.Redeemer): Data => {
//     return Data.plutus(Core.fromCorePlutusData(raw));
//   },

//   plutus: (data: Core.Data): Data => {
//     if (typeof data === 'string') {
//       return Core.fromHex(data);
//     } else if (typeof data === 'bigint') {
//       return data;
//     } else if (data instanceof Array) {
//       return data.map(Data.plutus);
//     } else if (data instanceof Map) {
//       return new Map(
//         [...data.entries()].map(([k, v]) => [Data.plutus(k), Data.plutus(v)])
//       );
//     } else if (data instanceof ConstrDataPlutusData) {
//       return new ConstrDataPlutusData(
//         data.getAlternative(),
//         data.getData().map(Data.plutus)
//       );
//     } else {
//       throw new Error(`bytey: unknown data type ${data}`);
//     }
//   },

//   blaze: (data: Data): Core.Data => {
//     if (data instanceof Uint8Array) {
//       return Core.toHex(data);
//     } else if (typeof data === 'bigint') {
//       return data;
//     } else if (data instanceof Array) {
//       return data.map(Data.blaze);
//     } else if (data instanceof Map) {
//       return new Map(
//         [...data.entries()].map(([k, v]) => [Data.blaze(k), Data.blaze(v)])
//       );
//     } else if (data instanceof ConstrData) {
//       return new ConstrData(data.index, data.fields.map(Data.blaze));
//     } else {
//       throw new Error(`stringy: unknown data type ${data}`);
//     }
//   },
// };

// export const Data = {
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

// from: (raw: Core.Datum | Core.Redeemer): Data => {
//   return Data.plutus(Core.fromCorePlutusData(raw));
// },

// plutus: (data: Core.Data): Data => {
//   if (typeof data === 'string') {
//     return Core.fromHex(data);
//   } else if (typeof data === 'bigint') {
//     return data;
//   } else if (data instanceof Array) {
//     return data.map(Data.plutus);
//   } else if (data instanceof Map) {
//     return new Map(
//       [...data.entries()].map(([k, v]) => [Data.plutus(k), Data.plutus(v)])
//     );
//   } else if (data instanceof ConstrDataPlutusData) {
//     return new ConstrDataPlutusData(
//       data.getAlternative(),
//       data.getData().map(Data.plutus)
//     );
//   } else {
//     throw new Error(`bytey: unknown data type ${data}`);
//   }
// },

// blaze: (data: Data): Core.Data => {
//   if (data instanceof Uint8Array) {
//     return Core.toHex(data);
//   } else if (typeof data === 'bigint') {
//     return data;
//   } else if (data instanceof Array) {
//     return data.map(Data.blaze);
//   } else if (data instanceof Map) {
//     return new Map(
//       [...data.entries()].map(([k, v]) => [Data.blaze(k), Data.blaze(v)])
//     );
//   } else if (data instanceof ConstrData) {
//     return new ConstrData(data.index, data.fields.map(Data.blaze));
//   } else {
//     throw new Error(`stringy: unknown data type ${data}`);
//   }
// },
// };

// export function checkBlueprint(target: PBlueprint, actual: PBlueprint): string {
//   if (typeof target === "bigint") {
//     if (target === actual) {
//       return "ok";
//     } else {
//       return `expected ${typeof target}, got ${typeof actual}`;
//     }
//   } else if (typeof target === "string") {
//     if
//   } else if (typeof target === "boolean") {
//     return target === actual;
//   } else if (target === null) {
//     return actual === null;
//   } else if (target === undefined) {
//     return actual === undefined;
//   } else if (target instanceof Array) {
//     if (!(actual instanceof Array)) {
//       return false;
//     }
//     if (target.length !== actual.length) {
//       return false;
//     }
//     for (let i = 0; i < target.length; i++) {
//       if (!checkBlueprint(target[i], actual[i])) {
//         return false;
//       }
//     }
//     return true;
//   } else if (target instanceof Map) {
//     if (!(actual instanceof Map)) {
//       return false;
//     }
//     if (target.size !== actual.size) {
//       return false;
//     }
//     for (const [k, v] of target.entries()) {
//       if (!checkBlueprint(v, actual.get(k))) {
//         return false;
//       }
//     }
//     return true;
//   } else {
//     return false;
//   }

// }

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

export type MaxDepth = 10;
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
type UnOpaqueString<T> = T extends string & { __opaqueString: infer _ }
  ? string
  : T;

export type PObjectBP<O extends TObject> = PObjectBP_<O, MaxDepth>;
type PObjectBP_<O extends TObject, Depth extends number> = Clean<
  PObjectBP__<O, Depth>
>;
type PObjectBP__<O extends TObject, Depth extends number> = Depth extends never
  ? never
  : O extends Wrapper<infer K, infer V>
    ? PFieldBP<PWrapperPB<O[`__wrapperBrand`], O>, Decrement<Depth>>
    : {
        [K in keyof O]: PFieldBP<O[K], Decrement<Depth>>;
      };

type PWrapperPB<K extends string, W extends Wrapper<any, any>> = W[K];
type PFieldBP<T, Depth extends number> = Depth extends never
  ? never
  : T extends (...args: any[]) => any
    ? never // Filter functions
    : T extends TObject
      ? PObjectBP_<T, Decrement<Depth>>
      : BaseTransform<T, Decrement<Depth>>;

type BaseTransform<T, Depth extends number> = T extends Uint8Array
  ? string
  : T extends bigint
    ? bigint
    : T extends Array<infer E>
      ? Array<PFieldBP<E, Decrement<Depth>>>
      : T extends Map<infer K, infer V>
        ? Map<PFieldBP<K, Decrement<Depth>>, PFieldBP<V, Decrement<Depth>>>
        : T extends string
          ? UnOpaqueString<T>
          : // : T extends Record<string, infer F>
            //   ? Record<string, PFieldBP<F, Decrement<Depth>>>
            T;

type AAA = PObjectBP<Currency>;
type BBB = PObjectBP<Asset>;

// export type PTypeBP<P extends PData> = DataBP<PConstanted<P>>;

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
  // Add more as needed
][N];

export const f = "+  ";
export const t = "   ";
export const arr = "  -~> ";
export const rra = " <~-  ";
