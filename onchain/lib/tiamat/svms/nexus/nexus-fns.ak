use aiken/collection/list
use aiken/crypto
use aiken/interval.{Finite, Interval, IntervalBound}
use aiken/primitive/bytearray
use aiken/primitive/string
use cardano/assets.{Value}
use cardano/transaction as tx
use tiamat/svms/matrix/matrix_types.{MatrixState, extract_matrix}
use tiamat/svms/nexus/nexus_types.{NexusAction, NexusConfig, NexusState}
use tiamat/util/util_fns/interval_fns.{interval_wraps}
use tiamat/util/util_fns/tiamat_fns.{check_support_vector_count}
use tiamat/util/util_fns/type_fns.{hex_to_decimal}
use tiamat/util/util_types/misc_types.{Asset}
use tiamat/util/util_types/tiamat_types.{EigenValue, Vector}

// remove those corresponding to the given eigen_value
fn filter_eigenvectors(
  eigen_value: EigenValue,
  eigenvectors: List<(Int, Vector)>,
) -> List<(Int, Vector)> {
  trace @"filter_eigenvectors"
  eigenvectors
    |> list.filter(
        fn(eigenvector) {
          let (eigenvalue, vector) = eigenvector
          !(eigen_value.start <= eigenvalue && eigenvalue <= eigen_value.end && eigen_value.vector == vector)
        },
      )
}

fn confirm_election(
  eigen_values: List<EigenValue>,
  eigenvectors: List<(Int, Vector)>,
) -> Bool {
  trace @"confirm_election"
  when eigenvectors is {
    [] -> True
    _ ->
      when eigen_values is {
        [] -> fail @"election failed"
        [v, ..vs] -> {
          let remaining = filter_eigenvectors(v, eigenvectors)
          confirm_election(vs, remaining)
        }
      }
  }
}

fn compute_eigenvalues(
  preimage: ByteArray,
  eigenvectors: List<Vector>,
  loop: Int,
  n: Int,
) -> List<(Int, Vector)> {
  trace @"compute_eigenvalues"
  when eigenvectors is {
    [] ->
      if n == 0 {
        []
      } else {
        fail @"wrong number of eigenvectors"
      }
    [v, ..vs] -> {
      let hash = preimage |> crypto.blake2b_256
      let eigenvalue = hex_to_decimal(hash) % loop
      [(eigenvalue, v), ..compute_eigenvalues(hash, vs, loop, n - 1)]
    }
  }
}

test test_compute_eigenvalues() {
  let preimage = #[10, 255]
  let eigenvectors =
    [#[255, 0, 1, 2], #[3, 255, 4, 5], #[6, 7, 255, 8], #[9, 10, 11, 255]]
  let loop = 1234
  let n = 4
  let (_, evs) =
    compute_eigenvalues(preimage, eigenvectors, loop, n) |> list.unzip

  eigenvectors == evs
}

fn from(
  timestamp: Int,
  utxo: tx.OutputReference,
) -> crypto.Hash<crypto.Blake2b_256, tx.OutputReference> {
  trace @"from"
  utxo.transaction_id
    |> bytearray.push(utxo.output_index)
    |> bytearray.push(timestamp)
    |> crypto.blake2b_256
}

// pub fn start (
//   nexus_utxo: Option<tx.Input>,
//   _own_id: AssetName,
//   _config: Data,
//   _new_state: Data,
//   _new_value: Value,
//   tx: tx.Transaction,
// ) -> Bool {
//   expect tx.Spend(old_utxo_ref) = context.purpose
//   expect Some(own_input) = tx.inputs |> tx.find_input(old_utxo_ref)

//   own_input == nexus_utxo
// }

// elect new eigenvectors. 
// Technically unhinged, but we require the new support vectors to sign instead of the old ones
pub fn unhinged(
  _nexus_utxo: Option<tx.Input>,
  _id: Asset,
  config: NexusConfig,
  old_state: NexusState,
  _old_value: Value,
  _action: NexusAction,
  new_state: NexusState,
  _new_value: Value,
  old_utxo_ref: tx.OutputReference,
  tx: tx.Transaction,
) -> Bool {
  trace @"unhinged"
  let tx = tx

  expect Some(matrix_input) =
    tx.reference_inputs
      |> list.find(
          fn(input) {
            assets.quantity_of(
              input.output.value,
              config.matrix.policy,
              config.matrix.name,
            ) == 1
          },
        )

  let matrix_datum = extract_matrix(matrix_input.output)
  let MatrixState(params, eigen_values) = matrix_datum.state

  expect Interval(_, IntervalBound(Finite(old_to), True)): Interval<Int> =
    old_state.current_cycle

  expect Interval(
    IntervalBound(Finite(new_from), True),
    IntervalBound(Finite(new_to), True),
  ): Interval<Int> = new_state.current_cycle
  // we cannot use the nexus-utxo parameter here
  expect Some(nexus_utxo) = tx.inputs |> tx.find_input(old_utxo_ref)
  // we include the timestamp to prevent getting stuck with offline vectors
  let hash_preimage = from(new_from, nexus_utxo.output_reference)

  expect Some(latest_ev) = list.head(eigen_values)
  let election_confirmed =
    confirm_election(
      eigen_values,
      compute_eigenvalues(
        hash_preimage,
        new_state.eigenvectors,
        latest_ev.end + 1,
        params.num_eigenvectors,
      ),
    )

  let correct_duration = new_to - new_from == params.cycle_duration
  let correct_offset = ( new_from - old_to ) % params.cycle_duration == 0

  let support_vectors_signed =
    check_support_vector_count(
      tx.extra_signatories,
      new_state.eigenvectors,
      // this is the main difference to the svm-revolve-function
      params.num_support_vectors,
    )

  if !election_confirmed {
    fail @"election not confirmed"
  } else if !correct_duration {
    fail @"incorrect duration"
  } else if !correct_offset {
    fail @"incorrect offset"
  } else if !support_vectors_signed {
    fail @"support vectors not signed"
  } else if new_from < old_to {
    trace string.from_int(new_from)
    trace string.from_int(old_to)
    fail @"new cycle starts before old cycle ends"
  } else if new_state.tiamat_params != params {
    fail @"params changed"
  } else if !interval_wraps(new_state.current_cycle, tx.validity_range) {
    fail @"cycle interval does not wrap validity range"
  } else {
    True
  }
  // election_confirmed &&
  // correct_duration &&
  // correct_offset &&
  // support_vectors_signed &&
  // new_from >= old_to &&
  // new_state.params == params &&
  // interval_wraps(new_state.current_cycle, tx.validity_range)
}
