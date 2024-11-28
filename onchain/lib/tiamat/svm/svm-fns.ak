use aiken/collection/dict
use aiken/collection/list
use cardano/assets.{Value}
use cardano/transaction as tx
use tiamat/svm/svm_types as svm
use tiamat/svms/nexus/nexus_types.{NexusState, extract_nexus}
use tiamat/util/util_fns/interval_fns.{interval_precedes_by}
use tiamat/util/util_fns/tiamat_fns.{
  check_support_vector_count, find_reference_svm,
}
use tiamat/util/util_types/misc_types.{Asset}

pub fn mk_validator(
  nexus: Option<Asset>,
  extraction_fn: svm.ExtractionFn<config, state>,
  revolving_fn: svm.RevolvingFn<config, state, action>,
  unhinged: Bool,
  halting_fn: svm.HaltingFn<config, state, action>,
  old_datum: svm.Datum<config, state>,
  redeemer: svm.Redeemer<action>,
  old_utxo_ref: tx.OutputReference,
  tx: tx.Transaction,
) -> Bool {
  trace @"mk_validator"
  let svm.Datum(id, config, old_state) = old_datum

  let nexus_utxo =
    when nexus is {
      None -> None
      Some(nexus) -> find_reference_svm(nexus, tx.reference_inputs)
    }

  expect Some(own_input) = tx.inputs |> tx.find_input(old_utxo_ref)
  let old_utxo: tx.Output = own_input.output
  let old_value: Value = old_utxo.value
  trace @"checking redeemer"
  when redeemer is {
    // todo allow unhinged halting only after a certain time to prevent spam-attacks
    // (this could also be dealt with in other ways in the offchain)
    svm.Halt(action) -> {
      trace @"halt"
      assets.quantity_of(old_value, id.policy, id.name) == 1 && assets.quantity_of(
        tx.mint,
        id.policy,
        id.name,
      ) == -1 && halting_fn(
        nexus_utxo,
        id,
        config,
        old_state,
        old_value,
        action,
        old_utxo_ref,
        tx,
      )
    }

    svm.Wipe -> {
      trace @"wipe"
      assets.quantity_of(old_value, id.policy, id.name) == 0
    }

    svm.Revolve(action) -> {
      trace @"unhinged or revolve"
      let own_address = old_utxo.address
      expect Some(new_utxo) =
        tx.outputs
          |> list.find(
              fn(output) {
                output.address == own_address && // todo this only works if && is lazy
                {
                  expect [Pair(id_name, 1)] =
                    output.value
                      |> assets.tokens(id.policy)
                      |> dict.to_pairs
                  id.name == id_name
                }
              },
            )

      trace @"checking new utxo"
      let new_datum = extraction_fn(new_utxo)
      let new_state = new_datum.state
      let new_value = new_utxo.value

      let hinged =
        if unhinged {
          True
        } else {
          trace @"revolve"
          expect Some(nexus_utxo) = nexus_utxo
          let nexus_datum = extract_nexus(nexus_utxo.output)
          let NexusState(
            tiamat_params,
            _dapp_params,
            eigenvectors,
            current_cycle,
          ) = nexus_datum.state

          if interval_precedes_by(
            current_cycle,
            tx.validity_range,
            tiamat_params.hinge_lock,
          ) {
            True
          } else {
            // if vectors get lazy, anyone can revolve
            check_support_vector_count(
              tx.extra_signatories,
              eigenvectors,
              tiamat_params.num_support_vectors,
            )
          }
        }

      // && todo do we need this?
      // interval_wraps(
      //   current_cycle, 
      //   tx.validity_range
      // )
      trace @"checking new state"
      assets.quantity_of(old_value, id.policy, id.name) == 1 && new_datum == svm.Datum {
        ..old_datum,
        state: new_state,
      } && hinged? && revolving_fn(
        nexus_utxo,
        id,
        config,
        old_state,
        old_value,
        action,
        new_state,
        new_value,
        old_utxo_ref,
        tx,
      )?
    }
  }
}

pub fn unrevolving(
  _nexus_utxo: Option<tx.Input>,
  _id: Asset,
  _config: config,
  _old_state: state,
  _old_value: Value,
  _action: action,
  _new_state: state,
  _new_value: Value,
  _old_utxo_ref: tx.OutputReference,
  _tx: tx.Transaction,
) -> Bool {
  False
}

pub fn unhalting(
  _nexus_utxo: Option<tx.Input>,
  _id: Asset,
  _config: config,
  _old_state: state,
  _old_value: Value,
  _action: action,
  _old_utxo_ref: tx.OutputReference,
  _tx: tx.Transaction,
) -> Bool {
  False
}
