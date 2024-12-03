// import { Semaphore } from "./semaphore";
// import { ElectionData } from "../state/electionData";
// import { PDappConfigT, PDappParamsT } from "../../types/tiamat/tiamat";

// /**
//  *
//  */
// export class ElectionPraetor<DC extends PDappConfigT, DP extends PDappParamsT> {
//   private static instances = new Map<string, number>();
//   public readonly name: string;

//   private readonly semaphore: Semaphore;

//   private current?: ElectionData<DC, DP>;
//   private next?: ElectionData<DC, DP>;

//   /**
//    *
//    * @param name
//    */
//   constructor(name: string) {
//     this.name = `${name} ElectionPraetor`;
//     const instance = ElectionPraetor.instances.get(this.name) ?? 0;
//     ElectionPraetor.instances.set(this.name, instance + 1);
//     if (instance) this.name = `${this.name}#${instance}`;

//     this.semaphore = new Semaphore(this.name);
//   }

//   /**
//    *
//    * @param from
//    * @param forCycle
//    * @param timeout
//    */
//   public latch = async (
//     from: string,
//     forCycle: "current" | "next",
//     timeout?: number,
//   ): Promise<[ElectionData<DC, DP> | undefined, string]> => {
//     const id = await this.semaphore.latch(from, timeout);
//     return [forCycle === "current" ? this.current : this.next, id];
//   };

//   /**
//    *
//    * @param update
//    * @param forCycle
//    * @param id
//    */
//   public discharge = (
//     update: ElectionData<DC, DP> | null,
//     forCycle: "current" | "next",
//     id: string,
//   ) => {
//     if (update) {
//       if (forCycle === "current") {
//         this.current = update;
//       } else {
//         this.next = update;
//       }
//     }
//     this.semaphore.discharge(id);
//   };
// }
