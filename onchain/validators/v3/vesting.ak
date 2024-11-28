use cardano/address.{Address}
use cardano/assets.{PolicyId}
use cardano/transaction as tx
use tiamat/svm/svm_fns.{mk_validator}
use tiamat/svms/vesting/vesting_fns
use tiamat/svms/vesting/vesting_types.{
  VestingDatum, VestingRedeemer, extract_vesting,
}
use tiamat/thread_nft/thread_nft_fns.{mk_thread_nft}
use tiamat/util/util_types/misc_types.{Asset}

validator svm_validator(nexus: Asset) {
  spend(
    datum: Option<VestingDatum>,
    redeemer: VestingRedeemer,
    utxo: tx.OutputReference,
    tx: tx.Transaction,
  ) {
    expect Some(datum): Option<VestingDatum> = datum
    mk_validator(
      Some(nexus),
      extract_vesting,
      vesting_fns.unhinged,
      True,
      vesting_fns.halt,
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

validator nft_policy(vestings_address: Address) {
  mint(
    _redeemer: Data,
    //svm.Redeemer,
    this_policy: PolicyId,
    tx: tx.Transaction,
  ) {
    mk_thread_nft(
      None,
      vestings_address,
      extract_vesting,
      vesting_fns.start,
      // redeemer, 
      this_policy,
      tx,
    )
  }

  else(_) {
    fail
  }
}
