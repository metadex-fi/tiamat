// import assert from 'assert';
// import { vectorPort } from '../../utils/constants';
// import { SocketServer } from './socketServer';
// import { SocketKupmios } from './socketKupmios';
// import { UtxoPubSub } from '../state/pubSub';
// import { Contract } from '../state/contract';
// import { Hash } from '../../types/general/derived/hash/hash';
// import { Core } from '@blaze-cardano/sdk';

// const args = Deno.args;
// console.log('args:', args);
// assert(
//   args.length === 8,
//   'Usage: deno run src/chain/agents/vector.ts <kupoUrl> <ogmiosUrl> <network> <nexusID> <matrixID> <privateKey> <ownIP> <targetStake>'
// );
// const kupoUrl = args[0];
// const ogmiosUrl = args[1];
// const network = args[2];
// const nexusID = args[3];
// const matrixID = args[4];
// let privateKey = args[5];
// const ownIP = args[6];
// const targetStake = BigInt(parseInt(args[7]));
// const networks = ['Mainnet', 'Preview', 'Preprod', 'Custom'];
// assert(
//   networks.includes(network),
//   `Invalid network: ${network} not in ${networks.concat(', ')}`
// );
// if (privateKey === 'generate') {
//   privateKey = Core.generatePrivateKey();
//   console.log(`Generated private key: ${privateKey}`);
// }
// const socketKupmios = SocketKupmios.createSingleton(kupoUrl, ogmiosUrl);
// console.log('created socketKupmios');
// const utxoSource = UtxoPubSub.createKupmiosSingleton(socketKupmios);
// console.log('created utxoSource');
// console.log('Initializing Blaze');
// const blaze = await Core.Core.new(
//   socketKupmios.kupmiosProvider,
//   network as Core.Network
// );
// console.log('Created blaze for network:', blaze.network);
// blaze.selectWalletFromPrivateKey(privateKey);
// console.log('Selected wallet with address:', blaze.wallet.address);
// const contract = new Contract(
//   blaze.utils,
//   utxoSource,
//   Hash.fromString(nexusID),
//   Hash.fromString(matrixID)
// );
// console.log(
//   'Created contract with nexusID:',
//   nexusID,
//   'and matrixID:',
//   matrixID
// );
// const socketServer: SocketServer = SocketServer.createSingleton(
//   privateKey,
//   ownIP,
//   vectorPort,
//   targetStake,
//   socketKupmios,
//   contract,
//   blaze
// );
// console.log('Created socketServer');
// socketKupmios.startQueryLoop();
// console.log('Started query loop');

// const vectorHandler = socketServer.vectorHandler;
// const ac = socketServer.abortController;
// Deno.serve({
//   port: vectorPort,
//   handler: vectorHandler,
//   signal: ac.signal,
// });
