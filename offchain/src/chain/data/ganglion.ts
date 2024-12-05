import assert from "assert";
import {
  blockDurationMs,
  errorTimeoutMs,
  logGanglionStateChange,
} from "../../utils/constants";
import { Zygote } from "./zygote";
import { Effector } from "./effector";
import { Trace } from "../../utils/wrappers";
import { ErrorTimeout } from "../../utils/errorTimeout";
import { Simplephore } from "../agents/semaphore";
import { Result } from "../state/callback";
import { t } from "../../types/general/fundamental/type";

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
  protected current: OutZT | `virginal` = `virginal`;

  private abortController: AbortController | null = null;
  private efferents: Array<Ganglion<[...any[], OutZT], Zygote>> = [];
  private effectors: Array<Effector<OutZT>> = [];
  private myelinated: string | null = null;
  private stemInnervations = new Set<() => Promise<Result>>();
  private myelinationTimeout?: ErrorTimeout;

  protected processSemaphore: Simplephore;
  protected doubleTapped = false;

  constructor(
    public readonly name: string,
    private readonly afferents: {
      [K in keyof InZsT]: Ganglion<any[], InZsT[K]>;
    },
    private readonly procedure: (
      afferentStates: Map<
        Ganglion<any[], InZsT[number]>,
        InZsT[number] | "virginal"
      >,
      previous: OutZT | `virginal`,
      signal: AbortSignal,
    ) => Promise<OutZT | "virginal">,
  ) {
    assert(
      this.name.endsWith(`Ganglion`) || this.name.endsWith(`Stem`),
      `Ganglion name must end with Ganglion or Stem: ${this.name}`,
    );
    this.processSemaphore = new Simplephore(name);

    this.afferents.forEach((afferent) => {
      // TODO ugly
      afferent.procure(
        this as unknown as Ganglion<[...Zygote[], Zygote], Zygote>,
      );
    });
    this.myelinationTimeout = new ErrorTimeout(
      `Myelination`,
      this.name,
      blockDurationMs,
      Trace.source(`INIT`, this.name),
    );
  }

  //////////////////////////////////////////
  // public endpoints

  public get scion(): OutZT | `virginal` {
    return this.current;
  }

  /**
   * Induce data updates from upstream Ganglion.
   * @param afferent
   * @param zygote
   */
  public induce = async (trace: Trace): Promise<Result> => {
    assert(this.myelinated, `${this.name}.induce: Ganglion not myelinated`);
    // this.abortController?.abort(); // TODO FIXME
    this.abortController = new AbortController();
    // NOTE not awaiting this.process on purpose, so we can move on (TODO FIXME)
    // return await this.process(this.abortController.signal, trace.via(`${this.name}.induce`))
    this.process(
      this.abortController.signal,
      trace.via(`${this.name}.induce`),
    ).then((result) => {
      result.burn().forEach((msg) => this.log(msg));
    });
    return await Promise.resolve(
      new Result([`Induced`], this.name, `induce`, trace),
    );
  };

  /**
   * End the setup phase and enable data processing.
   */
  public myelinate = async (from: string[]): Promise<Result[]> => {
    const from_ = from.join(`\n`);
    this.log(`Myelinating from:\n\n${from_}\n`);
    assert(
      !this.myelinated,
      `${this.name}.myelinate: Ganglion already myelinated from \n\n${this.myelinated}\n\nAttempted from:\n\n${from_}\n`,
    );
    this.myelinationTimeout?.clear();
    this.myelinationTimeout = undefined;
    this.myelinated = from_;
    const result = await Promise.all(
      [...this.stemInnervations.values()].map((innervate) => innervate()),
    );
    return result.flat();
  };

  public addStemInnervation = (innervateStem: () => Promise<Result>) => {
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
  private process = async (
    signal: AbortSignal,
    trace: Trace,
  ): Promise<Result> => {
    const trace_ = trace.via(`${this.name}.process`);
    if (this.processSemaphore.busy) {
      this.doubleTapped = true;
      return new Result([`Busy`], this.name, `sense`, trace_);
    }
    const processID = this.processSemaphore.latch(`process`);
    const result: (Result | string)[] = [];
    while (true) {
      try {
        this.log(`Processing`, trace_.compose());
        const afferentStates = new Map(
          this.afferents.map((afferent) => {
            const scion = afferent.scion;
            const scion_ = scion === `virginal` ? `virginal` : scion.show(t);
            this.log(`afferent ${afferent.name} state:`, scion_);
            return [afferent, scion];
          }),
        );
        const newState = await this.procedure(
          afferentStates,
          this.current,
          signal,
        );
        if (newState === `virginal`) {
          this.log(`Procedure returned virginal state`);
          assert(
            this.current === `virginal`,
            `${this.name}: Cannot return to virginal state`,
          );
        } else if (signal.aborted) {
          this.log(`Procedure aborted after execution`);
        } else {
          if (this.current !== `virginal` && this.current.equals(newState)) {
            this.log(`No change in state`);
          } else {
            if (logGanglionStateChange) {
              const current_ =
                this.current === `virginal` ? `virginal` : this.current.show(t);
              this.log(
                `State changed:\n`,
                current_,
                `\n\t⬇\n`,
                newState.show(t),
              );
            } else {
              this.log(`State changed`);
            }
            this.current = newState;
            const result_ = await this.induceEfferents(newState, trace_);
            result.push(...result_);
          }
        }
      } catch (e) {
        if ((e as Error).name === `AbortError`) {
          this.log(`Procedure aborted: ${(e as Error).message}`);
        } else {
          this.throw(`Error during procedure: ${e}`);
        }
      }
      if (this.doubleTapped) {
        this.doubleTapped = false;
      } else {
        this.processSemaphore.discharge(processID);
        return new Result(result, this.name, `process`, trace_);
      }
    }
  };

  /**
   * Propagate data updates downstream.
   * @param data
   */
  protected induceEfferents = async (
    data: OutZT,
    trace: Trace,
  ): Promise<Result[]> => {
    this.log(
      `Inducing efferents:\n`,
      this.efferents.map((e) => e.name),
      `\nand effectors:\n`,
      this.effectors.map((e) => e.name),
    );
    const trace_ = trace.via(`${this.name}.induceEfferents`);
    const inductionPromises = [
      ...this.efferents.map((efferent) =>
        // TODO ugly
        efferent.induce(trace_),
      ),
      ...this.effectors.map((effector) =>
        effector.induce(data, this.name, trace_),
      ),
    ];
    const result = await Promise.all(inductionPromises);
    // result.forEach((r) => r.burn().forEach((msg) => this.log(msg)));
    return result;
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
  protected log = (msg: string, ...args: any) => {
    console.log(`[${this.name}] ${msg}`, ...args, `\n`);
  };

  /**
   *
   * @param msg
   */
  protected throw = (msg: string) => {
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
