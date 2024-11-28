use aiken/collection/dict
use cardano/assets.{AssetName, PolicyId, Value}

// regular quantity_of returns 0 if not found
pub fn expect_quantity_of(
  self: Value,
  policy_id: PolicyId,
  asset_name: AssetName,
) -> Int {
  expect Some(tokens) =
    self
      |> assets.to_dict
      |> dict.get(policy_id)

  expect Some(amount) = dict.get(tokens, asset_name)

  amount
}

pub fn has_some_of(self: Value, policy_id: PolicyId) -> Bool {
  self
    |> assets.to_dict
    |> dict.has_key(policy_id)
}
// fn map(
//   self: GenericValue<a>,
//   with: fn(ByteArray, a) -> b
// ) -> GenericValue<b> {
//   let inner = do_map(to_dict(self), with) 
//   GenericValue<b>(inner)
// }

// fn do_map(
//   self: Dict<PolicyId, Dict<AssetName, a>>,
//   with: fn(ByteArray, a) -> b
// ) -> Dict<PolicyId, Dict<AssetName, b>> {
//   dict.map(
//     self, 
//     fn(_currency, token_amounts) { 
//       dict.map(
//         token_amounts, 
//         with,
//       ) 
//     }
//   )
// }

// pub fn free_rational_value(
//   self: RationalValue,
// ) -> FreeRationalValue {
//   do_map(to_dict(self), fn(_, r) {
//     free_rational(r)
//   }) |> FreeRationalValue
// }

// pub fn bind_rational_value(
//   self: FreeRationalValue,
// ) -> RationalValue {
//   do_map(to_dict(self), fn(_, r) {
//     bind_rational(r)
//   }) |> RationalValue
// }
