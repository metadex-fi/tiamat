use cardano/transaction as tx
use tiamat/svm/svm_types as svm
use tiamat/util/util_types/misc_types.{Asset}
use tiamat/util/util_types/tiamat_types.{EigenValue, TiamatParams, Vector}

pub type MatrixConfig {
  eigenwert: Asset,
}

// todo consider making this variable

pub type MatrixState {
  params: TiamatParams,
  eigen_values: List<EigenValue>,
}

pub type MatrixActionType {
  RegisterVector { ip: ByteArray, port: Int }
  DeregisterVector
  ChangeStake
  UpdateVector { ip: ByteArray, port: Int }
  ChangeProtocolParams
}

pub type MatrixAction {
  vector: Vector,
  action: MatrixActionType,
}

pub type MatrixDatum =
  svm.Datum<MatrixConfig, MatrixState>

pub type MatrixRedeemer =
  svm.Redeemer<MatrixAction>

pub fn extract_matrix(output: tx.Output) -> MatrixDatum {
  trace @"extract matrix"
  expect tx.InlineDatum(inline) = output.datum
  expect datum: MatrixDatum = inline
  datum
}
