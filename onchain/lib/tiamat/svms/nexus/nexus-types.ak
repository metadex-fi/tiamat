use cardano/transaction as tx
use tiamat/svm/svm_types as svm
use tiamat/util/util_types/misc_types.{Asset}
use tiamat/util/util_types/tiamat_types.{TiamatParams, Vector}

pub type NexusConfig {
  matrix: Asset,
  dapp_config: Data,
}

pub type NexusState {
  tiamat_params: TiamatParams,
  dapp_params: Data,
  // expected to be a copy from the matrix, which manages the original
  eigenvectors: List<Vector>,
  current_cycle: tx.ValidityRange,
}

pub type NexusAction =
  Void

// TODO consider making it wipeable if own_id doesn't match nexus id

pub type NexusDatum =
  svm.Datum<NexusConfig, NexusState>

pub type NexusRedeemer =
  svm.Redeemer<NexusAction>

pub fn extract_nexus(output: tx.Output) -> NexusDatum {
  trace @"extract nexus"
  expect tx.InlineDatum(inline) = output.datum
  expect datum: NexusDatum = inline
  datum
}
