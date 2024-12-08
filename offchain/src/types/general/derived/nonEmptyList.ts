import assert from "assert";
import { Generators, genPositive, maybeNdef } from "../../../utils/generators";
import { PList } from "../fundamental/container/list";
import { Decrement, MaxDepth, PData, PLifted } from "../fundamental/type";
import { PConstraint } from "../fundamental/container/constraint";
import { gMaxLength } from "../../../utils/constants";

/**
 *
 */
export class PNonEmptyList<
  PElem extends PData<Decrement<MaxDepth>>,
> extends PConstraint<PList<PElem>> {
  /**
   *
   * @param pelem
   * @param length
   */
  constructor(pelem: PElem, length?: bigint) {
    assert(!length || length > 0, "empty list");

    super(
      new PList(pelem, length),
      [assertNonEmptyList],
      () =>
        PList.genList(
          pelem.genData,
          length ?? genPositive(gMaxLength),
        ) as PLifted<PElem>[],
    );
  }

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static override genPType(
    gen: Generators,
    maxDepth: bigint,
  ): PConstraint<PList<PData<Decrement<MaxDepth>>>> {
    const length = maybeNdef(genPositive(gMaxLength));
    const pelem = gen.generate(maxDepth) as PData<Decrement<MaxDepth>>;
    return new PNonEmptyList(pelem, length);
  }
}

/**
 *
 * @param l
 */
function assertNonEmptyList<T>(l: Array<T>) {
  assert(l.length > 0, "encountered empty List");
}
