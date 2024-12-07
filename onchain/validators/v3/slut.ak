use cardano/address.{Address}
use cardano/assets.{PolicyId}
use cardano/transaction as tx

validator svm_validator {
  spend(
    _datum: Option<Data>,
    _redeemer: Data,
    _utxo: tx.OutputReference,
    _tx: tx.Transaction,
  ) {
    True
  }

  else(_) {
    fail @"slut svm_validator: not spend"
  }
}

validator nft_policy(_slut_address: Address) {
  mint(_redeemer: Data, _this_policy: PolicyId, _tx: tx.Transaction) {
    True
  }

  else(_) {
    fail @"slut nft_policy: not mint"
  }
}
