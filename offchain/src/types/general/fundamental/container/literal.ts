import assert from "assert";
import { Generators } from "../../../../utils/generators";
import { f, PBlueprint, PConstanted, PData, PLifted, PType, t } from "../type";

export type PMaybeLiteral<T extends PData> = T | PLiteral<T>;

/**
 *
 */
export class PLiteral<PT extends PData>
  implements PType<PConstanted<PT>, PLifted<PT>>
{
  public population = 1n;
  private plutusLiteral: PConstanted<PT>;
  private blueprintLiteral: PBlueprint;
  private str: string;
  /**
   *
   * @param pliteral
   * @param literal
   */
  constructor(
    public pliteral: PT,
    public literal: PLifted<PT>,
  ) {
    this.plutusLiteral = pliteral.pconstant(literal) as PConstanted<PT>;
    this.blueprintLiteral = pliteral.pblueprint(literal);
    this.str = pliteral.showData(literal);
  }

  /**
   *
   * @param l
   */
  public plift = (l: PConstanted<PT>): PLifted<PT> => {
    assert(
      this.pliteral.showData(this.pliteral.plift(l)) === this.str,
      `Literal.plift: Literal does not match, got:\n${this.pliteral.showData(
        this.pliteral.plift(l),
      )},\nexpected:\n${this.str}.`,
    );
    return this.literal;
  };

  /**
   *
   * @param data
   */
  public pconstant = (data: PLifted<PT>): PConstanted<PT> => {
    assert(
      this.pliteral.showData(data) === this.str,
      `Literal.pconstant: Literal does not match, got:\n${this.pliteral.showData(
        data,
      )},\nexpected:\n${this.str}.`,
    );
    return this.plutusLiteral;
  };

  /**
   *
   * @param data
   */
  public pblueprint = (data: PLifted<PT>): PBlueprint => {
    assert(
      this.pliteral.showData(data) === this.str,
      `Literal.pblueprint: Literal does not match, got:\n${this.pliteral.showData(
        data,
      )},\nexpected:\n${this.str}.`,
    );
    return this.blueprintLiteral;
  };

  /**
   *
   */
  public genData = (): PLifted<PT> => {
    return this.literal;
  };

  /**
   *
   * @param data
   * @param tabs
   * @param maxDepth
   */
  public showData = (
    data: PLifted<PT>,
    tabs = "",
    maxDepth?: bigint,
  ): string => {
    if (maxDepth !== undefined && maxDepth <= 0n) return "Literal ( … )";
    assert(
      this.pliteral.showData(data) === this.str,
      `Literal.showData: Literal does not match, got:\n${this.pliteral.showData(
        data,
      )},\nexpected:\n${this.str}.`,
    );
    const tt = tabs + t;
    const ttf = tt + f;

    return `Literal (
${ttf}${this.pliteral.showData(data, ttf, maxDepth ? maxDepth - 1n : maxDepth)}
${tt})`;
  };

  /**
   *
   * @param tabs
   * @param maxDepth
   */
  public showPType = (tabs = "", maxDepth?: bigint): string => {
    if (maxDepth !== undefined && maxDepth <= 0n) return "PLiteral ( … )";
    const tt = tabs + t;
    const ttf = tt + f;

    return `PLiteral (
${ttf}population: ${this.population},
${ttf}pliteral: ${this.pliteral.showPType(
      ttf,
      maxDepth ? maxDepth - 1n : maxDepth,
    )},
${ttf}literal: ${this.pliteral.showData(
      this.literal,
      ttf,
      maxDepth ? maxDepth - 1n : maxDepth,
    )}
${tt})`;
  };

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static genPType(gen: Generators, maxDepth: bigint): PLiteral<PData> {
    const pliteral = gen.generate(maxDepth);
    const literal = pliteral.genData();
    return new PLiteral(pliteral, literal);
  }
}
