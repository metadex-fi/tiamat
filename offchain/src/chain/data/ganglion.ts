import assert from "assert";
import { blockDurationMs, errorTimeoutMs } from "../../utils/constants";
import { Zygote } from "./zygote";
import { Effector } from "./effector";
import { Trace } from "../../utils/wrappers";
import { ErrorTimeout } from "../../utils/errorTimeout";
import { Simplephore } from "../agents/semaphore";
import { Result } from "../state/callback";

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
  public induce = (trace: Trace) => {
    assert(this.myelinated, `${this.name}.induce: Ganglion not myelinated`);
    // this.abortController?.abort(); // TODO FIXME
    this.abortController = new AbortController();
    this.process(this.abortController.signal, trace.via(`${this.name}.induce`));
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
  private process = async (signal: AbortSignal, trace: Trace) => {
    if (this.processSemaphore.busy) {
      this.doubleTapped = true;
      return;
    }
    const processID = this.processSemaphore.latch(`process`);
    const trace_ = trace.via(`${this.name}.process`);
    while (true) {
      try {
        this.log(`Processing`, trace_.compose());
        const afferentStates = new Map(
          this.afferents.map((afferent) => {
            const scion = afferent.scion;
            this.log(`afferent ${afferent.name} state:`, scion);
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
            this.log(`State changed:\n`, this.current, `\n\t⬇\n`, newState);
            this.current = newState;
            this.induceEfferents(newState, trace_);
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
        return;
      }
    }
  };

  /**
   * Propagate data updates downstream.
   * @param data
   */
  protected induceEfferents = async (data: OutZT, trace: Trace) => {
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
