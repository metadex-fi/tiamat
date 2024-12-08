import assert from "assert";
import {
  Generators,
  genName,
  genNonNegative,
  maybeNdef,
} from "../../../../utils/generators";
import {
  ConstrData,
  f,
  PConstanted,
  PData,
  PLifted,
  PType,
  PBlueprinted,
  RecordOfMaybe,
  t,
} from "../type";
import { gMaxLength } from "../../../../utils/constants";

/**
 *
 */
export class PRecord<PFields extends PData>
  implements
    PType<
      ConstrData<PConstanted<PFields>[]>,
      RecordOfMaybe<PLifted<PFields>>,
      RecordOfMaybe<PBlueprinted<PFields>>
    >
{
  public readonly population: bigint | undefined;
  private index = 0; // for sum types

  /**
   *
   * @param pfields
   */
  constructor(public readonly pfields: RecordOfMaybe<PFields>) {
    let population: bigint | undefined = 1n;
    Object.values(pfields).forEach((pfield) => {
      if (pfield) {
        population =
          pfield.population && population
            ? population * pfield.population
            : undefined;
      }
    });
    this.population = population;
    assert(
      !this.population || this.population > 0,
      `Population not positive in ${this.showPType()}`,
    );
  }

  /**
   *
   * @param index
   */
  public setIndex = (index: number) => {
    this.index = index;
  };

  /**
   *
   * @param c
   */
  public plift = (
    c: ConstrData<PConstanted<PFields>[]>,
  ): RecordOfMaybe<PLifted<PFields>> => {
    assert(
      c instanceof ConstrData,
      `Record.plift: expected Constr, got ${c} (${typeof c})\nfor ${this.showPType()})`,
    );
    assert(
      c.index === this.index,
      `Record.plift: wrong index ${c.index.toString()} for ${this.showPType()}`,
    );
    const r: RecordOfMaybe<PLifted<PFields>> = {};
    let i = 0;
    Object.entries(this.pfields).forEach(([key, pfield]) => {
      if (pfield !== undefined) {
        assert(
          i < c.fields.length,
          `Record.plift: too few elements at
key = ${key}
i = ${i}
pfield = ${pfield.showPType()}
in [${c}] of length ${c.fields.length}
for ${this.showPType()};
status: ${Object.keys(r).join(`,\n${f}`)}`,
        );
        const value = c.fields[i++];
        assert(
          value !== undefined,
          `Record.plift: undefined value <${value}> at
key = ${key}
i = ${i}
pfield = ${pfield.showPType()}
in [${c}] of length ${c.fields.length}
for ${this.showPType()};
status: ${Object.keys(r).join(`,\n${f}`)}`,
        );
        r[key] = pfield.plift(value) as PLifted<PFields>;
      } else {
        r[key] = undefined;
      }
    });
    assert(
      i === c.fields.length,
      `Record.plift: too many elements (${c.fields.length}) for ${this.showPType()}`,
    );
    return r;
  };

  /**
   *
   * @param data
   */
  private checkFields = (data: RecordOfMaybe<PLifted<PFields>>) => {
    assert(
      data instanceof Object,
      `PRecord.checkFields: expected Object, got ${data}\nfor ${this.showPType()}`,
    );
    const pfieldsNames = Object.keys(this.pfields).join(`,\n${f}`);
    const dataFieldsNames = Object.keys(data).join(`,\n${f}`);
    assert(
      pfieldsNames === dataFieldsNames,
      `PRecord.checkFields: expected fields:\n${f}${pfieldsNames},\ngot:\n${f}${dataFieldsNames}\nfor ${this.showPType()}\n`,
    );
  };

  /**
   *
   * @param data
   */
  public pconstant = (
    data: RecordOfMaybe<PLifted<PFields>>,
  ): ConstrData<PConstanted<PFields>[]> => {
    this.checkFields(data);

    const l = new Array<PConstanted<PFields>>();
    Object.entries(this.pfields).forEach(([key, pfield]) => {
      const value = data[key];
      if (pfield) {
        assert(
          value !== undefined,
          `cannot constant ${value} with pfield: ${pfield.showPType()}`,
        );
        l.push(pfield.pconstant(value) as PConstanted<PFields>);
      } else {
        assert(
          value === undefined,
          `cannot constant ${value} with undefined pfield`,
        );
      }
    });
    return new ConstrData(this.index, l);
  };

  /**
   *
   * @param data
   */
  public pblueprint = (
    data: RecordOfMaybe<PLifted<PFields>>,
  ): Record<string, PBlueprinted<PFields>> => {
    this.checkFields(data);

    const bp = {} as {
      [key: string]: any;
    };
    Object.entries(this.pfields).forEach(([key, pfield]) => {
      const value = data[key];
      if (pfield) {
        assert(
          value !== undefined,
          `cannot blueprint ${value} with pfield: ${pfield.showPType()}`,
        );
        // Object.assign(bp, {
        //   [key]: pfield.pblueprint(value),
        // });
        bp[key] = pfield.pblueprint(value);
      } else {
        assert(
          value === undefined,
          `cannot blueprint ${value} with undefined pfield`,
        );
      }
    });
    return bp;
  };

  /**
   *
   */
  public genData = (): RecordOfMaybe<PLifted<PFields>> => {
    const r: RecordOfMaybe<PLifted<PFields>> = {};
    Object.entries(this.pfields).forEach(([key, pfield]) => {
      r[key] = pfield?.genData() as PLifted<PFields>;
    });
    return r;
  };

  /**
   *
   * @param data
   * @param tabs
   * @param maxDepth
   */
  public showData = (
    data: RecordOfMaybe<PLifted<PFields>>,
    tabs = "",
    maxDepth?: bigint,
  ): string => {
    if (maxDepth !== undefined && maxDepth <= 0n) return "Record { … }";
    this.checkFields(data);
    if (data["size"] === 0) return "Record {}";
    const tt = tabs + t;
    const ttf = tt + f;
    const ttft = ttf + t;

    const fields = Object.entries(data)
      .map(([key, value]) => {
        const pfield = this.pfields[key];
        if (pfield === undefined) {
          assert(
            value === undefined,
            `PRecord.showData: value ${value} for undefined pfield at key ${key}`,
          );
          return `${key.length === 0 ? "_" : key}: undefined`;
        } else {
          assert(
            value !== undefined,
            `PRecord.showData: value undefined for pfield ${pfield.showPType()} at key ${key}`,
          );
          return `${key.length === 0 ? "_" : key}: ${pfield.showData(
            value,
            ttft,
            maxDepth ? maxDepth - 1n : maxDepth,
          )}`;
        }
      })
      .join(`,\n${ttf}`);
    return `Record {
${ttf}index: ${this.index},
${ttf}fields: ${fields}
${tt}}`;
  };

  /**
   *
   * @param tabs
   * @param maxDepth
   */
  public showPType = (tabs = "", maxDepth?: bigint): string => {
    if (maxDepth !== undefined && maxDepth <= 0n) return "PRecord ( … )";
    const tt = tabs + t;
    const ttf = tt + f;
    const ttff = ttf + f;

    const fields = Object.entries(this.pfields).map(([key, pfield]) => {
      return `\n${ttff}${key.length === 0 ? "_" : key}: ${
        pfield?.showPType(ttff, maxDepth ? maxDepth - 1n : maxDepth) ??
        "undefined"
      }`;
    });
    return `PRecord (
${ttf}population: ${this.population},
${ttf}pfields: {${fields.length > 0 ? `${fields.join(`,`)}\n${ttf}` : ""}}
${ttf}index: ${this.index},
${tt})`;
  };

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static genPType<PFields extends PData>(
    gen: Generators,
    maxDepth: bigint,
  ): PRecord<PFields> {
    const pfields: RecordOfMaybe<PFields> = {};
    const maxi = genNonNegative(gMaxLength);
    for (let i = 0; i < maxi; i++) {
      const key = genName();
      const pvalue = maybeNdef(() => gen.generate(maxDepth))?.();
      pfields[key] = pvalue as PFields;
    }
    return new PRecord(pfields) as PRecord<PFields>;
  }
}
