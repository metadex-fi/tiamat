use aiken/collection/list
use aiken/primitive/bytearray
use aiken/primitive/string
use cardano/assets.{PolicyId, Value}
use cardano/transaction as tx
use tiamat/svms/matrix/matrix_types.{
  ChangeProtocolParams, ChangeStake, DeregisterVector, MatrixAction,
  MatrixConfig, MatrixState, RegisterVector, UpdateVector,
}
use tiamat/svms/nexus/nexus_types.{NexusDatum, extract_nexus}
use tiamat/util/util_fns/list_fns.{
  find_transform, transform_until_delete, transform_until_find,
}
use tiamat/util/util_fns/value_fns.{has_some_of}
use tiamat/util/util_types/misc_types.{Asset}
use tiamat/util/util_types/tiamat_types.{EigenValue}

// todo: the stake lock thing - allow immediate deregistration/withdrawal, but move to vesting contract with remaining time
pub fn start(
  nexus_utxo: Option<tx.Input>,
  id: Asset,
  _config: MatrixConfig,
  _new_state: MatrixState,
  _new_value: Value,
  this_policy: PolicyId,
  _tx: tx.Transaction,
) -> Bool {
  trace @"matrix.start"

  expect Some(nexus_utxo) = nexus_utxo
  let nexus_datum: NexusDatum = extract_nexus(nexus_utxo.output)
  let nexus_config = nexus_datum.config
  let matrix_policy = nexus_config.matrix.policy
  let matrix_id = nexus_config.matrix.name

  matrix_policy == this_policy && matrix_policy == id.policy && matrix_id == id.name
}

// update stake
pub fn unhinged(
  _nexus_utxo: Option<tx.Input>,
  _id: Asset,
  config: MatrixConfig,
  old_state: MatrixState,
  old_value: Value,
  action: MatrixAction,
  new_state: MatrixState,
  new_value: Value,
  _old_utxo_ref: tx.OutputReference,
  tx: tx.Transaction,
) -> Bool {
  trace @"matrix.unhinged"

  let tx = tx

  if !list.has(tx.extra_signatories, action.vector) {
    // TODO wdym extra?
    let vector_string = bytearray.to_hex(action.vector)
    let signatories_strings = tx.extra_signatories |> list.map(bytearray.to_hex)
    let msg =
      string.join(
        [
          @"Vector", vector_string, @"is not a signatory of",
          ..signatories_strings
        ],
        @"\n",
      )
    fail msg
  } else {
    let params = old_state.params
    let e = config.eigenwert
    let deposited_e =
      ( new_value |> assets.quantity_of(e.policy, e.name) ) - (
        old_value |> assets.quantity_of(e.policy, e.name)
      )

    if deposited_e < 0 {
      trace @"withdrawal"
      list.any(
        tx.outputs,
        fn(output) {
          has_some_of(output.value, params.vesting_policy) && assets.quantity_of(
            output.value,
            e.policy,
            e.name,
          ) == -deposited_e
        },
      )
    } else {
      // True
      trace @"deposit"
      True
    } && when action.action is {
      RegisterVector(ip, port) -> {
        // True
        // deposited_e assumed to be positive
        trace @"RegisterVector"
        if deposited_e < params.min_stake {
          fail @"RegisterVector: Stake is too low"
        } else if list.any(
          old_state.eigen_values,
          fn(es) { es.vector == action.vector },
        ) {
          fail @"RegisterVector: Vector already registered"
        } else {
          let start =
            when old_state.eigen_values is {
              [] -> 0
              [x, ..] -> x.end + 1
            }
          let end = start + deposited_e

          trace @"RegisterVector: start"
          new_state == MatrixState {
            ..old_state,
            eigen_values: [
              EigenValue(start, end, action.vector, ip, port),
              ..old_state.eigen_values
            ],
          }
        }
      }

      DeregisterVector -> {
        // deposited_e assumed to be negative
        trace @"DeregisterVector"
        new_state == MatrixState {
          ..old_state,
          eigen_values: transform_until_delete(
            list: old_state.eigen_values,
            predicate: fn(es) {
              es.vector == action.vector && es.start - es.end == deposited_e
            },
            f: fn(es) {
              EigenValue {
                ..es,
                start: es.start + deposited_e,
                end: es.end + deposited_e,
              }
            },
          ),
        }
      }

      ChangeStake -> {
        // deposited_e assumed to be positive, zero, or negative
        trace @"ChangeStake"
        new_state == MatrixState {
          ..old_state,
          eigen_values: transform_until_find(
            list: old_state.eigen_values,
            predicate: fn(es) {
              es.vector == action.vector && deposited_e + es.end - es.start >= params.min_stake
            },
            f: fn(es) {
              EigenValue {
                ..es,
                start: es.start + deposited_e,
                end: es.end + deposited_e,
              }
            },
            g: fn(es) { EigenValue { ..es, end: es.end + deposited_e } },
          ),
        }
      }

      UpdateVector(ip, port) -> {
        trace @"UpdateVector"
        deposited_e == 0 && new_state == MatrixState {
          ..old_state,
          eigen_values: find_transform(
            list: old_state.eigen_values,
            predicate: fn(es) { es.vector == action.vector },
            f: fn(es) { EigenValue { ..es, ip: ip, port: port } },
          ),
        }
      }

      ChangeProtocolParams -> todo @"not implemented"
    }
  }
  // note: ensure lp-token-policy is unchangeable
}
