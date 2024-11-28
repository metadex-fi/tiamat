use aiken/crypto
use cardano/assets.{PolicyId}
use tiamat/util/util_types/misc_types.{FreeRational}

pub type EigenValue {
  start: Int,
  end: Int,
  vector: Vector,
  ip: ByteArray,
  port: Int,
}

pub type TiamatParams {
  min_stake: Int,
  // to register a vector
  cycle_duration: Int,
  margin_duration: Int,
  // safety margin before end of cycle
  hinge_lock: Int,
  // if vectors get lazy, anyone can revolve
  num_eigenvectors: Int,
  num_support_vectors: Int,
  // minimum required to pass
  suggested_tip: Int,
  // Shelling point for minimum vector tips
  vesting_policy: PolicyId,
  vesting_rate: FreeRational,
}

// ~ add your own here ~

// tokens released per second

pub type Vector =
  crypto.VerificationKeyHash
