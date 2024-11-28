// NOTE/TODO: This Pure isn't working yet...
export type Pure<
  Args extends readonly Immutable<any>[] = readonly any[],
  Return = any,
> = (...args: Args) => Return;

export type Immutable<T> = {
  readonly [P in keyof T]: T[P] extends Pure<any[], any>
    ? T[P] // Exclude pure functions from being readonly
    : Immutable<T[P]>; // Apply immutability recursively
};
