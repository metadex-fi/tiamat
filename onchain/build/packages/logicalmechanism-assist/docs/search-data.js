window.Aiken.initSearch([
  {
    doc: "assist/boolean",
    title: "and_",
    content:
      "and_(x: Int, y: Int) -&gt; Int\n Performs a logical `AND` operation on two integer values.\n Expects both inputs as binary (0 or 1) and returns 1 if both are 1, otherwise returns 0.\n\n ```aiken\n boolean.and_(1, 1)\n ```",
    url: "assist/boolean.html#and_",
  },
  {
    doc: "assist/boolean",
    title: "imply_",
    content:
      "imply_(x: Int, y: Int) -&gt; Int\n Performs a logical implication operation on two integer values.\n Returns 1 if the first input is false or both inputs are true, otherwise returns 0.\n \n ```aiken\n boolean.imply_(1, 0)\n ```",
    url: "assist/boolean.html#imply_",
  },
  {
    doc: "assist/boolean",
    title: "nand_",
    content:
      "nand_(x: Int, y: Int) -&gt; Int\n Performs a logical `NAND` operation on two integer values.\n Returns 1 if at least one input is 0, otherwise returns 0.\n \n ```aiken\n boolean.nand_(1, 1)\n ```",
    url: "assist/boolean.html#nand_",
  },
  {
    doc: "assist/boolean",
    title: "nor_",
    content:
      "nor_(x: Int, y: Int) -&gt; Int\n Performs a logical `NOR` operation on two integer values.\n Returns 1 if both inputs are 0, otherwise returns 0.\n \n ```aiken\n boolean.nor_(0, 0)\n ```",
    url: "assist/boolean.html#nor_",
  },
  {
    doc: "assist/boolean",
    title: "not_",
    content:
      "not_(x: Int) -&gt; Int\n Performs a logical `NOT` operation on an integer value.\n Expects the input as binary (0 or 1) and returns the inverse (1 becomes 0, 0 becomes 1).\n\n ```aiken\n boolean.not_(1)\n ```",
    url: "assist/boolean.html#not_",
  },
  {
    doc: "assist/boolean",
    title: "or_",
    content:
      "or_(x: Int, y: Int) -&gt; Int\n Performs a logical `OR` operation on two integer values.\n Expects both inputs as binary (0 or 1) and returns 1 if at least one input is 1, otherwise returns 0.\n \n ```aiken\n boolean.or_(0, 1)\n ```",
    url: "assist/boolean.html#or_",
  },
  {
    doc: "assist/boolean",
    title: "xnor_",
    content:
      "xnor_(x: Int, y: Int) -&gt; Int\n Performs a logical `XNOR` operation on two integer values.\n Returns 1 if the inputs are the same, otherwise returns 0.\n \n ```aiken\n boolean.xnor_(1, 1)\n ```",
    url: "assist/boolean.html#xnor_",
  },
  {
    doc: "assist/boolean",
    title: "xor_",
    content:
      "xor_(x: Int, y: Int) -&gt; Int\n Performs a logical `XOR` operation on two integer values.\n Expects both inputs as binary (0 or 1) and returns 1 if the inputs are different, otherwise returns 0.\n\n ```aiken\n boolean.xor_(0, 1)\n ```",
    url: "assist/boolean.html#xor_",
  },
  {
    doc: "assist/boolean",
    title: "assist/boolean",
    content:
      " This module contains code to do boolean logic on integers.\n Boolean logic here is the special case of arithmetic circuit logic with p = 2.\n",
    url: "assist/boolean.html",
  },
  {
    doc: "assist/types/cip68",
    title: "get",
    content:
      "get(cip68: CIP68, key: Data) -&gt; Data\n Attempt to find a data structure by a key inside the cip68 metadatum. If\n nothing is found then fail.\n\n ```aiken\n cip68.get(datum, some_key)\n ```",
    url: "assist/types/cip68.html#get",
  },
  {
    doc: "assist/types/cip68",
    title: "version",
    content:
      "version(metadata: CIP68) -&gt; Int\n Return the version of the metadata.\n\n ```aiken\n datum |&gt; cip68.version\n ```",
    url: "assist/types/cip68.html#version",
  },
  {
    doc: "assist/types/cip68",
    title: "CIP68",
    content:
      "CIP68 {\n  metadata: Dict&lt;Data, Data&gt;,\n  version: Int,\n}\n The generic CIP68 metadatum type as defined in the CIP at\n https://cips.cardano.org/cips/cip68/.\nCIP68 { metadata: Dict&lt;Data, Data&gt;, version: Int }\n",
    url: "assist/types/cip68.html#CIP68",
  },
  {
    doc: "assist/types/cip68",
    title: "prefix_100",
    content:
      "prefix_100: ByteArray = #&quot;000643b0&quot;\n (100) Reference Token Prefix\n https://developers.cardano.org/docs/governance/cardano-improvement-proposals/cip-0068/#222-nft-standard",
    url: "assist/types/cip68.html#prefix_100",
  },
  {
    doc: "assist/types/cip68",
    title: "prefix_222",
    content:
      "prefix_222: ByteArray = #&quot;000de140&quot;\n (222) Non-Fungible Token Prefix\n https://developers.cardano.org/docs/governance/cardano-improvement-proposals/cip-0068/#222-nft-standard",
    url: "assist/types/cip68.html#prefix_222",
  },
  {
    doc: "assist/types/cip68",
    title: "prefix_333",
    content:
      "prefix_333: ByteArray = #&quot;0014df10&quot;\n (333) Fungible Token Prefix\n https://developers.cardano.org/docs/governance/cardano-improvement-proposals/cip-0068/#333-ft-standard",
    url: "assist/types/cip68.html#prefix_333",
  },
  {
    doc: "assist/types/cip68",
    title: "prefix_444",
    content:
      "prefix_444: ByteArray = #&quot;001bc280&quot;\n (444) Rich-Fungible Token Prefix\n https://developers.cardano.org/docs/governance/cardano-improvement-proposals/cip-0068/#333-ft-standard",
    url: "assist/types/cip68.html#prefix_444",
  },
  {
    doc: "assist/types/cip68",
    title: "assist/types/cip68",
    content: "",
    url: "assist/types/cip68.html",
  },
  {
    doc: "assist/data",
    title: "input_datum",
    content:
      "input_datum(possible_input: Input) -&gt; Data\n Find the datum data on an input or error. The data is assumed\n to be an inline datum.\n\n ```aiken\n expect datum: Datum = data.input_datum(this_input)\n ```",
    url: "assist/data.html#input_datum",
  },
  {
    doc: "assist/data",
    title: "input_datum_by_hash",
    content:
      "input_datum_by_hash(\n  possible_input: Input,\n  datums: Dict&lt;Hash&lt;Blake2b_256, Data&gt;, Data&gt;,\n) -&gt; Data\n Find the datum data on a input by the datum hash or error. The\n data is assumed to be embedded data and must be referenced by\n its hash.\n\n ```aiken\n expect datum: Datum = data.input_datum_by_hash(this_input, these_datums)\n ```",
    url: "assist/data.html#input_datum_by_hash",
  },
  {
    doc: "assist/data",
    title: "metadata",
    content:
      "metadata(metadata: Dict&lt;Data, Data&gt;, key: Data) -&gt; Data\n Find some data from the metadata or fail. The key and value can be \n arbitrary data. This function is designed to work on the CIP68 generic\n type.\n\n ```aiken\n expect datum: Data = data.metadata(cip68.metadatum, datum.data_key)\n ```",
    url: "assist/data.html#metadata",
  },
  {
    doc: "assist/data",
    title: "output_datum",
    content:
      "output_datum(possible_output: Output) -&gt; Data\n Find the datum data on an output or error. The data is assumed\n to be an inline datum.\n\n ```aiken\n expect datum: Datum = data.output_datum(that_output)\n ```",
    url: "assist/data.html#output_datum",
  },
  {
    doc: "assist/data",
    title: "output_datum_by_hash",
    content:
      "output_datum_by_hash(\n  possible_output: Output,\n  datums: Dict&lt;Hash&lt;Blake2b_256, Data&gt;, Data&gt;,\n) -&gt; Data\n Find the datum data on an output or error. The data is assumed\n to be embedded.\n\n ```aiken\n expect datum: Datum = data.output_datum_by_hash(that_output, these_datums)\n ```",
    url: "assist/data.html#output_datum_by_hash",
  },
  {
    doc: "assist/data",
    title: "assist/data",
    content:
      " This module contains code for extracting data from a potential inline \n datum found in either an input or output.\n",
    url: "assist/data.html",
  },
  {
    doc: "assist/prefixes",
    title: "callable",
    content:
      "callable: ByteArray = #&quot;ca11ab1e&quot;\n Callable Token Prefix",
    url: "assist/prefixes.html#callable",
  },
  {
    doc: "assist/prefixes",
    title: "database",
    content:
      "database: ByteArray = #&quot;da7aba5e&quot;\n Database Token Prefix",
    url: "assist/prefixes.html#database",
  },
  {
    doc: "assist/prefixes",
    title: "seed",
    content: "seed: ByteArray = #&quot;5eed0e1f&quot;\n Seed Token Prefix",
    url: "assist/prefixes.html#seed",
  },
  {
    doc: "assist/prefixes",
    title: "assist/prefixes",
    content:
      " This module provides token prefixes for labeling unique tokens.\n",
    url: "assist/prefixes.html",
  },
  {
    doc: "assist/types/wallet",
    title: "is_valid",
    content:
      "is_valid(wallet: Wallet) -&gt; Bool\n Check if a wallet has a bad form and needs to be bypassed.\n The pkh must be the length 56 hex string and the sc is either empty or\n it is also a length 56 hex string.\n\n ```aiken\n wallet.is_valid(datum.wallet)\n ```",
    url: "assist/types/wallet.html#is_valid",
  },
  {
    doc: "assist/types/wallet",
    title: "to_vks",
    content:
      "to_vks(wallets: Wallets) -&gt; List&lt;PublicKeyHash&gt;\n Convert a list of wallets into a list of public key hashes. This is useful\n when doing multisig validation. The output order respects the input order.\n\n ```aiken\n wallet.to_vks(datum.wallets)\n ```",
    url: "assist/types/wallet.html#to_vks",
  },
  {
    doc: "assist/types/wallet",
    title: "Wallet",
    content:
      "Wallet {\n  pkh: PublicKeyHash,\n  sc: PublicKeyHash,\n}\n A wallet type for a non-smart contract address.\nWallet { pkh: PublicKeyHash, sc: PublicKeyHash }\n",
    url: "assist/types/wallet.html#Wallet",
  },
  {
    doc: "assist/types/wallet",
    title: "Wallets",
    content:
      "Wallets = List&lt;Wallet&gt;\n A list of wallets for non-smart contract addresses.\n",
    url: "assist/types/wallet.html#Wallets",
  },
  {
    doc: "assist/types/wallet",
    title: "assist/types/wallet",
    content: "",
    url: "assist/types/wallet.html",
  },
  {
    doc: "assist/types/moment",
    title: "is_after",
    content:
      "is_after(m: Moment, vr: ValidityRange) -&gt; Bool\n Check if a validity range of a tx is after a moment.\n This assumes exclusivity.\n\n |start----end|--|lower----upper|\n\n ```aiken\n moment.is_after(datum.moment, this_tx.validity_range)\n ```",
    url: "assist/types/moment.html#is_after",
  },
  {
    doc: "assist/types/moment",
    title: "is_before",
    content:
      "is_before(m: Moment, vr: ValidityRange) -&gt; Bool\n Check if a validity range of a tx is before a moment.\n This assumes exclusivity.\n\n |lower----upper|--|start----end|\n\n ```aiken\n moment.is_before(datum.moment, this_tx.validity_range)\n ```",
    url: "assist/types/moment.html#is_before",
  },
  {
    doc: "assist/types/moment",
    title: "is_contained",
    content:
      "is_contained(m: Moment, vr: ValidityRange) -&gt; Bool\n Check if a validity range is contained within some moment.\n This assumes inclusivity.\n\n |start--|lower----upper|--end|\n\n ```aiken\n moment.is_contained(datum.moment, this_tx.validity_range)\n ```",
    url: "assist/types/moment.html#is_contained",
  },
  {
    doc: "assist/types/moment",
    title: "is_logical",
    content:
      "is_logical(m: Moment) -&gt; Bool\n Check if a moment data structure is logical. \n\n ```aiken\n moment.is_logical(datum.moment)\n ```",
    url: "assist/types/moment.html#is_logical",
  },
  {
    doc: "assist/types/moment",
    title: "shift",
    content:
      "shift(m: Moment, t: Int) -&gt; Moment\n Shifts a moment by some integer amount. This is great for incrementing\n a fixed moment of time, maybe like an epoch boundary by five days.\n\n ```aiken\n moment.shift(this_moment, a_day)\n ```",
    url: "assist/types/moment.html#shift",
  },
  {
    doc: "assist/types/moment",
    title: "Moment",
    content:
      "Moment {\n  start: Int,\n  end: Int,\n}\n A finite moment of time represented as simple start and end integers.\nMoment { start: Int, end: Int }\n",
    url: "assist/types/moment.html#Moment",
  },
  {
    doc: "assist/types/moment",
    title: "Moments",
    content:
      "Moments = List&lt;Moment&gt;\n A finite list of moments of time.\n",
    url: "assist/types/moment.html#Moments",
  },
  {
    doc: "assist/types/moment",
    title: "assist/types/moment",
    content: "",
    url: "assist/types/moment.html",
  },
  {
    doc: "assist/types/hashes",
    title: "PublicKeyHash",
    content:
      "PublicKeyHash = Hash&lt;Blake2b_224, VerificationKey&gt;\n The public key hash, vkey, of an wallet address. Expected to be length 56 and\n is network agnostic. This is a non-smart contract hash. \n",
    url: "assist/types/hashes.html#PublicKeyHash",
  },
  {
    doc: "assist/types/hashes",
    title: "TxHash",
    content:
      "TxHash = Hash&lt;Blake2b_256, Transaction&gt;\n The transaction hash. Its the blake2b 256 of a tx body.\n",
    url: "assist/types/hashes.html#TxHash",
  },
  {
    doc: "assist/types/hashes",
    title: "ValidatorHash",
    content:
      "ValidatorHash = Hash&lt;Blake2b_224, Script&gt;\n The validator hash of a smart contract. Expected to be length 56 and\n is network agnostic. This is a smart contract hash. \n",
    url: "assist/types/hashes.html#ValidatorHash",
  },
  {
    doc: "assist/types/hashes",
    title: "assist/types/hashes",
    content: "",
    url: "assist/types/hashes.html",
  },
  {
    doc: "assist/count",
    title: "inputs_by_addr",
    content:
      "inputs_by_addr(inputs: List&lt;Input&gt;, addr: Address, amount: Int) -&gt; Bool\n Verify that the number of inputs from a specific script is equal to the\n amount intended in the contract. The amount must be exactly the counter.\n\n ```aiken\n count.inputs_by_addr(tx.inputs, this_addr, 1)\n ```",
    url: "assist/count.html#inputs_by_addr",
  },
  {
    doc: "assist/count",
    title: "inputs_by_datum",
    content:
      "inputs_by_datum(inputs: List&lt;Input&gt;, amount: Int) -&gt; Bool\n Verify that the number of inputs with an inline datum or datum hash is equal to the\n number intended in the contract. The amount must be exactly the counter.\n\n ```aiken\n count.inputs_by_datum(tx.inputs, 1)\n ```",
    url: "assist/count.html#inputs_by_datum",
  },
  {
    doc: "assist/count",
    title: "inputs_by_vkh",
    content:
      "inputs_by_vkh(inputs: List&lt;Input&gt;, amount: Int) -&gt; Bool\n Count the number of inputs with a payment credential that is a script.\n This does not take in an address but is a general count of validator hashes.\n\n ```aiken\n count.inputs_by_vkh(tx.inputs, 1)\n ```",
    url: "assist/count.html#inputs_by_vkh",
  },
  {
    doc: "assist/count",
    title: "outputs_by_addr",
    content:
      "outputs_by_addr(outputs: List&lt;Output&gt;, addr: Address, amount: Int) -&gt; Bool\n Verify that the number of outputs from a specific script is equal the amount\n intended in the contract. The amount must be exact with the counter.\n\n ```aiken\n count.outputs_by_addr(tx.outputs, this_addr, 1)\n ```",
    url: "assist/count.html#outputs_by_addr",
  },
  {
    doc: "assist/count",
    title: "outputs_by_datum",
    content:
      "outputs_by_datum(outputs: List&lt;Output&gt;, amount: Int) -&gt; Bool\n Verify that the number of outputs with an inline datum or datum hash is equal to the\n number intended in the contract. The amount must be exactly the counter.\n\n ```aiken\n count.outputs_by_datum(tx.outputs, 1)\n ```",
    url: "assist/count.html#outputs_by_datum",
  },
  {
    doc: "assist/count",
    title: "outputs_by_vkh",
    content:
      "outputs_by_vkh(outputs: List&lt;Output&gt;, amount: Int) -&gt; Bool\n Count the number of outputs with a payment credential that is a script.\n This does not take in an address but is a general count of validator hashes.\n\n ```aiken\n count.outputs_by_vkh(tx.outputs, 1)\n ```",
    url: "assist/count.html#outputs_by_vkh",
  },
  {
    doc: "assist/count",
    title: "single_input_with_bypass",
    content:
      "single_input_with_bypass(\n  inputs: List&lt;Input&gt;,\n  this_addr: Address,\n  those_addrs: List&lt;Address&gt;,\n) -&gt; Bool\n The contract can only be spent by itself or along side some list of know \n addresses. Loop all the inputs and count how many datums belong to this \n address. If any of those addresses exists then pass right over them but if \n anything else is found then fail. This should prevent unregulated contracts\n from being spent along side this script.\n\n ```aiken\n count.single_input_with_bypass(this_tx.inputs, this_addr, [that_addr])\n ```\n",
    url: "assist/count.html#single_input_with_bypass",
  },
  {
    doc: "assist/count",
    title: "assist/count",
    content:
      " This module contains code to accurately count the number of inputs and\n outputs in a transaction containing an address or a datum.\n",
    url: "assist/count.html",
  },
  {
    doc: "assist/maths",
    title: "base_q",
    content:
      "base_q(n: Int, q: Int) -&gt; List&lt;Int&gt;\n Convert a integer `n` into some base `q`. This method\n should scale with any integer and any logical base.\n\n ```aiken\n maths.base_q(123, 7)\n ```",
    url: "assist/maths.html#base_q",
  },
  {
    doc: "assist/maths",
    title: "decay",
    content:
      "decay(start_amt: Int, scale: Int, num: Int) -&gt; Int\n Decay some starting amount logarithmically until zero. The function evaluates\n `y = a - log(n)` and when `n &gt;= 2^a` the function equals zero but will return\n zero whenever the result is less than the scale. This is a great\n way to reduce some integer amount of something over time by incrementing `n`.\n\n ```aiken\n maths.decay(start_amount, lovelace_scaling, datum.current_int)\n ```",
    url: "assist/maths.html#decay",
  },
  {
    doc: "assist/maths",
    title: "effective_ratio",
    content:
      "effective_ratio(amt: Int, pct: Int, scale: Int) -&gt; Int\n Calculates the ratio of the amount `amt` multiplied by the scale by the\n percentage `pct`. The scale allows for finer calculations.\n\n ```aiken\n maths.effective_ratio(123456789, 40, 1000) == 3086419725\n ```",
    url: "assist/maths.html#effective_ratio",
  },
  {
    doc: "assist/maths",
    title: "from_int",
    content:
      "from_int(self: Int) -&gt; ByteArray\n Convert a integer into a hexadecimal bytearray. This works for all integers\n but odd length bytearrays will be prefixed with a zero. This function \n combined with the `to_int` function allows a string to represent a number\n and still be used for calculations, pushing the `2^64 - 1` integer boundary.\n\n ```aiken\n maths.from_int(44203)\n ```",
    url: "assist/maths.html#from_int",
  },
  {
    doc: "assist/maths",
    title: "gcd",
    content:
      "gcd(a: Int, b: Int) -&gt; Int\n Computes greatest common divisor of two numbers.\n\n ```aiken\n maths.gcd(20, 15)\n ```",
    url: "assist/maths.html#gcd",
  },
  {
    doc: "assist/maths",
    title: "is_in_range",
    content:
      "is_in_range(n: Int, lb: Int, ub: Int) -&gt; Bool\n Verify that some integer `n` is greater than the lower bound, `lb`, and\n less than or equal to the upper bound, `ub`. The function is exclusive\n for `lb` but inclusive for `lb + 1`.\n\n ```aiken\n maths.is_in_range(5, 0, 10)\n ```",
    url: "assist/maths.html#is_in_range",
  },
  {
    doc: "assist/maths",
    title: "legendre_symbol",
    content:
      "legendre_symbol(a: Int, p: Int) -&gt; Int\n Calculate the Legendre symbol `(a/p)` using the Euler&#39;s criterion.\n This implementation assumes that &#39;a&#39; and &#39;p&#39; are positive integers.\n\n ```aiken\n maths.legendre_symbol(10, 19)\n ```",
    url: "assist/maths.html#legendre_symbol",
  },
  {
    doc: "assist/maths",
    title: "list_powmod",
    content:
      "list_powmod(lst: List&lt;Int&gt;, g: Int, q: Int) -&gt; Int\n Computes the power mod product of a list of integers.\n\n ```aiken\n maths.list_pow_mod([1,2,3], 2, 19)\n ```",
    url: "assist/maths.html#list_powmod",
  },
  {
    doc: "assist/maths",
    title: "list_product",
    content:
      "list_product(lst: List&lt;Int&gt;) -&gt; Int\n Computes the product of a list of integers.\n\n ```aiken\n maths.list_product([1,2,3])\n ```",
    url: "assist/maths.html#list_product",
  },
  {
    doc: "assist/maths",
    title: "list_sum",
    content:
      "list_sum(lst: List&lt;Int&gt;) -&gt; Int\n Computes the sum of a list of integers.\n\n ```aiken\n maths.list_sum(list_of_integers)\n ```",
    url: "assist/maths.html#list_sum",
  },
  {
    doc: "assist/maths",
    title: "powmod",
    content:
      "powmod(n: Int, e: Int, q: Int) -&gt; Int\n Calculate `n` to the power of `e` modulo `q` using the exponentiation by \n squaring method. At each multiplication a modulo is calculated, allowing\n very large `n` and `e` values.\n\n ```aiken\n maths.powmod(3, 2, 5)\n ```",
    url: "assist/maths.html#powmod",
  },
  {
    doc: "assist/maths",
    title: "ratio",
    content:
      "ratio(amt: Int, pct: Int) -&gt; Int\n Calculates the ratio of the amount `amt` by a percentage `pct`. This can\n be used to calculate rough percentages. The function `ratio` is just a \n special case of the effective ratio function. \n\n ```aiken\n maths.ratio(123, 40)\n ```",
    url: "assist/maths.html#ratio",
  },
  {
    doc: "assist/maths",
    title: "scaling",
    content:
      "scaling(amt: Int, pct: Int) -&gt; Int\n Find the optimal scaling for a number such that it\n has three trailing zeros. This should be used in combination\n with the effective ratio for optimal calculations.\n\n ```aiken\n maths.scaling(123, 40)\n ```",
    url: "assist/maths.html#scaling",
  },
  {
    doc: "assist/maths",
    title: "to_int",
    content:
      "to_int(self: ByteArray) -&gt; Int\n Convert a hexadecimal bytearray into its base 10 representation. This\n only works with even length bytearrays so arbitrary numbers in hexadecimal\n form will not in general work.\n\n ```aiken\n maths.to_int(#&quot;acab&quot;)\n ```",
    url: "assist/maths.html#to_int",
  },
  {
    doc: "assist/maths",
    title: "large_prime",
    content:
      "large_prime: Int = 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab\n A large prime number. The value is near 4 x 10^114.",
    url: "assist/maths.html#large_prime",
  },
  {
    doc: "assist/maths",
    title: "assist/maths",
    content:
      " This module incorporates code for various mathematical operations.\n",
    url: "assist/maths.html",
  },
  {
    doc: "assist/find",
    title: "first_input_index",
    content:
      "first_input_index(inputs: List&lt;Input&gt;) -&gt; Int\n Find the first input&#39;s output reference index.\n Output references have the form `TxId#Idx`, this function\n extracts the `Idx` part. If nothing is found then error.\n\n ```aiken\n find.first_input_index(tx.inputs)\n ```",
    url: "assist/find.html#first_input_index",
  },
  {
    doc: "assist/find",
    title: "first_input_txid",
    content:
      "first_input_txid(inputs: List&lt;Input&gt;) -&gt; ByteArray\n Find the first input&#39;s output reference transaction id hash.\n Output references have the form `TxId#Idx`, this function\n extracts the `TxId` part. If nothing is found then error.\n\n ```aiken\n find.first_input_txid(tx.inputs)\n ```",
    url: "assist/find.html#first_input_txid",
  },
  {
    doc: "assist/find",
    title: "first_output_datum",
    content:
      "first_output_datum(outputs: List&lt;Output&gt;) -&gt; Data\n Find the first output with an inline datum and return the data.\n If nothing is found then error. This works great for tx with a\n single output and datum or where ordering is irrelevant.\n\n ```aiken\n find.first_output_datum(tx.outputs)\n ```",
    url: "assist/find.html#first_output_datum",
  },
  {
    doc: "assist/find",
    title: "input_by_addr",
    content:
      "input_by_addr(inputs: List&lt;Input&gt;, addr: Address) -&gt; Input\n Find the first occurrence of an input by a specific address. If nothing\n is found then error. The address here is an exact match, so both the\n pkh and sc need to be correct.\n\n ```aiken\n find.input_by_addr(tx.reference_inputs, ref_addr)\n ```",
    url: "assist/find.html#input_by_addr",
  },
  {
    doc: "assist/find",
    title: "input_by_nft",
    content:
      "input_by_nft(inputs: List&lt;Input&gt;, pid: PolicyId, tkn: AssetName) -&gt; Input\n Find the first occurance of an inline datum on an output with a value \n that contains a specific nft.",
    url: "assist/find.html#input_by_nft",
  },
  {
    doc: "assist/find",
    title: "input_by_ref",
    content:
      "input_by_ref(inputs: List&lt;Input&gt;, out_ref: OutputReference) -&gt; Input\n Find an input by an output reference. If nothing is found then error. \n Similar to the builtin function in stdlib but auto errors instead of\n returning an `Option`.\n\n ```aiken\n find.input_by_ref(tx.inputs, out_ref)\n ```",
    url: "assist/find.html#input_by_ref",
  },
  {
    doc: "assist/find",
    title: "output_by_addr",
    content:
      "output_by_addr(outputs: List&lt;Output&gt;, addr: Address) -&gt; Output\n Find the first occurrence of an output by a specific address. If nothing\n is found then error. The address here is an exact match.\n\n ```aiken\n find.output_by_addr(tx.outputs, your_address)\n ```",
    url: "assist/find.html#output_by_addr",
  },
  {
    doc: "assist/find",
    title: "output_by_addr_value",
    content:
      "output_by_addr_value(\n  outputs: List&lt;Output&gt;,\n  addr: Address,\n  value: Value,\n) -&gt; Output\n Return the first occurrence of an output that contains at least some specific\n value at some address. If nothing is found then error. This function\n does not search for an exact UTxO match.\n\n ```aiken\n find.output_by_addr_value(tx.outputs, wallet_addr, just_token_value)\n ```",
    url: "assist/find.html#output_by_addr_value",
  },
  {
    doc: "assist/find",
    title: "output_by_value",
    content:
      "output_by_value(outputs: List&lt;Output&gt;, value: Value) -&gt; Output\n Return the first occurrence of an output that contains at least some specific\n value. If nothing is found then error. This function\n does not search for an exact UTxO match.\n\n ```aiken\n find.output_by_value(tx.outputs, just_token_value)\n ```",
    url: "assist/find.html#output_by_value",
  },
  {
    doc: "assist/find",
    title: "output_datum_by_addr",
    content:
      "output_datum_by_addr(outputs: List&lt;Output&gt;, addr: Address) -&gt; Data\n Find the first occurence of output datum by some address. If nothing is\n found then error.\n\n ```aiken\n expect datum: Datum = find.output_datum_by_addr(tx.outputs, this_addr)\n ```",
    url: "assist/find.html#output_datum_by_addr",
  },
  {
    doc: "assist/find",
    title: "output_datum_by_nft",
    content:
      "output_datum_by_nft(\n  outputs: List&lt;Output&gt;,\n  pid: PolicyId,\n  tkn: AssetName,\n) -&gt; Data\n Find the first occurance of an inline datum on an output with a value \n that contains a specific nft.",
    url: "assist/find.html#output_datum_by_nft",
  },
  {
    doc: "assist/find",
    title: "redeemer_by_ref",
    content:
      "redeemer_by_ref(\n  redeemers: Dict&lt;ScriptPurpose, Redeemer&gt;,\n  out_ref: OutputReference,\n) -&gt; Data\n Find a redeemer data by an output reference. This is good for checking\n if a specific redeemer is being used on some specific UTxO inside \n the transaction.\n\n ```aiken\n find.redeemer_by_ref(tx.redeemers, that_out_ref)\n ```",
    url: "assist/find.html#redeemer_by_ref",
  },
  {
    doc: "assist/find",
    title: "stake_reward_by_sc",
    content:
      "stake_reward_by_sc(\n  withdraws: Dict&lt;StakeCredential, Int&gt;,\n  stake_credential: StakeCredential,\n) -&gt; Int\n Find the staking reward amount in loveace for some stake credential.\n If no rewards are available then error. This is a great method for\n checking on-chain staking rewards and withdrawal validation.\n\n ```aiken\n find.stake_reward_by_sc(tx.withdrawals, datum.wallet.sc)\n ```",
    url: "assist/find.html#stake_reward_by_sc",
  },
  {
    doc: "assist/find",
    title: "assist/find",
    content:
      " This module contains code for finding various aspects of \n a validating transaction.\n",
    url: "assist/find.html",
  },
  {
    doc: "assist/std",
    title: "out_ref",
    content:
      "out_ref(tx_id_hash: ByteArray, idx: Int) -&gt; OutputReference\n Create an `OutputReference` from the `TxId#Idx` information. This is useful\n for building correct output references of specific UTxOs. It can be combined\n with the `find` module for some very convenient requests.\n\n ```aiken\n std.out_ref(that_tx_id, that_tx_idx)\n ```",
    url: "assist/std.html#out_ref",
  },
  {
    doc: "assist/std",
    title: "assist/std",
    content:
      " This module incorporates additional code that expands the\n functionality of the standard library.\n",
    url: "assist/std.html",
  },
  {
    doc: "assist/values",
    title: "compute_hash",
    content:
      "compute_hash(target: Value) -&gt; ByteArray\n Compute the sha3_256 hash of a value by merklizing the policy id, asset\n name, and quantity. Empty values return the empty by string.\n\n ```aiken\n values.compute_hash(validating_value)\n ```",
    url: "assist/values.html#compute_hash",
  },
  {
    doc: "assist/values",
    title: "contains",
    content:
      "contains(target: Value, total: Value) -&gt; Bool\n Prove that the target value is contained inside another value. Each token\n inside the target must exist inside the total value. The quantity of each\n token must be at least the target amount or greater.\n\n ```aiken\n values.contains(payment_value, output_value)\n ```",
    url: "assist/values.html#contains",
  },
  {
    doc: "assist/values",
    title: "from_token",
    content:
      "from_token(token: Token) -&gt; Value\n Creates a Value type from a token.\n\n ```aiken\n values.from_token(this_token)\n ```",
    url: "assist/values.html#from_token",
  },
  {
    doc: "assist/values",
    title: "from_tokens",
    content:
      "from_tokens(tokens: Tokens) -&gt; Value\n Creates a Value type from a list of tokens.\n\n ```aiken\n values.from_tokens(redeemer.tokens)\n ```",
    url: "assist/values.html#from_tokens",
  },
  {
    doc: "assist/values",
    title: "multiply",
    content:
      "multiply(val: Value, n: Int) -&gt; Value\n Multiply some value by `n`. This is just a linear scaling to the quantity\n of each token.\n\n ```aiken\n values.multiply(bundle_value, bundle_size)\n ```",
    url: "assist/values.html#multiply",
  },
  {
    doc: "assist/values",
    title: "prove_exact_nft",
    content:
      "prove_exact_nft(\n  nft_pid: PolicyId,\n  nft_tkn: AssetName,\n  total_value: Value,\n) -&gt; Bool\n Proves that inside some value there is a policy id with token\n name that has a quantity of 1. This will show that a value contains an\n NFT or something that is nft-like. Should be useful to prove that\n something is holding a token inside a transaction when the policy id and\n token name is known.\n\n ```aiken\n values.prove_exact_nft(pid, tkn, that_value)\n ```",
    url: "assist/values.html#prove_exact_nft",
  },
  {
    doc: "assist/values",
    title: "prove_nft",
    content:
      "prove_nft(pid: PolicyId, total: Value) -&gt; Bool\n Proves that inside some value there is a policy id with a single token\n name that has a quantity of 1. This will show that a value contains an\n NFT or something that is nft-like. Should be useful to prove that\n something is holding a token inside a transaction when the token name\n is assumed to be unique.\n\n ```aiken\n values.prove_nft(pid, this_value)\n ```",
    url: "assist/values.html#prove_nft",
  },
  {
    doc: "assist/values",
    title: "unique_token_name",
    content:
      "unique_token_name(txid: TxHash, idx: Int, prefix: ByteArray) -&gt; AssetName\n Calculate a unique token name from a `TxId#Idx` and prefix. Can be combined\n with the `find` module to create unique token names from the first input\n utxo inside the transaction.\n\n ```aiken\n values.unique_token_name(tx_id, tx_idx, cip68.prefix_333)\n ```",
    url: "assist/values.html#unique_token_name",
  },
  {
    doc: "assist/values",
    title: "assist/values",
    content:
      " This module contains code that aids in various value \n manipulations and comparisons.\n",
    url: "assist/values.html",
  },
  {
    doc: "assist/payout",
    title: "at_least",
    content:
      "at_least(\n  payout_address: Address,\n  payout_value: Value,\n  outputs: List&lt;Output&gt;,\n) -&gt; Bool\n Find the first occurrence of an output that contains at least some specific\n value at some address. If nothing is found then return False. This function\n does not search for an exact UTxO match.\n\n ```aiken\n payout.at_least(wallet_addr, just_token_value, tx.outputs)\n ```",
    url: "assist/payout.html#at_least",
  },
  {
    doc: "assist/payout",
    title: "cont",
    content:
      "cont(payout_address: Address, outputs: List&lt;Output&gt;) -&gt; Bool\n Find the first occurrence of an output at some address. If nothing is \n found then return False. This function does not search by value.\n\n ```aiken\n payout.cont(that_script_addr, tx.outputs)\n ```",
    url: "assist/payout.html#cont",
  },
  {
    doc: "assist/payout",
    title: "exact",
    content:
      "exact(\n  payout_address: Address,\n  payout_value: Value,\n  outputs: List&lt;Output&gt;,\n) -&gt; Bool\n Find the first occurrence of an exact output that matches a specific\n address and value. If nothing is found then return False.\n\n ```aiken\n payout.exact(wallet_addr, validating_value, tx.outputs)\n ```",
    url: "assist/payout.html#exact",
  },
  {
    doc: "assist/payout",
    title: "assist/payout",
    content:
      " This module contains code that assists with payout logic. Payout\n functions are designed to return a boolean value instead of an error.\n",
    url: "assist/payout.html",
  },
  {
    doc: "assist/addresses",
    title: "create_address",
    content:
      "create_address(pkh: PublicKeyHash, sc: PublicKeyHash) -&gt; Address\n Creates a enterprise or base address from the public key hash and stake\n credential. An empty sc means enterpise address by default. This function\n assumes proper key lengths for `pkh` and `sc`.\n\n ```aiken\n addresses.create_address(datum.wallet.pkh, datum.wallet.sc)\n ```",
    url: "assist/addresses.html#create_address",
  },
  {
    doc: "assist/addresses",
    title: "create_script_address",
    content:
      "create_script_address(vkh: ValidatorHash, sc: ValidatorHash) -&gt; Address\n Creates a script address for a smart contract. The type does not mix address\n types. Staked smart contracts are contracts as well. An empty sc is\n assumed to be not staked. This function assumes proper key lengths for `vkh`\n and `sc`.\n\n ```aiken\n addresses.create_script_address(datum.script.vkh, datum.script.sc)\n ```",
    url: "assist/addresses.html#create_script_address",
  },
  {
    doc: "assist/addresses",
    title: "from_wallet",
    content:
      "from_wallet(wallet: Wallet) -&gt; Address\n Creates an address from the wallet type.\n\n ```aiken\n let addr: Address = types.from_wallet(this_wallet)\n ```",
    url: "assist/addresses.html#from_wallet",
  },
  {
    doc: "assist/addresses",
    title: "assist/addresses",
    content:
      " This module incorporates code for generating valid wallet and script \n addresses, ensuring their correctness. Empty keys are treated as \n intentional, and address subtypes are not combined nor mixed.\n",
    url: "assist/addresses.html",
  },
  {
    doc: "assist/tx",
    title: "is_spending_input",
    content:
      "is_spending_input(inputs: List&lt;Input&gt;, out_ref: OutputReference) -&gt; Bool\n Check if a specific input by output reference is being spent. This is useful\n when a minting script requires a utxo to be spent but doesn&#39;t need any specific\n information about that input.\n\n ```aiken\n tx.is_spending_input(tx.inputs, output_reference)\n ```",
    url: "assist/tx.html#is_spending_input",
  },
  {
    doc: "assist/tx",
    title: "not_being_spent_from",
    content:
      "not_being_spent_from(\n  validator_hashes: List&lt;ValidatorHash&gt;,\n  inputs: List&lt;Input&gt;,\n) -&gt; Bool\n Given a set of validator hashes prove that none of them are being spent. Assume\n every address is not staked and that the is list is complete.",
    url: "assist/tx.html#not_being_spent_from",
  },
  {
    doc: "assist/tx",
    title: "total_token_amount",
    content:
      "total_token_amount(\n  inputs: List&lt;Input&gt;,\n  pid: PolicyId,\n  tkn: AssetName,\n  threshold: Int,\n) -&gt; Bool\n Calculate the total amount of a token within the set of inputs for the \n transaction and check if it is at least equal to the provided threshold.\n\n ```aiken\n values.total_token_amount(tx.inputs, datum.pid, datum.tkn, datum.threshold)\n ```",
    url: "assist/tx.html#total_token_amount",
  },
  {
    doc: "assist/tx",
    title: "assist/tx",
    content:
      " This module contains code that aids in various transaction\n checks and comparisons.\n",
    url: "assist/tx.html",
  },
  {
    doc: "assist/tests/fake_tx",
    title: "test_bad_input",
    content:
      "test_bad_input() -&gt; Input\n A fake input without datum used for testing.",
    url: "assist/tests/fake_tx.html#test_bad_input",
  },
  {
    doc: "assist/tests/fake_tx",
    title: "test_bad_inputs",
    content: "test_bad_inputs() -&gt; List&lt;Input&gt;\n",
    url: "assist/tests/fake_tx.html#test_bad_inputs",
  },
  {
    doc: "assist/tests/fake_tx",
    title: "test_bad_out_ref",
    content:
      "test_bad_out_ref() -&gt; OutputReference\n Creates an `OutputReference`",
    url: "assist/tests/fake_tx.html#test_bad_out_ref",
  },
  {
    doc: "assist/tests/fake_tx",
    title: "test_bad_output",
    content:
      "test_bad_output() -&gt; Output\n A fake output without datum used for testing.",
    url: "assist/tests/fake_tx.html#test_bad_output",
  },
  {
    doc: "assist/tests/fake_tx",
    title: "test_bad_outputs",
    content: "test_bad_outputs() -&gt; List&lt;Output&gt;\n",
    url: "assist/tests/fake_tx.html#test_bad_outputs",
  },
  {
    doc: "assist/tests/fake_tx",
    title: "test_input",
    content: "test_input() -&gt; Input\n A fake input used for testing.",
    url: "assist/tests/fake_tx.html#test_input",
  },
  {
    doc: "assist/tests/fake_tx",
    title: "test_input_with_datum_hash",
    content:
      "test_input_with_datum_hash() -&gt; Input\n A fake input with a datum hash.",
    url: "assist/tests/fake_tx.html#test_input_with_datum_hash",
  },
  {
    doc: "assist/tests/fake_tx",
    title: "test_inputs",
    content:
      "test_inputs(amt: Int) -&gt; List&lt;Input&gt;\n A fake input used for testing.",
    url: "assist/tests/fake_tx.html#test_inputs",
  },
  {
    doc: "assist/tests/fake_tx",
    title: "test_one_lovelace_input",
    content: "test_one_lovelace_input() -&gt; Input\n",
    url: "assist/tests/fake_tx.html#test_one_lovelace_input",
  },
  {
    doc: "assist/tests/fake_tx",
    title: "test_out_ref",
    content:
      "test_out_ref() -&gt; OutputReference\n Creates an `OutputReference`",
    url: "assist/tests/fake_tx.html#test_out_ref",
  },
  {
    doc: "assist/tests/fake_tx",
    title: "test_output",
    content: "test_output() -&gt; Output\n A fake output used for testing.",
    url: "assist/tests/fake_tx.html#test_output",
  },
  {
    doc: "assist/tests/fake_tx",
    title: "test_output_with_datum_hash",
    content: "test_output_with_datum_hash() -&gt; Output\n",
    url: "assist/tests/fake_tx.html#test_output_with_datum_hash",
  },
  {
    doc: "assist/tests/fake_tx",
    title: "test_script_input",
    content: "test_script_input() -&gt; Input\n A fake input used for testing.",
    url: "assist/tests/fake_tx.html#test_script_input",
  },
  {
    doc: "assist/tests/fake_tx",
    title: "test_signatories",
    content:
      "test_signatories() -&gt; List&lt;ByteArray&gt;\n A fake list of tx signers",
    url: "assist/tests/fake_tx.html#test_signatories",
  },
  {
    doc: "assist/tests/fake_tx",
    title: "test_tx",
    content:
      "test_tx() -&gt; Transaction\n A fake transaction used for testing.",
    url: "assist/tests/fake_tx.html#test_tx",
  },
  {
    doc: "assist/tests/fake_tx",
    title: "DataType",
    content: "DataType = Data\n A `Data`data type\n",
    url: "assist/tests/fake_tx.html#DataType",
  },
  {
    doc: "assist/tests/fake_tx",
    title: "test_datum",
    content:
      "test_datum: ByteArray = #&quot;acabbeeffacecafe&quot;\n A test datum.",
    url: "assist/tests/fake_tx.html#test_datum",
  },
  {
    doc: "assist/tests/fake_tx",
    title: "assist/tests/fake_tx",
    content: " This is for testing only.\n",
    url: "assist/tests/fake_tx.html",
  },
  {
    doc: "assist/signing",
    title: "verify_multisig",
    content:
      "verify_multisig(\n  sigs: List&lt;PublicKeyHash&gt;,\n  vks: List&lt;PublicKeyHash&gt;,\n  minimum: Int,\n) -&gt; Bool\n This counts the number of signatures inside a transaction that are from \n the list of signers then checks if its at least the minimum amount.\n\n ```aiken\n signing.verify_multisig(context.transaction, lst_of_sigs, sig_threshold)\n ```",
    url: "assist/signing.html#verify_multisig",
  },
  {
    doc: "assist/signing",
    title: "verify_sig",
    content:
      "verify_sig(vks: List&lt;PublicKeyHash&gt;, vk: PublicKeyHash) -&gt; Bool\n Check if the list of signatures inside a transaction contains the\n verification key.\n\n ```aiken\n signing.verify_sig(context.transaction, wallet_pkh)\n ```",
    url: "assist/signing.html#verify_sig",
  },
  {
    doc: "assist/signing",
    title: "assist/signing",
    content:
      " This module contains code for verifying transaction signatures. \n It assumes that all signatures provided are verification keys.\n",
    url: "assist/signing.html",
  },
  {
    doc: "assist/certificates",
    title: "create_credential_delegation",
    content:
      "create_credential_delegation(sc: ValidatorHash, pool_id: PoolId) -&gt; Certificate\n Creates a credential delegation for changing the location of the stake.\n This certificate can be used to check if stake is being delegated to\n a specific pool.\n\n ```aiken\n certificates.create_credential_delegation(datum.contract_hash, datum.pool_id)\n ```",
    url: "assist/certificates.html#create_credential_delegation",
  },
  {
    doc: "assist/certificates",
    title: "assist/certificates",
    content:
      " This module incorporates code for generating valid certificates,\n ensuring their correctness. \n",
    url: "assist/certificates.html",
  },
  {
    doc: "assist/types/token",
    title: "add_token_to_value",
    content:
      "add_token_to_value(the_value: Value, token: Token) -&gt; Value\n Add a Token type to a Value type. This should be a very safe way to\n increment a value on a UTxO. The other option is having the redeemer be \n the general Value type and potentially allow badly formed values to be used.\n\n ```aiken\n add_token_to_value(token, this_value)\n ```",
    url: "assist/types/token.html#add_token_to_value",
  },
  {
    doc: "assist/types/token",
    title: "add_tokens_to_value",
    content:
      "add_tokens_to_value(the_value: Value, tokens: Tokens) -&gt; Value\n Add a list of Token types to a Value type. This should be a very safe way to\n increment a value on a UTxO. The other option is having the redeemer be \n the general Value type and potentially allow badly formed values to be used.\n\n ```aiken\n add_tokens_to_value(redeemer.tokens, this_value)\n ```",
    url: "assist/types/token.html#add_tokens_to_value",
  },
  {
    doc: "assist/types/token",
    title: "addition_only",
    content:
      "addition_only(tokens: Tokens) -&gt; Bool\n Check that each token is greater than zero in a list tokens.\n\n ```aiken\n token.addition_only(redeemer.tokens)\n ```",
    url: "assist/types/token.html#addition_only",
  },
  {
    doc: "assist/types/token",
    title: "contains",
    content:
      "contains(target: Tokens, total: Tokens) -&gt; Bool\n Check if a target list of tokens exist inside another list of tokens.\n The token amount must be greater than or equal to the target amount. If\n nothing is found then it returns False.\n\n ```aiken\n token.contains(target, total)\n ```",
    url: "assist/types/token.html#contains",
  },
  {
    doc: "assist/types/token",
    title: "divide",
    content:
      "divide(token: Token, n: Int) -&gt; Token\n Divide a token by some integer. The divisor must be positive. This is\n integer division so the token amount will be rounded towards negative \n infinity.\n\n ```aiken\n token.divide(that_token, 2)\n ```",
    url: "assist/types/token.html#divide",
  },
  {
    doc: "assist/types/token",
    title: "exists",
    content:
      "exists(target: Token, total: Tokens) -&gt; Bool\n Check if a Token exists in a list of Tokens. The amount has to be greater\n than or equal to the target.\n\n ```aiken\n token.exists(target_token, total_tokens)\n ```",
    url: "assist/types/token.html#exists",
  },
  {
    doc: "assist/types/token",
    title: "from_value",
    content:
      "from_value(v: Value) -&gt; Tokens\n Convert a value into a list of tokens. This conversation is a fast way\n to be able to do multiplication on a value.\n\n ```aiken\n token.from_value(this_value)\n ```",
    url: "assist/types/token.html#from_value",
  },
  {
    doc: "assist/types/token",
    title: "multiply",
    content:
      "multiply(token: Token, n: Int) -&gt; Token\n Multiply a token by some integer. This linearly scales the token amount\n on the token.\n\n ```aiken\n token.multiply(that_token, 4)\n ```",
    url: "assist/types/token.html#multiply",
  },
  {
    doc: "assist/types/token",
    title: "negate",
    content:
      "negate(tokens: Tokens) -&gt; Tokens\n Negate all the tokens in the list.\n\n ```aiken\n token.negate(these_tokens)\n ```",
    url: "assist/types/token.html#negate",
  },
  {
    doc: "assist/types/token",
    title: "negative",
    content:
      "negative(tkn: Token) -&gt; Token\n Give the negative of a token.\n\n ```aiken\n token.negative(this_token)\n ```",
    url: "assist/types/token.html#negative",
  },
  {
    doc: "assist/types/token",
    title: "subtraction_only",
    content:
      "subtraction_only(tokens: Tokens) -&gt; Bool\n Check that each token is less than zero in a list tokens.\n\n ```aiken\n token.subtraction_only(redeemer.tokens)\n ```",
    url: "assist/types/token.html#subtraction_only",
  },
  {
    doc: "assist/types/token",
    title: "Token",
    content:
      "Token {\n  pid: PolicyId,\n  tkn: AssetName,\n  amt: Int,\n}\n A token type for a safe single policy id and asset name value.\nToken { pid: PolicyId, tkn: AssetName, amt: Int }\n",
    url: "assist/types/token.html#Token",
  },
  {
    doc: "assist/types/token",
    title: "Tokens",
    content:
      "Tokens = List&lt;Token&gt;\n A tokens type for a safe value as a list of Tokens.\n",
    url: "assist/types/token.html#Tokens",
  },
  {
    doc: "assist/types/token",
    title: "assist/types/token",
    content:
      " A Token is a safe type for some asset on Cardano. A Token can be combined\n with another Token to form Tokens, a list of Token.  This should be a safe\n and clean way to build out the value type inside of datums and redeemers \n instead of building out the value type directly which could be harmful.\n",
    url: "assist/types/token.html",
  },
  {
    doc: "assist/circuits",
    title: "and_",
    content:
      "and_(x: Int, y: Int, p: Int) -&gt; Int\n Performs a logical `AND` operation on two integer values within an arithmetic circuit.\n\n ```aiken\n circuits.and_(1, 1, p)\n ```",
    url: "assist/circuits.html#and_",
  },
  {
    doc: "assist/circuits",
    title: "imply_",
    content:
      "imply_(x: Int, y: Int, p: Int) -&gt; Int\n Performs a logical implication operation on two integer values within an arithmetic circuit.\n \n ```aiken\n circuits.imply_(1, 0, p)\n ```",
    url: "assist/circuits.html#imply_",
  },
  {
    doc: "assist/circuits",
    title: "nand_",
    content:
      "nand_(x: Int, y: Int, p: Int) -&gt; Int\n Performs a logical `NAND` operation on two integer values within an arithmetic circuit.\n \n ```aiken\n circuits.nand_(1, 1, p)\n ```",
    url: "assist/circuits.html#nand_",
  },
  {
    doc: "assist/circuits",
    title: "nor_",
    content:
      "nor_(x: Int, y: Int, p: Int) -&gt; Int\n Performs a logical `NOR` operation on two integer values within an arithmetic circuit.\n \n ```aiken\n circuits.nor_(0, 0, p)\n ```",
    url: "assist/circuits.html#nor_",
  },
  {
    doc: "assist/circuits",
    title: "not_",
    content:
      "not_(x: Int, p: Int) -&gt; Int\n Performs a logical `NOT` operation on an integer value within an arithmetic circuit.\n\n ```aiken\n circuits.not_(1, p)\n ```",
    url: "assist/circuits.html#not_",
  },
  {
    doc: "assist/circuits",
    title: "or_",
    content:
      "or_(x: Int, y: Int, p: Int) -&gt; Int\n Performs a logical `OR` operation on two integer values within an arithmetic circuit..\n \n ```aiken\n circuits.or_(0, 1, p)\n ```",
    url: "assist/circuits.html#or_",
  },
  {
    doc: "assist/circuits",
    title: "xnor_",
    content:
      "xnor_(x: Int, y: Int, p: Int) -&gt; Int\n Performs a logical `XNOR` operation on two integer values within an arithmetic circuit.\n \n ```aiken\n circuits.xnor_(1, 1, p)\n ```",
    url: "assist/circuits.html#xnor_",
  },
  {
    doc: "assist/circuits",
    title: "xor_",
    content:
      "xor_(x: Int, y: Int, p: Int) -&gt; Int\n Performs a logical `XOR` operation on two integer values within an arithmetic circuit.\n\n ```aiken\n circuits.xor_(0, 1, p)\n ```",
    url: "assist/circuits.html#xor_",
  },
  {
    doc: "assist/circuits",
    title: "assist/circuits",
    content:
      " This module contains code to do arithmetic circuit logic on integers.\n All values are assumed to be positive and p is a prime.\n",
    url: "assist/circuits.html",
  },
  {
    doc: "assist/credentials",
    title: "create_stake_credential",
    content:
      "create_stake_credential(sc: ValidatorHash) -&gt; Referenced&lt;Credential&gt;\n Creates a stake credential from the hex encoding of a stake key.\n This can be used to find the reward amount from the withdrawals \n information inside the transaction of the form `Dict&lt;StakeCredential, Int&gt;`.\n\n ```aiken\n credentials.create_stake_credential(datum.contract_hash)\n ```",
    url: "assist/credentials.html#create_stake_credential",
  },
  {
    doc: "assist/credentials",
    title: "assist/credentials",
    content:
      " This module incorporates code for generating valid credentials,\n ensuring their correctness. \n",
    url: "assist/credentials.html",
  },
  {
    doc: "assist/minting",
    title: "by_prefix",
    content:
      "by_prefix(\n  flat: List&lt;(PolicyId, AssetName, Int)&gt;,\n  pid: PolicyId,\n  prefix: AssetName,\n  amt: Int,\n) -&gt; Bool\n This checks if a specific policy id, prefix, and amount exist inside\n the flattened exact value. Instead of searching for exact match, it\n checks if the token name has the correct prefix. This works if\n every token name on the policy id is unique. If found then it returns\n True else False.\n\n ```aiken\n minting.by_prefix(flatten_mint_value, pid, tkn, 1)\n ```",
    url: "assist/minting.html#by_prefix",
  },
  {
    doc: "assist/minting",
    title: "exact",
    content:
      "exact(\n  flat: List&lt;(PolicyId, AssetName, Int)&gt;,\n  pid: PolicyId,\n  tkn: AssetName,\n  amt: Int,\n) -&gt; Bool\n This checks if a specific policy id, token name, and amount exist inside\n the flattened exact value. It is searching for an exact match. If found\n then it returns True else False.\n\n ```aiken\n minting.exact(flatten_mint_value, pid, tkn, 1)\n ```",
    url: "assist/minting.html#exact",
  },
  {
    doc: "assist/minting",
    title: "is_occurring",
    content:
      "is_occurring(\n  flat: List&lt;(PolicyId, AssetName, Int)&gt;,\n  pid: PolicyId,\n  tkn: AssetName,\n) -&gt; Bool\n Prove that a transaction is minting something from a specific policy id \n and token name but the amount does not matter. This is great for lock-n-mint\n style contracts where some logic just needs to check if a mint is occuring\n but not the specifics of the amount being minted or burned. If a mint is\n occurring then it will return True else False.\n\n ```aiken\n minting.is_occurring(flatten_mint_value, pid, tkn)\n ```",
    url: "assist/minting.html#is_occurring",
  },
  {
    doc: "assist/minting",
    title: "assist/minting",
    content:
      " This module incorporates code for various minting and burning validations.\n",
    url: "assist/minting.html",
  },
]);