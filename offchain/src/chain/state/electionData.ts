import assert from "assert";
import { AssocMap } from "../../types/general/fundamental/container/map";
import { KeyHash } from "../../types/general/derived/hash/keyHash";
import {
  EigenValue,
  PDappConfigT,
  PDappParamsT,
  TiamatParams,
} from "../../types/tiamat/tiamat";
import {
  slotDurationMs,
  assertWithinMargin,
  logElection,
  logRegistered,
} from "../../utils/constants";
import { PLifted } from "../../types/general/fundamental/type";
import { Core } from "@blaze-cardano/sdk";
import { MatrixUtxo, NexusUtxo } from "./tiamatSvmUtxo";
import blake from "blakejs";
import { Zygote } from "../data/zygote";

export interface EigenvectorData {
  valency: number;
  keyHash: KeyHash;
}

export interface IpPort {
  ip: string;
  port: number;
}

/**
 *
 * @param eigenvectors
 */
export function getEigenvectorValencies(
  eigenvectors: EigenValue[],
): Map<string, EigenvectorData> {
  const ipData = new Map<string, EigenvectorData>();
  eigenvectors.forEach((vector) => {
    const ip = vector.ip;
    let data = ipData.get(ip);
    if (data) {
      data.valency += 1;
    } else {
      data = {
        valency: 1,
        keyHash: vector.vector,
      };
    }

    ipData.set(ip, data);
  });
  return ipData;
}

/**
 *
 */
