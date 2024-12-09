import { Generators } from "../../../utils/generators";
import { PObject } from "../fundamental/container/object";
import { PRecord } from "../fundamental/container/record";
import {
  Decrement,
  f,
  MaxDepth,
  PBlueprinted,
  PData,
  PLifted,
  TObjectBP,
} from "../fundamental/type";
import { KeyHash, PKeyHash } from "./hash/keyHash";
import { PSum } from "../fundamental/container/sum";
import { None, Option, POption } from "./option";
import { PInteger } from "../fundamental/primitive/integer";
import { Core } from "@blaze-cardano/sdk";
import { Address as BlazeAddress } from "@blaze-cardano/core";
import { Some } from "./option";
import assert from "assert";
import { addressFromCredentials } from "@blaze-cardano/core";

// type BlazeCredential = {
//   type: Core.CredentialType;
//   hash: Core.Hash28ByteBase16;
// };

/**
 *
 */
export class VerificationKey {
  public readonly typus = "VerificationKey";
  /**
   *
   * @param keyHash
   */
  constructor(public readonly keyHash: KeyHash) {}

  /**
   *
   * @param tabs
   */
  public show = (tabs = ``): string => {
    const tf = tabs + f;
    return `VerificationKeyCredential (\n${tf}keyHash: ${this.keyHash.show(
      tf,
    )}\n${tabs})`;
  };

  /**
   *
   * @param credential
   */
  static fromBlaze(credential: Core.Credential): VerificationKey {
    return new VerificationKey(KeyHash.fromBlazeCredential(credential));
  }

  /**
   *
   * @param type
   */
  public toBlaze = (type: Core.CredentialType): Core.Credential => {
    return Core.Credential.fromCore({
      type,
      hash: this.keyHash.toBlazeDowncast(),
    });
  };
}

/**
 *
 */
class PVerificationKey extends PObject<VerificationKey> {
  /**
   *
   */
  constructor() {
    super(
      new PRecord({
        keyHash: PKeyHash.ptype,
      }),
      VerificationKey,
      `VerificationKey`,
    );
  }

  /**
   *
   * @param data
   */
  public override pblueprint = (
    data: VerificationKey,
  ): {
    VerificationKey: [string];
  } => {
    return {
      VerificationKey: [data.keyHash.toBlaze()], // TODO correct?
    };
  };

  static ptype = new PVerificationKey();
  /**
   *
   */
  static override genPType(): PVerificationKey {
    return PVerificationKey.ptype;
  }
}

// TODO those are scripthashes, not keyhashes
/**
 *
 */
export class Script {
  public readonly typus = "Script";
  /**
   *
   * @param keyHash
   */
  constructor(public readonly keyHash: KeyHash) {}

  /**
   *
   * @param tabs
   */
  public show = (tabs = ``): string => {
    const tf = tabs + f;
    return `ScriptCredential (\n${tf}keyHash: ${this.keyHash.show(
      tf,
    )}\n${tabs})`;
  };

  /**
   *
   * @param credential
   */
  static fromBlaze(credential: Core.Credential): Script {
    return new Script(KeyHash.fromBlazeCredential(credential));
  }

  /**
   *
   * @param type
   */
  public toBlaze = (type: Core.CredentialType): Core.Credential => {
    return Core.Credential.fromCore({
      type,
      hash: this.keyHash.toBlazeDowncast(),
    });
  };
}

// TODO those are scripthashes, not keyhashes
/**
 *
 */
class PScript extends PObject<Script> {
  /**
   *
   */
  constructor() {
    super(
      new PRecord({
        keyHash: PKeyHash.ptype,
      }),
      Script,
      `Script`,
    );
  }

  /**
   *
   * @param data
   */
  public override pblueprint = (
    data: Script,
  ): {
    Script: [string];
  } => {
    return {
      Script: [data.keyHash.toBlaze()], // TODO correct?
    };
  };

  static ptype = new PScript();
  /**
   *
   */
  static override genPType(): PScript {
    return PScript.ptype;
  }
}

export type Credential = VerificationKey | Script;

/**
 *
 */
export class PCredential extends PSum<[VerificationKey, Script]> {
  /**
   *
   */
  constructor() {
    super([PVerificationKey.ptype, PScript.ptype]);
  }

