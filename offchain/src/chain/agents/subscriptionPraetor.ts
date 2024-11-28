import { Semaphore } from "./semaphore";

/**
 *
 */
export class SubscriptionPraetor {
  private static instances = new Map<string, number>();
  public readonly name: string;
  private readonly semaphore: Semaphore;

  private toAddresses = new Set<string>();

  /**
   *
   * @param name
   */
  constructor(name: string) {
    this.name = `${name} SubscriptionPraetor`;
    const instance = SubscriptionPraetor.instances.get(this.name) ?? 0;
    SubscriptionPraetor.instances.set(this.name, instance + 1);
    if (instance) this.name = `${this.name}#${instance}`;
    this.semaphore = new Semaphore(this.name);
  }

  /**
   *
   * @param from
   */
  public latch = async (from: string): Promise<[Set<string>, string]> => {
    const id = await this.semaphore.latch(from);
    console.log(`[${this.name}] ${id} latchd subscriptions`);

    return [this.toAddresses, id];
  };

  /**
   *
   * @param update
   * @param id
   */
  public discharge = (update: Set<string>, id: string) => {
    this.semaphore.discharge(id);
    console.log(`[${this.name}] ${id} discharged subscriptions`);
    this.toAddresses = update;
  };
}
