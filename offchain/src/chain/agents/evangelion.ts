// import assert from 'assert';
// import { Blockfrost, Core } from '@blaze-cardano/sdk';
// import { Asset } from '../../types/general/derived/asset/asset';
// import { Currency } from '../../types/general/derived/asset/currency';
// import { Token } from '../../types/general/derived/asset/token';
// import { Rational } from '../../types/general/derived/rational';
// import { Eva } from './eva';
// import { TiamatParams } from '../../types/tiamat/tiamat';

// // default protocol parameters (TODO don't really belong here)
// // Times are in seconds.
// const min_stake = 1000n;
// const cycle_duration = 60n;
// const margin_duration = 500n; // milliseconds
// const higne_lock = cycle_duration * 3n;
// const num_eigenvectors = 3n;
// const num_support_vectors = 2n;
// const suggested_tip = 10000n;
// const option_fee = new Rational(1n, 1000n);
// const price_tolerance = 100000000n;
// const vesting_rate = new Rational(1n, 1n); // one token per second

// const vesting_policy = Currency.dummy; // will be replaced in genesisChain
// const protocolParams = new TiamatParams(
//   min_stake,
//   cycle_duration,
//   margin_duration,
//   higne_lock,
//   num_eigenvectors,
//   num_support_vectors,
//   suggested_tip,
//   vesting_policy,
//   vesting_rate
// );

// const args = process.argv.slice(2);
// console.log('args:', args);
// assert(
//   args.length === 4,
//   `Usage: deno run --allow-read --allow-net src/chain/agents/evangelion.ts <network> <privateKey> <policy> <token>`
// );
// const network = args[0] as
//   | 'cardano-preview'
//   | 'cardano-preprod'
//   | 'cardano-mainnet'
//   | 'cardano-sanchonet';
// let privateKey = args[1];
// const policy = args[2];
// const token = args[3];
// // because for now we only copied the start times for Mainnet and Preview, and blockfrost (above) for Preview
// const networks = ['cardano-preview']; //["cardano-preview", "cardano-preprod", "cardano-mainnet", "cardano-sanchonet"]
// assert(
//   networks.includes(network),
//   `Invalid network: ${network} not in [\n\t${networks.concat(',\n\t')}\n]`
// );
// if (privateKey === 'generate') {
//   privateKey = Core.generatePrivateKey();
//   console.log(`Generated private key: ${privateKey}`);
// }

// const projectId = process.env.BLOCKFROST_PROJECT_ID;
// assert(projectId, 'BLOCKFROST_PROJECT_ID not set in .env');
// const blockfrostProvider = new Blockfrost({ network, projectId });

// const eigenwert = new Asset(Currency.fromHex(policy), Token.fromString(token));

// // from shelley-genesis
// const shelleySystemStart =
//   network === 'cardano-mainnet'
//     ? '2017-09-23T21:44:51Z'
//     : '2022-10-25T00:00:00Z';
// const genesisTime = new Date(shelleySystemStart).getTime();
// const genesisAlignment = 60 * 1000;
// // NOTE using minutes here for aesthetic reasons

// const neon = new Eva(
//   blockfrostProvider,
//   network,
//   genesisTime,
//   genesisAlignment,
//   privateKey,
//   eigenwert,
//   protocolParams
// );
// await neon.init();
// await neon.genesis();
