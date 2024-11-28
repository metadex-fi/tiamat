use aiken/collection/dict.{Dict}
use cardano/assets

// unsorted
// pub fn left_zip_foldl(
//   left: Dict<ByteArray, v1>,
//   right: Dict<ByteArray, v2>,
//   with: fn(v1, v2, acc) -> acc,
//   default: v2,
//   zero: acc,
// ) -> acc {
//   do_left_zip_foldl(dict.to_pairs(left), right, with, default, zero)
// }

// fn do_left_zip_foldl(
//   left: Pairs<ByteArray, v1>,
//   right: Dict<ByteArray, v2>,
//   with: fn(v1, v2, acc) -> acc,
//   default: v2,
//   zero: acc,
// ) -> acc {
//   when left is {
//     [] -> zero
//     [Pair(lk, lv), ..ls] ->
//       when dict.get(right, lk) is {
//         None ->
//           do_left_zip_foldl(ls, right, with, default, with(lv, default, zero))
//         Some(rv) ->
//           do_left_zip_foldl(ls, right, with, default, with(lv, rv, zero))
//       }
//   }
// }

// pub fn value_left_zip_foldl(
//   left: Dict<assets.PolicyId, Dict<assets.AssetName, v1>>,
//   right: Dict<assets.PolicyId, Dict<assets.AssetName, v2>>,
//   with: fn(v1, v2, acc) -> acc,
//   default: v2,
//   zero: acc,
// ) -> acc {
//   left_zip_foldl(
//     left,
//     right,
//     fn(left_assets, right_assets, acc_amnt) {
//       left_zip_foldl(left_assets, right_assets, with, default, acc_amnt)
//     },
//     dict.empty,
//     zero,
//   )
// }

// sorted
pub fn left_zip_foldl(
  left: Dict<key, v1>,
  right: Dict<key, v2>,
  with: fn(v1, v2, acc) -> acc,
  default: v2,
  zero: acc,
) -> acc {
  do_left_zip_foldl(
    dict.to_pairs(left),
    dict.to_pairs(right),
    with,
    default,
    zero,
  )
}

fn do_left_zip_foldl(
  left: Pairs<key, v1>,
  right: Pairs<key, v2>,
  with: fn(v1, v2, acc) -> acc,
  default: v2,
  zero: acc,
) -> acc {
  when left is {
    [] -> zero
    [Pair(lk, lv), ..ls] ->
      when right is {
        [] -> do_left_zip_foldl(ls, [], with, default, with(lv, default, zero))
        [Pair(rk, rv), ..rs] ->
          if lk == rk {
            do_left_zip_foldl(ls, rs, with, default, with(lv, rv, zero))
          } else {
            do_left_zip_foldl(left, rs, with, default, zero)
          }
      }
  }
}

pub fn value_left_zip_foldl(
  left: Dict<assets.PolicyId, Dict<assets.AssetName, v1>>,
  right: Dict<assets.PolicyId, Dict<assets.AssetName, v2>>,
  with: fn(v1, v2, acc) -> acc,
  default: v2,
  zero: acc,
) -> acc {
  left_zip_foldl(
    left,
    right,
    fn(left_assets, right_assets, acc_amnt) {
      left_zip_foldl(left_assets, right_assets, with, default, acc_amnt)
    },
    dict.empty,
    zero,
  )
}
