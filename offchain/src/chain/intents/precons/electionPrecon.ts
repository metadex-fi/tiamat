import { Core } from "@blaze-cardano/sdk";
import { Trace, Tx, TxCompleat, TxId, UtxoSet } from "../../../utils/wrappers";
import { Precon } from "../precon";
import assert from "assert";
import { NexusState } from "../../../types/tiamat/svms/nexus/state";
import { Interval } from "../../../types/general/derived/interval";
import { Void } from "../../../types/general/derived/void";
import { CliqueElectionTx } from "../../state/messages";
import { computeSubsets } from "../../actions/tippingAction";
import { TiamatContract } from "../../state/tiamatContract";
import { Callback, Result } from "../../state/callback";
import { slotDurationMs } from "../../../utils/constants";
import { Ganglion } from "../../data/ganglion";
import { PDappConfigT, PDappParamsT } from "../../../types/tiamat/tiamat";
import { ElectionData } from "../../state/electionData";

const slotDurationMs_ = BigInt(slotDurationMs);

// NOTE/TODO: as we are interested in the current election state in different places (i.e. contract), we might want to
// factor that out into some ganglia.
export class ElectionPrecon<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
> extends Precon<DC, DP, ElectionData<DC, DP>> {
  constructor(
    name: string,
    priorGanglion: Ganglion<any[], ElectionData<DC, DP>>,
    nexusID: Core.AssetId,
    forCycle: "current" | "next",
  ) {
    name = `${name} ${forCycle}ElectionPrecon`;

    // check if the currently eligible eigenvectors are reflectd by the onchain nexus state.
    const isMetBy = (prior: ElectionData<DC, DP>): boolean => {
      return prior.eligibleEVsElected;
    };

    // servitor suffices to update the election state.
    const fixWallet = `servitor`;

    // update the election state in the nexus.
    // NOTE/TODO we are ripping this from ElectAction, which we then should probably phase out once we're done
    const fixTx = (
      fixingTx: Tx,
      prior: ElectionData<DC, DP>,
      ackCallback: Callback<TxId> | `no fix ACK`,
    ): Tx => {
      assert(prior.suitableForElection, `ElectAction: not suitableForElection`);
      const currentCycle = Interval.inclusive(prior.fromMs, prior.toMs);
      const action = new Void();
      const newState = new NexusState<DP>(
        prior.tiamatParams,
        prior.dappParams,
        prior.eligibleEVs.map((ev) => ev.vector),
        currentCycle,
      );
      const newValue = prior.nexusUtxo.svmValue; // no change in value.
      assert(ackCallback !== `no fix ACK`, `${name}: ackCallback not set`);
      const withElectionTx = prior.nexusUtxo
        .revolvingTx(
          fixingTx,
          ackCallback,
          "unhinged", // NOTE elections are a special type, technically unhinged but practically "hinged", but to the new elecatorate, so we don't use the existing mechanism (which requires the old elecatorate). See onchain code.
          action,
          newState,
          newValue,
          `isNexus`,
        )
        .addReferenceInput(prior.matrixUtxo.utxo)
        // rounding inwards, as onchain checks that the validity interval is within the cycle interval
        // TODO/NOTE: one slot wide election cycles will cause trouble here
        // TODO the fact that we have to round to slots in the first place sucks, but we tracked the
        // problem down to cardano-js-sdk, with which we don't want to mess atm.
        .setValidFromMs(prior.fromMs, slotDurationMs_, `up`)
        .setValidUntilMs(prior.toMs, slotDurationMs_, `down`);

      return withElectionTx;
    };

    // we add the new nexus-utxo as read-input (if it would not be required, we would not have this precon).
    const chainUtxos = (utxos: UtxoSet) => {
      const nexusUtxos = utxos.list.filter((utxo) =>
        utxo.core.output().amount().multiasset()?.get(nexusID),
      );
      assert(
        nexusUtxos.length === 1,
        `${name}: expected exactly one nexus-utxo, got ${nexusUtxos.length}`,
      );
      return [
        {
          utxo: nexusUtxos[0]!,
          redeemer: `read` as `read`,
        },
      ];
    };

    // needs to be signed by each clique of the new electorate, and submitted accordingly as multiple txes.
    const mkDivergentFixSubmit =
      (prior: ElectionData<DC, DP>) =>
      async (
        fixingTx: Tx,
        contract: TiamatContract<DC, DP>,
        trace: Trace,
      ): Promise<{
        fixTxCompleat: TxCompleat; // for chaining the action-tx
        submitFixTx: () => Promise<Result>;
      }> => {
        let fixTxCompleat: TxCompleat | null = null;
        const electionTxes: CliqueElectionTx[] = [];

        const supportVectorSets = computeSubsets(
          prior.eligibleEVs,
          Number(prior.tiamatParams.num_support_vectors),
        );
        for (const supportVectorSet of supportVectorSets) {
          let fixingTx_ = fixingTx.clone(); // includes the election-tx
          supportVectorSet.forEach((supportVector) => {
            // TODO ensure this works with multiple copies of the same EV
            const vector = supportVector.vector.toBlaze();
            console.log(`ElectAction.electionTxes: addSignerKey(${vector})`);
            fixingTx_ = fixingTx_.addRequiredSigner(vector);
          });

          const electionActionCompleat = await fixingTx_.compleat();
          console.log(`electionActionCompleat`);
          if (!fixTxCompleat) {
            fixTxCompleat = electionActionCompleat;
          }

          const electionActionSigned = await electionActionCompleat.sign();
          console.log(`electionActionSigned`);

          electionTxes.push({
            supportVectorSet,
            tx: {
              partiallySignedElectionTx: electionActionSigned.tx,
              // electionTxPartialWitnessSetHex: electionActionWitness,
            },
          });
        }
        assert(fixTxCompleat, `${name}: fixTxCompleat not set`);

        const submitFixTx = async () => {
          return await contract.submitElectionTxes(
            electionTxes,
            trace.via(`${name}.divergentSubmit`),
          );
        };

        return {
          fixTxCompleat,
          submitFixTx,
        };
      };

    super(
      priorGanglion,
      isMetBy,
      fixWallet,
      fixTx,
      chainUtxos,
      mkDivergentFixSubmit,
    );
  }
}
