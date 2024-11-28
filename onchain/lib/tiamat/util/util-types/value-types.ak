use aiken/collection/dict.{Dict, from_ascending_pairs_with}
use aiken/collection/list
use aiken/math/rational.{Rational}
use cardano/assets.{AssetName, PolicyId}
use tiamat/util/util_types/misc_types.{FreeRational}

pub opaque type GenericValue<t> {
  inner: Dict<PolicyId, Dict<AssetName, t>>,
}

pub fn to_dict(self: GenericValue<t>) -> Dict<PolicyId, Dict<AssetName, t>> {
  self.inner
}

pub type RationalValue =
  GenericValue<Rational>

pub type FreeRationalValue =
  GenericValue<FreeRational>

pub type FreeValue =
  Pairs<PolicyId, Pairs<AssetName, Int>>

/// Promote an arbitrary list of assets into a `Value`. This function fails
/// (i.e. halt the program execution) if:
///
/// - there's any duplicate amongst `PolicyId`;
/// - there's any duplicate amongst `AssetName`;
/// - the `AssetName` aren't sorted in ascending lexicographic order; or
/// - any asset quantity is null.
///
/// This function is meant to turn arbitrary user-defined `Data` into safe `Value`,
/// while checking for internal invariants.
pub fn from_asset_list(
  xs: Pairs<PolicyId, Pairs<AssetName, FreeRational>>,
) -> FreeRationalValue {
  xs
    |> list.foldr(
        dict.empty,
        fn(inner, acc) {
          expect Pair(p, [_, ..] as x) = inner
          x
            |> from_ascending_pairs_with(fn(v) { v.denominator > 0 })
            |> dict.insert_with(
                acc,
                p,
                _,
                fn(_, _, _) {
                  fail @"Duplicate policy in the asset list."
                },
              )
        },
      )
    |> GenericValue
}
