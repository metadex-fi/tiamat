import assert from "assert";
import { errorTimeoutMs } from "../../utils/constants";
import { Zygote } from "./zygote";
import { Effector } from "./effector";
import { Sent } from "../state/utxoSource";
import { Trace } from "../../utils/wrappers";

/**
 * A node in the data processing pipeline.
 *
 * TODO add the stuff with "current" and "next" state back -
 * The idea was to still be somewhat up to date in a scenario
 * of rapid-fire data updates from chain.
 * Recall: The idea was that each ganglion will proceed calcualting as if
 * nothing happens, and only when finished address the at that point latest
 * new upstream updates.
 */
export class Ganglion<InZsT extends readonly Zygote[], OutZT extends Zygote> {
  private current: OutZT | `virginal` = `virginal`;
  private afferentsCache: Map<
    Ganglion<Zygote[], InZsT[number]>,
    InZsT[number] | "virginal"
  > = new Map();

  private abortController: AbortController | null = null;
  private efferents: Array<Ganglion<[...any[], OutZT], Zygote>> = [];
  private effectors: Array<Effector<OutZT>> = [];
  private myelinated: string | null = null;
  private stemInnervations = new Set<() => void>();

  constructor(
    private readonly name: string,
    private readonly afferents: {
      [K in keyof InZsT]: Ganglion<any[], InZsT[K]>;
    },
    private readonly procedure: (
      afferentStates: Map<
        Ganglion<any[], InZsT[number]>,
        InZsT[number] | "virginal"
      >,
      signal: AbortSignal,
    ) => Promise<OutZT | "virginal">,
  ) {
    assert(
      this.name.endsWith(`Ganglion`),
      `Ganglion name must end with Ganglion: ${this.name}`,
    );
    // this.current = initialState;

    this.afferents.forEach((afferent) => {
      this.afferentsCache.set(afferent, afferent.scion);
    });

    this.afferents.forEach((afferent) => {
      // TODO ugly
      afferent.procure(
        this as unknown as Ganglion<[...Zygote[], Zygote], Zygote>,
      );
    });
  }

  //////////////////////////////////////////
  // public endpoints

  public get scion(): OutZT | `virginal` {
    if (this.current === `virginal`) {
      return `virginal`;
    } else {
      return this.current;
    }
  }

  /**
   * Induce data updates from upstream Ganglion.
   * @param afferent
   * @param zygote
   */
  public induce = (
    afferent: Ganglion<any[], InZsT[number]>,
    zygote: InZsT[number],
    trace: Trace,
  ) => {
    this.log(`Inducing from ${afferent.name} with zygote:`, zygote);
    assert(this.myelinated, `${this.name}.induce: Ganglion not myelinated`);
    const current = this.afferentsCache.get(afferent);
    if (current && current !== `virginal` && current.equals(zygote)) {
      return;
    }
    this.afferentsCache.set(afferent, zygote);
    this.abortController?.abort();
    this.abortController = new AbortController();
    this.process(this.abortController.signal, trace);
  };

  /**
   * End the setup phase and enable data processing.
   */
  public myelinate = (from: string[]) => {
    const from_ = from.join(`\n`);
    this.log(`Myelinating from:\n\n${from_}\n`);
    assert(
      !this.myelinated,
      `${this.name}.myelinate: Ganglion already myelinated from \n\n${this.myelinated}\n\nAttempted from:\n\n${from_}\n`,
    );
    this.myelinated = from_;
    for (const innervateStem of this.stemInnervations) {
      innervateStem();
    }
  };

  public addStemInnervation = (
    innervateStem: () => Promise<(string | Sent)[]>,
  ) => {
    assert(
      !this.myelinated,
      `${this.name}.addStemInnervation: Ganglion already myelinated`,
    );
    assert(
      !this.stemInnervations.has(innervateStem),
      `Stem-innervation already added`,
    );
    this.stemInnervations.add(innervateStem);
  };

  /**
   * Add side effect to data updates.
   * @param efferent
   */
  public innervateEffector = (effector: Effector<OutZT>) => {
    assert(
      !this.myelinated,
      `${this.name}.innervate: Ganglion already myelinated`,
    );
    assert(
      !this.effectors.includes(effector),
      `${this.name}: Effector already innervated`,
    );
    this.effectors.push(effector);
  };

  //////////////////////////////////////////
  // internal methods

  /**
   * Process upstream data updates.
   * @param signal
   */
  private process = async (signal: AbortSignal, trace: Trace) => {
    try {
      const newState = await this.procedure(
        new Map(this.afferentsCache),
        signal,
      );
      if (newState === `virginal`) {
        this.log(`Procedure returned virginal state.`);
        return;
      }
      if (signal.aborted) {
        this.log(`Procedure aborted after execution.`);
        return;
      }
      this.log(`Procedure returned`, newState);
      if (this.current !== `virginal` && this.current.equals(newState)) {
        this.log(`No change in state.`);
        return;
      }
      this.log(`State changed.`);
      this.current = newState;
      this.log(`Inducing efferents.`);
      this.induceEfferents(newState, trace);
    } catch (e) {
      // if ((e as Error).name === `AbortError`) {
      //   this.log(`Procedure aborted: ${e}`);
      // } else {
      this.throw(`Error during procedure: ${e}`);
      // }
    }
  };

  /**
   * Propagate data updates downstream.
   * @param data
   */
  private induceEfferents = async (data: OutZT, trace: Trace) => {
    const trace_ = trace.via(this.name);
    const inductionPromises = [
      ...this.efferents.map((efferent) =>
        // TODO ugly
        efferent.induce(
          this as unknown as Ganglion<[...Zygote[], Zygote], Zygote>,
          data,
          trace_,
        ),
      ),
      ...this.effectors.map((effector) =>
        // TODO ugly
        effector.induce(data, this.name, trace_),
      ),
    ];
    await Promise.all(inductionPromises);
  };

  /**
   * Connect to downstream Ganglion.
   * @param efferent
   */
  private procure = (efferent: Ganglion<[...Zygote[], OutZT], Zygote>) => {
    assert(
      !this.myelinated,
      `${this.name}.procure: Ganglion already myelinated`,
    );
    assert(
      !this.efferents.includes(efferent),
      `${this.name}: Efferent already procured`,
    );
    this.efferents.push(efferent);
  };

  /**
   *
   * @param msg
   * @param {...any} args
   */
  private log = (msg: string, ...args: any) => {
    console.log(`[${this.name}] ${msg}`, ...args, `\n`);
  };

  /**
   *
   * @param msg
   */
  private throw = (msg: string) => {
    this.log(`ERROR: ${msg}\n`);
    if (errorTimeoutMs === null) {
      throw new Error(`${this.name} ERROR: ${msg}\n`);
    } else {
      setTimeout(() => {
        throw new Error(`${this.name} ERROR: ${msg}\n`);
      }, errorTimeoutMs);
    }
  };
}