  static ptype = new PCredential();
  /**
   *
   */
  static override genPType(): PCredential {
    return PCredential.ptype;
  }
}

/**
 *
 */
export class Inline<Of> {
  public readonly typus = "Inline";
  /**
   *
   * @param of
   */
  constructor(
    public readonly of: Of, // TODO check if this works
  ) {}

  /**
   *
   * @param tabs
   */
  public show(tabs = ``): string {
    const tf = tabs + f;
    // @ts-ignore FIXME
    return `Inline ${this.of.show(tf)}`;
  }
}

type AAA<POf extends PData> = TObjectBP<Inline<PLifted<POf>>>;
type BBB = AAA<PCredential>;

/**
 *
 */
class PInline<POf extends PData> extends PObject<Inline<PLifted<POf>>> {
  /**
   *
   * @param pof
   */
  constructor(public readonly pof: POf) {
    super(
      new PRecord({
        of: pof,
      }),
      Inline<PLifted<POf>>,
      `Inline`,
    );
  }

  /**
   *
   * @param data
   */
  public override pblueprint = (
    data: Inline<PLifted<POf>>,
  ): {
    Inline: [PBlueprinted<POf>];
  } => {
    return {
      Inline: [this.pof.pblueprint(data.of)], // TODO correct?
    };
  };

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static override genPType<POf extends PData>(
    gen: Generators,
    maxDepth: bigint,
  ): PInline<POf> {
    const pof: POf = gen.generate(maxDepth) as POf;
    return new PInline<POf>(pof);
  }
}

/**
 *
 */
export class Pointer {
  public readonly typus = "Pointer";
  /**
   *
   * @param slotNumber
   * @param transactionIndex
   * @param certificateIndex
   */
  constructor(
    public readonly slotNumber: bigint,
    public readonly transactionIndex: bigint,
    public readonly certificateIndex: bigint,
  ) {}

  /**
   *
   * @param tabs
   */
  public show = (tabs = ``): string => {
    const tf = tabs + f;
    return `Pointer (\n${tf}slotNumber: ${this.slotNumber},\n${tf}transactionIndex: ${this.transactionIndex},\n${tf}certificateIndex: ${this.certificateIndex}\n${tabs})`;
  };
}

/**
 *
 */
class PPointer extends PObject<Pointer> {
  /**
   *
   */
  constructor() {
    super(
      new PRecord({
        slotNumber: PInteger.ptype,
        transactionIndex: PInteger.ptype,
        certificateIndex: PInteger.ptype,
      }),
      Pointer,
      `Pointer`,
    );
  }

  static ptype = new PPointer();
  /**
   *
   */
  static override genPType(): PPointer {
    return PPointer.ptype;
  }
}

export type Referenced<Of> = Inline<Of> | Pointer;

/**
 *
 */
export class PReferenced<POf extends PData> extends PSum<
  [Inline<PLifted<POf>>, Pointer]
> {
  /**
   *
   * @param pof
   */
  constructor(public readonly pof: POf) {
    super([new PInline(pof), PPointer.ptype]);
  }

  /**
   *
   * @param gen
   * @param maxDepth
   */
  static override genPType<POf extends PData>(
    gen: Generators,
    maxDepth: bigint,
  ): PReferenced<POf> {
    const pof: POf = gen.generate(maxDepth) as POf;
    return new PReferenced<POf>(pof);
  }
}

/**
 *
 */
export class Address {
  public readonly typus = "Address";
  /**
   *
   * @param paymentCredential
   * @param stakeCredential
   */
  constructor(
    public readonly paymentCredential: Credential,
    public readonly stakeCredential: Option<Referenced<Credential>>,
  ) {}

  /**
   *
   * @param tabs
   */
  public show = (tabs = ``): string => {
    const tf = `${tabs}${f}`;
    return `Address (\n${tf}paymentCredential: ${this.paymentCredential.show(
      tf,
    )},\n${tf}stakeCredential: ${this.stakeCredential.show(tf)}\n${tabs})`;
  };

