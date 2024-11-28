use aiken/cbor
use aiken/crypto
use cardano/transaction as tx
use tiamat/svm/svm_types as svm

pub type VestingConfig {
  owner: crypto.VerificationKeyHash,
}

pub type VestingState {
  time_lock: Int,
}

pub type VestingAction =
  Void

pub type VestingDatum =
  svm.Datum<VestingConfig, VestingState>

pub type VestingRedeemer =
  svm.Redeemer<VestingAction>

pub fn extract_vesting(output: tx.Output) -> VestingDatum {
  trace @"extract vesting"
  expect tx.InlineDatum(inline) = output.datum
  trace cbor.diagnostic(inline)
  expect datum: VestingDatum = inline
  datum
}
