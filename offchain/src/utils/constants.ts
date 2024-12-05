import assert from "assert";

export const maxInteger = BigInt(
  // TODO better value, maybe look at chain/plutus max
  Number.MAX_SAFE_INTEGER, // = 2 ** 53 - 1
); // NOTE/TODO using this for now to avoid Number rounding errors for convenience
// export const maxInteger = 2n ** 61n;
// TODO revert
// export const maxInteger = 10000n; // NOTE This will cause weirdness after we added the minAda of 1000000n (utxo.ts)
export const defaultMaxWeight = 10000n; //BigInt(Math.floor(Number(maxInteger) ** 0.5)); // TODO evaluate this
export const gMaxStringLength = 9000n; //maxInteger;
export const gMaxStringBytes = gMaxStringLength / 2n;
export const gMaxLength = 10n;
export const gMaxDiracs = 100n;
export const gMaxDepth = 4n;
export const maxShowDepth = 5n;
export const compareVariants = false;
export const globalExpLimit = 300; // TODO better value (500 failed, 100 appears to work)
export const handleInvalidSvms = false; // in prod we might get invalid svms because of spammers/attackers, but in dev we want to get an error. TODO adjust accordingly
// TODO the above can happen even if emulator in case of closing-split, consider catching that accordingly deactivating the above
export const handleInvalidVectorMsgs = false; // in prod we might get invalid vector messages because of spammers/attackers, but in dev we want to get an error. TODO adjust accordingly
export const handleTxSubmissionErrors = false;
export const handleInvalidConnectionAttempts = false;
export const assertVectorConnections = true;
export const assertWithinMargin = false; // TODO fix this (medium priority)

// fees and minAda
export const lovelacePerAda = 1000000n;
export const txFees = 5n * lovelacePerAda; // costs in lovelace for fees and collateral. TODO wild guess and probably overestimate
export const lockedLovelace = 25n * lovelacePerAda; // ada required in a utxo.  TODO wild guess and probably overestimate
export const prefundNumTxFees = 10n; // how many txes we pre-fund. TODO shouldn't be a constant
export const minNumTxFees = 2n; // how many txes we pre-fund.
assert(
  prefundNumTxFees >= minNumTxFees,
  `numTxFees must be able to pay for at least one action- and fixing-tx in the current setup. This would be less for unhinged txes, but we will address that later. See ServitorPrecon for more.`,
);

export const kupoUrl = "http(s)://localhost:1442"; // TODO placeholder
export const ogmiosUrl = "ws(s)://localhost:1337"; // TODO placeholder
export const vectorElectionMargin = 1000;
export const vectorPort = 8080;
export const defaultSlack = [21n, 20n]; // to be made into a rational

export const queryLoopTimeoutMs = 1; // how often vectors poll kupo for updates. 10 for non-emulated chain
export const wsAttemptTimeoutMs = 50 * queryLoopTimeoutMs; // how long vectors wait for a connection attempt to succeed
export const recordedTxCacheSize = 100;

export const slotDurationMs = 100 * queryLoopTimeoutMs; // ms per slot. Onchain: 1000
export const slotsPerBlock = 20;
export const blockDurationMs = slotDurationMs * slotsPerBlock;
export const vestingMarginMs = 2 * blockDurationMs; // how long from now the vesting period starts when we lock stake, in ms
// NOTE: a single block gave an error with emulator here, so we choose two

// verbosity
export const logElection = true;
export const logRegistered = false;
export const logSimplephore = false;
export const logCallbacks = true;
export const logCallbackFns = false;
export const logUtxoEvents = true;
export const logGanglionStateChange = true;

export const attemptCounterConnect = false;
// export const simulatedPubSubMaxDelay = slotDurationMs / 2;

// TODO lower those below
export const callbackTimeoutMs: number | null = 60 * slotDurationMs; // how long we wait for a callback to return before we throw an error
export const semaphoreTimeoutMs: number | null = 60 * slotDurationMs; // how long we wait for a semaphore to be released before we throw an error
export const errorTimeoutMs: number | null = 5 * slotDurationMs; // how long we wait after an error before we throw it
export const printTimeoutMs: number | null = 1.5 * blockDurationMs; // how long we wait after a callback-result is created before we want to see it printed
export const maxUserMsgDelay: number | null = 20 * queryLoopTimeoutMs;
export const maxVectorMsgDelay: number | null = null;

// svm labels
export const matrixLabel = `matrix`;
export const nexusLabel = `nexus`;
export const vestingLabel = `vesting`;
