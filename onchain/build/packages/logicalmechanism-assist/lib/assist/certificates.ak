//// This module incorporates code for generating valid certificates,
//// ensuring their correctness. 
////

use aiken/transaction/certificate.{Certificate, CredentialDelegation}
use aiken/transaction/credential.{PoolId}
use assist/credentials
use assist/types/hashes.{ValidatorHash}

/// Creates a credential delegation for changing the location of the stake.
/// This certificate can be used to check if stake is being delegated to
/// a specific pool.
///
/// ```aiken
/// certificates.create_credential_delegation(datum.contract_hash, datum.pool_id)
/// ```
pub fn create_credential_delegation(
  sc: ValidatorHash,
  pool_id: PoolId,
) -> Certificate {
  CredentialDelegation {
    delegator: credentials.create_stake_credential(sc),
    delegatee: pool_id,
  }
}

test simple_credential_delegation() {
  let cred: Certificate =
    CredentialDelegation {
      delegator: credentials.create_stake_credential(#""),
      delegatee: #"",
    }
  create_credential_delegation(#"", #"") == cred
}
