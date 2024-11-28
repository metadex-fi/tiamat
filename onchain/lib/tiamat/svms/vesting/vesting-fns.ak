use aiken/collection/list
use aiken/interval.{Finite}
use aiken/primitive/string
use cardano/assets.{PolicyId, Value}
use cardano/transaction as tx
use tiamat/svms/matrix/matrix_types.{extract_matrix}
use tiamat/svms/nexus/nexus_types.{extract_nexus}
use tiamat/svms/vesting/vesting_types.{
  VestingAction, VestingConfig, VestingState,
}
use tiamat/util/util_fns/tiamat_fns.{find_reference_svm}
use tiamat/util/util_types/misc_types.{Asset}

fn extract_eigenwert(matrix: tx.Input) -> Asset {
  trace @"vesting.extract_eigenwert"
  let matrix_datum = extract_matrix(matrix.output)
  matrix_datum.config.eigenwert
}

pub fn start(
  _nexus_utxo: Option<tx.Input>,
  _id: Asset,
  _config: VestingConfig,
  new_state: VestingState,
  _new_value: Value,
  _this_policy: PolicyId,
  tx: tx.Transaction,
) -> Bool {
  trace @"vesting.start"

  let tx = tx
  expect Finite(tx_valid_to) = tx.validity_range.upper_bound.bound_type

  trace string.from_int(tx_valid_to)
  trace string.from_int(new_state.time_lock)
  tx_valid_to <= new_state.time_lock
}

// todo consider deduplicating with halt
// withdraw vested tokens
pub fn unhinged(
  nexus_utxo: Option<tx.Input>,
  _id: Asset,
  config: VestingConfig,
  old_state: VestingState,
  old_value: Value,
  _action: VestingAction,
  new_state: VestingState,
  new_value: Value,
  _old_utxo_ref: tx.OutputReference,
  tx: tx.Transaction,
) -> Bool {
  trace @"vesting.unhinged"
  expect Some(nexus_utxo) = nexus_utxo
  let tx = tx

  expect Finite(tx_valid_from) = tx.validity_range.lower_bound.bound_type
  expect Finite(tx_valid_to) = tx.validity_range.upper_bound.bound_type

  let nexus_datum = extract_nexus(nexus_utxo.output)
  let nexus_config = nexus_datum.config
  let nexus_state = nexus_datum.state
  let vesting_rate = nexus_state.tiamat_params.vesting_rate

  let old_time_lock = old_state.time_lock
  let elapsed = tx_valid_from - old_time_lock
  let claimable = vesting_rate.numerator * elapsed / vesting_rate.denominator

  expect Some(matrix) =
    find_reference_svm(nexus_config.matrix, tx.reference_inputs)
  let e = extract_eigenwert(matrix)
  let claimed_e =
    assets.quantity_of(old_value, e.policy, e.name) - assets.quantity_of(
      new_value,
      e.policy,
      e.name,
    )

  list.has(tx.extra_signatories, config.owner) && tx_valid_to <= new_state.time_lock && claimed_e <= claimable
}

pub fn halt(
  nexus_utxo: Option<tx.Input>,
  _id: Asset,
  config: VestingConfig,
  old_state: VestingState,
  old_value: Value,
  _action: VestingAction,
  _old_utxo_ref: tx.OutputReference,
  tx: tx.Transaction,
) -> Bool {
  trace @"vesting.halt"
  expect Some(nexus_utxo) = nexus_utxo
  let tx = tx

  expect Finite(tx_valid_from) = tx.validity_range.lower_bound.bound_type

  // expect Finite(tx_valid_to) = tx.validity_range.upper_bound.bound_type
  let nexus_datum = extract_nexus(nexus_utxo.output)
  let nexus_config = nexus_datum.config
  let nexus_state = nexus_datum.state
  let vesting_rate = nexus_state.tiamat_params.vesting_rate

  let old_time_lock = old_state.time_lock
  let elapsed = tx_valid_from - old_time_lock
  let claimable = vesting_rate.numerator * elapsed / vesting_rate.denominator

  expect Some(matrix) =
    find_reference_svm(nexus_config.matrix, tx.reference_inputs)
  let e = extract_eigenwert(matrix)
  let claimed_e = old_value |> assets.quantity_of(e.policy, e.name)

  // -
  // (new_value |> assets.quantity_of(e.policy, e.name))
  list.has(tx.extra_signatories, config.owner) && // tx_valid_to <= new_state.time_lock &&
  claimed_e <= claimable
}
