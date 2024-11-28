use aiken/collection/dict.{Dict}

pub fn strict_zip_foldl(
  v1: Dict<ByteArray, v1>,
  v2: Dict<ByteArray, v2>,
  with: fn(ByteArray, v1, v2, acc) -> acc,
  zero: acc,
) -> acc {
  do_strict_zip_foldl(dict.to_pairs(v1), dict.to_pairs(v2), with, zero)
}

fn do_strict_zip_foldl(
  left: Pairs<ByteArray, v1>,
  right: Pairs<ByteArray, v2>,
  with: fn(ByteArray, v1, v2, acc) -> acc,
  zero: acc,
) -> acc {
  when (left, right) is {
    ([], []) -> zero
    ([Pair(lk, lv), ..ls], [Pair(rk, rv), ..rs]) ->
      if lk == rk {
        do_strict_zip_foldl(ls, rs, with, with(lk, lv, rv, zero))
      } else {
        fail @"strict_zip_foldl: keys mismatch"
      }
    _ -> fail @"strict_zip_foldl: lengths mismatch"
  }
}
// pub fn value_strict_zip_foldl (
//   left: Dict<assets.PolicyId, Dict<assets.AssetName, v1>>,
//   right: Dict<assets.PolicyId, Dict<assets.AssetName, v2>>,
//   with: fn(v1, v2, acc) -> acc,
//   zero: acc, 
// ) -> acc {
//   strict_zip_foldl(
//     left,
//     right,
//     fn(left_assets, right_assets, acc_amnt) {
//       strict_zip_foldl(
//         left_assets,
//         right_assets,
//         with,
//         acc_amnt,
//       )
//     },
//     zero,
//   )
// }
