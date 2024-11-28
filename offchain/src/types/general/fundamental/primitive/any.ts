// import { PType } from '../type';

// /** the most general type. Similar to any or undefined.
//  * TODO consider type checks in the functions still.
//  */
// export class PAny<P extends Data> implements PType<P, P> {
//   public population = 0; // because not implemented

//   public plift(data: P): P {
//     return data;
//   }

//   public pconstant(data: P): P {
//     return data;
//   }

//   public genData(): P {
//     throw new Error("not implemented");
//   }

//   public showData = (data: unknown): string => {
//     return `Any: ${data}`;
//   };

//   public showPType = (): string => {
//     return `PAny`;
//   };

//   static override genPType(): PAny<Data> {
//     return new PAny();
//   }
// }
