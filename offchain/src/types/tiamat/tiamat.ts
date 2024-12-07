import { txFees } from "../../utils/constants";
import { Currency, PCurrency } from "../general/derived/asset/currency";
import { KeyHash, PKeyHash } from "../general/derived/hash/keyHash";
import { Rational, PRational } from "../general/derived/rational";
import { PObject } from "../general/fundamental/container/object";
import { PRecord } from "../general/fundamental/container/record";
import { PInteger } from "../general/fundamental/primitive/integer";
import { PString } from "../general/fundamental/primitive/string";
import { f, PData } from "../general/fundamental/type";
import assert from "assert";

export type PDappConfigT = PData & { __brand: "PDappConfigT" };
export type PDappParamsT = PData & { __brand: "PDappParamsT" };

/**
 *
 */
export class EigenValue {
  typus = "EigenValue";
  /**
   *
   * @param start
   * @param end
   * @param vector
   * @param ip
   * @param port
   */
  constructor(
    public readonly start: bigint,
    public readonly end: bigint,
    public readonly vector: KeyHash,
    public readonly ip: string,
    public readonly port: bigint,
  ) {}

  /**
   *
   */
  public show = (): string => {
    return `
${f}start: ${this.start}
${f}end: ${this.end}
${f}vector: ${this.vector.concise()}
${f}ip: ${this.ip}
${f}port: ${this.port}
    `;
  };

  /**
   *
   * @param other
   */
  public equals = (other: EigenValue): boolean => {
    return (
      this.start === other.start &&
      this.end === other.end &&
      this.vector.equals(other.vector) &&
      this.ip === other.ip &&
      this.port === other.port
    );
  };

  public clone = (): EigenValue => {
    return new EigenValue(
      this.start,
      this.end,
      this.vector.clone(),
      this.ip,
      this.port,
    );
  };
}

/**
 *
 */
export class PEigenValue extends PObject<EigenValue> {
  /**
   *
   */
  constructor() {
    super(
      new PRecord({
        start: PInteger.ptype,
        end: PInteger.ptype,
        vector: PKeyHash.ptype,
        ip: PString.ptype,
        port: PInteger.ptype,
      }),
      EigenValue,
      `EigenValue`,
    );
  }

  static ptype = new PEigenValue();
  /**
   *
   */
  static override genPType(): PEigenValue {
    return PEigenValue.ptype;
  }
}

/**
 *
 */
export class TiamatParams {
  typus = "TiamatParams";
  /**
   *
   * @param minStake
   * @param cycleDuration
   * @param marginDuration
   * @param hingeLock
   * @param numEigenvectors
   * @param numSupportVectors
   * @param suggestedTip
   * @param vestingPolicy
   * @param vestingRate
   */
  constructor(
    public readonly minStake: bigint, // to register a vector
    public readonly cycleDuration: bigint,
    public readonly marginDuration: bigint, // safety margin before end of cycle
    public readonly hingeLock: bigint, // if vectors get lazy, anyone can revolve
    public readonly numEigenvectors: bigint,
    public readonly numSupportVectors: bigint, // minimum required to pass
    public readonly suggestedTip: bigint, // Shelling point for minimum vector tips
    public readonly vestingPolicy: Currency,
    public readonly vestingRate: Rational, // tokens released per second
    // ~ add your own here ~
  ) {}

  /**
   *
   */
  public get fixedFees(): bigint {
    return this.suggestedTip * this.numSupportVectors + txFees;
  }

  /**
   *
   * @param other
   */
  public equals = (other: TiamatParams) => {
    return (
      this.minStake === other.minStake &&
      this.cycleDuration === other.cycleDuration &&
      this.marginDuration === other.marginDuration &&
      this.hingeLock === other.hingeLock &&
      this.numEigenvectors === other.numEigenvectors &&
      this.numSupportVectors === other.numSupportVectors &&
      this.suggestedTip === other.suggestedTip &&
      this.vestingPolicy.equals(other.vestingPolicy) &&
      this.vestingRate.equals(other.vestingRate)
      // ~ add your own here ~
    );
  };

  /**
   *
   * @param vesting_policy
   */
  public withVestingPolicy = (vesting_policy: Currency): TiamatParams => {
    assert(this.vestingPolicy === Currency.dummy, `Vesting policy already set`);
    return new TiamatParams(
      this.minStake,
      this.cycleDuration,
      this.marginDuration,
      this.hingeLock,
      this.numEigenvectors,
      this.numSupportVectors,
      this.suggestedTip,
      vesting_policy,
      this.vestingRate,
      // ~ add your own here ~
    );
  };
}

/**
 *
 */
export class PTiamatParams extends PObject<TiamatParams> {
  /**
   *
   */
  constructor() {
    super(
      new PRecord({
        min_stake: PInteger.ptype, // to register a vector
        cycle_duration: PInteger.ptype,
        margin_duration: PInteger.ptype, // safety margin before end of cycle
        hinge_lock: PInteger.ptype, // if vectors get lazy, anyone can revolve
        num_eigenvectors: PInteger.ptype,
        num_support_vectors: PInteger.ptype, // minimum required to pass
        suggested_tip: PInteger.ptype, // Shelling point for minimum vector tips
        vesting_policy: PCurrency.ptype,
        vesting_rate: PRational.ptype, // tokens released per second
        // ~ add your own here ~
      }),
      TiamatParams,
      `TiamatParams`,
    );
  }

  static ptype = new PTiamatParams();
  /**
   *
   */
  static override genPType(): PTiamatParams {
    return PTiamatParams.ptype;
  }
}
