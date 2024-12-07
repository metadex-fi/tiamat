use aiken/collection/dict
use aiken/collection/list
use aiken/crypto
use aiken/primitive/bytearray
use cardano/address.{Address}
use cardano/assets.{AssetName, PolicyId, Value}
use cardano/transaction as tx
use tiamat/svm/svm_types as svm
use tiamat/thread_nft/thread_nft_types.{StartingFn}
// use tiamat/svm/svm_fns as svm
use tiamat/util/util_fns/tiamat_fns.{find_reference_svm}
use tiamat/util/util_types/misc_types.{Asset}

fn from(
  seed: tx.OutputReference,
) -> crypto.Hash<crypto.Blake2b_256, tx.OutputReference> {
  trace @"seed.transaction_id"
  trace seed.transaction_id
  trace @"seed.output_index"
  trace seed.output_index
  trace bytearray.push(seed.transaction_id, seed.output_index)
  seed.transaction_id
    |> bytearray.push(seed.output_index)
    |> crypto.blake2b_256
    |> bytearray.drop(16)
}

pub fn mk_thread_nft(
  nexus: Option<Asset>,
  svm_address: Address,
  extraction_fn: svm.ExtractionFn<config, state>,
  starting_fn: StartingFn<config, state>,
  // redeemer: Data, 
  this_policy: PolicyId,
  tx: tx.Transaction,
) -> Bool {
  trace @"mk_thread_nft"
  let nexus_utxo =
    when nexus is {
      None -> None
      Some(nexus) -> find_reference_svm(nexus, tx.reference_inputs)
    }
  tx.mint
    |> assets.tokens(this_policy)
    |> dict.to_pairs
    |> list.all(
        fn(nft_amount) {
          let Pair(nft, amount) = nft_amount
          let half_nft = bytearray.drop(nft, 16)
          (amount == -1)
          || {
          trace list.length(tx.inputs)

          amount == 1 && list.any(
            tx.inputs,
            fn(input) {
              let target = from(input.output_reference)
              trace @"target"
              trace target
              trace @"half_nft"
              trace half_nft
              trace @"nft"
              trace nft
              target == half_nft
            },
          ) && list.any(
            tx.outputs,
            fn(output) { output.address == svm_address && {
                let token_pairs =
                  output.value
                    |> assets.tokens(this_policy)
                    |> dict.to_pairs
                when token_pairs is {
                  [Pair(id_nft, 1)] -> {
                    let datum = extraction_fn(output)

                    (this_policy == datum.id.currency)? && (nft == datum.id.token && nft == id_nft)? && starting_fn(
                      nexus_utxo,
                      datum.id,
                      datum.config,
                      // redeemer,
                      datum.state,
                      output.value,
                      this_policy,
                      tx,
                    )?
                  }
                  [] -> fail @"no tokens"
                  _ -> fail @"too many tokens"
                }
              } },
          )
          }
        },
      )
}

pub fn autostarting(
  _nexus_utxo: Option<tx.Input>,
  _id: Asset,
  _config: config,
  _action: action,
  _new_state: state,
  _new_value: Value,
  _tx: tx.Transaction,
) -> Bool {
  trace @"autostarting"
  True
}

pub fn mk_singleton(singleton_id: AssetName) {
  fn(
    _nexus_utxo: Option<tx.Input>,
    id: Asset,
    _config: config,
    // _action: action,
    _new_state: state,
    _new_value: Value,
    _this_policy: PolicyId,
    _tx: tx.Transaction,
  ) -> Bool {
    trace @"mk_singleton"
    id.token == singleton_id
  }
}
