use aiken/primitive/bytearray

pub fn hex_to_decimal(hex: ByteArray) -> Int {
  bytearray.foldl(hex, 0, fn(byte, zero) { zero * 256 + byte })
}
