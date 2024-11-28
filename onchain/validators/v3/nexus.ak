use cardano/address.{Address}
use cardano/assets.{AssetName, PolicyId}
use cardano/transaction as tx
use tiamat/svm/svm_fns.{mk_validator, unhalting}
use tiamat/svms/nexus/nexus_fns
use tiamat/svms/nexus/nexus_types.{NexusDatum, NexusRedeemer, extract_nexus}
use tiamat/thread_nft/thread_nft_fns.{mk_singleton, mk_thread_nft}

validator svm_validator {
  spend(
    datum: Option<NexusDatum>,
    redeemer: NexusRedeemer,
    utxo: tx.OutputReference,
    tx: tx.Transaction,
  ) {
    expect Some(datum): Option<NexusDatum> = datum
    mk_validator(
      None,
      extract_nexus,
      nexus_fns.unhinged,
      True,
      unhalting,
      // note: if changed, consider implications for find_nexus (now find_reference_svm) in svms

      datum,
      redeemer,
      utxo,
      tx,
    )
  }

  else(_) {
    fail
  }
}

validator nft_policy(nexus_address: Address, nexus_id: AssetName) {
  mint(_redeemer: Data, this_policy: PolicyId, tx: tx.Transaction) {
    mk_thread_nft(
      None,
      nexus_address,
      extract_nexus,
      mk_singleton(nexus_id),
      // redeemer, 
      this_policy,
      tx,
    )
  }

  else(_) {
    fail
  }
}
