// use cardano/address.{Address}
// use cardano/assets.{PolicyId}
// use cardano/transaction as tx
// use tiamat/svm/svm_fns.{
//   mk_validator,
// }
// use tiamat/svms/vesting/vesting_fns
// use tiamat/svms/vesting/vesting_types.{}
// use tiamat/thread_nft/thread_nft_fns.{mk_thread_nft}
// use tiamat/util/util_types/misc_types.{Asset}

// validator (nexus: Asset) {
//   fn svm_validator(
//     datum: Option<VestingDatum>,
//     redeemer: Redeemer,
//     utxo: tx.OutputReference,
//     tx: tx.Transaction,
//   ) {
//     expect Some(datum): Option<VestingDatum> = datum
//     mk_validator(
//       Some(nexus),
//       extract,
//       vesting_fns.unhinged,
//       True,
//       vesting_fns.halt,
//       datum,
//       redeemer,
//       utxo,
//       tx,
//     )
//   }
// }

// validator (vestings_address: Address) {
//   fn nft_policy(
//     _redeemer: Data,
//     //svm.Redeemer,
//     this_policy: PolicyId,
//     tx: tx.Transaction,
//   ) {
//     mk_thread_nft(
//       None,
//       vestings_address,
//       extract,
//       vesting_fns.start,
//       // redeemer, 
//       this_policy,
//       tx,
//     )
//   }
// }
