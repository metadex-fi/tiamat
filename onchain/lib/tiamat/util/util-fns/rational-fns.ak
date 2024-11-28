use aiken/math
use aiken/math/rational.{Rational, denominator, numerator}
use aiken/primitive/string
use tiamat/util/util_types/misc_types.{FreeRational}

pub fn ratios_leq(p: Rational, q: Rational) -> Bool {
  rational.compare(p, q) != Greater
}

pub fn ratios_eq(p: Rational, q: Rational) -> Bool {
  rational.compare(p, q) == Equal
}

pub fn ratio_reduced(r: Rational) -> Bool {
  math.gcd(numerator(r), denominator(r)) == 1
}

pub fn ratios_zero(p: Rational, q: Rational) -> Bool {
  numerator(p) == 0 && numerator(q) == 0
}

pub fn min_ratio(p: Rational, q: Rational) -> Rational {
  if rational.compare(p, q) == Less {
    p
  } else {
    q
  }
}

pub fn show_rational(r: Rational) -> String {
  let n = numerator(r)
  let d = denominator(r)
  string.join(
    [string.from_int(n), string.from_int(d)],
    @"\n",
  )
}

pub fn max_ratio(p: Rational, q: Rational) -> Rational {
  if rational.compare(p, q) == Greater {
    p
  } else {
    q
  }
}

pub fn ratio_nonnegative(p: Rational) -> Bool {
  numerator(p) < 0 == ( denominator(p) < 0 )
}

pub fn ratio_positive(p: Rational) -> Bool {
  numerator(p) != 0 && ratio_nonnegative(p)
}

pub fn free_rational(self: Rational) -> FreeRational {
  FreeRational { numerator: numerator(self), denominator: denominator(self) }
}

pub fn bind_rational(self: FreeRational) -> Rational {
  expect Some(rational) = rational.new(self.numerator, self.denominator)
  rational
}
