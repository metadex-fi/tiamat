use aiken/collection/list
use cardano/assets
use cardano/transaction as tx
use tiamat/util/util_fns/list_fns.{find_delete_all}
use tiamat/util/util_types/misc_types.{Asset}
use tiamat/util/util_types/tiamat_types.{Vector}

pub fn check_support_vector_count(
  signatories: List<Vector>,
  eigenvectors: List<Vector>,
  remaining: Int,
) -> Bool {
  when eigenvectors is {
    [] -> False
    _ ->
      when signatories is {
        [] -> False
        [signatory, ..signatories_] -> {
          // this allows for twice the same eigenvector, which is correct
          let (found, eigenvectors_) = find_delete_all(eigenvectors, signatory)
          let remaining_ = remaining - found
          if remaining_ <= 0 {
            True
          } else {
            check_support_vector_count(signatories_, eigenvectors_, remaining_)
          }
        }
      }
  }
}

pub fn find_reference_svm(
  id: Asset,
  reference_inputs: List<tx.Input>,
) -> Option<tx.Input> {
  trace @"find_reference_svm"
  list.find(
    reference_inputs,
    fn(input) {
      assets.quantity_of(input.output.value, id.policy, id.name) == 1
    },
  )
}