  // TODO rather ugly
  /**
   *
   * @param networkId
   * @param type
   */
  public toBlaze = (
    networkId: Core.NetworkId,
    type: Core.CredentialType,
  ): BlazeAddress => {
    console.log(`Address.toBlaze`);
    const paymentCredential: Core.Credential =
      this.paymentCredential.toBlaze(type);
    let stakeCredential: Core.Credential | undefined = undefined;
    if (this.stakeCredential instanceof Some) {
      const stakeCredential_ = this.stakeCredential.of;
      assert(
        stakeCredential_ instanceof Inline,
        `Address.toBlaze: stakeCredential not Inline`,
      );
      stakeCredential = stakeCredential_.of.toBlaze(type);
    }
    const address = addressFromCredentials(
      networkId,
      paymentCredential,
      stakeCredential,
    );
    console.log(`Address.toBlaze: ${address}`);
    return address;
  };

  /**
   *
   * @param address
   */
  static fromBlaze(address: BlazeAddress): Address {
    const props = address.getProps();
    assert(props.paymentPart, `Address.fromBlaze: no details`);
    const paymentCredential: Credential =
      props.paymentPart.type === Core.CredentialType.KeyHash
        ? VerificationKey.fromBlaze(Core.Credential.fromCore(props.paymentPart))
        : Script.fromBlaze(Core.Credential.fromCore(props.paymentPart));

    const stakeCredential: Option<Inline<Credential>> = props.delegationPart
      ? new Some(
          new Inline(
            props.delegationPart.type === Core.CredentialType.KeyHash
              ? VerificationKey.fromBlaze(
                  Core.Credential.fromCore(props.delegationPart),
                )
              : Script.fromBlaze(
                  Core.Credential.fromCore(props.delegationPart),
                ),
          ),
        )
      : new None();
    return new Address(paymentCredential, stakeCredential);
  }

  // public asBlueprint = (): {
  //   paymentCredential: { VerificationKey: [string] } | { Script: [string] };
  //   stakeCredential:
  //     | { Inline: [{ VerificationKey: [string] } | { Script: [string] }] }
  //     | {
  //         Pointer: {
  //           slotNumber: bigint;
  //           transactionIndex: bigint;
  //           certificateIndex: bigint;
  //         };
  //       }
  //     | null;
  // } => {
  //   const paymentCredential =
  //     this.paymentCredential instanceof VerificationKeyCredential
  //       ? {
  //           VerificationKey: [this.paymentCredential.keyHash.toString()] as [
  //             string,
  //           ],
  //         }
  //       : { Script: [this.paymentCredential.keyHash.toString()] as [string] };
  //   const stakeCredential =
  //     this.stakeCredential instanceof Some
  //       ? this.stakeCredential.of instanceof Inline
  //         ? {
  //             Inline: [
  //               this.stakeCredential.of.of instanceof VerificationKeyCredential
  //                 ? {
  //                     VerificationKey: [
  //                       this.stakeCredential.of.of.keyHash.toString(),
  //                     ] as [string],
  //                   }
  //                 : {
  //                     Script: [
  //                       this.stakeCredential.of.of.keyHash.toString(),
  //                     ] as [string],
  //                   },
  //             ] as [{ VerificationKey: [string] } | { Script: [string] }],
  //           }
  //         : {
  //             Pointer: {
  //               slotNumber: this.stakeCredential.of.slotNumber,
  //               transactionIndex: this.stakeCredential.of.transactionIndex,
  //               certificateIndex: this.stakeCredential.of.certificateIndex,
  //             },
  //           }
  //       : null;
  //   return { paymentCredential, stakeCredential };
  // };
}

export interface BPAddress {
  paymentCredential: { VerificationKey: [string] } | { Script: [string] };
  stakeCredential:
    | {
        Inline: [
          | {
              VerificationKey: [string];
            }
          | { Script: [string] },
        ];
      }
    | {
        Pointer: {
          slotNumber: bigint;
          transactionIndex: bigint;
          certificateIndex: bigint;
        };
      }
    | null;
}

/**
 *
 */
export class PAddress extends PObject<Address> {
  /**
   *
   */
  constructor() {
    super(
      new PRecord({
        paymentCredential: PCredential.ptype,
        stakeCredential: new POption(new PReferenced(PCredential.ptype)),
      }),
      Address,
      `Address`,
    );
  }

  static ptype = new PAddress();
  /**
   *
   */
  static override genPType(): PAddress {
    return PAddress.ptype;
  }
}
