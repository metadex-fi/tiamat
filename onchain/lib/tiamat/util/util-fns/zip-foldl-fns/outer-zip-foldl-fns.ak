use aiken/collection/dict.{Dict}
use aiken/primitive/bytearray
use cardano/assets

fn outer_zip_foldl(
  left: Dict<ByteArray, v1>,
  right: Dict<ByteArray, v2>,
  with: fn(ByteArray, v1, v2, acc) -> acc,
  default_l: v1,
  default_r: v2,
  zero: acc,
) -> acc {
  do_outer_zip_foldl(
    dict.to_pairs(left),
    dict.to_pairs(right),
    with,
    default_l,
    default_r,
    zero,
  )
}

fn do_outer_zip_foldl(
  left: Pairs<ByteArray, v1>,
  right: Pairs<ByteArray, v2>,
  with: fn(ByteArray, v1, v2, acc) -> acc,
  default_l: v1,
  default_r: v2,
  zero: acc,
) -> acc {
  when left is {
    [] ->
      when right is {
        [] -> zero
        [Pair(rk, rv), ..rs] ->
          do_outer_zip_foldl(
            [],
            rs,
            with,
            default_l,
            default_r,
            with(rk, default_l, rv, zero),
          )
      }
    [Pair(lk, lv), ..ls] ->
      when right is {
        [] ->
          do_outer_zip_foldl(
            ls,
            [],
            with,
            default_l,
            default_r,
            with(lk, lv, default_r, zero),
          )
        [Pair(rk, rv), ..rs] -> {
          let ordering = bytearray.compare(lk, rk)
          if ordering == Equal {
            do_outer_zip_foldl(
              ls,
              rs,
              with,
              default_l,
              default_r,
              with(lk, lv, rv, zero),
            )
          } else if ordering == Less {
            do_outer_zip_foldl(
              ls,
              right,
              with,
              default_l,
              default_r,
              with(lk, lv, default_r, zero),
            )
          } else {
            do_outer_zip_foldl(
              left,
              rs,
              with,
              default_l,
              default_r,
              with(rk, default_l, rv, zero),
            )
          }
        }
      }
  }
}

pub fn value_outer_zip_foldl(
  left: Dict<assets.PolicyId, Dict<assets.AssetName, v1>>,
  right: Dict<assets.PolicyId, Dict<assets.AssetName, v2>>,
  with: fn(assets.PolicyId, assets.AssetName, v1, v2, acc) -> acc,
  default_l: v1,
  default_r: v2,
  zero: acc,
) -> acc {
  outer_zip_foldl(
    left,
    right,
    fn(policy, left_assets, right_assets, acc_amnt) {
      outer_zip_foldl(
        left_assets,
        right_assets,
        fn(asset, l, r, zero) { with(policy, asset, l, r, zero) },
        default_l,
        default_r,
        acc_amnt,
      )
    },
    dict.empty,
    dict.empty,
    zero,
  )
}
