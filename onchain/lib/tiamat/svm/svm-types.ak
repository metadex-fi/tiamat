use cardano/assets.{Value}
use cardano/transaction as tx
use tiamat/util/util_types/misc_types.{Asset}

pub type Datum<config, state> {
  id: Asset,
  config: config,
  state: state,
}

pub type Redeemer<action> {
  Revolve { action: action }
  Halt { action: action }
  Wipe
}

pub type ExtractionFn<config, state> =
  fn(tx.Output) -> Datum<config, state>

pub type RevolvingFn<config, state, action> =
  fn(
    Option<tx.Input>,
    Asset,
    config,
    state,
    Value,
    action,
    state,
    Value,
    tx.OutputReference,
    tx.Transaction,
  ) ->
    Bool

// nexus-utxo
// own id
// config
// old state
// old value
// action
// new state
// new value

pub type HaltingFn<config, state, action> =
  fn(
    Option<tx.Input>,
    Asset,
    config,
    state,
    Value,
    action,
    tx.OutputReference,
    tx.Transaction,
  ) ->
    Bool
// nexus-utxo
// own id
// config
// old state
// old value
// action