export class ElectionData<DC extends PDappConfigT, DP extends PDappParamsT>
  implements Zygote
{
  private eligibleEVsValenciesCache?: AssocMap<IpPort, EigenvectorData>;
  private eligibleEVsElectedCache?: boolean;

  public static compute<DC extends PDappConfigT, DP extends PDappParamsT>(
    name: string,
    matrixUtxo: MatrixUtxo,
    nexusUtxo: NexusUtxo<DC, DP>,
    forCycle: "current" | "next",
  ) {
    assert(nexusUtxo.svmDatum, `Elect: no svmDatum in nexusUtxo`);
    const oldState = nexusUtxo.svmDatum.state;
    const dappParams = oldState.dapp_params;
    const onChainEVs = oldState.eigenvectors;

    assert(matrixUtxo.svmDatum, `Elect: no svmDatum in matrixUtxo`);
    const matrixUtxoString = `${matrixUtxo.utxo.core.input().index()}:${matrixUtxo.utxo.core.input().transactionId()}`;

    const matrixState = matrixUtxo.svmDatum.state;
    const tiamatParams = matrixState.params;
    const eigenValues = matrixState.eigen_values;
    if (logRegistered) {
      console.log(
        `[${name}]`,
        "registered eigenvalues:",
        eigenValues.map((ev) => ev.show()).join(`\n`),
      );
    }
    // assert(eigenValues.length, `Elect: no eigenvalues`);

    // TODO are we at seconds or milliseconds onchain now?
    // TODO and what about that nonsense that Blaze does to validity intervals?
    const cycleDurationMs = tiamatParams.cycle_duration; // milliseconds
    const oldFromMs = oldState.current_cycle.from; // milliseconds
    const oldToMs = oldState.current_cycle.to; // milliseconds

    let fromMs = forCycle === "current" ? oldFromMs : oldToMs; // milliseconds

    const lateByMs = BigInt(Date.now()) - oldFromMs;
    if (lateByMs > 0n) {
      const extraCycles = lateByMs / cycleDurationMs;
      fromMs += extraCycles * cycleDurationMs;
    }
    const suitableForElection = fromMs >= oldToMs;
    const toMs = fromMs + cycleDurationMs;

    assert(nexusUtxo.utxo, `Elect: no nexusUtxo.utxo`);
    const nexusUtxoTxId = Core.fromHex(
      nexusUtxo.utxo.core.input().transactionId(),
    );
    let hash = new Uint8Array(nexusUtxoTxId.length + 2);
    hash[1] = Number(nexusUtxo.utxo.core.input().index()); // NOTE wraps around
    hash.set(nexusUtxoTxId, 2);
    const seed = Core.toHex(hash);
    hash[0] = Number(fromMs); // NOTE wraps around

    const eligibleEVs: EigenValue[] = [];
    if (eigenValues.length) {
      const loop = eigenValues[0]!.end + 1n;
      for (let n = 0; n < tiamatParams.num_eigenvectors; n++) {
        hash = blake.blake2b(hash); // NOTE using blake directly here instead of Blaze
        const roll =
          hash.reduce((acc, val) => (acc << 8n) | BigInt(val), 0n) % loop;
        const eigenValue = eigenValues.find(
          (ev) => ev.start <= roll && roll <= ev.end,
        );
        assert(eigenValue, `Elect: no eigenvalue for ${roll}`);
        eligibleEVs.push(eigenValue);
      }
    }
    if (logElection) {
      console.log(
        `[${name}]`,
        "onChainEVs:",
        oldState.eigenvectors.map((ev) => ev.concise()).join(`\n`),
      );
      console.log(
        `[${name}]`,
        "eligibleEVs:",
        eligibleEVs.map((ev) => ev.show()).join(`\n`),
      );
    }

    assert(
      fromMs + tiamatParams.cycle_duration === toMs,
      `ElectionData: fromMs + params.cycle_duration !== toMs: ${fromMs} + ${tiamatParams.cycle_duration} !== ${toMs}`,
    );
    // console.log( // TODO FIXME
    //   `${forCycle} ElectionData: withinMargin? ${withinMargin}` // NOTE this is mostly for the asserts below
    // );

    return new ElectionData(
      name,
      matrixUtxo,
      nexusUtxo,
      forCycle,
      tiamatParams,
      dappParams,
      fromMs,
      toMs,
      onChainEVs,
      eligibleEVs,
      seed,
      matrixUtxoString,
      suitableForElection,
    );
  }

  private constructor(
    public readonly name: string,
    public readonly matrixUtxo: MatrixUtxo,
    public readonly nexusUtxo: NexusUtxo<DC, DP>,
    public readonly forCycle: "current" | "next",
    public readonly tiamatParams: TiamatParams,
    public readonly dappParams: PLifted<DP>,
    public readonly fromMs: bigint,
    public readonly toMs: bigint,
    public readonly onChainEVs: KeyHash[],
    public readonly eligibleEVs: EigenValue[],
    public readonly seed: string,
    public readonly matrixUtxoString: string,
    public readonly suitableForElection: boolean,
  ) {}

  public equals = (other: ElectionData<DC, DP>): boolean => {
    if (this === other) {
      return true;
    } else if (
      this.seed === other.seed &&
      this.matrixUtxoString === other.matrixUtxoString &&
      this.fromMs === other.fromMs
    ) {
      assert(
        this.toMs === other.toMs,
        `${this.name}.equals: this.toMs !== other.toMs: ${this.toMs} !== ${other.toMs}`,
      );
      return true;
    } else {
      return false;
    }
  };

  /**
   *
   */
  public get eligibleEVsElected(): boolean {
    if (this.eligibleEVsElectedCache === undefined) {
      this.eligibleEVsElectedCache = this.checkEligibleEVsElected();
    }
    return this.eligibleEVsElectedCache;
  }

  /**
   *
   */
  public get eligibleEVsValencies(): AssocMap<IpPort, EigenvectorData> {
    if (!this.eligibleEVsValenciesCache) {
      this.eligibleEVsValenciesCache = this.countEligibleEVsValencies();
    }
    return this.eligibleEVsValenciesCache;
  }

  /**
   *
   */
  public get withinMargin(): boolean {
    let now = BigInt(Date.now());
    let nextBoundary = this.forCycle === `current` ? this.toMs : this.fromMs;
    // const nextBoundary = now < this.fromMs ? this.fromMs : this.toMs; // TODO not too sure about this either
    let marginStart = nextBoundary - this.tiamatParams.margin_duration;
    // const zeroTime = Core.SLOT_CONFIG_NETWORK['Custom'].zeroTime; // TODO hardcoding, but it's only for logging
    // console.log(`current slot:`, (Number(now) - zeroTime) / slotDurationMs);
    // console.log(
    //   `next boundary slot:`,
    //   (Number(nextBoundary) - zeroTime) / slotDurationMs
    // );
    console.log(
      `distance to next cycle boundary:`,
      Number(nextBoundary - now) / slotDurationMs,
      `slots`,
    );
    console.log(
      `distance to/from margin start:`,
      Number(marginStart - now) / slotDurationMs,
      `slots`,
    );
    while (now >= nextBoundary) {
      const msg = `${this.forCycle}: nextBoundary in the past by ${
        Number(now - nextBoundary) / slotDurationMs
      } slots`;
      if (assertWithinMargin) {
        throw new Error(msg);
      } else {
        console.log(msg);
        nextBoundary += this.tiamatParams.cycle_duration;
        marginStart += this.tiamatParams.cycle_duration;
        now = BigInt(Date.now());
        // console.log(`current slot:`, (Number(now) - zeroTime) / slotDurationMs);
        // console.log(
        //   `next boundary slot:`,
        //   (Number(nextBoundary) - zeroTime) / slotDurationMs
        // );
        console.log(
          `distance to next cycle boundary:`,
          Number(nextBoundary - now) / slotDurationMs,
          `slots`,
        );
        console.log(
          `distance to/from margin start:`,
          Number(marginStart - now) / slotDurationMs,
          `slots`,
        );
      }
    }

    const withinMargin = now >= marginStart;
    // NOTE below is more of a "should be"
    // TODO and is probably weird with the loop above
    assert(
      withinMargin === (this.forCycle === `next`),
      `ElectionData: ${
        withinMargin ? `` : `not `
      }within margin for ${this.forCycle} cycle (off by ${now} - ${marginStart} = ${now - marginStart}ms)`,
    );
    return withinMargin;
  }

  /**
   *
   * @param previous
   */
  public assertAlignment = (previous: ElectionData<DC, DP>) => {
    assert(
      this.forCycle === "next",
      `alignsWith: expected this.forCycle === "next"`,
    );
    assert(
      previous.forCycle === "current",
      `alignsWith: expected previous.forCycle === "current"`,
    );

    assert(
      this.seed === previous.seed,
      `seed: ${this.seed} !== ${previous.seed}`,
    );
    assert(
      this.matrixUtxoString === previous.matrixUtxoString,
      `matrixUtxo: ${this.matrixUtxoString} !== ${previous.matrixUtxoString}`,
    );

    for (let i = 0; i < this.onChainEVs.length; i++) {
      assert(
        this.onChainEVs[i]!.equals(previous.onChainEVs[i]!),
        `onchainEVs[${i}]: ${this.onChainEVs[i]!.show()}  !==  ${previous.onChainEVs[
          i
        ]!.show()}`,
      );
    }
    for (let i = 0; i < this.eligibleEVs.length; i++) {
      assert(
        this.eligibleEVs[i]!.equals(previous.eligibleEVs[i]!),
        `eligibleEVs[${i}]: ${this.eligibleEVs[i]!.show()}  !==  ${previous.eligibleEVs[
          i
        ]!.show()}`,
      );
    }

    if (!this.tiamatParams.equals(previous.tiamatParams)) {
      console.log(`params`, this.tiamatParams, `!==`, previous.tiamatParams);
      throw new Error(`params`);
    }

    assert(
      this.fromMs === previous.fromMs,
      `fromMs ${this.fromMs} !== fromMs ${previous.fromMs}`,
    );
    assert(
      this.toMs === previous.toMs,
      `toMs ${this.toMs} !== toMs ${previous.toMs}`,
    );
  };

  // This is true if onChainEVs is the same as eligibleEVs
  /**
   *
   */
  private checkEligibleEVsElected = (): boolean => {
    if (this.onChainEVs.length !== this.eligibleEVs.length) {
      return false;
    }

    /**
     *
     * @param arr
     */
    function countOccurrences(arr: string[]): Map<string, number> {
      const counts: Map<string, number> = new Map();

      for (const item of arr) {
        counts.set(item, (counts.get(item) ?? 0) + 1);
      }

      return counts;
    }

    const onChainStrings = this.onChainEVs.map((kh) => kh.concise());
    const eligibleStrings = this.eligibleEVs.map((ev) => ev.vector.concise());

    const onChainCounts = countOccurrences(onChainStrings);
    const eligibleCounts = countOccurrences(eligibleStrings);

    if (onChainCounts.size !== eligibleCounts.size) {
      return false;
    }

    for (const [ev, valency] of onChainCounts) {
      if (eligibleCounts.get(ev) !== valency) {
        return false;
      }
    }

    return true;
  };

  /**
   *
   */
  private countEligibleEVsValencies = (): AssocMap<IpPort, EigenvectorData> => {
    const ipData = new AssocMap<IpPort, EigenvectorData>(
      (ip) => `${ip.ip}:${ip.port}`,
    );
    this.eligibleEVs.forEach((vector) => {
      const ip = vector.ip;
      const port = Number(vector.port);
      const ipPort = { ip, port };
      let data = ipData.get(ipPort);
      if (data) {
        data.valency += 1;
      } else {
        data = {
          valency: 1,
          keyHash: vector.vector,
        };
      }

      ipData.set(ipPort, data);
    });
    return ipData;
  };
}
