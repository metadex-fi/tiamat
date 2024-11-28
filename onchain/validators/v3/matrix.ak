use cardano/address.{Address}
use cardano/assets.{PolicyId}
use cardano/transaction as tx
use tiamat/svm/svm_fns.{mk_validator, unhalting}
use tiamat/svms/matrix/matrix_fns
use tiamat/svms/matrix/matrix_types.{MatrixDatum,
  MatrixRedeemer, extract_matrix}
use tiamat/thread_nft/thread_nft_fns.{mk_thread_nft}
use tiamat/util/util_types/misc_types.{Asset}

validator svm_validator {
  spend(
    datum: Option<MatrixDatum>,
    redeemer: MatrixRedeemer,
    utxo: tx.OutputReference,
    tx: tx.Transaction,
  ) {
    expect Some(datum): Option<MatrixDatum> = datum
    mk_validator(
      None,
      extract_matrix,
      matrix_fns.unhinged,
      True,
      unhalting,
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

validator nft_policy(matrix_address: Address, nexus: Asset) {
  mint(_redeemer: Data, this_policy: PolicyId, tx: tx.Transaction) {
    mk_thread_nft(
      Some(nexus),
      matrix_address,
      extract_matrix,
      matrix_fns.start,
      // redeemer, 
      this_policy,
      tx,
    )
  }

  else(_) {
    fail
  }
}
