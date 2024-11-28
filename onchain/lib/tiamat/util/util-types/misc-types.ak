use aiken/crypto
use aiken/primitive/bytearray
use cardano/assets.{AssetName, PolicyId}

pub type Asset {
  policy: PolicyId,
  name: AssetName,
}

pub fn compare(a: Asset, b: Asset) -> Ordering {
  when bytearray.compare(a.policy, b.policy) is {
    Equal -> bytearray.compare(a.name, b.name)
    neq -> neq
  }
}

pub fn to_bytes(asset: Asset) -> ByteArray {
  bytearray.concat(asset.policy, asset.name)
}

pub fn hash(asset: Asset) -> crypto.Hash<crypto.Blake2b_256, Asset> {
  asset |> to_bytes |> crypto.blake2b_256
}

pub type FreeRational {
  numerator: Int,
  denominator: Int,
}
