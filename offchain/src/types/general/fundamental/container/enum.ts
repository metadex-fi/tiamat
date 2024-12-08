// import assert from "assert";
// import {
//   Generators,
//   genPositive,
//   randomChoice,
// } from "../../../../utils/generators";
// import { f, PBlueprinted, PConstanted, PData, PLifted, PType, t } from "../type";
// import { gMaxLength } from "../../../../utils/constants";

// /**
//  *
//  */
// export class PEnum<PT extends PData>
//   implements PType<PConstanted<PT>, PLifted<PT>, PBlueprinted<PT>>
// {
//   public population: bigint | undefined;
//   private plutusLiterals: {
//     constant: PConstanted<PT>;
//     blueprint: PBlueprinted<PT>;
//   }[];
//   private strs: string[];
//   /**
//    *
//    * @param pliteral
//    * @param literals
//    */
//   constructor(
//     public pliteral: PT,
//     public literals: PLifted<PT>[],
//   ) {
//     assert(literals.length > 0, "PEnum: literals of enum must be non-empty");
//     this.plutusLiterals = literals.map((l) => {
//       return {
//         constant: pliteral.pconstant(l) as PConstanted<PT>,
//         blueprint: pliteral.pblueprint(l),
//       };
//     });
//     this.strs = [];
//     literals.forEach((l) => {
//       const str = pliteral.showData(l);
//       assert(!this.strs.includes(str), `PEnum: Duplicate literal: ${str}`);
//       this.strs.push(str);
//     });
//     this.population = BigInt(literals.length);
//   }

//   /**
//    *
//    * @param l
//    */
//   public plift = (l: PConstanted<PT>): PLifted<PT> => {
//     const str = this.pliteral.showData(this.pliteral.plift(l));
//     const index = this.strs.indexOf(str);
//     assert(index !== -1, "PEnum.plift: Literal does not match");
//     return this.literals[index]!;
//   };

//   /**
//    *
//    * @param data
//    */
//   public pconstant = (data: PLifted<PT>): PConstanted<PT> => {
//     const str = this.pliteral.showData(data);
//     const index = this.strs.indexOf(str);
//     assert(index !== -1, "PEnum.pconstant: Literal does not match");
//     return this.plutusLiterals[index]!.constant;
//   };

//   /**
//    *
//    * @param data
//    */
//   public pblueprint = (data: PLifted<PT>): PBlueprinted<PT> => {
//     const str = this.pliteral.showData(data);
//     const index = this.strs.indexOf(str);
//     assert(index !== -1, "PEnum.pblueprint: Literal does not match");
//     return this.plutusLiterals[index]!.blueprint;
//   };

//   /**
//    *
//    */
//   public genData = (): PLifted<PT> => {
//     return randomChoice(this.literals);
//   };

//   /**
//    *
//    * @param data
//    * @param tabs
//    * @param maxDepth
//    */
//   public showData = (
//     data: PLifted<PT>,
//     tabs = "",
//     maxDepth?: bigint,
//   ): string => {
//     if (maxDepth !== undefined && maxDepth <= 0n) return "Enum ( … )";
//     const str = this.pliteral.showData(data);
//     const index = this.strs.indexOf(str);
//     assert(
//       index !== -1,
//       `PEnum.showData: Literal does not match, got:\n${str},\nexpected one of:\n${this.strs.join(
//         ", ",
//       )}.`,
//     );

//     const tt = tabs + t;
//     const ttf = tt + f;

//     return `Enum (
// ${ttf}${this.pliteral.showData(data, ttf, maxDepth ? maxDepth - 1n : maxDepth)}
// ${tt})`;
//   };

//   /**
//    *
//    * @param tabs
//    * @param maxDepth
//    */
//   public showPType = (tabs = "", maxDepth?: bigint): string => {
//     if (maxDepth !== undefined && maxDepth <= 0n) return "PEnum ( … )";
//     const tt = tabs + t;
//     const ttf = tt + f;
//     const ttft = ttf + t;
//     const ttftf = ttft + f;

//     return `PEnum (
// ${ttf}population: ${this.population},
// ${ttf}pliteral: ${this.pliteral.showPType(
//       ttf,
//       maxDepth ? maxDepth - 1n : maxDepth,
//     )},
// ${ttf}literals: [
// ${ttftf}${this.literals
//       .map((l) =>
//         this.pliteral.showData(l, ttftf, maxDepth ? maxDepth - 1n : maxDepth),
//       )
//       .join(`,\n${ttftf}`)}
// ${ttft}]
// ${tt})`;
//   };

//   /**
//    *
//    * @param gen
//    * @param maxDepth
//    */
//   static genPType(gen: Generators, maxDepth: bigint): PEnum<PData> {
//     const pliteral = gen.generate(maxDepth);
//     const length = genPositive(gMaxLength);
//     const literals: PLifted<PData>[] = [];
//     const strs: string[] = [];
//     for (let i = 0; i < length; i++) {
//       const literal = pliteral.genData();
//       const str = pliteral.showData(literal);
//       if (!strs.includes(str)) {
//         strs.push(str);
//         literals.push(literal);
//       }
//     }
//     return new PEnum(pliteral, literals);
//   }
// }
