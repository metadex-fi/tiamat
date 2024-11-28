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

/**
 *
 */
export class ConstrData<T extends Data> {
  /**
   *
   * @param index
   * @param fields
   */
  constructor(
    public index: bigint,
    public fields: T[],
  ) {}
}

export type Data =
  | Uint8Array
  | bigint
  | Data[]
  | Map<Data, Data>
  | ConstrData<Data>;

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
    const constr = new Core.ConstrPlutusData(data.index, list);
    return Core.PlutusData.newConstrPlutusData(constr);
  } else {
    throw new Error(`asCorePlutusData: unknown data type ${data}`);
  }
}

/**
 *
 * @param constr
 */
export function fromCorePlutusDatum(
  constr: Core.ConstrPlutusData,
): ConstrData<Data> {
  const list: Data[] = [];
  const fields = constr.getData();
  for (let i = 0; i < fields.getLength(); i++) {
    list.push(fromCorePlutusData(fields.get(i)));
  }
  return new ConstrData(constr.getAlternative(), list);
}

/**
 *
 * @param data
 */
export function fromCorePlutusData(data: Core.PlutusData): Data {
  const kind = data.getKind();
  switch (kind) {
    case Core.PlutusDataKind.ConstrPlutusData:
      const constr = data.asConstrPlutusData();
      if (!constr) {
        throw new Error(
          `fromCorePlutusData: expected ConstrPlutusData, got ${data} (${data.toCbor()}`,
        );
      }
      const list: Data[] = [];
      const fields = constr.getData();
      for (let i = 0; i < fields.getLength(); i++) {
        list.push(fromCorePlutusData(fields.get(i)));
      }
      return new ConstrData(constr.getAlternative(), list);

    case Core.PlutusDataKind.Map:
      const map = data.asMap();
      if (!map) {
        throw new Error(
          `fromCorePlutusData: expected Map, got ${data} (${data.toCbor()}`,
        );
      }
      const mapData = new Map();
      const keys = map.getKeys();
      for (let i = 0; i < map.getLength(); i++) {
        const key_ = keys.get(i);
        const key = fromCorePlutusData(key_);
        const value_ = map.get(key_);
        assert(
          value_,
          `fromCorePlutusData: expected value, got ${value_} (${data.toCbor()}`,
        );
        const value = fromCorePlutusData(value_!);
        mapData.set(key, value);
      }
      return mapData;

    case Core.PlutusDataKind.List:
      const list_ = data.asList();
      if (!list_) {
        throw new Error(
          `fromCorePlutusData: expected List, got ${data} (${data.toCbor()}`,
        );
      }
      const listData = [];
      for (let i = 0; i < list_.getLength(); i++) {
        listData.push(fromCorePlutusData(list_.get(i)));
      }
      return listData;

    case Core.PlutusDataKind.Integer:
      const integer = data.asInteger();
      if (integer === undefined) {
        throw new Error(
          `fromCorePlutusData: expected Integer, got ${data} (${data.toCbor()})`,
        );
      }
      return integer;

    case Core.PlutusDataKind.Bytes:
      const bytes = data.asBoundedBytes();
      if (!bytes) {
        throw new Error(
          `fromCorePlutusData: expected Bytes, got ${data} (${data.toCbor()}`,
        );
      }
      return bytes;

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

export type RecordOfMaybe<T> = Record<string, T | undefined>;

export interface TObject {
  typus: string;
}

// we need two types here, because we can both map multiple Data-types onto the same
// Lifted-type, and vice versa; examples (Data -> LIfted):
// 1. Array maps to Array (via PList), Record (via PRecord) and Object (via PObject)
// 2. Array (via PObject) and Constr (via PSum) map to Object
export interface PType<D extends Data, L> {
  readonly population: bigint | undefined; // undefined means infinite TODO better way?
  plift(data: D): L;
  pconstant(data: L): D;
  pblueprint(data: L): PBlueprint;
  genData(): L;
  showData(data: L, tabs?: string, maxDepth?: bigint): string;
  showPType(tabs?: string, maxDepth?: bigint): string;
}

export type PData = PType<Data, unknown>;
export type PLifted<P extends PData> = ReturnType<P["plift"]>;
export type PConstanted<P extends PData> = ReturnType<P["pconstant"]>;
// export type PBlueprinted<P extends PData> = ReturnType<P['pblueprint']>;
export type PBlueprint =
  | Record<string, any>
  | bigint
  | string
  | boolean
  | null
  | undefined;

export const f = "+  ";
export const t = "   ";
export const arr = "  -~> ";
export const rra = " <~-  ";
