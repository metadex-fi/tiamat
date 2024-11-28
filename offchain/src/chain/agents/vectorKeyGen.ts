// import assert from 'assert';
// import { Core } from '@blaze-cardano/sdk';

// const args = Deno.args;
// console.log('args:', args);
// assert(
//   args.length === 2,
//   `Usage: deno run --allow-read --allow-net src/chain/agents/vectorKeyGen.ts <network> <numKeys>`
// );
// const network = args[0];
// const numKeys = parseInt(args[1]);
// const networks = ['Mainnet', 'Preview', 'Preprod', 'Custom'];
// assert(
//   networks.includes(network),
//   `Invalid network: ${network} not in ${networks.concat(', ')}`
// );

// const privateKeys = [];
// for (let i = 0; i < numKeys; i++) {
//   const privateKey = Core.generatePrivateKey();
//   privateKeys.push(privateKey);
//   console.log(privateKey);
//   // TODO spit out addresses too
// }

// const blaze = await Core.Core.new(undefined, network as Core.Network);

// console.log(`\n`);

// for (const privateKey of privateKeys) {
//   blaze.selectWalletFromPrivateKey(privateKey);
//   const address = await blaze.wallet.address();
//   console.log(address);
// }
