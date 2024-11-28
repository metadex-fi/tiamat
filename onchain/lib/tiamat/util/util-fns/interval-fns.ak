use aiken/interval.{
  Finite, Interval, IntervalBound, NegativeInfinity, PositiveInfinity,
}
use cardano/transaction as tx

pub fn interval_wraps(outer: tx.ValidityRange, inner: tx.ValidityRange) -> Bool {
  let Interval(outer_from, outer_to) = outer
  let Interval(inner_from, inner_to) = inner
  // fails if same and not inclusive / inclusive
  interval_bound_le(outer_from, inner_from) && interval_bound_le(
    inner_to,
    outer_to,
  )
  // fails if same and inclusive / not inclusive
}

fn interval_bound_le(
  smaller: IntervalBound<Int>,
  larger: IntervalBound<Int>,
) -> Bool {
  if smaller.bound_type == NegativeInfinity || larger.bound_type == PositiveInfinity {
    True
  } else if smaller.bound_type == PositiveInfinity || larger.bound_type == NegativeInfinity {
    False
  } else {
    expect Finite(smaller) = smaller.bound_type
    expect Finite(larger) = larger.bound_type

    // todo this is technically a protocol parameter, but we can justify hardcoding it with 
    // rounding level being our own choice for now.
    let smaller = smaller / 1000
    let larger = larger / 1000 + 1

    // todo maybe too slacky?
    smaller <= larger
  }
  // we are allowing for slack regarding the inclusivities also
  // smaller < larger || (
  //   smaller == larger && 
  //   smaller.is_inclusive == larger.is_inclusive
  // )
}

pub fn interval_precedes_by(
  earlier: tx.ValidityRange,
  later: tx.ValidityRange,
  by: Int,
) -> Bool {
  let Interval(_, earlier_to) = earlier
  let Interval(later_from, _) = later
  when earlier_to is {
    IntervalBound(Finite(earlier_to), _earlier_incl) ->
      when later_from is {
        IntervalBound(Finite(later_from), _later_incl) ->
          earlier_to + by <= later_from
        _ -> False
      }
    _ -> False
  }
}
// pub fn interval_wraps (outer: ValidityRange, inner: ValidityRange) -> Bool {
//     expect Interval(
//       IntervalBound(Finite(outer_from), True),
//       IntervalBound(Finite(outer_to), True)
//     ): ValidityRange = outer

//     expect Interval(
//       IntervalBound(Finite(inner_from), _),
//       IntervalBound(Finite(inner_to), _)
//     ): ValidityRange = inner

//     inner_from >= outer_from && inner_to <= outer_to
// }
