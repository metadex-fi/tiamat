// use cardano/address.{Address}
// use cardano/assets.{PolicyId}
// use cardano/transaction as tx
// use tiamat/svm/svm_fns.{
//   mk_validator, unhalting,
// }
// use tiamat/svms/matrix/matrix_fns
// use tiamat/svms/matrix/matrix_types.{}
// use tiamat/thread_nft/thread_nft_fns.{mk_thread_nft}
// use tiamat/util/util_types/misc_types.{Asset}

// validator {
//   fn svm_validator(
//     datum: Option<MatrixDatum>,
//     redeemer: MatrixRedeemer,
//     utxo: tx.OutputReference,
//     tx: tx.Transaction,
//   ) {
//     expect Some(datum): Option<MatrixDatum> = datum
//     mk_validator(
//       None,
//       extract,
//       matrix_fns.unhinged,
//       True,
//       unhalting,
//       datum,
//       redeemer,
//       utxo,
//       tx,
//     )
//   }
// }

// validator (matrix_address: Address, nexus: Asset) {
//   fn nft_policy(_redeemer: Data, this_policy: PolicyId, tx: tx.Transaction) {
//     mk_thread_nft(
//       Some(nexus),
//       matrix_address,
//       extract,
//       matrix_fns.start,
//       // redeemer, 
//       this_policy,
//       tx,
//     )
//   }
// }
