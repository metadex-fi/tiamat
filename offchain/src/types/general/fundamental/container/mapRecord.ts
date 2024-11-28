// import assert from 'assert';
// import { Generators, genNonNegative, gMaxLength } from '../../../../mod';
// import { PByteString } from '../mod';
// import { f, PConstanted, PData, PLifted, PType, RecordOf, t } from '../type';

// export class PMapRecord<PFields extends PData>
//   implements
//     PType<Map<string, PConstanted<PFields>>, Map<string, PLifted<PFields>>> {
//   public population: number;

//   constructor(
//     public pfields: RecordOf<PFields>,
//   ) {
//     for (const key in pfields) {
//       try {
//         toHex(fromHex(key));
//       } catch (_e) {
//         throw new Error(`PMapRecord: key is not a valid hex string: ${key}`);
//       }
//     }
//     let population = 1;
//     Object.values(pfields).forEach((pfield) => {
//       population *= pfield.population;
//     });
//     this.population = population;
//     assert(
//       this.population > 0,
//       `Population not positive in ${this.showPType()}`,
//     );
//   }

//   public plift = (
//     m: Map<string, PConstanted<PFields>>,
//   ): Map<string, PLifted<PFields>> => {
//     assert(
//       m instanceof Map,
//       `MapRecord.plift: expected Map: ${m}`,
//     );
//     const data = new Map<string, PLifted<PFields>>();

//     m.forEach((value, key) => {
//       const pvalue = this.pfields[key];
//       data.set(key, pvalue.plift(value) as PLifted<PFields>);
//     });
//     return data;
//   };

//   public pconstant = (
//     data: Map<string, PLifted<PFields>>,
//   ): Map<string, PConstanted<PFields>> => {
//     assert(data instanceof Map, `PMapRecord.pconstant: expected Map`);

//     // const pfieldsNames = Object.getOwnPropertyNames(this.pfields);
//     // const dataFieldsNames = [...data.keys()].toString();
//     // assert(
//     //   pfieldsNames.toString() === dataFieldsNames.toString(),
//     //   "PMapRecord.pconstant: fields mismatch",
//     // );

//     const m = new Map<string, PConstanted<PFields>>();
//     data.forEach((value, key) => {
//       const pfield = this.pfields[key];
//       assert(pfield, `field not found: ${key}`);
//       m.set(key, pfield.pconstant(value) as PConstanted<PFields>);
//     });
//     return m;
//   };

//   public genData = (): Map<string, PLifted<PFields>> => {
//     const m = new Map<string, PLifted<PFields>>();
//     Object.entries(this.pfields).forEach(([key, pfield]) => {
//       m.set(key, pfield.genData() as PLifted<PFields>);
//     });
//     return m;
//   };

//   public showData = (
//     data: Map<string, PLifted<PFields>>,
//     tabs = "",
//   ): string => {
//     assert(
//       data instanceof Map,
//       `PMapRecord.showData: expected Map, got ${JSON.stringify(data)}`,
//     );

//     if (data.size === 0) return "MapRecord {}";
//     const tt = tabs + t;
//     const ttf = tt + f;
//     const ttft = ttf + t;

//     const fields = [...data.entries()].map(([key, value]) => {
//       return `${ttf}${key.length === 0 ? "_" : key} => ${
//         this.pfields[key].showData(value, ttft)
//       }`;
//     }).join(",\n");
//     return `MapRecord {
// ${fields}
// ${tt}}`;
//   };

//   public showPType = (tabs = ""): string => {
//     const tt = tabs + t;
//     const ttf = tt + f;
//     const ttff = ttf + f;

//     const fields = Object.entries(this.pfields).map(([key, pfield]) => {
//       return `\n${ttff}${key.length === 0 ? "_" : key} => ${
//         pfield.showPType(ttff)
//       }`;
//     });
//     return `PMapRecord (
// ${ttf}population: ${this.population},
// ${ttf}pfields: {${fields.length > 0 ? `${fields.join(`,`)}\n${ttf}` : ""}}
// ${tt})`;
//   };

//   static override genPType(
//     gen: Generators,
//     maxDepth: bigint,
//   ): PMapRecord<PData> {
//     const pfields: RecordOf<PData> = {};
//     const maxi = genNonNegative(gMaxLength);
//     const pbytes = new PByteString();
//     for (let i = 0; i < maxi; i++) {
//       const key = pbytes.genData();
//       const pvalue = gen.generate(maxDepth);
//       pfields[key] = pvalue;
//     }
//     return new PMapRecord(pfields);
//   }
// }
