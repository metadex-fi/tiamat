import { Core } from "@blaze-cardano/sdk";

/**
 * Hard coded protocol parameters for the Cardano ledger.
 * These parameters are used as default values in the absence of network-provided parameters.
 */
export const hardCodedProtocolParams: Core.ProtocolParameters = {
  coinsPerUtxoByte: 4310, // The number of coins per UTXO byte.
  minFeeReferenceScripts: {
    base: 44,
    range: 25600,
    multiplier: 1.2,
  },
  maxTxSize: 16384, // The maximum transaction size.
  minFeeCoefficient: 44, // The minimum fee coefficient.
  minFeeConstant: 155381, // The minimum fee constant.
  maxBlockBodySize: 90112, // The maximum block body size.
  maxBlockHeaderSize: 1100, // The maximum block header size.
  stakeKeyDeposit: 2000000, // The stake key deposit.
  poolDeposit: 500000000, // The pool deposit.
  poolRetirementEpochBound: 18, // The pool retirement epoch bound.
  desiredNumberOfPools: 500, // The desired number of pools.
  poolInfluence: "3/10", // The pool influence.
  monetaryExpansion: "3/1000", // The monetary expansion.
  treasuryExpansion: "1/5", // The treasury expansion.
  minPoolCost: 170000000, // The minimum pool cost.
  protocolVersion: {
    major: 9,
    minor: 0,
  }, // The protocol version.
  maxValueSize: 5000, // The maximum value size.
  collateralPercentage: 150, // The collateral percentage.
  maxCollateralInputs: 3, // The maximum collateral inputs.
  costModels: new Map() // The cost models.
    .set(
      0,
      [
        205665, 812, 1, 1, 1000, 571, 0, 1, 1000, 24177, 4, 1, 1000, 32, 117366,
        10475, 4, 23000, 100, 23000, 100, 23000, 100, 23000, 100, 23000, 100,
        23000, 100, 100, 100, 23000, 100, 19537, 32, 175354, 32, 46417, 4,
        221973, 511, 0, 1, 89141, 32, 497525, 14068, 4, 2, 196500, 453240, 220,
        0, 1, 1, 1000, 28662, 4, 2, 245000, 216773, 62, 1, 1060367, 12586, 1,
        208512, 421, 1, 187000, 1000, 52998, 1, 80436, 32, 43249, 32, 1000, 32,
        80556, 1, 57667, 4, 1000, 10, 197145, 156, 1, 197145, 156, 1, 204924,
        473, 1, 208896, 511, 1, 52467, 32, 64832, 32, 65493, 32, 22558, 32,
        16563, 32, 76511, 32, 196500, 453240, 220, 0, 1, 1, 69522, 11687, 0, 1,
        60091, 32, 196500, 453240, 220, 0, 1, 1, 196500, 453240, 220, 0, 1, 1,
        806990, 30482, 4, 1927926, 82523, 4, 265318, 0, 4, 0, 85931, 32, 205665,
        812, 1, 1, 41182, 32, 212342, 32, 31220, 32, 32696, 32, 43357, 32,
        32247, 32, 38314, 32, 57996947, 18975, 10,
      ],
    )
    .set(
      1,
      [
        205665, 812, 1, 1, 1000, 571, 0, 1, 1000, 24177, 4, 1, 1000, 32, 117366,
        10475, 4, 23000, 100, 23000, 100, 23000, 100, 23000, 100, 23000, 100,
        23000, 100, 100, 100, 23000, 100, 19537, 32, 175354, 32, 46417, 4,
        221973, 511, 0, 1, 89141, 32, 497525, 14068, 4, 2, 196500, 453240, 220,
        0, 1, 1, 1000, 28662, 4, 2, 245000, 216773, 62, 1, 1060367, 12586, 1,
        208512, 421, 1, 187000, 1000, 52998, 1, 80436, 32, 43249, 32, 1000, 32,
        80556, 1, 57667, 4, 1000, 10, 197145, 156, 1, 197145, 156, 1, 204924,
        473, 1, 208896, 511, 1, 52467, 32, 64832, 32, 65493, 32, 22558, 32,
        16563, 32, 76511, 32, 196500, 453240, 220, 0, 1, 1, 69522, 11687, 0, 1,
        60091, 32, 196500, 453240, 220, 0, 1, 1, 196500, 453240, 220, 0, 1, 1,
        1159724, 392670, 0, 2, 806990, 30482, 4, 1927926, 82523, 4, 265318, 0,
        4, 0, 85931, 32, 205665, 812, 1, 1, 41182, 32, 212342, 32, 31220, 32,
        32696, 32, 43357, 32, 32247, 32, 38314, 32, 35892428, 10, 57996947,
        18975, 10, 38887044, 32947, 10,
      ],
    )
    .set(
      2,
      [
        100788, 420, 1, 1, 1000, 173, 0, 1, 1000, 59957, 4, 1, 11183, 32,
        201305, 8356, 4, 16000, 100, 16000, 100, 16000, 100, 16000, 100, 16000,
        100, 16000, 100, 100, 100, 16000, 100, 94375, 32, 132994, 32, 61462, 4,
        72010, 178, 0, 1, 22151, 32, 91189, 769, 4, 2, 85848, 123203, 7305,
        -900, 1716, 549, 57, 85848, 0, 1, 1, 1000, 42921, 4, 2, 24548, 29498,
        38, 1, 898148, 27279, 1, 51775, 558, 1, 39184, 1000, 60594, 1, 141895,
        32, 83150, 32, 15299, 32, 76049, 1, 13169, 4, 22100, 10, 28999, 74, 1,
        28999, 74, 1, 43285, 552, 1, 44749, 541, 1, 33852, 32, 68246, 32, 72362,
        32, 7243, 32, 7391, 32, 11546, 32, 85848, 123203, 7305, -900, 1716, 549,
        57, 85848, 0, 1, 90434, 519, 0, 1, 74433, 32, 85848, 123203, 7305, -900,
        1716, 549, 57, 85848, 0, 1, 1, 85848, 123203, 7305, -900, 1716, 549, 57,
        85848, 0, 1, 955506, 213312, 0, 2, 270652, 22588, 4, 1457325, 64566, 4,
        20467, 1, 4, 0, 141992, 32, 100788, 420, 1, 1, 81663, 32, 59498, 32,
        20142, 32, 24588, 32,
        // 20744,
        // 32,
        // 25933,
        // 32,
        // 24623,
        // 32,
        // 43053543,
        // 10,
        // 53384111,
        // 14333,
        // 10,
        // 43574283,
        // 26308,
        // 10,
        // 16000,
        // 100,
        // 16000,
        // 100,
        // 962335,
        // 18,
        // 2780678,
        // 6,
        // 442008,
        // 1,
        // 52538055,
        // 3756,
        // 18,
        // 267929,
        // 18,
        // 76433006,
        // 8868,
        // 18,
        // 52948122,
        // 18,
        // 1995836,
        // 36,
        // 3227919,
        // 12,
        // 901022,
        // 1,
        // 166917843,
        // 4307,
        // 36,
        // 284546,
        // 36,
        // 158221314,
        // 26549,
        // 36,
        // 74698472,
        // 36,
        // 333849714,
        // 1,
        // 254006273,
        // 72,
        // 2174038,
        // 72,
        // 2261318,
        // 64571,
        // 4,
        // 207616,
        // 8310,
        // 4,
        // 1293828,
        // 28716,
        // 63,
        // 0,
        // 1,
        // 1006041,
        // 43623,
        // 251,
        // 0,
        // 1
      ],
    ),
  // .set(
  //   2,
  //   [
  //     100788,420,1,1,1000,173,0,1,1000,59957,4,1,11183,32,201305,8356,4,16000,
  //     100,16000,100,16000,100,16000,100,16000,100,16000,100,100,100,16000,100,
  //     94375,32,132994,32,61462,4,72010,178,0,1,22151,32,91189,769,4,2,85848,
  //     123203,7305,-900,1716,549,57,85848,0,1,1,1000,42921,4,2,24548,29498,
  //     38,1,898148,27279,1,51775,558,1,39184,1000,60594,1,141895,32,83150,32,
  //     15299,32,76049,1,13169,4,22100,10,28999,74,1,28999,74,1,43285,552,1,44749,
  //     541,1,33852,32,68246,32,72362,32,7243,32,7391,32,11546,32,85848,123203,7305,
  //     -900,1716,549,57,85848,0,1,90434,519,0,1,74433,32,85848,123203,7305,-900,
  //     1716,549,57,85848,0,1,1,85848,123203,7305,-900,1716,549,57,85848,0,1,955506,
  //     213312,0,2,270652,22588,4,1457325,64566,4,20467,1,4,0,141992,32,100788,420,
  //     1,1,81663,32,59498,32,20142,32,24588,32,//20744,32,25933,32,24623,32,43053543,
  //     // 10,53384111,14333,10,43574283,26308,10,16000,100,16000,100,962335,18,2780678,
  //     // 6,442008,1,52538055,3756,18,267929,18,76433006,8868,18,52948122,18,1995836,
  //     // 36,3227919,12,901022,1,166917843,4307,36,284546,36,158221314,26549,36,74698472,
  //     // 36,333849714,1,254006273,72,2174038,72,2261318,64571,4,207616,8310,4,1293828,
  //     // 28716,63,0,1,1006041,43623,251,0,1
  //   ],
  // ),

  prices: {
    memory: 577 / 10000,
    steps: 0.0000721,
  }, // The prices.
  maxExecutionUnitsPerTransaction: {
    memory: 14000000,
    steps: 10000000000,
  }, // The maximum execution units per transaction.
  maxExecutionUnitsPerBlock: {
    memory: 62000000,
    steps: 20000000000,
  }, // The maximum execution units per block.
};
