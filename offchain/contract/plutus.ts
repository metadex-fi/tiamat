// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { type Script } from "@blaze-cardano/core";
import { applyParamsToScript, cborToScript } from "@blaze-cardano/uplc";
import { type PlutusData } from "@blaze-cardano/core";

export interface V3MatrixNftPolicy {
  new (
    matrixAddress: {
      paymentCredential: { VerificationKey: [string] } | { Script: [string] };
      stakeCredential:
        | { Inline: [{ VerificationKey: [string] } | { Script: [string] }] }
        | {
            Pointer: {
              slotNumber: bigint;
              transactionIndex: bigint;
              certificateIndex: bigint;
            };
          }
        | null;
    },
    nexus: { policy: string; name: string },
  ): Script;
  _redeemer: PlutusData;
}

export const V3MatrixNftPolicy = Object.assign(
  function (
    matrixAddress: {
      paymentCredential: { VerificationKey: [string] } | { Script: [string] };
      stakeCredential:
        | { Inline: [{ VerificationKey: [string] } | { Script: [string] }] }
        | {
            Pointer: {
              slotNumber: bigint;
              transactionIndex: bigint;
              certificateIndex: bigint;
            };
          }
        | null;
    },
    nexus: { policy: string; name: string },
  ) {
    return cborToScript(
      applyParamsToScript(
        "59079a010100323232323232322225333004323232323253323300a3001300b3754004264646464646466464664664646464444646466002002660106eacc084c088c088c088c088c078dd500b8019129998100008a51132533301e3232323253330223370e00490008a51153330223011002153330223300c3758602c60486ea80748cdc799198079b94337166eb4c064c098dd50009bae3018302637540029010180b98129baa00100213300c3758603060486ea807494ccc08ccdd7980b98129baa00102213253330270011615333027302a0011323253330263015375a6050004264a66604e66e3c038dd7180d98149baa301b302937540022a66604e66e3c020dd7180e18149baa301b302937540022a66604e66e3c0200084ccccccc03c034c06cc0a4dd5000980e18149baa001301d302937540026eacc070c0a4dd50028070110a5014a02940c94ccc09cc05cc0a0dd50008992999814180f98149baa0011323232323232533303130340021330210051533302e3025302f375400626464a666066606c0042660460022a666060604e60626ea800c4c8c8c8c94ccc0dcc0e80084cc09800c4cc094004894ccc0e4008403c4c94ccc0dcc0b8c0e0dd5000899191919191919191919299982218238010980618238068b1bad30450013045002375c608600260860046eb8c104004c104008dd6981f800981f8011bad303d001303937540022c60760042c6eb0c0e0004c0e0008c0d8004c0c8dd50018b0b181a00098181baa00316163032001303200230300013030002302e001302a37540022c605860526ea800458c070c0a0dd50020b1bae30260013029001163300f37566030604a6ea80040285280a5014a06601800490101bad3022002375c604000260460042660060060022940c08c0054ccc068c024c06cdd50018a60103d87a8000132323300100137586022603c6ea805c894ccc080004530103d87a800013232533301f300e3332223253330233012302437540022900009bad30283025375400264a666046602460486ea80045300103d87a80001323300100137566052604c6ea8008894ccc0a0004530103d87a80001323232325333029337220100042a66605266e3c0200084c05ccc0b4dd4000a5eb80530103d87a8000133006006003375a60540066eb8c0a0008c0b0008c0a8004cc03c00c008dd5980a18109baa3014302137540046eb8c04cc084dd50029bae30143021375400a2601a6604600497ae013300400400130240023022001301f301c375400644646600200200644a66603a00229404c94ccc06cc010c080008528899801801800981000091199b8c001337026e3400800400888c94ccc05cc018c060dd50008a5eb7bdb1804dd5980e180c9baa0013300300200122323300100100322533301a00114c103d87a8000132323232533301b3372200e0042a66603666e3c01c0084c024cc07cdd3000a5eb80530103d87a8000133006006003375660380066eb8c068008c078008c070004c004cc05c0452f5c06e952000322222222533301a3011301b375400e2646464a66603a66e3c00801454ccc074cdc78011bae3011301f3754012266e3c004dd71809180f9baa00914a02940dd71808980f1baa3010301e37540046eb8c03cc074dd51807980e9baa001300f301c375464a666036601660386ea80044c94ccc070c04cc074dd500089919191919192999812981400109980a8028a999811180c98119baa0031323232325333029302c00213301900315333026301d3027375400a26464646464646464a666062606800426604000e26603e00644a6660660042a666060604e60626ea800c4c8c8c8c94ccc0dcc0e80084cc08800c4cc088004406458c0e0004c0e0008c0d8004c0c8dd50018b0991801181b8019bae30350021630320013032002375860600026060004605c002605c004605800260506ea80145858c0a8004c0a8008c0a0004c090dd50018b0b18130009813001181200098120011811000980f1baa001163020301d37540022c602060386ea8c03cc070dd5180f980e1baa00716225333014300b30153754004264646464a666036603c00426464a66603460220022a66603a60386ea8014540085854ccc068c0240044c8c94ccc07cc0880085401058dd69810000980e1baa0051533301a300a0011533301d301c375400a2a0042c2c60346ea80105401458c94ccc06cc06800454ccc060cdc4a400860320022c2600e60320022c6ea8c070004c070008c068004c058dd50010b1b8748008dc3a40086eb8c054c048dd500411191980080080191198018009801001112999808180398089baa00213232323232323232323232323232323232325333025302800215333022301930233754002264646464a66605260580042a02e2c6eb4c0a8004c0a8008dd6981400098121baa001161630260013026002375c604800260480046eb4c088004c088008dd6981000098100011bad301e001301e002375a603800260380046eb4c068004c068008dd6980c000980c0011bad3016001301237540042c44a66601e600c60206ea80084c8c8c8c94ccc058c0640085401458dd7180b800980b8011bae3015001301137540042c4602400246022602400246020602260220026e1d200016300d300e002300c001300c002300a0013006375400229309b2b2b9a5573aaae7955cfaba05742ae881",
        [matrixAddress, nexus],
        {
          dataType: "list",
          items: [
            {
              title: "Address",
              description:
                "A Cardano `Address` typically holding one or two credential references.\n\n Note that legacy bootstrap addresses (a.k.a. 'Byron addresses') are\n completely excluded from Plutus contexts. Thus, from an on-chain\n perspective only exists addresses of type 00, 01, ..., 07 as detailed\n in [CIP-0019 :: Shelley Addresses](https://github.com/cardano-foundation/CIPs/tree/master/CIP-0019/#shelley-addresses).",
              anyOf: [
                {
                  title: "Address",
                  dataType: "constructor",
                  index: 0,
                  fields: [
                    {
                      title: "paymentCredential",
                      description:
                        "A general structure for representing an on-chain `Credential`.\n\n Credentials are always one of two kinds: a direct public/private key\n pair, or a script (native or Plutus).",
                      anyOf: [
                        {
                          title: "VerificationKey",
                          dataType: "constructor",
                          index: 0,
                          fields: [{ dataType: "bytes" }],
                        },
                        {
                          title: "Script",
                          dataType: "constructor",
                          index: 1,
                          fields: [{ dataType: "bytes" }],
                        },
                      ],
                    },
                    {
                      title: "stakeCredential",
                      anyOf: [
                        {
                          title: "Some",
                          description: "An optional value.",
                          dataType: "constructor",
                          index: 0,
                          fields: [
                            {
                              description:
                                "Represent a type of object that can be represented either inline (by hash)\n or via a reference (i.e. a pointer to an on-chain location).\n\n This is mainly use for capturing pointers to a stake credential\n registration certificate in the case of so-called pointer addresses.",
                              anyOf: [
                                {
                                  title: "Inline",
                                  dataType: "constructor",
                                  index: 0,
                                  fields: [
                                    {
                                      description:
                                        "A general structure for representing an on-chain `Credential`.\n\n Credentials are always one of two kinds: a direct public/private key\n pair, or a script (native or Plutus).",
                                      anyOf: [
                                        {
                                          title: "VerificationKey",
                                          dataType: "constructor",
                                          index: 0,
                                          fields: [{ dataType: "bytes" }],
                                        },
                                        {
                                          title: "Script",
                                          dataType: "constructor",
                                          index: 1,
                                          fields: [{ dataType: "bytes" }],
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  title: "Pointer",
                                  dataType: "constructor",
                                  index: 1,
                                  fields: [
                                    {
                                      dataType: "integer",
                                      title: "slotNumber",
                                    },
                                    {
                                      dataType: "integer",
                                      title: "transactionIndex",
                                    },
                                    {
                                      dataType: "integer",
                                      title: "certificateIndex",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          title: "None",
                          description: "Nothing.",
                          dataType: "constructor",
                          index: 1,
                          fields: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              title: "Asset",
              anyOf: [
                {
                  title: "Asset",
                  dataType: "constructor",
                  index: 0,
                  fields: [
                    { title: "policy", dataType: "bytes" },
                    { title: "name", dataType: "bytes" },
                  ],
                },
              ],
            },
          ],
        } as any,
      ),
      "PlutusV3",
    );
  },

  { _redeemer: { title: "Data", description: "Any Plutus data." } },
) as unknown as V3MatrixNftPolicy;

export interface V3MatrixSvmValidator {
  new (): Script;
  datum: {
    id: { policy: string; name: string };
    config: { eigenwert: { policy: string; name: string } };
    state: {
      params: {
        minStake: bigint;
        cycleDuration: bigint;
        marginDuration: bigint;
        hingeLock: bigint;
        numEigenvectors: bigint;
        numSupportVectors: bigint;
        suggestedTip: bigint;
        vestingPolicy: string;
        vestingRate: { numerator: bigint; denominator: bigint };
      };
      eigenValues: Array<{
        start: bigint;
        end: bigint;
        vector: string;
        ip: string;
        port: bigint;
      }>;
    };
  };
  redeemer:
    | {
        Revolve: {
          action: {
            vector: string;
            action:
              | { RegisterVector: { ip: string; port: bigint } }
              | "DeregisterVector"
              | "ChangeStake"
              | { UpdateVector: { ip: string; port: bigint } }
              | "ChangeProtocolParams";
          };
        };
      }
    | {
        Halt: {
          action: {
            vector: string;
            action:
              | { RegisterVector: { ip: string; port: bigint } }
              | "DeregisterVector"
              | "ChangeStake"
              | { UpdateVector: { ip: string; port: bigint } }
              | "ChangeProtocolParams";
          };
        };
      }
    | "Wipe";
}

export const V3MatrixSvmValidator = Object.assign(
  function () {
    return cborToScript(
      "590f940101003232323232323225333002323232323253323300830013009375400426464646464664464a666020600800226464a66602a603000426600a0022a0082c602c00260246ea802c54ccc040c0240044c8c94ccc054c0600084cc0140045401058c058004c048dd50058a99980818028008a99980998091baa00b1500216163010375401444a66601e600660206ea80084c8c8c8c94ccc058c0640084c8c94ccc054c0240044c8c8c8c94ccc070c07c0085401858dd6980e800980e8011bae301b001301737540062a66602a601c0022a666030602e6ea800c540085854ccc054c02800454ccc060c05cdd50018a8010b0a99980a99b87480180044c8c8c8c94ccc070c07c0085401858dd6980e800980e8011bae301b001301737540062a66602a66e1d200800115333018301737540062a0042c2c602a6ea80085401458c05c004c05c008dd7180a80098089baa002161533300d3001300e37540062646464646464646464646466646464644464646464646464a66604a6032604c6ea80044c8c8c94ccc0a0c0840044c94ccc0a4c088ccc05c00cdd7180b18159baa00a375c603460566ea802854ccc0a4cdc399980b9bab302e302f302f302f302f302b375404c6eb8c058c0acdd50051bae301a302b375401490008a5014a02940c0b4c0a8dd50118a999814180e8008980e19980b0011bae3015302a37540126eb8c064c0a8dd500489919192999815980f98161baa001132323232325333030302933301e00a375c603a60646ea8044dd7181098191baa011153330303375e0086460426606a606c0026606a606c606e0026606a00897ae0303237540262a6660600022666666666602801a02201e01c01401000600404e05a29405280a50533302f4a2294454ccc0bcc08cc0c0dd5006099191919299981999991119191919299981d1819981d9baa0011323232533303d3036303e3754002266e24cdc00018041bad3042303f37540022940c104c0f8dd5002981e1baa004375a607e60786ea8004528181f181d9baa00330393754004607860726ea800cc0ecc0f0c0e0dd5001981c181c8011812981a9baa030375a6070607260726072606a6ea800c528899980c1bac3026303537540600026eb4c0e0c0e4c0e4c0e4c0e4c0e4c0d4dd50019bac303700130373037002303500130313754603660626ea8c94ccc0c0c094c0c4dd50008992999818981298191baa0011323232323232533303a303d00213302200515333037302b30383754006264646464a66607c608200426604c0062a666076605e60786ea80144c8c8c8c8c8c8c8c94ccc118c1240084cc0b401c4cc0b000c894ccc12000854ccc114c0e4c118dd500189919191929998261827801099818801899818800880c8b18268009826801182580098239baa003161323002304c003375c60940042c608e002608e0046eb0c114004c114008c10c004c10c008c104004c0f4dd50028b0b181f800981f801181e800981c9baa0031616303b001303b002303900130390023037001303337540022c606a60646ea800458c06cc0c4dd5181018189baa3034303137540182c6eacc07cc0c0dd5001980c98179baa00132533302d3022302e3754002264a66605c6044605e6ea80044c8c8c8c8c8c94ccc0dcc0e80084cc07c01454ccc0d0c0a0c0d4dd500189919299981c981e0010998108008a99981b1815181b9baa003132323232533303d304000213302400313302300122533303f002100f132533303d3031303e3754002264646464646464646464a666094609a00426018609a01a2c6eb4c12c004c12c008dd7182480098248011bae30470013047002375a608a002608a0046eb4c10c004c0fcdd50008b18208010b1bac303e001303e002303c001303837540062c2c6074002606c6ea800c5858c0e0004c0e0008c0d8004c0d8008c0d0004c0c0dd50008b181918179baa001163018302e37540026060605a6ea800458cc044dd6180b18161baa0272533302b3375e6030605a6ea80040084c8c94ccc0c0c0cc0084c94ccc0b8c09cdd69818001099b8f375c603e60606ea803c00458dd718170008b1818800992999816181298169baa00114bd6f7b63009bab3031302e3754002660346eacc070c0b4dd50009bae3018302d37540182940c058c0acdd5002181698151baa023302837540446eacc05cc0a0dd5000980b18139baa302a302737540022c660166eb0c044c098dd5010919baf301230273754002038a666046603860486ea9300103d87a800014c103d87a80001323300b3758602a604c6ea80848c078ccc04cdd5980b18139baa3016302737540026eb8c048c09cdd50011bae3016302737540046050604a6ea930103d87a8000302730280023026001302600230240013020375400260020024444a666042004294054ccc08400c528099191919299981119b89001480005288999980400400200100099b81004375a604c0046eb0c094c098004c8c8cc004004014894ccc09400452f5c210100008101800009919299981219b8f00200513233029375066e00dd69815000a4004660526054605600297ae03300400400113233029302a00133029374e660526ea400cdd618151815800a5eb80cc010010004c0a4008dd718138009bae3024004302400322323300100100322533302000114c103d87a800013232533301f30050021300f330230024bd700998020020009812001181100091299980d1807180d9baa002132323232533302130240021323253330203014001153330233022375400a2a0042c2a666040603200226464a66604a60500042a0082c6eb4c098004c088dd50028a999810180a8008a99981198111baa005150021616302037540082a00a2c64a66604260400022a66603c66e252004301f0011613017301f00116375460440026044004604000260386ea800858c8c888888888894ccc090ccc090cc88c8cc00400400c894ccc0ac004528099299981499b8f375c605c00400829444cc00c00c004c0b8004dd6180b98131baa001375c6022604c6ea80152825113232632330010013758603260506ea800c894ccc0a800452f5c02660566ea4dcc18079bae302c00133002002302d001300c375c6022604c6ea80144c8c8c94ccc09d4ccc09ccdc4000a400026601c6eb0c04cc0a4dd5002129998141919198008009bab301b302c375400644a66605c00229404c8c94ccc0b4cdc8802800899b8f005001133004004002375c605a606200460620026eb8c068c0a8dd5002099b873330163756603260546ea8004dd7180a98151baa003375c603260546ea800ccdc0a4000004294052889919299199815180f0010991919299981699b88007375a6034605e6ea80245854ccc0b4cc050dd6180f18179baa01023371e6eb8c068c0c0dd50009bae301b3030375401e2c264600a603c66064606660606ea8044cc0c8dd399819180f198191ba800133032375066e00004020cc0c8c06cc0c0dd5007998191ba900333032375000497ae03758603e60606ea80452f5c064a66606200229000099b80375a603e60606ea8c0cc00520023758603c605e6ea8040dd6981898190011bae3030001302c37540062a66605460460042600260346605c605e60586ea8034cc0b8dd399198008009bac301c302d375401c44a66605e0022c26464a66605ca66605c66e3cdd7180d18181baa002375c603660606ea803c4cdc399b81375a603660606ea8008dd6980f98181baa00200814a02002266064603c660646ea0cdc01bad301b30303754004010660646ea0cdc01bad301f303037540040106068606860606ea8008cc010010004c0cc008c0c40052f5c02a666054603e0042600260346605c605e60586ea8034cc0b8dd399198008009bac301c302d375401c44a66605e0022c26464a66605ca66605c66e3cdd7180d18181baa002375c603660606ea803c4cdc49bad301b3030375401466e04cdc00041bad301f303037540046eb4c06cc0c0dd50010a5013303232301f33033303400133033375066e00dd6981018189baa0030093035303500130303754004002266064603c660646ea0cdc01bad301b30303754004010660646ea0cdc01bad301f303037540040106068606860606ea8008cc010010004c0cc008c0c40052f5c02a66605466e1d20060021323232533302d302100713004301d330313032302f3754020660626e9cc8cc004004dd6180f98181baa011225333032001161323253330313371e6eb8c074c0ccdd50011bae301e3033375402426606a646460466606e60700046606e60700026606e607060720026606e6ea4020cc0dcdd4003a5eb80c0e0004c0ccdd500100089981a80119802002000981b001181a000a5eb805281bad30313032002375c606000260586ea800c58dd780498149baa0013018302937540102940cdc099980a0029bae3013302837540026eb8c05cc0a0dd500099980a0041bae3013302837540026eb8c05cc0a0dd5000980918139baa00930113026375400e44646600200200644a66604000229404c94ccc078c010c08c008528899801801800981180091b9932333001001337006e34009200148900222533301c3371000490000800899191919980300319b8000548004cdc599b80002533301f33710004900a0a40c02903719b8b33700002a66603e66e2000520141481805206e0043370c004901019b8300148080cdc7002001180e980d1baa00e22323300100100322330030013002002225333018300c301937540042646464646464646464646464646464646464a66605a60600042a666054603c60566ea80044c8c8c8c94ccc0c4c0d00085405c58dd6981900098190011bad3030001302c37540022c2c605c002605c0046eb8c0b0004c0b0008dd6981500098150011bad30280013028002375a604c002604c0046eb4c090004c090008dd6981100098110011bad30200013020002375a603c00260346ea800858894ccc05cc02cc060dd5001099191919299980f18108010a8028b1bae301f001301f002375c603a00260326ea8008588c068c06cc06c0048c064004888c94ccc058c03cc05cdd50008a400026eb4c06cc060dd500099299980b1807980b9baa00114c103d87a8000132330010013756603860326ea8008894ccc06c004530103d87a8000132323232533301c337220100042a66603866e3c0200084c030cc080dd4000a5eb80530103d87a8000133006006003375a603a0066eb8c06c008c07c008c074004cc01000c00888c8cc00400400c894ccc060004530103d87a800013232323253330193372200e0042a66603266e3c01c0084c024cc074dd3000a5eb80530103d87a8000133006006003375660340066eb8c060008c070008c068004dd2a40004602a602c00246028602a602a602a602a602a602a602a00246026602860286028602860286028602860280022c6e1d2000370e900218079808001180700098051baa002370e90010b1805980600118050009805001180400098021baa00114984d9595cd2ab9d5573caae7d5d02ba15745",
      "PlutusV3",
    );
  },
  {
    datum: {
      title: "MatrixDatum",
      anyOf: [
        {
          title: "Datum",
          dataType: "constructor",
          index: 0,
          fields: [
            {
              title: "id",
              anyOf: [
                {
                  title: "Asset",
                  dataType: "constructor",
                  index: 0,
                  fields: [
                    { title: "policy", dataType: "bytes" },
                    { title: "name", dataType: "bytes" },
                  ],
                },
              ],
            },
            {
              title: "config",
              anyOf: [
                {
                  title: "MatrixConfig",
                  dataType: "constructor",
                  index: 0,
                  fields: [
                    {
                      title: "eigenwert",
                      anyOf: [
                        {
                          title: "Asset",
                          dataType: "constructor",
                          index: 0,
                          fields: [
                            { title: "policy", dataType: "bytes" },
                            { title: "name", dataType: "bytes" },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              title: "state",
              anyOf: [
                {
                  title: "MatrixState",
                  dataType: "constructor",
                  index: 0,
                  fields: [
                    {
                      title: "params",
                      anyOf: [
                        {
                          title: "TiamatParams",
                          dataType: "constructor",
                          index: 0,
                          fields: [
                            { dataType: "integer", title: "minStake" },
                            { dataType: "integer", title: "cycleDuration" },
                            { dataType: "integer", title: "marginDuration" },
                            { dataType: "integer", title: "hingeLock" },
                            { dataType: "integer", title: "numEigenvectors" },
                            { dataType: "integer", title: "numSupportVectors" },
                            { dataType: "integer", title: "suggestedTip" },
                            { title: "vestingPolicy", dataType: "bytes" },
                            {
                              title: "vestingRate",
                              anyOf: [
                                {
                                  title: "FreeRational",
                                  dataType: "constructor",
                                  index: 0,
                                  fields: [
                                    { dataType: "integer", title: "numerator" },
                                    {
                                      dataType: "integer",
                                      title: "denominator",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      dataType: "list",
                      items: {
                        title: "EigenValue",
                        anyOf: [
                          {
                            title: "EigenValue",
                            dataType: "constructor",
                            index: 0,
                            fields: [
                              { dataType: "integer", title: "start" },
                              { dataType: "integer", title: "end" },
                              { title: "vector", dataType: "bytes" },
                              { dataType: "bytes", title: "ip" },
                              { dataType: "integer", title: "port" },
                            ],
                          },
                        ],
                      },
                      title: "eigenValues",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    redeemer: {
      title: "MatrixRedeemer",
      anyOf: [
        {
          title: "Revolve",
          dataType: "constructor",
          index: 0,
          fields: [
            {
              title: "action",
              anyOf: [
                {
                  title: "MatrixAction",
                  dataType: "constructor",
                  index: 0,
                  fields: [
                    { title: "vector", dataType: "bytes" },
                    {
                      title: "action",
                      anyOf: [
                        {
                          title: "RegisterVector",
                          dataType: "constructor",
                          index: 0,
                          fields: [
                            { dataType: "bytes", title: "ip" },
                            { dataType: "integer", title: "port" },
                          ],
                        },
                        {
                          title: "DeregisterVector",
                          dataType: "constructor",
                          index: 1,
                          fields: [],
                        },
                        {
                          title: "ChangeStake",
                          dataType: "constructor",
                          index: 2,
                          fields: [],
                        },
                        {
                          title: "UpdateVector",
                          dataType: "constructor",
                          index: 3,
                          fields: [
                            { dataType: "bytes", title: "ip" },
                            { dataType: "integer", title: "port" },
                          ],
                        },
                        {
                          title: "ChangeProtocolParams",
                          dataType: "constructor",
                          index: 4,
                          fields: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          title: "Halt",
          dataType: "constructor",
          index: 1,
          fields: [
            {
              title: "action",
              anyOf: [
                {
                  title: "MatrixAction",
                  dataType: "constructor",
                  index: 0,
                  fields: [
                    { title: "vector", dataType: "bytes" },
                    {
                      title: "action",
                      anyOf: [
                        {
                          title: "RegisterVector",
                          dataType: "constructor",
                          index: 0,
                          fields: [
                            { dataType: "bytes", title: "ip" },
                            { dataType: "integer", title: "port" },
                          ],
                        },
                        {
                          title: "DeregisterVector",
                          dataType: "constructor",
                          index: 1,
                          fields: [],
                        },
                        {
                          title: "ChangeStake",
                          dataType: "constructor",
                          index: 2,
                          fields: [],
                        },
                        {
                          title: "UpdateVector",
                          dataType: "constructor",
                          index: 3,
                          fields: [
                            { dataType: "bytes", title: "ip" },
                            { dataType: "integer", title: "port" },
                          ],
                        },
                        {
                          title: "ChangeProtocolParams",
                          dataType: "constructor",
                          index: 4,
                          fields: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        { title: "Wipe", dataType: "constructor", index: 2, fields: [] },
      ],
    },
  },
) as unknown as V3MatrixSvmValidator;

export interface V3NexusNftPolicy {
  new (
    nexusAddress: {
      paymentCredential: { VerificationKey: [string] } | { Script: [string] };
      stakeCredential:
        | { Inline: [{ VerificationKey: [string] } | { Script: [string] }] }
        | {
            Pointer: {
              slotNumber: bigint;
              transactionIndex: bigint;
              certificateIndex: bigint;
            };
          }
        | null;
    },
    nexusId: string,
  ): Script;
  _redeemer: PlutusData;
}

export const V3NexusNftPolicy = Object.assign(
  function (
    nexusAddress: {
      paymentCredential: { VerificationKey: [string] } | { Script: [string] };
      stakeCredential:
        | { Inline: [{ VerificationKey: [string] } | { Script: [string] }] }
        | {
            Pointer: {
              slotNumber: bigint;
              transactionIndex: bigint;
              certificateIndex: bigint;
            };
          }
        | null;
    },
    nexusId: string,
  ) {
    return cborToScript(
      applyParamsToScript(
        "59062101010032323232323232223225333005323232323253323300b3001300c3754004264646646646464646464446464660020026600e6eacc074c078c078c078c078c068dd500900191299980e0008a51132533301a32323232533301e3370e00490008a511533301e30110021533301e3300b3758601c60406ea80608cdc799198071b94337166eb4c050c088dd50009bae3010302237540029010180798109baa00100213300b3758602660406ea806094ccc07ccdd7980798109baa00101e1325333023001161533302330260011323253330223015375a6048004264a66604666e3c038dd7180998129baa3013302537540022a66604666e3c020dd7180b98129baa3013302537540022a66604666e3c0200084cccc8888cdc79bae301b302937540080486026604a6ea8004c05cc094dd5000980c18129baa0013756602e604a6ea80145280a5014a0601c0082c6eb8c088004c09400458cc038dd5980998109baa00100a14a0294052819805801240406eb4c078008dd7180e000980f8010998018018008a50301f0015333016300930173754980103d87a800014c103d87a800013232330010013758601860346ea8048894ccc070004530103d87a800013232533301b300e33322232533301f3012302037540022900009bad30243021375400264a66603e602460406ea80045300103d87a8000132330010013756604a60446ea8008894ccc090004530103d87a80001323232325333025337220100042a66604a66e3c0200084c05ccc0a4dd4000a5eb80530103d87a8000133006006003375a604c0066eb8c090008c0a0008c098004cc03c00c008dd59807980e9baa300f301d37540046eb8c02cc074dd50029bae300f301d375400a2601a6603e00497ae01330040040013020002301e001301b30183754980103d87a800022323300100100322533301a00114a0264a6660306008603a00429444cc00c00c004c07400488ccdc600099b81371a0040020044464a666028600e602a6ea800452f5bded8c026eacc064c058dd5000998020010009180b00091191980080080191299980b0008a60103d87a800013232323253330173372200e0042a66602e66e3c01c0084c024cc06cdd3000a5eb80530103d87a8000133006006003375660300066eb8c058008c068008c060004dd2a40006464464a66602466e1d200430133754002264a666026601260286ea80044c8c8c8c8c8c94ccc070c07c0084cc02801454ccc064c03cc068dd5001899191919299981018118010998070018a99980e9809980f1baa005132323232323232325333028302b00215333025301b3026375400e2646464646464646464646464646464646464a666074607a0042a66606e605a60706ea80044c8c8c8c94ccc0f8c1040084c8cc00400406888c94ccc10400854ccc0f8c0d0c0fcdd500d0991919192999822982400109981a00189981a00088180b18230009823001182200098201baa01a1613230023045003375c608600460040042c6eb4c0fc004c0fc008dd6981e800981c9baa0011616303b001303b002375c607200260720046eb4c0dc004c0dc008dd6981a800981a8011bad30330013033002375a606200260620046eb4c0bc004c0bc008dd6981680098168011bad302b0013027375400e2c2c605200260520046eb0c09c004c09c008c094004c094008c08c004c07cdd50028b0b18108009810801180f800980d9baa0031616301d001301d002301b001301b0023019001301537540022c602e60286ea800458c018c04cdd5000912999808980398091baa0021323232325333018301b0021500516375c603200260320046eb8c05c004c04cdd50010b112999808180318089baa0021323232325333017301a002132325333016300c001153330193018375400a2a0042c2a66602c601200226464a666036603c0042a0082c6eb4c070004c060dd50028a99980b19b874801000454ccc064c060dd50028a8010b0b180b1baa0041500516325333017301600115333014337129002180a8008b09803980a8008b1baa301800130180023016001301237540042c6e1d2002375c6024601e6ea80108c048c04c0048c044c048c048004dc3a40002c601c601e004601a002601a0046016002600e6ea800452613656375c002ae6955ceaab9e5573eae815d0aba201",
        [nexusAddress, nexusId],
        {
          dataType: "list",
          items: [
            {
              title: "Address",
              description:
                "A Cardano `Address` typically holding one or two credential references.\n\n Note that legacy bootstrap addresses (a.k.a. 'Byron addresses') are\n completely excluded from Plutus contexts. Thus, from an on-chain\n perspective only exists addresses of type 00, 01, ..., 07 as detailed\n in [CIP-0019 :: Shelley Addresses](https://github.com/cardano-foundation/CIPs/tree/master/CIP-0019/#shelley-addresses).",
              anyOf: [
                {
                  title: "Address",
                  dataType: "constructor",
                  index: 0,
                  fields: [
                    {
                      title: "paymentCredential",
                      description:
                        "A general structure for representing an on-chain `Credential`.\n\n Credentials are always one of two kinds: a direct public/private key\n pair, or a script (native or Plutus).",
                      anyOf: [
                        {
                          title: "VerificationKey",
                          dataType: "constructor",
                          index: 0,
                          fields: [{ dataType: "bytes" }],
                        },
                        {
                          title: "Script",
                          dataType: "constructor",
                          index: 1,
                          fields: [{ dataType: "bytes" }],
                        },
                      ],
                    },
                    {
                      title: "stakeCredential",
                      anyOf: [
                        {
                          title: "Some",
                          description: "An optional value.",
                          dataType: "constructor",
                          index: 0,
                          fields: [
                            {
                              description:
                                "Represent a type of object that can be represented either inline (by hash)\n or via a reference (i.e. a pointer to an on-chain location).\n\n This is mainly use for capturing pointers to a stake credential\n registration certificate in the case of so-called pointer addresses.",
                              anyOf: [
                                {
                                  title: "Inline",
                                  dataType: "constructor",
                                  index: 0,
                                  fields: [
                                    {
                                      description:
                                        "A general structure for representing an on-chain `Credential`.\n\n Credentials are always one of two kinds: a direct public/private key\n pair, or a script (native or Plutus).",
                                      anyOf: [
                                        {
                                          title: "VerificationKey",
                                          dataType: "constructor",
                                          index: 0,
                                          fields: [{ dataType: "bytes" }],
                                        },
                                        {
                                          title: "Script",
                                          dataType: "constructor",
                                          index: 1,
                                          fields: [{ dataType: "bytes" }],
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  title: "Pointer",
                                  dataType: "constructor",
                                  index: 1,
                                  fields: [
                                    {
                                      dataType: "integer",
                                      title: "slotNumber",
                                    },
                                    {
                                      dataType: "integer",
                                      title: "transactionIndex",
                                    },
                                    {
                                      dataType: "integer",
                                      title: "certificateIndex",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          title: "None",
                          description: "Nothing.",
                          dataType: "constructor",
                          index: 1,
                          fields: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            { title: "AssetName", dataType: "bytes" },
          ],
        } as any,
      ),
      "PlutusV3",
    );
  },

  { _redeemer: { title: "Data", description: "Any Plutus data." } },
) as unknown as V3NexusNftPolicy;

export interface V3NexusSvmValidator {
  new (): Script;
  datum: {
    id: { policy: string; name: string };
    config: {
      matrix: { policy: string; name: string };
      dappConfig: PlutusData;
    };
    state: {
      tiamatParams: {
        minStake: bigint;
        cycleDuration: bigint;
        marginDuration: bigint;
        hingeLock: bigint;
        numEigenvectors: bigint;
        numSupportVectors: bigint;
        suggestedTip: bigint;
        vestingPolicy: string;
        vestingRate: { numerator: bigint; denominator: bigint };
      };
      dappParams: PlutusData;
      eigenvectors: Array<string>;
      currentCycle: {
        lowerBound: {
          boundType:
            | "NegativeInfinity"
            | { Finite: [bigint] }
            | "PositiveInfinity";
          isInclusive: boolean;
        };
        upperBound: {
          boundType:
            | "NegativeInfinity"
            | { Finite: [bigint] }
            | "PositiveInfinity";
          isInclusive: boolean;
        };
      };
    };
  };
  redeemer:
    | { Revolve: { action: undefined } }
    | { Halt: { action: undefined } }
    | "Wipe";
}

export const V3NexusSvmValidator = Object.assign(
  function () {
    return cborToScript(
      "590e7e01010032323232323232253330023232323232533233008300130093754004264646464646464a66601e600800226464a666028602e0042a0082c64a666022600c60246ea800454ccc050c04cdd50008a4c2c2c602a00260226ea802854ccc03cc0200044c8c94ccc050c05c0085401058c94ccc044c018c048dd50008a99980a18099baa00114985858c054004c044dd50050a99980798018008a99980918089baa00a150021616300f37540122a66601a6004601c6ea800c4c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8cc88c8c8c8c8c8c8c94ccc0acc080c0b0dd50008991919299981718138008992999817981419980a8019bae301f303137540146eb8c038c0c4dd50050a99981799b873330153756603a60626ea80b0dd7180f98189baa00a375c601c60626ea8029200114a029405281924c606660606ea80a454ccc0b8c0880044c08cccc050008dd7180f18181baa009375c601a60606ea80244c8c8c94ccc0c4c098c0c8dd500089919191919299981b181799980e0051bae3026303837540226eb8c054c0e0dd50088a99981b19baf0043230293303b303c0013303b303c303d0013303b0044bd70181c1baa013153330360011333333333301400d01100f00e00a00800300202d03314a02940528299981aa5114a22a66606a6054606c6ea80304c8c8c8c94ccc0e4ccc888c8c8c8c94ccc100c0e4c104dd500089919192999821981e18221baa00113371266e0000c020dd6982418229baa00114a0608e60886ea8014c108dd50021bad3045304237540022940c110c104dd5001981f9baa0023042303f375400660826084607c6ea800cc0f8c0fc008c084c0ecdd501b1bad302c303b375400629444ccc090dd61811981d9baa036001375a604460766ea800cdd6181e800981e981e801181d800981b9baa301630373754602a6028606e6ea8c0e8c0dcdd50060b1bab3013303637540066028606a6ea8004c048004c0d8c0ccdd50008b198109bac30113032375405a4a66606266ebcc084c0ccdd500080109919299981b181c801099299981a18169bad303600213371e6eb8c04cc0d8dd50078008b1bae3034001163037001325333032302b30333754002297adef6c6013756606e60686ea8004cc060dd5980818199baa001375c604260666ea8030528180f98189baa00432498c0ccc0c0dd501498171baa02837566016605c6ea8004c028c0b4dd5181818169baa00116330193758603460586ea809c0854ccc0a4c088c0a8dd5260103d87a800014c103d87a80001323301b3758601260586ea809c8c090ccc044dd5980518169baa300a302d37540026eb8c06cc0b4dd50011bae300a302d3754004605c60566ea930103d87a8000302d302e002302c001302c002302a00130263754002646464444444444464a666060604a60626ea80044c8c8c8c8c8c94ccc0d8c0bcc0dcdd5001099299981b80109919191919299981e181a981e9baa002132533303d00213232325333040303930413754004264a666082004264a666084606e60866ea80044c8c94ccc110c0e4c114dd5000899191929998239998239981180a99911919998008008040019bad3038304c37540324444a6660a00042a66609a6084002297ae01613233052374e660a46ea0cdc31919199800800a40009000111299982919b87001004100213330030033370066e080092080043371c00a002607e0026e34004018cc148c14c00d2f5c0666600a00a00260a800666e00009200137280066eb0c0a0c124dd500e181a1bad302630493754609860926ea80112825116153330473330470034a09445854ccc11cccc11c0092825116153330473330470014a09445854ccc11ccdc40058088b0a99982399982399baf30373049375403802c941288b0a99982399982399191919299982599814982800218280010998148008018a50304f3050001304b3754606260966ea806cc134c138004c124dd5181d18249baa01c4a0944585289998189bac3030304837540306eb0c09cc120dd500d9bad302f3048375402a607466e18cdc08048079bad30243047375402866e1ccdc08020041bad3023304637540262ca66608c022298103d87a8000130353304730480114bd70191919191b940013371601200266e2cdd6981198231baa002001375c6066608a6ea8004c0c8c110dd5182398221baa00116330303758606260866ea804c05058dd6982298211baa002163038304037546088608a0046086002607e6ea801458dd69820981f1baa002163034303c375460806082004607e00260766ea8c0f8008c0f4c0f8004c0e4dd51815181c9baa00c16375a607660706ea800858c0b8c0d8dd5181d181d801181c800981a9baa3038303930353754604c606a6ea802cdd6181b981c001181b00098191baa30113032375464a666062604a60646ea80044c94ccc0c8c09cc0ccdd50008991919191919299981d981f00109980d0028a99981c1816981c9baa00313232533303d304000213301c0011533303a302f303b3754006264646464a666082608800426604200626604400244a666086004201e264a666082606c60846ea80044c8c8c8c8c8c8c8c8c8c94ccc138c1440084c030c14403458dd6982780098278011bae304d001304d002375c609600260960046eb4c124004c124008dd6982380098219baa00116304500216375860840026084004608000260786ea800c5858c0f8004c0e8dd50018b0b181e000981e001181d000981d001181c000981a1baa001163036303337540022c602260646ea8c03cc0c8dd5181a98191baa00116330203758601c60626ea80048c0a4ccc058dd5980798191baa300f303237540026eb8c080c0c8dd5181018191baa009375c601e60646ea8c080c0c8dd5004980080091129998148008a5115333029002161333003003302c00232323300100100322533302c00114bd700991929998159919199816a99981699b89375a603a605e6ea801c00854ccc0b4cdc48011bad300c302f375400e266e3cdd7180718179baa00700114a0294128251375c606260640066eb4c0c00084cc0bcdd38011980200200089980200200098180011bac302e001302b00222533302453330243375e6028604c6ea800930103d879800014a2266ebcc050c098dd5000a60103d87b800014a22a666048a66604866ebcc050c098dd5001260103d87b800014a2266ebcc050c098dd5000a60103d879800014a0264a66604a603c604c6ea80044c8c94ccc09cc080c0a0dd5000899b8933706004906807980a19b83375a605860526ea800520d00f163016302837540066eb4c0a8c09cdd50008b180a18131baa0023027302437540304604e6050002464a666044602c60466ea80044c94ccc08cc060c090dd50008991919191919299981618178010998058028a999814980f18151baa0031323232325333030303300213300f0031533302d3022302e375400a26464646464646464a666070607600426603000e26603200644a6660740042a66606e605860706ea800c4c8c8c8c94ccc0f8c1040084cc08000c4cc080004406458c0fc004c0fc008c0f4004c0e4dd50018b0991801181f0019bae303c00216303900130390023758606e002606e004606a002606a0046066002605e6ea80145858c0c4004c0c4008c0bc004c0acdd50018b0b1816800981680118158009815801181480098129baa001163027302437540022c600460466ea80048c094c098c098004894ccc080c054c084dd5001099191919299981398150010a8028b1bae30280013028002375c604c00260446ea800858894ccc07cc050c080dd50010991919191919191919191919191919191919299981a181b8010a999818981318191baa0011323232325333038303b0021501716375a607200260720046eb4c0dc004c0ccdd50008b0b181a800981a8011bae30330013033002375a606200260620046eb4c0bc004c0bc008dd6981680098168011bad302b001302b002375a605200260520046eb4c09c004c09c008dd6981280098109baa002162232330010010032233003001300200222533301d3012301e3754004264646464a666048604e00426464a66604660300022a66604c604a6ea8014540085854ccc08cc0700044c8c94ccc0a0c0ac0085401058dd6981480098129baa005153330233017001153330263025375400a2a0042c2c60466ea80105401458c94ccc090c08c00454ccc084cdc4a400860440022c2603460440022c6ea8c094004c094008c08c004c07cdd50010b11119299980f180b980f9baa0011480004dd6981198101baa00132533301e3017301f3754002298103d87a8000132330010013756604860426ea8008894ccc08c004530103d87a80001323232325333024337220100042a66604866e3c0200084c058cc0a0dd4000a5eb80530103d87a8000133006006003375a604a0066eb8c08c008c09c008c094004cc01000c00888c8cc00400400c894ccc080004530103d87a800013232323253330213372200e0042a66604266e3c01c0084c04ccc094dd3000a5eb80530103d87a8000133006006003375660440066eb8c080008c090008c0880048c078c07cc07cc07cc07cc07cc07cc07c0048c074c078c078c078c078c0780048c070c074c074c074c074c074c074c074c074004c00400488894ccc06c0085280a99980d8018a50132323232533301c3371200290000a5113333008008004002001337020086eb4c080008dd6180f981000099191980080080291299980f8008a5eb850100008101800009919299980f19b8f00200513233023375060186eb4c090004cc08cc090c0940052f5c066008008002264660466048002660466e9ccc08cdd48019bac302430250014bd701980200200098118011bae3021001375c603c008603c0066e012002230183019301930193019001223300400223375e6008602c6ea80040088c05800488c8cc00400400c894ccc0580045300103d87a8000132325333015300500213007330190024bd70099802002000980d001180c0009ba5480008c04cc050c050c05000458dc3a40086e1d2000300f3010002300e001300a37540046e1d200216300b300c002300a001300a00230080013004375400229309b2b2b9a5573aaae7955cfaba05742ae89",
      "PlutusV3",
    );
  },
  {
    datum: {
      title: "NexusDatum",
      anyOf: [
        {
          title: "Datum",
          dataType: "constructor",
          index: 0,
          fields: [
            {
              title: "id",
              anyOf: [
                {
                  title: "Asset",
                  dataType: "constructor",
                  index: 0,
                  fields: [
                    { title: "policy", dataType: "bytes" },
                    { title: "name", dataType: "bytes" },
                  ],
                },
              ],
            },
            {
              title: "config",
              anyOf: [
                {
                  title: "NexusConfig",
                  dataType: "constructor",
                  index: 0,
                  fields: [
                    {
                      title: "matrix",
                      anyOf: [
                        {
                          title: "Asset",
                          dataType: "constructor",
                          index: 0,
                          fields: [
                            { title: "policy", dataType: "bytes" },
                            { title: "name", dataType: "bytes" },
                          ],
                        },
                      ],
                    },
                    { title: "dappConfig", description: "Any Plutus data." },
                  ],
                },
              ],
            },
            {
              title: "state",
              anyOf: [
                {
                  title: "NexusState",
                  dataType: "constructor",
                  index: 0,
                  fields: [
                    {
                      title: "tiamatParams",
                      anyOf: [
                        {
                          title: "TiamatParams",
                          dataType: "constructor",
                          index: 0,
                          fields: [
                            { dataType: "integer", title: "minStake" },
                            { dataType: "integer", title: "cycleDuration" },
                            { dataType: "integer", title: "marginDuration" },
                            { dataType: "integer", title: "hingeLock" },
                            { dataType: "integer", title: "numEigenvectors" },
                            { dataType: "integer", title: "numSupportVectors" },
                            { dataType: "integer", title: "suggestedTip" },
                            { title: "vestingPolicy", dataType: "bytes" },
                            {
                              title: "vestingRate",
                              anyOf: [
                                {
                                  title: "FreeRational",
                                  dataType: "constructor",
                                  index: 0,
                                  fields: [
                                    { dataType: "integer", title: "numerator" },
                                    {
                                      dataType: "integer",
                                      title: "denominator",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    { title: "dappParams", description: "Any Plutus data." },
                    {
                      dataType: "list",
                      items: { title: "Vector", dataType: "bytes" },
                      title: "eigenvectors",
                    },
                    {
                      title: "currentCycle",
                      description:
                        "A type to represent intervals of values. Interval are inhabited by a type\n `a` which is useful for non-infinite intervals that have a finite\n lower-bound and/or upper-bound.\n\n This allows to represent all kind of mathematical intervals:\n\n ```aiken\n // [1; 10]\n let i0: Interval<PosixTime> = Interval\n   { lower_bound:\n       IntervalBound { bound_type: Finite(1), is_inclusive: True }\n   , upper_bound:\n       IntervalBound { bound_type: Finite(10), is_inclusive: True }\n   }\n ```\n\n ```aiken\n // (20; infinity)\n let i1: Interval<PosixTime> = Interval\n   { lower_bound:\n       IntervalBound { bound_type: Finite(20), is_inclusive: False }\n   , upper_bound:\n       IntervalBound { bound_type: PositiveInfinity, is_inclusive: False }\n   }\n ```",
                      anyOf: [
                        {
                          title: "Interval",
                          dataType: "constructor",
                          index: 0,
                          fields: [
                            {
                              title: "lowerBound",
                              description:
                                "An interval bound, either inclusive or exclusive.",
                              anyOf: [
                                {
                                  title: "IntervalBound",
                                  dataType: "constructor",
                                  index: 0,
                                  fields: [
                                    {
                                      title: "boundType",
                                      description:
                                        "A type of interval bound. Where finite, a value of type `a` must be\n provided. `a` will typically be an `Int`, representing a number of seconds or\n milliseconds.",
                                      anyOf: [
                                        {
                                          title: "NegativeInfinity",
                                          dataType: "constructor",
                                          index: 0,
                                          fields: [],
                                        },
                                        {
                                          title: "Finite",
                                          dataType: "constructor",
                                          index: 1,
                                          fields: [{ dataType: "integer" }],
                                        },
                                        {
                                          title: "PositiveInfinity",
                                          dataType: "constructor",
                                          index: 2,
                                          fields: [],
                                        },
                                      ],
                                    },
                                    {
                                      title: "isInclusive",
                                      anyOf: [
                                        {
                                          title: "False",
                                          dataType: "constructor",
                                          index: 0,
                                          fields: [],
                                        },
                                        {
                                          title: "True",
                                          dataType: "constructor",
                                          index: 1,
                                          fields: [],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              title: "upperBound",
                              description:
                                "An interval bound, either inclusive or exclusive.",
                              anyOf: [
                                {
                                  title: "IntervalBound",
                                  dataType: "constructor",
                                  index: 0,
                                  fields: [
                                    {
                                      title: "boundType",
                                      description:
                                        "A type of interval bound. Where finite, a value of type `a` must be\n provided. `a` will typically be an `Int`, representing a number of seconds or\n milliseconds.",
                                      anyOf: [
                                        {
                                          title: "NegativeInfinity",
                                          dataType: "constructor",
                                          index: 0,
                                          fields: [],
                                        },
                                        {
                                          title: "Finite",
                                          dataType: "constructor",
                                          index: 1,
                                          fields: [{ dataType: "integer" }],
                                        },
                                        {
                                          title: "PositiveInfinity",
                                          dataType: "constructor",
                                          index: 2,
                                          fields: [],
                                        },
                                      ],
                                    },
                                    {
                                      title: "isInclusive",
                                      anyOf: [
                                        {
                                          title: "False",
                                          dataType: "constructor",
                                          index: 0,
                                          fields: [],
                                        },
                                        {
                                          title: "True",
                                          dataType: "constructor",
                                          index: 1,
                                          fields: [],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    redeemer: {
      title: "NexusRedeemer",
      anyOf: [
        {
          title: "Revolve",
          dataType: "constructor",
          index: 0,
          fields: [
            {
              title: "action",
              anyOf: [{ dataType: "constructor", index: 0, fields: [] }],
            },
          ],
        },
        {
          title: "Halt",
          dataType: "constructor",
          index: 1,
          fields: [
            {
              title: "action",
              anyOf: [{ dataType: "constructor", index: 0, fields: [] }],
            },
          ],
        },
        { title: "Wipe", dataType: "constructor", index: 2, fields: [] },
      ],
    },
  },
) as unknown as V3NexusSvmValidator;

export interface V3SlutNftPolicy {
  new (_slutAddress: {
    paymentCredential: { VerificationKey: [string] } | { Script: [string] };
    stakeCredential:
      | { Inline: [{ VerificationKey: [string] } | { Script: [string] }] }
      | {
          Pointer: {
            slotNumber: bigint;
            transactionIndex: bigint;
            certificateIndex: bigint;
          };
        }
      | null;
  }): Script;
  _redeemer: PlutusData;
}

export const V3SlutNftPolicy = Object.assign(
  function (_slutAddress: {
    paymentCredential: { VerificationKey: [string] } | { Script: [string] };
    stakeCredential:
      | { Inline: [{ VerificationKey: [string] } | { Script: [string] }] }
      | {
          Pointer: {
            slotNumber: bigint;
            transactionIndex: bigint;
            certificateIndex: bigint;
          };
        }
      | null;
  }) {
    return cborToScript(
      applyParamsToScript(
        "58510101003232323232225333003323232323253330083370e900018049baa0011324a26eb8c02cc028dd50008b1805180580118048009804801180380098029baa00114984d9595cd2ab9d5573cae855d101",
        [_slutAddress],
        {
          dataType: "list",
          items: [
            {
              title: "Address",
              description:
                "A Cardano `Address` typically holding one or two credential references.\n\n Note that legacy bootstrap addresses (a.k.a. 'Byron addresses') are\n completely excluded from Plutus contexts. Thus, from an on-chain\n perspective only exists addresses of type 00, 01, ..., 07 as detailed\n in [CIP-0019 :: Shelley Addresses](https://github.com/cardano-foundation/CIPs/tree/master/CIP-0019/#shelley-addresses).",
              anyOf: [
                {
                  title: "Address",
                  dataType: "constructor",
                  index: 0,
                  fields: [
                    {
                      title: "paymentCredential",
                      description:
                        "A general structure for representing an on-chain `Credential`.\n\n Credentials are always one of two kinds: a direct public/private key\n pair, or a script (native or Plutus).",
                      anyOf: [
                        {
                          title: "VerificationKey",
                          dataType: "constructor",
                          index: 0,
                          fields: [{ dataType: "bytes" }],
                        },
                        {
                          title: "Script",
                          dataType: "constructor",
                          index: 1,
                          fields: [{ dataType: "bytes" }],
                        },
                      ],
                    },
                    {
                      title: "stakeCredential",
                      anyOf: [
                        {
                          title: "Some",
                          description: "An optional value.",
                          dataType: "constructor",
                          index: 0,
                          fields: [
                            {
                              description:
                                "Represent a type of object that can be represented either inline (by hash)\n or via a reference (i.e. a pointer to an on-chain location).\n\n This is mainly use for capturing pointers to a stake credential\n registration certificate in the case of so-called pointer addresses.",
                              anyOf: [
                                {
                                  title: "Inline",
                                  dataType: "constructor",
                                  index: 0,
                                  fields: [
                                    {
                                      description:
                                        "A general structure for representing an on-chain `Credential`.\n\n Credentials are always one of two kinds: a direct public/private key\n pair, or a script (native or Plutus).",
                                      anyOf: [
                                        {
                                          title: "VerificationKey",
                                          dataType: "constructor",
                                          index: 0,
                                          fields: [{ dataType: "bytes" }],
                                        },
                                        {
                                          title: "Script",
                                          dataType: "constructor",
                                          index: 1,
                                          fields: [{ dataType: "bytes" }],
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  title: "Pointer",
                                  dataType: "constructor",
                                  index: 1,
                                  fields: [
                                    {
                                      dataType: "integer",
                                      title: "slotNumber",
                                    },
                                    {
                                      dataType: "integer",
                                      title: "transactionIndex",
                                    },
                                    {
                                      dataType: "integer",
                                      title: "certificateIndex",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          title: "None",
                          description: "Nothing.",
                          dataType: "constructor",
                          index: 1,
                          fields: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        } as any,
      ),
      "PlutusV3",
    );
  },

  { _redeemer: { title: "Data", description: "Any Plutus data." } },
) as unknown as V3SlutNftPolicy;

export interface V3SlutSvmValidator {
  new (): Script;
  _datum: PlutusData;
  _redeemer: PlutusData;
}

export const V3SlutSvmValidator = Object.assign(
  function () {
    return cborToScript(
      "5857010100323232323225333002323232323253330073370e900118041baa00113232324a26018601a004601600260126ea800458c024c028008c020004c020008c018004c010dd50008a4c26cacae6955ceaab9e5742ae89",
      "PlutusV3",
    );
  },
  { _datum: { title: "Data", description: "Any Plutus data." } },
  { _redeemer: { title: "Data", description: "Any Plutus data." } },
) as unknown as V3SlutSvmValidator;

export interface V3VestingNftPolicy {
  new (vestingsAddress: {
    paymentCredential: { VerificationKey: [string] } | { Script: [string] };
    stakeCredential:
      | { Inline: [{ VerificationKey: [string] } | { Script: [string] }] }
      | {
          Pointer: {
            slotNumber: bigint;
            transactionIndex: bigint;
            certificateIndex: bigint;
          };
        }
      | null;
  }): Script;
  _redeemer: PlutusData;
}

export const V3VestingNftPolicy = Object.assign(
  function (vestingsAddress: {
    paymentCredential: { VerificationKey: [string] } | { Script: [string] };
    stakeCredential:
      | { Inline: [{ VerificationKey: [string] } | { Script: [string] }] }
      | {
          Pointer: {
            slotNumber: bigint;
            transactionIndex: bigint;
            certificateIndex: bigint;
          };
        }
      | null;
  }) {
    return cborToScript(
      applyParamsToScript(
        "59048d0101003232323232323222533300332323232325332330093001300a37540042646464664646464646446464660020026600c6eacc068c06cc06cc06cc06cc05cdd500880191299980c8008a51132533301732323232533301b3370e00490008a511533301b300d0021533301b3300a37586020603a6ea805c8cdc799198069b94337166eb4c04cc07cdd50009bae3012301f375400290101808980f1baa00100213300a37586024603a6ea805c94ccc070cdd79808980f1baa00101b13253330200011615333020302300113232533301f3011375a6042004264a66604066e3c038dd7180a98111baa3015302237540022a66604066e3c020dd7180b18111baa3015302237540022a66604066e3c0200084cccc8888c94ccc094c05cc098dd5000899b89375a6054604e6ea8004dd6980d18139baa003163019302637546034604c6ea8c0a4c0a8c0a8c0a8c0a8c0a8c0a8c0a8c098dd5010180a98111baa001301630223754002602e60446ea8004dd5980b18111baa00514a0294052819299981019b8748010c084dd50008992999810980c98111baa0011323232323232533302a302d00215333027301f3028375400a264646464a66605c60620042a666056604660586ea801c4c8c94ccc0c0c0cc00854ccc0b4c094c0b8dd5003899192999819181a80108078b1bad3033001302f375400e2c2c6eb8c0c4004c0b4dd50038b0b1bae302f001302f002375c605a00260526ea80145858c0ac004c0ac008c0a4004c0a4008c09c004c08cdd50008b181298111baa001163016302137540082c6eb8c07c004c08800458cc034dd59809180f1baa00100a14a0294052819805001240406eb4c06c008dd7180c800980e0010998018018008a50301c0015333013300530143754980103d87a800014c103d87a8000132323300100137586016602e6ea8044894ccc064004530103d87a8000132325333018300a33322232533301c300e301d37540022900009bad3021301e375400264a666038601c603a6ea80045300103d87a80001323300100137566044603e6ea8008894ccc084004530103d87a80001323232325333022337220100042a66604466e3c0200084c058cc098dd4000a5eb80530103d87a8000133006006003375a60460066eb8c084008c094008c08c004cc03800c008dd59807180d1baa300e301a37540046eb8c034c068dd50029bae300e301a375400a260186603800497ae0133004004001301d002301b001301830153754980103d87a800022323300100100322533301800114a0264a66602c6008603600429444cc00c00c004c06c00488ccdc600099b81371a0040020044464a666024600860266ea800452f5bded8c026eacc05cc050dd5000998020010009b874800888c8cc00400400c894ccc050004530103d87a800013232323253330153372200e0042a66602a66e3c01c0084c024cc064dd3000a5eb80530103d87a80001330060060033756602c0066eb8c050008c060008c058004dd2a40006eb8c044c038dd50029180880091808180880091807980818080009b874800058c030c034008c02c004c02c008c024004c014dd50008a4c26cacae6955ceaab9e5573eae815d0aba21",
        [vestingsAddress],
        {
          dataType: "list",
          items: [
            {
              title: "Address",
              description:
                "A Cardano `Address` typically holding one or two credential references.\n\n Note that legacy bootstrap addresses (a.k.a. 'Byron addresses') are\n completely excluded from Plutus contexts. Thus, from an on-chain\n perspective only exists addresses of type 00, 01, ..., 07 as detailed\n in [CIP-0019 :: Shelley Addresses](https://github.com/cardano-foundation/CIPs/tree/master/CIP-0019/#shelley-addresses).",
              anyOf: [
                {
                  title: "Address",
                  dataType: "constructor",
                  index: 0,
                  fields: [
                    {
                      title: "paymentCredential",
                      description:
                        "A general structure for representing an on-chain `Credential`.\n\n Credentials are always one of two kinds: a direct public/private key\n pair, or a script (native or Plutus).",
                      anyOf: [
                        {
                          title: "VerificationKey",
                          dataType: "constructor",
                          index: 0,
                          fields: [{ dataType: "bytes" }],
                        },
                        {
                          title: "Script",
                          dataType: "constructor",
                          index: 1,
                          fields: [{ dataType: "bytes" }],
                        },
                      ],
                    },
                    {
                      title: "stakeCredential",
                      anyOf: [
                        {
                          title: "Some",
                          description: "An optional value.",
                          dataType: "constructor",
                          index: 0,
                          fields: [
                            {
                              description:
                                "Represent a type of object that can be represented either inline (by hash)\n or via a reference (i.e. a pointer to an on-chain location).\n\n This is mainly use for capturing pointers to a stake credential\n registration certificate in the case of so-called pointer addresses.",
                              anyOf: [
                                {
                                  title: "Inline",
                                  dataType: "constructor",
                                  index: 0,
                                  fields: [
                                    {
                                      description:
                                        "A general structure for representing an on-chain `Credential`.\n\n Credentials are always one of two kinds: a direct public/private key\n pair, or a script (native or Plutus).",
                                      anyOf: [
                                        {
                                          title: "VerificationKey",
                                          dataType: "constructor",
                                          index: 0,
                                          fields: [{ dataType: "bytes" }],
                                        },
                                        {
                                          title: "Script",
                                          dataType: "constructor",
                                          index: 1,
                                          fields: [{ dataType: "bytes" }],
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  title: "Pointer",
                                  dataType: "constructor",
                                  index: 1,
                                  fields: [
                                    {
                                      dataType: "integer",
                                      title: "slotNumber",
                                    },
                                    {
                                      dataType: "integer",
                                      title: "transactionIndex",
                                    },
                                    {
                                      dataType: "integer",
                                      title: "certificateIndex",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          title: "None",
                          description: "Nothing.",
                          dataType: "constructor",
                          index: 1,
                          fields: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        } as any,
      ),
      "PlutusV3",
    );
  },

  { _redeemer: { title: "Data", description: "Any Plutus data." } },
) as unknown as V3VestingNftPolicy;

export interface V3VestingSvmValidator {
  new (nexus: { policy: string; name: string }): Script;
  datum: {
    id: { policy: string; name: string };
    config: { owner: string };
    state: { timeLock: bigint };
  };
  redeemer:
    | { Revolve: { action: undefined } }
    | { Halt: { action: undefined } }
    | "Wipe";
}

export const V3VestingSvmValidator = Object.assign(
  function (nexus: { policy: string; name: string }) {
    return cborToScript(
      applyParamsToScript(
        "590cec0101003232323232323222533300332323232325332330093001300a3754004264646464646464a666020600800226464a66602a60300042a0082c64a666024600c60266ea800454ccc054c050dd50008a4c2c2c602c00260246ea802854ccc040c0200044c8c94ccc054c0600085401058c94ccc048c018c04cdd50008a99980a980a1baa00114985858c058004c048dd50050a99980818018008a99980998091baa00a150021616301037540122a66601c6004601e6ea800c4c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8ccc8c888c8c8c8c8c8c8c94ccc0a8c078c0acdd50008991919299981698128008992999817181319980a8019bae3013303037540146eb8c050c0c0dd50050a99981719b8733301537566066606860686068606860606ea80a8dd7180998181baa00a375c602860606ea802920011533302e3022302f375400c26464a666060605060626ea80044c8c8c8c94ccc0d0c0a0c0d4dd500089919299981b1980c1bac3021303837540646eb8c06cc0e0dd5008099b8900100414a06660380146eb8c068c0dcdd50009bae301b30373754002602e6072606c6ea800458cc05cc060c0d4dd5180c981a9baa00337586032606a6ea80bccdc199b82375a602e60686ea8004cdc09bad3037303437540066eb4c05cc0d0dd50059bad301830343754002603860666ea8c058c0ccdd5180f18199baa001301c3016303237540042c602860626ea8c050c0c4dd5181098189baa02b30333030375400c2c29405281924c6064605e6ea809c54ccc0b4c0800044c084ccc050008dd7180918179baa009375c6026605e6ea80244c8c8c94ccc0c0c090c0c4dd500089919191919299981a981699980e0051bae301a303737540226eb8c06cc0dcdd50088a99981a99baf0043230203303a303b0013303a303b303c0013303a0044bd70181b9baa013153330350011533303530293036375401a26464a66606e605e60706ea80044c8c94ccc0e4c0c4c0e8dd500089919191919299981f1819181f9baa001132325333040330223758605660846ea80f0dd7181298211baa01a153330403371200e6eb4c094c108dd5007099b8900100414a02940cdc099981300a1bae3024304137540026eb8c094c104dd50009998130061bae3024304137540026eb8c094c104dd50009810982198201baa00116330213022303f37546046607e6ea800cdd61811981f9baa0393370666e08dd69810981f1baa0013370200a6eb4c084c0f8dd500a9bad3022303e3754002604c607a6ea8c080c0f4dd51814181e9baa00130263020303c375400a6eb4c0f8c0ecdd50008b180e981d1baa301e303a3754605460746ea80d0dd6981e181c9baa00116301b30383754603660706ea8c0a0c0e0dd5019181d181b9baa00d1614a02940528299981a25114a22a6660686050606a6ea80304c8c8c8c94ccc0e0ccc888c8c8c8c94ccc0fcc0dcc100dd500089919192999821181d18219baa00113371266e0000c020dd6982398221baa00114a0608c60866ea8014c104dd50021bad3044304137540022940c10cc100dd5001981f1baa0023041303e375400660806082607a6ea800cc0f4c0f8008c0a8c0e8dd501a1bad303d303e303e303e303a375400629444ccc060dd61811981d1baa034001375a607a607c607c607c607c607c60746ea800cdd6181e000981e181e001181d000981b1baa30213036375460406034606c6ea8c0e4c0d8dd50060b1bab301930353754006603e60686ea8004c94ccc0c8c094c0ccdd500089929998199813981a1baa0011323232323232533303c303f00213302700515333039302d303a375400626464a66607c60820042a666076605e60786ea800c4c8c94ccc100c10c008402c58dd69820800981e9baa0031616375c607e00260766ea800c5858c0f4004c0f4008c0ec004c0ec008c0e4004c0d4dd50008b181b981a1baa00116301e30333754002606a60646ea800458cc05cdd6180e18189baa02b253330303375e602a60646ea80040084c8c94ccc0d4c0e00084c94ccc0ccc0acdd6981a801099b8f375c6032606a6ea803c00458dd718198008b181b000992999818981498191baa00114bd6f7b63009bab303630333754002660326eacc058c0c8dd50009bae3015303237540182940c04cc0c0dd50021924c6064605e6ea809cc0b4dd50131bab3011302d3754002602060586ea8c0bcc0b0dd50008b198089bac300e302b375404a466ebcc03cc0b0dd50008102999814181018149baa00714c0103d87a800013300c302d302a375400e6eb0c038c0a8dd50121816181680118158009815801181480098129baa00130010012222533302600214a02a66604c00629404c8c8c8c94ccc09ccdc4800a400029444cccc020020010008004cdc08021bad302b00237586054605600264646600200200a44a666054002297ae1010100008101800009919299981499b8f0020051323302e375066e00dd69817800a40046605c605e606000297ae0330040040011323302e302f0013302e374e6605c6ea400cdd618179818000a5eb80cc010010004c0b8008dd718160009bae3029004302900330093302301e4bd70181218109baa01422323300100100322533302500114a0264a66604666e3cdd718140010020a5113300300300130280012300330203754600860406ea8c94ccc07cc048c080dd50008992999810180a18109baa00113232323232325333029302c00213301400515333026301a3027375400626464a666056605c00426602c0022a666050603860526ea800c4c8c8c8c94ccc0bcc0c80084cc06c00c4cc070004894ccc0c4008403c4c94ccc0bcc08cc0c0dd5000899191919191919191919299981e181f80109806181f8068b1bad303d001303d002375c607600260760046eb8c0e4004c0e4008dd6981b800981b8011bad3035001303137540022c60660042c6eb0c0c0004c0c0008c0b8004c0a8dd50018b0b181600098141baa0031616302a001302a002302800130280023026001302237540022c604860426ea800458c02cc080dd5180218101baa0012233006001230173330063756600a60426ea8c014c084dd50009bae3004302137540066eb8c014c084dd50019181080091810181080091119299980e980a980f1baa0011480004dd69811180f9baa00132533301d3015301e3754002298103d87a8000132330010013756604660406ea8008894ccc088004530103d87a80001323232325333023337220100042a66604666e3c0200084c034cc09cdd4000a5eb80530103d87a8000133006006003375a60480066eb8c088008c098008c090004cc01400c00888c8cc00400400c894ccc07c004530103d87a800013232533301e300500213008330220024bd700998020020009811801181080091191980080080191299980f0008a6103d87a8000132323232533301f3372200e0042a66603e66e3c01c0084c024cc08cdd3000a5eb80530103d87a8000133006006003375660400066eb8c078008c088008c080004dd2a40004603660386038603860386038603860386038002464a66602c6012602e6ea80044c94ccc05cc02cc060dd50008991919191919299981018118010998058028a99980e9808980f1baa0031323232325333024302700213300f0031533302130153022375400a26464646464646464a666058605e00426603000e26603200644a66605c0042a666056603e60586ea800c4c8c8c8c94ccc0c8c0d40084cc08000c4cc080004406458c0cc004c0cc008c0c4004c0b4dd50018b099180118190019bae303000216302d001302d00237586056002605600460520026052004604e00260466ea80145858c094004c094008c08c004c07cdd50018b0b18108009810801180f800980f801180e800980c9baa00116301b301837540022c6004602e6ea80048c064c068c068004894ccc050c020c054dd5001099191919299980d980f0010a8028b1bae301c001301c002375c6034002602c6ea800858894ccc04cc01cc050dd50010991919191919191919191919191919191919299981418158010a999812980c98131baa001132323232533302c302f0021501716375a605a002605a0046eb4c0ac004c09cdd50008b0b181480098148011bae30270013027002375a604a002604a0046eb4c08c004c08c008dd6981080098108011bad301f001301f002375a603a002603a0046eb4c06c004c06c008dd6980c800980a9baa0021622323300100100322330030013002002225333011300530123754004264646464a666030603600426464a66602e60160022a66603460326ea8014540085854ccc05cc03c0044c8c94ccc070c07c0085401058dd6980e800980c9baa00515333017300a0011533301a3019375400a2a0042c2c602e6ea80105401458c94ccc060c05c00454ccc054cdc4a4008602c0022c2601a602c0022c6ea8c064004c064008c05c004c04cdd50010b1180a180a980a980a980a980a980a980a8008b1b8748010dc3a400060206022004601e00260166ea8008dc3a40042c6018601a004601600260160046012002600a6ea8004526136565734aae7555cf2ab9f5740ae855d101",
        [nexus],
        {
          dataType: "list",
          items: [
            {
              title: "Asset",
              anyOf: [
                {
                  title: "Asset",
                  dataType: "constructor",
                  index: 0,
                  fields: [
                    { title: "policy", dataType: "bytes" },
                    { title: "name", dataType: "bytes" },
                  ],
                },
              ],
            },
          ],
        } as any,
      ),
      "PlutusV3",
    );
  },
  {
    datum: {
      title: "VestingDatum",
      anyOf: [
        {
          title: "Datum",
          dataType: "constructor",
          index: 0,
          fields: [
            {
              title: "id",
              anyOf: [
                {
                  title: "Asset",
                  dataType: "constructor",
                  index: 0,
                  fields: [
                    { title: "policy", dataType: "bytes" },
                    { title: "name", dataType: "bytes" },
                  ],
                },
              ],
            },
            {
              title: "config",
              anyOf: [
                {
                  title: "VestingConfig",
                  dataType: "constructor",
                  index: 0,
                  fields: [{ title: "owner", dataType: "bytes" }],
                },
              ],
            },
            {
              title: "state",
              anyOf: [
                {
                  title: "VestingState",
                  dataType: "constructor",
                  index: 0,
                  fields: [{ dataType: "integer", title: "timeLock" }],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    redeemer: {
      title: "VestingRedeemer",
      anyOf: [
        {
          title: "Revolve",
          dataType: "constructor",
          index: 0,
          fields: [
            {
              title: "action",
              anyOf: [{ dataType: "constructor", index: 0, fields: [] }],
            },
          ],
        },
        {
          title: "Halt",
          dataType: "constructor",
          index: 1,
          fields: [
            {
              title: "action",
              anyOf: [{ dataType: "constructor", index: 0, fields: [] }],
            },
          ],
        },
        { title: "Wipe", dataType: "constructor", index: 2, fields: [] },
      ],
    },
  },
) as unknown as V3VestingSvmValidator;