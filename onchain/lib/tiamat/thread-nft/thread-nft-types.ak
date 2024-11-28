use cardano/assets.{PolicyId, Value}
use cardano/transaction as tx
use tiamat/util/util_types/misc_types.{Asset}

pub type StartingFn<config, state> =
  fn(Option<tx.Input>, Asset, config, state, Value, PolicyId, tx.Transaction) ->
    Bool
// nexus-utxo
// own id
// config
// action, // action
// new state
// new asset
// this policy
