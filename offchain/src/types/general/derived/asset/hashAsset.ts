// import { Core } from '@blaze-cardano/sdk';
// import { PObject } from '../../fundamental/container/object';
// import { PRecord } from '../../fundamental/container/record';
// import { Hash, PHash } from '../hash/hash';
// import { Asset } from './asset';
// import { Currency, PCurrency } from './currency';

// // NOTE biggest difference to regular Asset is that tokenName is not decoded/encoded
// // when parsing to/from blaze, as this is not symmetric unless starting with text-strings
// // (here we start with hashes, aka hex-strings).
// export class HashAsset {
//   constructor(
//     public readonly currency: Currency,
//     public readonly token: Hash
//   ) {}

//   public show = (): string => {
//     return `HashAsset (${this.currency.show()}, ${this.token.show()})`;
//   };

//   public concise = (): string => {
//     return `${this.currency.concise()}.${this.token.concise()}`;
//   };

//   public equals = (other: HashAsset): boolean => {
//     return (
//       this.currency.equals(other.currency) && this.token.equals(other.token)
//     );
//   };

//   public next = (skip = 1n): HashAsset => {
//     return new HashAsset(this.currency, this.token.hash(skip));
//   };

//   public get toBlaze(): Core.AssetId {
//     if (this.currency.symbol.length === 0) {
//       throw new Error('HashAsset.toBlaze(): lovelace is not a hash asset');
//       // return "lovelace";
//     } else {
//       return Core.AssetId.fromParts(
//         this.currency.toBlaze(),
//         this.token.toBlaze()
//       );
//     }
//   }

//   public toBlazeWith(amount: bigint): Core.Value {
//     const assetId = this.toBlaze;
//     const multiasset = new Map<Core.AssetId, bigint>();
//     multiasset.set(assetId, amount);
//     return new Core.Value(0n, multiasset);
//   }

//   static fromBlaze(hexAsset: string): HashAsset {
//     try {
//       if (hexAsset === 'lovelace') {
//         throw new Error('HashAsset.fromBlaze(): lovelace is not a hash asset');
//       } else {
//         const unit = Core.fromUnit(hexAsset);
//         return new HashAsset(
//           Currency.fromBlaze(unit.policyId),
//           Hash.fromBlaze(unit.assetName ?? '')
//         );
//       }
//     } catch (e) {
//       throw new Error(`HashAsset.fromBlaze ${hexAsset}:\n${e}`);
//     }
//   }

//   static fromAsset(asset: Asset): HashAsset {
//     try {
//       return new HashAsset(asset.currency, Hash.fromString(asset.token.name));
//     } catch (e) {
//       throw new Error(`HashAsset.fromAsset ${asset.show()}:\n${e}`);
//     }
//   }
// }

// export class PHashAsset extends PObject<HashAsset> {
//   constructor() {
//     super(
//       new PRecord({
//         currency: PCurrency.ptype,
//         token: PHash.ptype,
//       }),
//       HashAsset
//     );
//   }

//   static ptype = new PHashAsset();
//   static override genPType(): PHashAsset {
//     return PHashAsset.ptype;
//   }
// }
