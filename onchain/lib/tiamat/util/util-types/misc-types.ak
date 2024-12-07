use aiken/crypto
use aiken/primitive/bytearray
use cardano/assets.{AssetName, PolicyId}

pub type Asset {
  currency: PolicyId,
  token: AssetName,
}

pub fn compare(a: Asset, b: Asset) -> Ordering {
  when bytearray.compare(a.currency, b.currency) is {
    Equal -> bytearray.compare(a.token, b.token)
    neq -> neq
  }
}

pub fn to_bytes(asset: Asset) -> ByteArray {
  bytearray.concat(asset.currency, asset.token)
}

pub fn hash(asset: Asset) -> crypto.Hash<crypto.Blake2b_256, Asset> {
  asset |> to_bytes |> crypto.blake2b_256
}

pub type FreeRational {
  numerator: Int,
  denominator: Int,
}
