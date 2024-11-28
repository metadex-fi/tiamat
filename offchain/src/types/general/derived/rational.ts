import assert from "assert";
import {
  ceilDiv,
  genNonNegative,
  genNumber,
  genPositive,
  randomChoice,
} from "../../../utils/generators";
import { PObject } from "../fundamental/container/object";
import { PRecord } from "../fundamental/container/record";
import { PInteger } from "../fundamental/primitive/integer";

/**
 *
 */
export class Rational {
  public readonly typus = "Rational";
  /**
   *
   * @param numerator
   * @param denominator
   */
  constructor(
    public numerator: bigint, // TODO make private again
    public denominator: bigint, // to register a vector
  ) {
    Rational.assert(this);
  }

  /**
   *
   */
  public get isZero(): boolean {
    return this.numerator === 0n;
  }

  /**
   *
   * @param other
   */
  public equals = (other: Rational): boolean => {
    return (
      this.numerator === other.numerator &&
      this.denominator === other.denominator
    );
  };

  /**
   *
   */
  public concise = (): string => {
    return `${this.numerator}/${this.denominator}`;
    // const whole = this.numerator / this.denominator;
    // const remainder = this.numerator % this.denominator;
    // return `${whole} ${remainder}/${this.denominator}`;
  };

  /**
   *
   */
  public decimal = (): string => {
    return `${Number(this.numerator) / Number(this.denominator)}`;
  };

  /**
   *
   * @param factor
   */
  public scaledWith = (factor: bigint): Rational => {
    return new Rational(this.numerator * factor, this.denominator);
  };

  /**
   *
   * @param i
   */
  public plusInt = (i: bigint): Rational => {
    return new Rational(
      this.numerator + i * this.denominator,
      this.denominator,
    );
  };

  /**
   *
   * @param i
   */
  public intMinus = (i: bigint): Rational => {
    return new Rational(
      i * this.denominator - this.numerator,
      this.denominator,
    );
  };

  /**
   *
   * @param other
   */
  public minus = (other: Rational): Rational => {
    return new Rational(
      this.numerator * other.denominator - other.numerator * this.denominator,
      this.denominator * other.denominator,
    );
  };

  /**
   *
   * @param other
   */
  public add = (other: Rational): void => {
    this.numerator =
      this.numerator * other.denominator + other.numerator * this.denominator;
    this.denominator *= other.denominator;
  };

  /**
   *
   * @param other
   */
  public times = (other: Rational): Rational => {
    return new Rational(
      this.numerator * other.numerator,
      this.denominator * other.denominator,
    );
  };

  /**
   *
   * @param other
   */
  public by = (other: Rational): Rational => {
    return new Rational(
      this.numerator * other.denominator,
      this.denominator * other.numerator,
    );
  };

  /**
   *
   * @param other
   */
  public multiplyWith = (other: Rational): void => {
    this.numerator *= other.numerator;
    this.denominator *= other.denominator;
  };

  /**
   *
   * @param scalar
   */
  public timesIntFloor = (scalar: bigint): bigint => {
    return (this.numerator * scalar) / this.denominator;
  };

  /**
   *
   * @param scalar
   */
  public timesIntCeil = (scalar: bigint): bigint => {
    return ceilDiv(this.numerator * scalar, this.denominator);
  };

  /**
   *
   */
  public get floor(): bigint {
    return this.numerator / this.denominator;
  }

  /**
   *
   */
  public get ceil(): bigint {
    return ceilDiv(this.numerator, this.denominator);
  }

  /**
   *
   */
  public get round(): bigint {
    const floor = this.floor;
    const remainder = this.numerator % this.denominator;
    if (remainder * 2n >= this.denominator) {
      return floor + 1n;
    } else {
      return floor;
    }
  }

  /**
   *
   */
  public get recip(): Rational {
    return new Rational(this.denominator, this.numerator);
  }

  /**
   *
   * @param other
   */
  public divideBy = (other: Rational): Rational => {
    return new Rational(
      this.numerator * other.denominator,
      this.denominator * other.numerator,
    );
  };

  /**
   *
   * @param other
   */
  public compareTo = (other: Rational): number => {
    const delta =
      this.numerator * other.denominator - other.numerator * this.denominator;
    if (delta === 0n) return 0;
    return delta > 0n ? 1 : -1; // to avoid potential conversion issues
  };

  /**
   *
   * @param rational
   */
  static assert = (rational: Rational): void => {
    assert(rational.denominator !== 0n, "denominator cannot be 0");
  };

  /**
   *
   */
  static generate = (): Rational => {
    const numerator = genNumber();
    let denominator = genPositive();
    denominator = randomChoice([denominator, -denominator]);
    return new Rational(numerator, denominator);
  };

  /**
   *
   */
  static zero = (): Rational => {
    return new Rational(0n, 1n);
  };

  /**
   *
   * @param numerator
   */
  static fromInt = (numerator: bigint): Rational => {
    return new Rational(numerator, 1n);
  };

  // Function to compute the square root of a bigint using the Babylonian method
  /**
   *
   * @param value
   */
  private static sqrtBigint(value: bigint): bigint {
    if (value < 0n) {
      throw new Error("Cannot compute the square root of a negative number");
    }
    if (value < 2n) {
      return value;
    }

    let x0 = value / 2n;
    let x1 = (x0 + value / x0) / 2n;

    while (x1 < x0) {
      x0 = x1;
      x1 = (x0 + value / x0) / 2n;
    }

    return x0;
  }

  /**
   *
   */
  public get sqrt(): Rational {
    const sqrtNumerator = Rational.sqrtBigint(this.numerator);
    const sqrtDenominator = Rational.sqrtBigint(this.denominator);
    return new Rational(sqrtNumerator, sqrtDenominator);
  }

  /**
   *
   * @param a
   * @param b
   */
  static gcd = (a: bigint, b: bigint): bigint => {
    if (b === 0n) return a;
    return Rational.gcd(b, a % b);
  };

  /**
   *
   */
  public get reduced(): Rational {
    const gcd =
      this.numerator === 0n
        ? this.denominator
        : this.numerator < 0n
          ? -Rational.gcd(-this.numerator, this.denominator)
          : Rational.gcd(this.numerator, this.denominator);
    return new Rational(this.numerator / gcd, this.denominator / gcd);
  }

  /**
   *
   */
  public static genNonNegative(): Rational {
    const numerator = genNonNegative();
    const denominator = genPositive();
    return new Rational(numerator, denominator).reduced;
  }

  /**
   *
   */
  public static genPositive(): Rational {
    const numerator = genPositive();
    const denominator = genPositive();
    return new Rational(numerator, denominator).reduced;
  }
}

/**
 *
 */
export class PRational extends PObject<Rational> {
  /**
   *
   */
  constructor() {
    super(
      new PRecord({
        numerator: PInteger.ptype,
        denominator: PInteger.ptype,
      }),
      Rational,
      `Rational`,
    );
  }

  /**
   *
   */
  public override genData = (): Rational => {
    return Rational.generate();
  };

  static ptype = new PRational();
  /**
   *
   */
  static override genPType(): PRational {
    return PRational.ptype;
  }
}
