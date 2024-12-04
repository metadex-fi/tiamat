import assert from "assert";
import { Core, Blaze, HotWallet } from "@blaze-cardano/sdk";
import { KeyHash } from "../../types/general/derived/hash/keyHash";
import { AssocMap } from "../../types/general/fundamental/container/map";
import {
  assertVectorConnections,
  attemptCounterConnect,
  errorTimeoutMs,
  handleInvalidConnectionAttempts,
  handleInvalidVectorMsgs,
  maxUserMsgDelay,
  maxVectorMsgDelay,
  recordedTxCacheSize,
  wsAttemptTimeoutMs,
} from "../../utils/constants";
import { ChangeStakeAction } from "../actions/matrixAction/changeStakeAction";
import { DeregisterVectorAction } from "../actions/matrixAction/deregisterVectorAction";
import { RegisterVectorAction } from "../actions/matrixAction/registerVectorAction";
import { UpdateVectorAction } from "../actions/matrixAction/updateVectorAction";
import { LockStakeAction } from "../actions/vestingAction/lockStakeAction";
import { TiamatContract } from "../state/tiamatContract";
import { Sent, UtxoSource } from "../state/utxoSource";
import { MatrixUtxo, TiamatSvmUtxo } from "../state/tiamatSvmUtxo";
import { SocketKupmios } from "./socketKupmios";
import { SocketPraetor, UserSockets, VectorSockets } from "./socketPraetor";
import { SubscriptionPraetor } from "./subscriptionPraetor";
import { Callback, Result } from "../state/callback";
import {
  Bech32Address,
  P,
  Trace,
  TraceUtxo,
  Tx,
  TxCompleat,
  TxId,
  UtxoSet,
  W,
} from "../../utils/wrappers";
import {
  // AckMsg,
  ElectionTxCBOR,
  ElectionTxMsg,
  NewBlockMsg,
  parseElectedSupportVectorSet,
  parseElectionTx,
  parseTippedSupportVectorSet,
  parseTippedTx,
  TippedTxCBOR,
  TippedTxMsg,
  TxClique,
  UntippedTxMsg,
} from "../state/messages";
import { EigenvectorData, ElectionData, IpPort } from "../state/electionData";
import {
  EigenValue,
  PDappConfigT,
  PDappParamsT,
} from "../../types/tiamat/tiamat";
import http, { IncomingMessage, ServerResponse, Server } from "http"; // TODO https
import {
  WebSocket,
  CloseEvent,
  MessageEvent,
  ErrorEvent,
  WebSocketServer,
} from "ws";
import { getEd25519KeyHashHex } from "../../utils/conversions";
import { Effector } from "../data/effector";
import { TiamatCortex } from "../state/tiamatCortex";

/**
 *
 */
export class SocketServer<
  DC extends PDappConfigT,
  DP extends PDappParamsT,
  CT extends TiamatContract<DC, DP>,
> {
  private static instances = new Map<string, number>();
  public readonly name: string;

  private readonly socketType = `server`;
  private readonly processedTxesIn: Set<Core.TransactionId> = new Set(); // sent and rejected tipped txes
  private readonly ownIpPort: IpPort;
  private vectorPeerData: AssocMap<IpPort, EigenvectorData> = new AssocMap(
    (ip) => `${ip.ip}:${ip.port}`,
  );
  // private vectorPeerSockets: VectorSocket[] = [];
  private vectorPeerSockets: SocketPraetor<VectorSockets>;
  private readonly userSockets: SocketPraetor<UserSockets>;
  private readonly userAddressSubscriptions = new Map<
    string,
    SubscriptionPraetor
  >();
  private readonly userBlockSubscriptions = new Set<string>();
  private tip?: bigint;
  private readonly recordedTxs: Set<Core.TransactionId> = new Set();
  private eligible = false;
  // private ipInSync = false; // TODO manage and make use of this (not a priority rn)

  private static singleton?: SocketServer<any, any, any>;
  private server?: Server;
  private retryConnectTimeout?: NodeJS.Timeout;
  private counterConnectTimeout?: NodeJS.Timeout;
  private connectionCheckTimeout?: NodeJS.Timeout;
  private active = true;

  private readonly cortex: TiamatCortex<DC, DP, CT>;

  /**
   *
   * @param ownPrivateKey
   * @param ownPublicKeyHash
   * @param targetOwnIP
   * @param targetOwnPort
   * @param targetStake
   * @param utxoSource
   * @param socketKupmios
   * @param contract
   * @param blaze
   */
  private constructor(
    // private readonly ownPrivateKey: Core.Bip32PrivateKey,
    private readonly ownPublicKeyHash: Core.Ed25519KeyHashHex,
    public readonly targetOwnIP: string,
    public readonly targetOwnPort: number,
    public readonly targetStake: bigint,
    private readonly utxoSource: UtxoSource,
    private readonly socketKupmios: SocketKupmios,
    private readonly contract: CT,
    private readonly blaze: Blaze<P, W>,
  ) {
    this.ownIpPort = {
      ip: targetOwnIP,
      port: targetOwnPort,
    };
    this.name = `${targetOwnIP}:${targetOwnPort} SocketServer`;
    // blaze.name = `${this.name} Blaze`;
    const instance = SocketServer.instances.get(this.name) ?? 0;
    SocketServer.instances.set(this.name, instance + 1);
    if (instance) this.name = `${this.name}#${instance}`;

    this.vectorPeerSockets = new SocketPraetor(
      `${this.name} VectorSockets`,
      new VectorSockets(),
    );
    this.userSockets = new SocketPraetor(
      `${this.name} UserSockets`,
      new UserSockets(),
    );

    this.log(`ownKeyHash:`, this.ownPublicKeyHash);
    this.log(`targetOwnIP:`, this.targetOwnIP);
    this.log(`targetOwnPort:`, this.targetOwnPort);
    this.log(`targetStake:`, this.targetStake);

    this.cortex = new TiamatCortex<DC, DP, CT>(this.name, contract);

    this.cortex.electionsPlexus.innervateMarginEffectors(
      this.maybeAcceptConnections,
      this.updateElectionConnections,
    );

    // contract.electionsPlexus.currentElectionGanglion.innervateEffector(
    //   new Effector(
    //     new Callback(
    //       `always`,
    //       [this.name, `currentElectionGanglion`, `innervateEffector`],
    //       async (election, trace) => {
    //         this.tip = election.tiamatParams.suggested_tip;
    //         this.vectorPeerData = election.eligibleEVsValencies;
    //         this.vectorPeerData.delete(this.ownIpPort);

    //       },
    //     )
    //   )
    // )

    // NOTE/TODO: keeping the rest of this around in case we want to parse it into the new version later
    // contract.subscribeToElection(
    //   new Callback(
    //     `always`,
    //     [this.name, `constructor`, `subscribeToElection`],
    //     async (election: ElectionData<DC, DP>, trace) => {

    //       if (election.forCycle === `current`) {
    //         const fromMs = Number(election.fromMs);
    //         const toMs = Number(election.toMs);
    //         const midCycleMs =
    //           fromMs + Number(election.tiamatParams.cycle_duration) * 0.5;

    //         const sinceStartMs = Date.now() - fromMs;
    //         const untilEndMs = toMs - Date.now();
    //         const untilMidMs = midCycleMs - Date.now();

    //         assert(
    //           sinceStartMs >= 0,
    //           `${this.name}: current election starts in ${
    //             -sinceStartMs / slotDurationMs
    //           } slots`,
    //         );
    //         this.log(
    //           `current election started`,
    //           sinceStartMs / slotDurationMs,
    //           `slots ago`,
    //         );
    //         assert(
    //           untilEndMs > 0,
    //           `${this.name}: current election in the past by ${
    //             -untilEndMs / slotDurationMs
    //           } slots`,
    //         );
    //         this.log(
    //           `current election ends in`,
    //           untilEndMs / slotDurationMs,
    //           `slots`,
    //         );

    //         if (this.matrixUnchanged(election)) {
    //           if (this.sameElectionTimes(election)) {
    //             if (this.nexusUnchanged(election)) {
    //               this.nextElection?.assertAlignment(election);
    //             }
    //             if (untilMidMs > 0) {
    //               this.log(
    //                 `checking connections in`,
    //                 untilMidMs / slotDurationMs,
    //                 `slots`,
    //               );
    //               this.connectionCheckTimeout = setTimeout(
    //                 () => this.checkCurrentConnections(),
    //                 untilMidMs,
    //               );
    //             } else {
    //               this.log(
    //                 `missed connection check by ${
    //                   -untilMidMs / slotDurationMs
    //                 } slots`,
    //               );
    //             }
    //           }
    //         }
    //       }

    //     },
    //   ),
    // );

    this.cortex.matrixPlexus.svmUtxoStem.innervateEffector(
      new Effector(
        `SocketServerMatrixEffector`,
        new Callback(
          `always`,
          [this.name, `constructor`, `subscribeToMatrix`],
          async (matrix, trace) => {
            const maybeMatrix = matrix.maybeUtxo;
            if (typeof maybeMatrix === `string`) {
              return await Promise.resolve([
                `${this.name} - effector for syncEigenValue: matrix = ${maybeMatrix}`,
              ]);
            } else {
              return [await this.syncEigenValue(maybeMatrix, trace)];
            }
          },
        ),
      ),
    );
  }

  //////////////////////////////////////////
  // public endpoints

  /**
   *
   * @param ownPrivateKey
   * @param targetOwnIP
   * @param targetOwnPort
   * @param targetStake
   * @param utxoSource
   * @param socketKupmios
   * @param contract
   * @param blaze
   */
  public static async newTestingInstance<
    DC extends PDappConfigT,
    DP extends PDappParamsT,
    CT extends TiamatContract<DC, DP>,
  >(
    ownPrivateKey: Core.Bip32PrivateKey,
    targetOwnIP: string,
    targetOwnPort: number,
    targetStake: bigint,
    utxoSource: UtxoSource,
    socketKupmios: SocketKupmios,
    contract: CT,
    blaze: Blaze<P, W>,
  ): Promise<SocketServer<DC, DP, CT>> {
    const { publicKey } = await HotWallet.generateAccountAddressFromMasterkey(
      ownPrivateKey,
      contract.networkId,
    );
    const ownPublicKeyHash = await getEd25519KeyHashHex(publicKey);
    // await contract.startWatchingElection();
    const socketServer = new SocketServer<DC, DP, CT>(
      // ownPrivateKey,
      ownPublicKeyHash,
      targetOwnIP,
      targetOwnPort,
      targetStake,
      utxoSource,
      socketKupmios,
      contract,
      blaze,
    );

    const result = await socketServer.myelinate([
      `SocketServer.newTestingInstance`,
    ]);
    result.forEach((r) => r.burn().forEach((m) => socketServer.log(m)));
    return socketServer;
  }

  /**
   *
   * @param ownPrivateKey
   * @param targetOwnIP
   * @param targetOwnPort
   * @param targetStake
   * @param utxoSource
   * @param socketKupmios
   * @param contract
   * @param blaze
   */
  public static async createSingleton<
    DC extends PDappConfigT,
    DP extends PDappParamsT,
    CT extends TiamatContract<DC, DP>,
  >(
    ownPrivateKey: Core.Bip32PrivateKey,
    targetOwnIP: string,
    targetOwnPort: number,
    targetStake: bigint,
    utxoSource: UtxoSource,
    socketKupmios: SocketKupmios,
    contract: CT,
    blaze: Blaze<P, W>,
  ): Promise<SocketServer<DC, DP, CT>> {
    assert(!SocketServer.singleton, `singleton already exists`);
    const { publicKey } = await HotWallet.generateAccountAddressFromMasterkey(
      ownPrivateKey,
      contract.networkId,
    );
    const ownPublicKeyHash = await getEd25519KeyHashHex(publicKey);
    // await contract.startWatchingElection();
    SocketServer.singleton = new SocketServer<DC, DP, CT>(
      // ownPrivateKey,
      ownPublicKeyHash,
      targetOwnIP,
      targetOwnPort,
      targetStake,
      utxoSource,
      socketKupmios,
      contract,
      blaze,
    );

    const result = await SocketServer.singleton.myelinate([
      `SocketServer.createSingleton`,
    ]);
    result.forEach((r) =>
      r.burn().forEach((m) => SocketServer.singleton?.log(m)),
    );
    return SocketServer.singleton;
  }

  /**
   *
   */
  public static getSingleton<
    DC extends PDappConfigT,
    DP extends PDappParamsT,
    CT extends TiamatContract<DC, DP>,
  >(): SocketServer<DC, DP, CT> {
    assert(SocketServer.singleton, `singleton does not exist`);
    return SocketServer.singleton;
  }

  /**
   *
   */
  public serve = () => {
    this.server = http.createServer(this.vectorHandler);

    this.server.listen(this.targetOwnPort, () => {
      this.log(`Started server on port:`, this.targetOwnPort);
    });
  };

  // public serve = () => {
  //   this.server = Deno.serve({
  //     port: this.targetOwnPort,
  //     handler: this.vectorHandler,
  //   });
  //   this.log(`Started server on port:`, this.targetOwnPort);
  // };

  /**
   *
   */
  public shutdown = async () => {
    this.log(`SHUTTING DOWN`);
    this.active = false;
    clearTimeout(this.retryConnectTimeout);
    clearTimeout(this.counterConnectTimeout);
    clearTimeout(this.connectionCheckTimeout);
    this.socketKupmios.stopQueryLoop();
    // this.contract.stopWatchingElection();
    // await new Promise((resolve) => setTimeout(resolve, wsAttemptTimeoutMs * 2));
    // const peers = this.vectorPeerSockets.seize(`shutdown`);
    // const users = this.userSockets.seize(`shutdown`);
    // await new Promise((resolve) => setTimeout(resolve, wsAttemptTimeoutMs * 2));
    await this.closeAllConnections();
    // // await new Promise((resolve) => setTimeout(resolve, wsAttemptTimeoutMs * 2));
    // await this.server?.shutdown();
    // // await new Promise((resolve) => setTimeout(resolve, 1000));
    // // this.contract.stopWatchingElection();
    const msg = `${this.name} SHUTDOWN COMPLETE`;
    // this.log(msg);
    return msg;
  };

  //////////////////////////////////////////
  // internal methods

  private myelinate = async (from: string[]): Promise<Result[]> => {
    const from_ = [...from, `SocketServer: ${this.name}`];
    return await this.cortex.myelinate(from_);
  };

  /**
   *
   * @param sockets
   * @param ipPort
   * @param ws
   * @param type
   * @param role
   */
  private awaitSocketConnection = async (
    sockets: VectorSockets | UserSockets,
    ipPort: IpPort,
    ws: WebSocket,
    type: "vector" | "user",
    role: "client" | "server",
  ): Promise<() => boolean> => {
    const ip = ipPort.ip;
    const port = ipPort.port;
    this.log(`establishing socket with ${ip}:${port}`);
    let openingTimeout: NodeJS.Timeout;
    let awaitOpenTimeout: NodeJS.Timeout;

    /**
     *
     * @param ws
     */
    const onOpeningSuccess = (ws: WebSocket) => {
      const existingRole = sockets.has(ip, port);
      if (!existingRole) {
        if (type === "vector") {
          const vectorKeyHash = this.vectorPeerData.get(ipPort)?.keyHash;
          if (!vectorKeyHash) {
            const msg = `data for vector ${ip}:${port} not found in ${this.vectorPeerData.show(
              (ev) => ev.keyHash.concise(),
            )}`;
            this.log(msg);
            this.throw(msg);
          } else {
            sockets.insert(ipPort, ws, vectorKeyHash.toBlaze(), role);
          }
        } else {
          sockets.insert(ipPort, ws, "user" as Core.Ed25519KeyHashHex, role); // TODO naughty casting
        }
      } else {
        const msg = `socket already exists for ${ip}:${port} with role ${existingRole}`;
        if (existingRole === role && role === "server") {
          this.throw(msg);
        } else {
          this.log(msg);
        }
      }
    };

    /**
     *
     * @param event
     */
    const onOpeningError = (event: CloseEvent | ErrorEvent) => {
      this.log(`ERROR: ${ip}:${port} ${type} connection failed:`, event);
    };

    /**
     *
     * @param _event
     */
    const onOpenedClose = async (_event: CloseEvent) => {
      this.log(
        `DISCONNECTED FROM ${type} ${ip}:${port}`,
        // event,
      );
      let peers_: VectorSockets | UserSockets;
      let id_: string;
      if (type === "vector") {
        [peers_, id_] = await this.vectorPeerSockets.latch(`onOpenedClose`);
      } else {
        [peers_, id_] = await this.userSockets.latch(`onOpenedClose`);
      }

      if (peers_.has(ip, port)) {
        sockets.delete(ip, port);
      } else {
        this.log(`socket not found for ${ip}:${port}`);
        // NOTE: this can happen if the other party disconnects before we do (TODO include in checks way later on)
      }

      if (type === "vector") {
        this.vectorPeerSockets.discharge(id_);
      } else {
        this.userSockets.discharge(id_);
      }
    };

    /**
     *
     */
    const mkOnMessage = () => {
      const receiveMessage =
        type === "vector" ? this.receiveVectorMessage : this.receiveUserMessage;
      return async (event: MessageEvent) => {
        // ws.send(`ACK`);
        assert(
          typeof event.data === `string`,
          `${this.name}.receiveMessage: expected string`,
        );
        const result: Result = await receiveMessage(ws, event.data, ipPort);
        result.burn().forEach((r) => this.log(r));
      };
    };

    return await new Promise<() => boolean>((resolve) => {
      let isOpen = role === "client";
      let timedOut = false;

      ws.addEventListener(`close`, (event) => {
        if (!isOpen) {
          this.log(`connection could not be established to ${ip}:${port}`);
          onOpeningError(event);
          resolve(() => false);
        } else {
          onOpenedClose(event);
        }
      });

      const onMessage = mkOnMessage();
      ws.addEventListener(`message`, (event) => {
        if (timedOut) return;
        onMessage(event);
      });

      openingTimeout = setTimeout(() => {
        timedOut = true;
        clearTimeout(awaitOpenTimeout);
        const msg = `opening timeout to ${ip}:${port}`;
        this.log(msg);
        ws.close(1000, msg);
        resolve(() => false);
        // this.throw(msg);
      }, wsAttemptTimeoutMs);

      /**
       *
       * @param ws
       */
      const mkInsertion = (ws: WebSocket) => {
        clearTimeout(openingTimeout);
        this.log(`CONNECTED TO ${type} ${ip}:${port}`);
        return (): true => {
          onOpeningSuccess(ws);
          return true;
        };
      };

      if (role === "server") {
        ws.addEventListener(`open`, () => {
          if (!timedOut) {
            isOpen = true;
            const insertion = mkInsertion(ws);
            resolve(insertion);
          } else {
            ws.close(1000, `opening timed out`);
          }
        });
        ws.addEventListener(`error`, (err) => {
          if (!isOpen) {
            onOpeningError(err);
            ws.close(1000, `opening error`);
            resolve(() => false);
          }
        });
      } else {
        /**
         *
         */
        const awaitOpen = () => {
          if (ws.readyState === WebSocket.OPEN) {
            onOpeningSuccess(ws);
            const insertion = mkInsertion(ws);
            resolve(insertion);
          } else {
            this.log(
              `waiting for opening to ${ip}:${port}, state:`,
              this.showState(ws.readyState),
            );
            if (!timedOut) {
              awaitOpenTimeout = setTimeout(awaitOpen, 1);
            }
          }
        };
        awaitOpen();
      }
    });
  };

  /**
   *
   * @param userIP
   * @param userPort
   * @param ws
   */
  private receiveUserConnection = async (
    userIP: string,
    userPort: number,
    ws: WebSocket,
  ) => {
    const [users, id] = await this.userSockets.latch(`receiveUserConnection`);
    const ipPort: IpPort = {
      ip: userIP,
      port: userPort,
    };
    const insert = await this.awaitSocketConnection(
      users,
      ipPort,
      ws,
      "user",
      "client",
    );
    const success = insert();
    this.log(`receiveUserConnection success:`, success);
    this.userSockets.discharge(id);
  };

  /**
   *
   * @param vectorIP
   * @param vectorPort
   * @param ws
   */
  private receiveVectorConnection = async (
    vectorIP: string,
    vectorPort: number,
    // vectorKeyHash: Core.Ed25519KeyHashHex,
    ws: WebSocket,
  ) => {
    const [peers, id] = await this.vectorPeerSockets.latch(
      `receiveVectorConnection`,
    );

    const ipPort: IpPort = {
      ip: vectorIP,
      port: vectorPort,
    };
    const insert = await this.awaitSocketConnection(
      peers,
      ipPort,
      ws,
      "vector",
      "client",
    );
    const success = insert();
    this.log(`receiveUserConnection success:`, success);
    this.vectorPeerSockets.discharge(id);
  };

  /**
   *
   * @param vectorIpPort
   */
  private getVectorKeyHash = (vectorIpPort: IpPort): KeyHash | undefined => {
    const peerData = this.vectorPeerData.get(vectorIpPort);
    this.log(
      `peerData:`,
      JSON.stringify(peerData),
      `for ${vectorIpPort.ip}:${vectorIpPort.port}`,
    );
    return peerData?.keyHash;
  };

  /**
   *
   */
  private acceptingConnections = () => {
    return this.eligible;
  };

  /**
   *
   */
  private get vectorHandler() {
    /**
     *
     * @param req
     * @param res
     */
    const handler = (req: IncomingMessage, res: ServerResponse) => {
      /**
       *
       * @param reason
       * @param ip
       * @param port
       */
      const reject = (reason: string, ip?: string, port?: number) => {
        const msg = `<> ${ip}:${port}: ${reason}`;
        this.log(msg);
        if (!handleInvalidConnectionAttempts) {
          this.throw(msg);
        }
        res.statusCode = 400;
        res.end(msg);
      };

      if (req.headers["upgrade"] === "websocket") {
        const ip = req.socket.remoteAddress;
        if (!ip) {
          const reason = `No ip address specified`;
          return reject(reason, ip);
        }

        if (!req.url) {
          const reason = `No URL specified from ${ip}`;
          return reject(reason, ip);
        }

        const url = new URL(req.url, `http://${req.headers.host}`); // Ensure a base URL
        const socketType = url.searchParams.get("type");
        const remotePort = url.searchParams.get("port");
        if (remotePort === null) {
          const reason = `No port specified from ${ip}`;
          return reject(reason, ip);
        }
        const port = parseInt(remotePort);

        if (!this.active) {
          const reason = `I am shut down`;
          return reject(reason, ip, port);
        }

        if (!this.acceptingConnections()) {
          const reason = `I am not elected`;
          return reject(reason, ip, port);
        }

        // Upgrade the request to WebSocket for client and server socket types
        /**
         *
         * @param onSuccess
         */
        const handleUpgrade = (onSuccess: (socket: WebSocket) => void) => {
          const wss = new WebSocketServer({
            noServer: true,
          });
          wss.handleUpgrade(
            req,
            req.socket,
            Buffer.alloc(0),
            (client: WebSocket, _request: IncomingMessage) => {
              onSuccess(client);
            },
          );
        };

        if (socketType === "client") {
          handleUpgrade((socket) => {
            this.receiveUserConnection(ip, port, socket);
          });
          return; // The WebSocket connection is now open, no need to return HTTP response
        } else if (socketType === "server") {
          const keyHash = this.getVectorKeyHash({
            ip,
            port,
          });
          if (keyHash) {
            handleUpgrade((socket) => {
              this.receiveVectorConnection(ip, port, socket);
            });
            return; // The WebSocket connection is now open, no need to return HTTP response
          } else {
            const reason = `You are not elected: ${this.vectorPeerData.show(
              (ev) => ev.keyHash.concise(),
            )}`;
            return reject(reason, ip, port);
          }
        } else {
          const reason = `Invalid socket type: ${socketType}`;
          return reject(reason, ip, port);
        }
      } else {
        // Handle non-WebSocket requests
        const reason = `This is not a WebSocket request`;
        return reject(reason);
      }
    };

    return handler;
  }

  private maybeAcceptConnections = async (
    election: ElectionData<DC, DP>,
  ): Promise<Result> => {
    const firstOwnIndex = election.eligibleEVs.findIndex(
      (ev) => ev.vector.toBlaze() === this.ownPublicKeyHash,
    );
    const eligible = firstOwnIndex !== -1;
    this.log(`maybeOpenForConnections: firstOwnIndex =`, firstOwnIndex);
    let msg: string;
    if (!eligible) {
      if (this.eligible) {
        msg = `stopped being eligible`;
        this.eligible = false; // for speed before closing connections
        await this.closeAllConnections();
      } else {
        msg = `still not eligible`;
      }
    } else {
      if (!this.eligible) {
        msg = `became eligible`;
        this.eligible = true;
      } else {
        msg = `remaining eligible`;
      }
    }
    this.log(msg);
    return new Result(
      [msg],
      this.name,
      `maybeAcceptConnections`,
      Trace.source(`SOCKET`, `${this.name}.maybeAcceptConnections`),
    );
  };

  private updateElectionConnections = async (
    election: ElectionData<DC, DP>,
    trace: Trace,
  ): Promise<Result> => {
    const trace_ = trace.via(`${this.name}.updateElectionConnections`);
    this.tip = election.tiamatParams.suggested_tip;
    const firstOwnIndex = election.eligibleEVs.findIndex(
      (ev) => ev.vector.toBlaze() === this.ownPublicKeyHash,
    );
    const eligible = firstOwnIndex !== -1;
    this.log(`updateElectionConnections: firstOwnIndex =`, firstOwnIndex);
    this.vectorPeerData = election.eligibleEVsValencies.clone;
    const deleted = this.vectorPeerData.delete(this.ownIpPort);
    if (!eligible) {
      assert(
        !deleted,
        `${this.name}.updateElectionConnections: deleted self from eligibleEVsValencies`,
      );
      return new Result(
        [`updateElectionConnections: not eligible`],
        this.name,
        `updateElectionConnections`,
        trace_,
      );
    } else {
      assert(
        deleted,
        `${this.name}.updateElectionConnections: did not delete self from eligibleEVsValencies`,
      );
    }

    const marginDurationMs = Number(election.tiamatParams.margin_duration);

    const counterConnectTimeoutMs = marginDurationMs * 2;
    const retryTimeoutMs = marginDurationMs;
    const retryDeadlineMs = Date.now() + marginDurationMs * 2;
    const electionCheckTimeoutMs = marginDurationMs * 3;

    setTimeout(() => this.checkCurrentConnections(), electionCheckTimeoutMs);

    await this.updateVectorConnections(
      election.eligibleEVs,
      election.eligibleEVsValencies,
      firstOwnIndex,
      counterConnectTimeoutMs,
      false,
      retryTimeoutMs,
      retryDeadlineMs,
      trace_,
    );

    return new Result(
      [`connections updated`],
      this.name,
      `updateElectionConnections`,
      trace_,
    );
  };

  /**
   *
   * @param eligibleEVs
   * @param eligibleEVsValencies
   * @param firstOwnIndex
   * @param counterConnectTimeoutMs
   * @param counterConnecting
   * @param retryTimeoutMs
   * @param retryDeadlineMs
   * @param trace
   */
  private updateVectorConnections = async (
    eligibleEVs: EigenValue[],
    eligibleEVsValencies: AssocMap<IpPort, EigenvectorData>,
    firstOwnIndex: number,
    counterConnectTimeoutMs: number,
    counterConnecting: boolean,
    retryTimeoutMs: number,
    retryDeadlineMs: number,
    trace: Trace,
  ): Promise<void> => {
    if (!this.active) return;

    const [peers, id] = await this.vectorPeerSockets.latch(
      `updateVectorConnections`,
    );
    this.log(`updating vector connections`);

    await peers.forEach(async (ws, ipPort) => {
      if (!eligibleEVsValencies.has(ipPort)) {
        await this.disconnectFromVector(ipPort, ws, 1000, `new cycle`);
      }
    });

    const insertionPromises: Promise<() => boolean>[] = [];
    const connectingTo: IpPort[] = [];
    /**
     *
     * @param eigenValue
     */
    const connectTo = (eigenValue: EigenValue) => {
      const vectorIpPort: IpPort = {
        ip: eigenValue.ip,
        port: Number(eigenValue.port),
      };
      if (!peers.has(vectorIpPort.ip, vectorIpPort.port)) {
        if (
          !connectingTo.some(
            (vector) =>
              vector.ip === vectorIpPort.ip &&
              vector.port === vectorIpPort.port,
          )
        ) {
          this.log(
            `updateVectorConnections: preparing to connect to ${vectorIpPort.ip}:${vectorIpPort.port}`,
          );
          connectingTo.push(vectorIpPort);
          insertionPromises.push(this.connectToVector(peers, vectorIpPort));
        } else {
          this.log(
            `updateVectorConnections: double entry for ${vectorIpPort.ip}:${vectorIpPort.port}, skipping`,
          );
        }
      } else {
        this.log(
          `updateVectorConnections: already connected to ${vectorIpPort.ip}:${vectorIpPort.port}`,
        );
      }
    };

    assert(!counterConnecting, `counter-connecting not implemented`);
    // TODO this should be lastOwnIndex + 1... maybe? reconsider later when implementing counter-connecting
    if (counterConnecting) connectingTo.push(this.ownIpPort); // TODO more elegant solution
    const from = counterConnecting ? firstOwnIndex + 1 : 0;
    const to = counterConnecting ? eligibleEVs.length : firstOwnIndex;
    this.log(`updateVectorConnections: from ${from} to ${to}`);
    for (let i = from; i < to; i++) {
      const eigenValue = eligibleEVs[i]!;
      this.log(`evaluating eigenValue ${i}:`, eigenValue.show());
      connectTo(eigenValue);
    }
    this.log(
      `updateVectorConnections: ${insertionPromises.length} connection attempts initialized`,
    );

    const insertions = await Promise.all(insertionPromises);
    const success = insertions.every((insert) => insert());

    this.vectorPeerSockets.discharge(id);
    this.log(`updateVectorConnections: connection attempts success:`, success);

    if (!counterConnecting) {
      // if this is our counter-connection-attempt, we neither retry nor start another
      if (!success) {
        // if some outgoing are not connected, we try to retry
        /**
         *
         */
        const retry = async () => {
          if (!this.active) {
            return;
          }
          const retryTimeoutMs_ = Date.now() + retryTimeoutMs;
          if (retryTimeoutMs_ > retryDeadlineMs) return;
          await this.updateVectorConnections(
            eligibleEVs,
            eligibleEVsValencies,
            firstOwnIndex,
            counterConnectTimeoutMs,
            false,
            retryTimeoutMs,
            retryDeadlineMs,
            trace.via(`${this.name}.updateVectorConnections.retry`),
          );
        };

        this.retryConnectTimeout = setTimeout(retry, retryTimeoutMs);
      } else if (attemptCounterConnect) {
        // if all outgoing are connected, we start the counter-connection-attempt
        /**
         *
         */
        const counterConnect = async () => {
          if (!this.active) {
            return;
          }
          await this.updateVectorConnections(
            eligibleEVs,
            eligibleEVsValencies,
            firstOwnIndex,
            counterConnectTimeoutMs,
            true,
            retryTimeoutMs,
            retryDeadlineMs,
            trace.via(`${this.name}.updateVectorConnections.counterConnect`),
          );
        };
        this.counterConnectTimeout = setTimeout(
          counterConnect,
          counterConnectTimeoutMs,
        );
      }
    }
  };

  // /**
  //  *
  //  * @param currentElection
  //  */
  // private matrixUnchanged = (
  //   currentElection: ElectionData<DC, DP>,
  // ): boolean => {
  //   if (
  //     this.nextElection?.matrixUtxoString === currentElection.matrixUtxoString
  //   ) {
  //     this.log(`same matrix utxos:\n`, currentElection.matrixUtxoString);
  //     return true;
  //   } else {
  //     this.log(
  //       `new matrix utxo:\n`,
  //       this.nextElection?.matrixUtxoString,
  //       `\n`,
  //       currentElection.matrixUtxoString,
  //     );
  //     return false;
  //   }
  // };

  // /**
  //  *
  //  * @param currentElection
  //  */
  // private nexusUnchanged = (currentElection: ElectionData<DC, DP>): boolean => {
  //   if (this.nextElection?.seed === currentElection.seed) {
  //     this.log(`same nexus seeds:\n`, currentElection.seed);
  //     return true;
  //   } else {
  //     this.log(
  //       `new nexus seed:\n`,
  //       this.nextElection?.seed,
  //       `\n`,
  //       currentElection.seed,
  //     );
  //     return false;
  //   }
  // };

  // /**
  //  *
  //  * @param currentElection
  //  */
  // private sameElectionTimes = (
  //   currentElection: ElectionData<DC, DP>,
  // ): boolean => {
  //   const nextElection = this.nextElection;
  //   assert(nextElection, `${this.name}: next election not found`);
  //   // TODO fix those cases
  //   if (
  //     nextElection.fromMs === currentElection.fromMs &&
  //     nextElection.toMs === currentElection.toMs
  //   ) {
  //     return true;
  //   } else {
  //     this.log(
  //       `election-times not aligned:\n`,
  //       `next:   `,
  //       Number(nextElection.fromMs) / slotDurationMs,
  //       Number(nextElection.toMs) / slotDurationMs,
  //       `\n`,
  //       `current:`,
  //       Number(currentElection.fromMs) / slotDurationMs,
  //       Number(currentElection.toMs) / slotDurationMs,
  //     );
  //     const precedesBy =
  //       Number(currentElection.fromMs - nextElection.fromMs) / slotDurationMs;
  //     const precedesBy_ =
  //       Number(currentElection.toMs - nextElection.toMs) / slotDurationMs;
  //     assert(
  //       precedesBy === precedesBy_,
  //       `${this.name}: cycle duration changed: ${precedesBy} vs. ${precedesBy_}`,
  //     );
  //     if (currentElection.toMs === nextElection.fromMs) {
  //       this.log(
  //         `next election starts immediately after current election, assuming we're just fast this time...`,
  //       ); // TODO investigate if that's an issue (later)
  //     } else if (precedesBy >= 0) {
  //       this.log(
  //         `next election precedes current election by ${precedesBy} slots`,
  //       ); // TODO fix this (later)
  //       // this.throw(
  //       //   `next election precedes current election by ${precedesBy} slots`,
  //       // );
  //     } else {
  //       this.throw(
  //         `next election after current election by ${-precedesBy} slots`,
  //       );
  //     }
  //     return false;
  //   }
  // };

  /**
   *
   */
  private checkCurrentConnections = async () => {
    if (!this.active) return;
    this.log(`checking current connections`);
    const [peers, id] = await this.vectorPeerSockets.latch(
      `checkCurrentConnections`,
    );
    const peerData = this.vectorPeerData;
    // if (this.nextElection) {
    const notConnected: IpPort[] = [];
    for (const [peer, _] of peerData) {
      if (!peers.has(peer.ip, peer.port)) {
        notConnected.push(peer);
      }
    }
    if (notConnected.length) {
      const not = notConnected
        .map((peer) => `\t${peer.ip}:${peer.port}`)
        .join(`\n`);
      const all = [...peerData.keys()]
        .map((peer) => `\t${peer.ip}:${peer.port}`)
        .join(`\n`);
      // const only = peers.sockets.map((peer) =>
      //   `\t${peer.ipPort.ip}:${peer.ipPort.port}`
      // );
      const msg = `not connected to\n${not}\nof\n${all}}`;
      if (assertVectorConnections) {
        this.throw(msg);
      } else {
        this.log(msg);
      }
    }
    // }

    this.vectorPeerSockets.discharge(id);
    this.log(`connections ok`);
  };

  /**
   *
   */
  private closeAllConnections = async () => {
    this.log(`closing all connections`);

    const [peers, id] =
      await this.vectorPeerSockets.latch(`closeAllConnections`);
    const [users, id_] = await this.userSockets.latch(`closeAllConnections`);

    const code = 1000; // TODO code?
    const reason = `election ended`;
    peers.forEach((vector) => {
      vector.close(code, reason);
    });
    peers.clear();
    users.forEach((ws) => {
      ws.close(code, reason);
    });
    users.clear();

    this.vectorPeerSockets.discharge(id);
    this.userSockets.discharge(id_);
    this.log(`closed all connections`);
  };

  /**
   *
   * @param peers
   * @param vectorIpPort
   */
  private connectToVector = async (
    peers: VectorSockets,
    vectorIpPort: IpPort,
  ): Promise<() => boolean> => {
    const ip = vectorIpPort.ip;
    const port = vectorIpPort.port;
    const ws = new WebSocket(
      `ws://${ip}:${port}?type=${this.socketType}&port=${this.ownIpPort.port}`,
    );
    return await this.awaitSocketConnection(
      peers,
      vectorIpPort,
      ws,
      `vector`,
      `server`,
    );
  };

  // returns index of the closed socket
  /**
   *
   * @param ipPort
   * @param ws
   * @param code
   * @param reason
   */
  private disconnectFromVector = async (
    ipPort: IpPort,
    ws: WebSocket,
    code?: number,
    reason?: string,
  ): Promise<void> => {
    this.log(`disconnecting from vector ${ipPort.ip}:${ipPort.port}`);
    if (
      ws.readyState === WebSocket.OPEN ||
      ws.readyState === WebSocket.CONNECTING
    ) {
      // ws.close(code, reason); // TODO better?
      return await new Promise((resolve) => {
        ws.addEventListener(`close`, () => {
          resolve();
        });
        ws.close(code, reason);
      });
    }
  };

  /**
   *
   * @param _ws
   * @param data
   * @param userIpPort
   */
  private receiveUserMessage = async (
    _ws: WebSocket,
    data: string,
    userIpPort: IpPort,
  ): Promise<Result> => {
    // TODO catch and handle errors
    const msg = JSON.parse(data);
    this.log(`received message from user ${userIpPort.ip}:${userIpPort.port}`);

    const fields = Object.keys(msg);
    assert(
      fields.length === 2,
      `${this.name}: wrong number of fields in ${fields}\n\nmsg: ${msg}\n\nraw: ${data}`,
    );
    assert(
      fields[0] === `payload`,
      `${this.name}: first field not "payload": ${
        fields[0]
      }\n\nmsg: ${msg}\n\nraw: ${data}`,
    );
    assert(
      fields[1] === `tag`,
      `${this.name}: first field not "tag": ${
        fields[1]
      }\n\nmsg: ${msg}\n\nraw: ${data}`,
    );

    if (maxUserMsgDelay !== null) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * maxUserMsgDelay!),
      );
    }

    let result: Result;
    // if (msg.tag === `subscribeToNewBlock`) {
    //   result = this.setUserBlockSubscription(userIpPort);
    // } else
    if (msg.tag === `subscribedAddresses`) {
      assert(
        msg.payload instanceof Array,
        `${this.name}: wrong data type for ${msg.tag}`,
      );
      result = new Result(
        [
          await this.updateUserBlockSubscription(userIpPort),
          await this.updateUserAddressSubscriptions(userIpPort, msg.payload),
        ],
        this.name,
        `receiveUserMessage`,
        Trace.source(`SOCKET`, `${this.name}.receiveUserMessage`),
      );
    } else if (msg.tag === `untipped tx`) {
      assert(
        typeof msg.payload === `string`,
        `${this.name}: wrong data type for ${msg.tag}`,
      );
      result = await this.processUntippedTx(
        msg.payload,
        // ws,
        Trace.source(
          `SOCKET`,
          `${this.name}.receiveUserMessage.processUntippedTx`,
        ),
      );
    } else if (msg.tag === `tipped tx`) {
      assert(
        msg.payload instanceof Object,
        `${this.name}: wrong data type for ${msg.tag}`,
      );
      result = await this.processTippedTx(
        msg.payload,
        Trace.source(
          `SOCKET`,
          `${this.name}.receiveUserMessage.processTippedTx`,
        ),
      );
    } else if (msg.tag === `election-tx`) {
      assert(
        msg.payload instanceof Object,
        `${this.name}: wrong data type for ${msg.tag}`,
      );
      result = await this.processElectionTx(
        msg.payload,
        Trace.source(
          `SOCKET`,
          `${this.name}.receiveUserMessage.processElectionTx`,
        ),
      );
    } else {
      const error = `unknown tag: ${msg.tag}`;
      this.throw(error);
      result = new Result(
        [error],
        this.name,
        `receiveUserMessage`,
        Trace.source(`SOCKET`, `${this.name}.receiveUserMessage`),
      );
    }
    return result;
  };

  /**
   *
   * @param _ws
   * @param data
   * @param vectorIpPort
   */
  private receiveVectorMessage = async (
    _ws: WebSocket,
    data: string,
    vectorIpPort: IpPort,
  ): Promise<Result> => {
    // TODO catch and handle errors
    const msg = JSON.parse(data);

    const fields = Object.keys(msg);
    assert(
      fields.length === 2,
      `${this.name}: wrong number of fields in ${fields}`,
    );
    assert(
      fields[0] === `payload`,
      `${this.name}: first field not "payload": ${fields[0]}`,
    );
    assert(
      fields[1] === `tag`,
      `f${this.name}: irst field not "tag": ${fields[1]}`,
    );

    if (maxVectorMsgDelay !== null) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * maxVectorMsgDelay!),
      );
    }

    const [peers, id] =
      await this.vectorPeerSockets.latch(`receiveVectorMessage`);
    assert(
      peers.has(vectorIpPort.ip, vectorIpPort.port),
      `${this.name}: unknown vector ip/port: ${vectorIpPort.ip}:${vectorIpPort.port}`,
    );
    this.vectorPeerSockets.discharge(id);
    let result: Result;
    if (msg.tag === `untipped tx`) {
      // we use this to inform each other about submissions of tipped
      // txes, such that our local utxo-state remains synced
      assert(typeof msg.data === `string`, `${this.name}: wrong data type`);
      const tx = Core.Transaction.fromCbor(msg.data);
      result = await this.recordTippedTx(
        tx,
        Trace.source(`SOCKET`, `${this.name}.receiveVectorMessage`),
      );
    } else if (msg.tag === `tipped txes`) {
      // TODO consider requiring us being elected here
      result = await this.processTippedTx(
        msg.data,
        Trace.source(`SOCKET`, `${this.name}.receiveVectorMessage`),
      );
    } else if (msg.tag === `election-tx`) {
      result = await this.processElectionTx(
        msg.data,
        Trace.source(`SOCKET`, `${this.name}.receiveVectorMessage`),
      );
    } else {
      const error = `unknown tag: ${msg.tag}`;
      this.throw(error);
      result = new Result(
        [error],
        this.name,
        `receiveVectorMessage`,
        Trace.source(`SOCKET`, `${this.name}.receiveVectorMessage`),
      );
    }
    return result;
  };

  // TODO removing subscriptions when socket closed
  /**
   *
   * @param userIpPort
   */
  private updateUserBlockSubscription = async (
    userIpPort: IpPort,
  ): Promise<Result> => {
    const user = `${userIpPort.ip}:${userIpPort.port}`;
    const trace = Trace.source(
      `SOCKET`,
      `${this.name}.updateUserBlockSubscription(${user})`,
    );
    if (this.userBlockSubscriptions.has(user)) {
      return new Result(
        [`${user} already subscribed to new blocks`],
        this.name,
        `updateUserBlockSubscription`,
        trace,
      );
    }
    this.userBlockSubscriptions.add(user);

    const result = await this.utxoSource.subscribeToNewBlock(
      this,
      new Callback(
        `always`,
        [
          this.name,
          `setUserBlockSubscription`,
          `${userIpPort.ip}:${userIpPort.port}`,
        ],
        async (block: number, _trace: Trace) => {
          const [users, id] = await this.userSockets.latch(
            `notifyNewBlock(${user})`,
          );
          const ws = users.getByIpPort(userIpPort.ip, userIpPort.port);
          assert(
            ws,
            `${this.name} - notifyNewBlock: socket not found for user ${user}`,
          );
          const newBlockMsg: NewBlockMsg = {
            payload: block,
            tag: "new block",
          };
          ws.send(JSON.stringify(newBlockMsg));

          this.userSockets.discharge(id);
          return await Promise.resolve([`notified new block ${user}`]);
        },
      ),
    );

    return new Result(
      [result, `updated block subscriptions for ${user}`],
      this.name,
      `updateUserBlockSubscription`,
      trace,
    );
  };

  // TODO removing subscriptions when socket closed
  /**
   *
   * @param userIpPort
   * @param newAddresses
   */
  private updateUserAddressSubscriptions = async (
    userIpPort: IpPort,
    newAddresses: string[],
  ): Promise<Result> => {
    const user = `${userIpPort.ip}:${userIpPort.port}`;
    let subscriptions = this.userAddressSubscriptions.get(user);
    if (!subscriptions) {
      subscriptions = new SubscriptionPraetor(this.name);
      this.userAddressSubscriptions.set(user, subscriptions);
    }
    const [oldAddresses, id_] = await subscriptions.latch(
      `${user}.setUserAddressSubscription`,
    );

    // TODO user subscriptions to matrix and nexus are always implied
    // const newAddresses_ = [
    //   this.contract.matrix.address,
    //   this.contract.nexus.address,
    //   ...newAddresses,
    // ];

    const notifyUser: Callback<string> = new Callback(
      `always`,
      [
        this.name,
        `setUserAddressSubscription`,
        `${userIpPort.ip}:${userIpPort.port}`,
        ...newAddresses,
      ],
      async (utxoEventsMsg: string): Promise<string[]> => {
        await new Promise((resolve) => setTimeout(resolve, 10 * Math.random())); // TODO FIXME
        const [users, id] = await this.userSockets.latch(`${user}.notifyUser`);
        this.log(
          `notifying user:`,
          user,
          // `\nmessage:`,
          // utxoEventsMsg,
        );
        const ws = users.getByIpPort(userIpPort.ip, userIpPort.port);
        assert(
          ws,
          `${this.name} - notifyUser: socket not found for user ${user} in ${users.show()}`,
        );
        // this.log(this.ipPortStr, user, `socket state:`, ws.readyState); // TODO for some reason that is essential...
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(utxoEventsMsg);
        } else {
          this.log(
            `- notifyUser: socket not open for user ${user}; state: ${ws.readyState}`,
          );
        }

        this.userSockets.discharge(id);
        return await Promise.resolve([`notified ${user}`]);
      },
    );

    const newAddressSet = new Set(newAddresses);
    assert(
      newAddresses.length === newAddressSet.size,
      `${this.name}.setUserAddressSubscription: duplicate addresses`,
    );
    // TODO user subscriptions to matrix and nexus should be implied
    assert(
      newAddressSet.has(this.contract.matrix.address.bech32),
      `${this.name}.setUserAddressSubscription: not subscribing to matrix`,
    );
    assert(
      newAddressSet.has(this.contract.nexus.address.bech32),
      `${this.name}.setUserAddressSubscription: not subscribing to nexus`,
    );
    let i = 0;
    for (const newAddress of newAddressSet) {
      if (!oldAddresses.has(newAddress)) {
        this.utxoSource.subscribeToAddressMsgs(
          this,
          Bech32Address.fromBech32(
            `user ${userIpPort.ip}:${userIpPort.port} subscription ${i}`,
            newAddress,
          ),
          user,
          notifyUser,
        );
      }
    }

    for (const oldAddress of oldAddresses) {
      if (!newAddressSet.has(oldAddress)) {
        this.utxoSource.unsubscribeFromAddressMsgs(
          this,
          Bech32Address.fromBech32(`unsubscribing`, oldAddress),
          user,
        );
      }
    }

    subscriptions.discharge(newAddressSet, id_);

    return new Result(
      [`updated subscriptions for ${user}`],
      this.name,
      `updateUserAddressSubscriptions`,
      Trace.source(`SOCKET`, `${this.name}.updateUserAddressSubscriptions`),
    );
  };

  /**
   *
   * @param txCBOR
   * @param trace
   */
  private processUntippedTx = async (
    txCBOR: Core.TxCBOR,
    // ws: WebSocket,
    trace: Trace,
  ): Promise<Result> => {
    this.log(`processUntippedTx`);
    // TODO catch and handle errors
    const tx = Core.Transaction.fromCbor(txCBOR);
    const result = await this.submitTxToChain(
      tx,
      true,
      trace.via(`${this.name}.processUntippedTx`),
    );
    // const ack: AckMsg = {
    //   payload: txId.txId,
    //   tag: `ACK`,
    // };
    // ws.send(JSON.stringify(ack));

    return result;
  };

  /**
   *
   * @param tx
   * @param trace
   */
  private recordTippedTx = async (
    tx: Core.Transaction,
    trace: Trace,
  ): Promise<Result> => {
    // TODO catch and handle errors
    const trace_ = trace.via(`${this.name}.recordTippedTx`);
    const txId = tx.toCore().id;
    if (this.recordedTxs.has(txId)) {
      if (this.recordedTxs.size > recordedTxCacheSize) {
        this.recordedTxs.clear();
      }
      return new Result(
        [`tx already recorded`],
        this.name,
        `recordTippedTx`,
        trace_,
      );
    } else {
      this.recordedTxs.add(txId);
      const utxosID = await this.socketKupmios.latchUtxoSemaphore(
        `${this.name}.recordTippedTx`,
      );
      const result = await this.socketKupmios.applyTxToLedger(tx, true, trace_);
      this.socketKupmios.dischargeUtxoSemaphore(utxosID);
      return result;
    }
  };

  // TODO semaphore
  /*
  TODO prevent various exploits:

  - should not be spending any utxos of our own (important)
  - deal with spamming the same requests over and over (later)
  - check if the tipping tx is valid and spends the correct outputs of the payload-tx (later)
    -> regarding that - quoting from blaze's emulator-provider:

    Checks that are already handled by the transaction builder:
      - Fee calculation
      - Phase 2 evaluation
      - Input value == Output value (including mint value)
      - Min ada requirement
      - Stake key registration deposit amount
      - Collateral

    Checks that need to be done:
      - Verify witnesses
      - Correct count of scripts and vkeys
      - Stake key registration
      - Withdrawals
      - Validity interval
  */

  /**
   *
   * @param tx
   * @param trace
   */
  private processTippedTx = async (
    tx: TippedTxCBOR,
    trace: Trace,
  ): Promise<Result> => {
    const trace_ = trace.via(`${this.name}.processTippedTx`);
    /**
     *
     * @param msg
     */
    const fail = (msg: string): Result => {
      if (handleInvalidVectorMsgs) {
        this.log(msg);
      } else {
        this.throw(msg);
      }
      return new Result([msg], this.name, `processTippedTx`, trace_);
    };

    // parse tx
    const parsedTx = parseTippedTx(tx);
    const txID = parsedTx.partiallySignedPayloadTx.toCore().id;

    // check if we already processed (= submitted or rejected) the payload-tx
    // -> if so, we skip the tx
    if (this.processedTxesIn.has(txID)) {
      return fail(`tx with id ${txID} already processed`);
    }

    // parse new clique
    assert(this.tip !== undefined, `${this.name}: tip not defined`);
    let txClique: TxClique;
    try {
      txClique = parseTippedSupportVectorSet(this.tip, parsedTx);
    } catch (error) {
      return fail(`error parsing tippedSupportVectorSet: ${error}`);
    }

    /*
    NOTE: we should only receive txes that are missing our signature
    -> we should only send the updated txes to those members of the clique who's signatures are missing
    */

    // check if the new clique is missing our signature
    // -> if not, we skip the tx
    // -> otherwise, we sign it

    const ownOutstandingIndex = txClique.outstanding.indexOf(
      this.ownPublicKeyHash,
    );
    if (ownOutstandingIndex < 0) {
      return fail(`tx with id ${txID} not missing our signature`);
    }
    txClique.outstanding.splice(ownOutstandingIndex, 1);

    // sign it
    const newWitnessSet = await this.blaze.wallet.signTransaction(
      parsedTx.partiallySignedPayloadTx,
      true,
    );
    const payloadTxBody = parsedTx.partiallySignedPayloadTx.body();

    // check if the clique is complete
    // -> if so, we submit it and return
    // -> otherwise, we send the updated tx to all the missing clique-members

    let result: Result;
    if (txClique.outstanding.length === 0) {
      this.processedTxesIn.add(txID);
      const signedPayloadTx = new Core.Transaction(
        payloadTxBody,
        newWitnessSet,
        parsedTx.partiallySignedPayloadTx.auxiliaryData(),
      );
      result = new Result(
        [
          await this.submitTxToChain(
            signedPayloadTx,
            true,
            trace_.via(`${this.name}.processTippedTx (1/2)`),
          ),
          await this.submitTxToChain(
            parsedTx.signedTippingTx,
            false,
            trace_.via(`${this.name}.processTippedTx (2/2)`),
          ),
        ],
        this.name,
        `processTippedTx`,
        trace_,
      );
    } else {
      this.log(`sending tipped tx to peers`);
      const updatedTx: TippedTxCBOR = {
        ...tx,
        partiallySignedPayloadTxCBOR: new Core.Transaction(
          payloadTxBody,
          newWitnessSet,
          parsedTx.partiallySignedPayloadTx.auxiliaryData(),
        ).toCbor(),
      };

      const msg: TippedTxMsg = {
        payload: updatedTx,
        tag: `tipped tx`,
      };
      const msg_ = JSON.stringify(msg);

      const [peers, id] = await this.vectorPeerSockets.latch(`processTippedTx`);
      txClique.outstanding.forEach((keyHash) => {
        const ws = peers.getByKeyHash(keyHash)?.ws;
        assert(
          ws,
          `${this.name}: socket not found for vector with keyHash ${keyHash}`,
        );
        ws.send(msg_);
      });
      this.vectorPeerSockets.discharge(id);
      result = new Result(
        [`sent tipped tx to peers`],
        this.name,
        `processTippedTx`,
        trace_,
      );
    }
    return result;
  };

  /**
   *
   * @param tx
   * @param trace
   */
  private processElectionTx = async (
    tx: ElectionTxCBOR,
    trace: Trace,
  ): Promise<Result> => {
    this.log(`processElectionTx`);
    const trace_ = trace.via(`${this.name}.processElectionTx`);
    /**
     *
     * @param msg
     */
    const fail = (msg: string): Result => {
      if (handleInvalidVectorMsgs) {
        this.log(msg);
      } else {
        this.throw(msg);
      }
      return new Result([msg], this.name, `processElectionTx`, trace_);
    };
    // parse tx
    const parsedTx = parseElectionTx(tx);
    const txID = parsedTx.partiallySignedElectionTx.toCore().id;

    // check if we already processed (= submitted or rejected) the payload-tx
    // -> if so, we skip the tx
    if (this.processedTxesIn.has(txID)) {
      return fail(`tx with id ${txID} already processed`);
    }

    // parse new clique
    let txClique: TxClique;
    try {
      txClique = parseElectedSupportVectorSet(parsedTx);
    } catch (error) {
      return fail(`error parsing electedSupportVectorSet: ${error}`);
    }

    /*
    NOTE: we should only receive txes that are missing our signature
    -> we should only send the updated txes to those members of the clique who's signatures are missing
    */

    // check if the new clique is missing our signature
    // -> if not, we skip the tx
    // -> otherwise, we sign it

    const ownOutstandingIndex = txClique.outstanding.indexOf(
      this.ownPublicKeyHash,
    );
    if (ownOutstandingIndex < 0) {
      return fail(`tx with id ${txID} not missing our signature`);
    }
    txClique.outstanding.splice(ownOutstandingIndex, 1);

    // sign it
    const newWitnessSet = await this.blaze.wallet.signTransaction(
      parsedTx.partiallySignedElectionTx,
      true,
    );
    const electionTxBody = parsedTx.partiallySignedElectionTx.body();

    // check if the clique is complete
    // -> if so, we submit it and return
    // -> otherwise, we send the updated tx to all the missing clique-members

    let result: Result;
    if (txClique.outstanding.length === 0) {
      this.log(`submitting election-tx`);
      this.processedTxesIn.add(txID);
      const signedElectionTx = new Core.Transaction(
        electionTxBody,
        newWitnessSet,
        parsedTx.partiallySignedElectionTx.auxiliaryData(),
      );
      result = await this.submitTxToChain(signedElectionTx, true, trace_);
    } else {
      this.log(`sending election-tx to peers`);
      const updatedTx: ElectionTxCBOR = {
        partiallySignedElectionTxCBOR: new Core.Transaction(
          electionTxBody,
          newWitnessSet,
          parsedTx.partiallySignedElectionTx.auxiliaryData(),
        ).toCbor(),
      };
      const msg: ElectionTxMsg = {
        payload: updatedTx,
        tag: `election-tx`,
      };
      const msg_ = JSON.stringify(msg);
      const [peers, id] =
        await this.vectorPeerSockets.latch(`processElectionTx`);
      txClique.outstanding.forEach((keyHash) => {
        const ws = peers.getByKeyHash(keyHash)?.ws;
        assert(
          ws,
          `${this.name}: socket not found for vector with keyHash ${keyHash}`,
        );
        ws.send(msg_);
      });
      this.vectorPeerSockets.discharge(id);
      result = new Result(
        [`sent election-tx to peers`],
        this.name,
        `processElectionTx`,
        trace_,
      );
    }

    return result;
  };

  /**
   *
   * @param tx
   * @param updateLocalOutputs
   * @param trace
   */
  private submitTxToChain = async (
    tx: Core.Transaction, // common denominator of TxSigned (our own) and Core.TxCBOR (from the wire)
    updateLocalOutputs: boolean, // for tipping-tx we got ambiguity, so we don't create utxos here
    trace: Trace,
  ): Promise<Result> => {
    this.log(`submitting via socketServer`);
    const trace_ = trace.via(`${this.name}.submitTxToChain`);

    const result: (Result | string | Sent)[] = [];
    this.recordedTxs.add(tx.toCore().id);

    const utxosID = await this.socketKupmios.latchUtxoSemaphore(
      `${this.name}.submitTxToChain`,
    );

    result.push(await this.socketKupmios.submitUntippedTx(tx, trace_));
    await this.informOtherVectorsAboutTx(tx);
    result.push(
      await this.socketKupmios.applyTxToLedger(tx, updateLocalOutputs, trace_),
    );
    this.socketKupmios.dischargeUtxoSemaphore(utxosID);
    return new Result(result, this.name, `submitTxToChain`, trace_);
  };

  /**
   *
   * @param tx
   */
  private informOtherVectorsAboutTx = async (tx: Core.Transaction) => {
    const msg: UntippedTxMsg = {
      payload: tx.toCbor(),
      tag: `untipped tx`,
    };
    const msg_ = JSON.stringify(msg);
    const [peers, id] = await this.vectorPeerSockets.latch(
      `informOtherVectorsAboutTx`,
    );
    peers.forEach((ws, _) => {
      ws.send(msg_);
    });
    this.vectorPeerSockets.discharge(id);
  };

  /**
   *
   * @param matrix
   * @param trace_
   */
  private syncEigenValue = async (
    matrix: MatrixUtxo,
    trace: Trace,
  ): Promise<Result> => {
    this.log(`syncEigenValue`);
    assert(matrix.svmDatum, `${this.name}: no svmDatum in matrix utxo`);
    const trace_ = trace.via(`${this.name}.syncEigenValue`);
    const eigenValues = matrix.svmDatum.state.eigen_values;
    const eigenwert = matrix.svmDatum.config.eigenwert;
    let firstTx: TxCompleat | undefined;
    let tx: Tx | undefined;
    // let matrixUtxo: MatrixUtxo | undefined;
    // let vestingUtxo: VestingUtxo | undefined;
    let nexusUtxo: TraceUtxo;
    try {
      nexusUtxo = this.contract.nexus.singleton.utxo;
    } catch (err) {
      this.log(err as string);
      return new Result(
        [`syncEigenValue: nexus not found`],
        this.name,
        `syncEigenValue`,
        trace_,
      );
    }

    const utxos = await UtxoSet.ofWallet(this.blaze.wallet);
    if (utxos.size === 0) {
      return new Result([`no utxos`], this.name, `syncEigenValue`, trace_);
    }

    const ownEigenValue = eigenValues.find(
      (ev) => ev.vector.concise() === this.ownPublicKeyHash,
    );

    // let greenLight: () => void;
    // const redLight = new Promise<void>((resolve) => {
    //   greenLight = resolve;
    // });
    const ackCallback = new Callback(
      `once`,
      [this.name, `syncEigenValue`, `ackCallback`],
      async (txId: TxId, _trace: Trace): Promise<string[]> => {
        this.log(`syncEigenValue.ackCallback for`, txId);
        // greenLight();
        return await Promise.resolve([
          `${this.name} syncEigenValue.ackCallback for ${txId}`,
        ]);
      },
    );

    if (!ownEigenValue) {
      if (this.targetStake > 0n) {
        const vector = KeyHash.fromBlaze(this.ownPublicKeyHash);
        const registerVectorAction = new RegisterVectorAction(
          matrix,
          vector,
          this.targetOwnIP,
          this.targetOwnPort,
          this.targetStake,
        );
        tx = registerVectorAction.unhingedTx(
          new Tx(this.blaze, utxos),
          ackCallback,
          nexusUtxo,
        );
      } else {
        return new Result(
          [`not registered and no desire to be registered`],
          this.name,
          `syncEigenValue`,
          trace_,
        );
      }
    } else if (this.targetStake === 0n) {
      const vector = KeyHash.fromBlaze(this.ownPublicKeyHash);
      const deregisterVectorAction = new DeregisterVectorAction(matrix, vector);
      const currentStake = ownEigenValue.end - ownEigenValue.start;
      const lockStakeAction = new LockStakeAction(
        this.contract,
        vector,
        eigenwert,
        currentStake,
      );
      tx = deregisterVectorAction.unhingedTx(
        new Tx(this.blaze, utxos),
        ackCallback,
        nexusUtxo,
      );
      tx = lockStakeAction.startingTx(tx, ackCallback, utxos);
    } else {
      const currentStake = ownEigenValue.end - ownEigenValue.start;
      if (currentStake !== this.targetStake) {
        const vector = KeyHash.fromBlaze(this.ownPublicKeyHash);
        const deposited = this.targetStake - currentStake;
        const changeStakeAction = new ChangeStakeAction(
          matrix,
          vector,
          deposited,
        );
        tx = changeStakeAction.unhingedTx(
          new Tx(this.blaze, utxos),
          ackCallback,
          nexusUtxo,
        );
        if (deposited < 0) {
          this.log(`locking withdrawn stake:`, deposited);
          const lockStakeAction = new LockStakeAction(
            this.contract,
            vector,
            eigenwert,
            BigInt(-deposited),
          );
          tx = lockStakeAction.startingTx(tx, ackCallback, utxos);
        }
      }
      if (
        ownEigenValue.ip !== this.targetOwnIP ||
        ownEigenValue.port !== BigInt(this.targetOwnPort)
      ) {
        const vector = KeyHash.fromBlaze(this.ownPublicKeyHash);
        let matrix_ = matrix;
        let tx_: Tx | TxCompleat | undefined;
        if (tx) {
          firstTx = await tx.compleat();
          matrix_ = TiamatSvmUtxo.singletonAfterTx(
            matrix.svm,
            firstTx,
            matrix.inlineScript,
            matrix.idNFT.token,
          );
          tx_ = await firstTx.chain(`same`);
        } else {
          tx_ = new Tx(this.blaze, utxos);
        }
        const updateVectorAction = new UpdateVectorAction(
          matrix_,
          vector,
          this.targetOwnIP,
          this.targetOwnPort,
        );
        tx = updateVectorAction.unhingedTx(tx_, ackCallback, nexusUtxo);
      }
    }

    let return_: (Result | string | Sent)[] = [`already synced`];
    if (tx) {
      this.log(`about to submit syncing tx...`);

      if (firstTx) {
        this.log(`two txes`);
        const secondTx = await tx.compleat();
        // this.log(`completed:\n`, firstTx.toHash(), `\n`, secondTx.toHash());
        const signedTxes = await Promise.all([firstTx.sign(), secondTx.sign()]);
        this.log(`signed`);
        // try {
        return_ = [
          await this.contract.submitUntippedTx(
            signedTxes[0],
            // mkAckCallback(0, 2),
            trace_.via(`${this.name}.syncEigenValue (1/2)`),
          ),
          await this.contract.submitUntippedTx(
            signedTxes[1],
            // mkAckCallback(1, 2),
            trace_.via(`${this.name}.syncEigenValue (2/2)`),
          ),
        ];
        // } catch (e) {
        //   return [`syncing txes failed - ${e}`];
        // }
      } else {
        this.log(`one tx`);
        this.log(`utxos:`, utxos);
        const txCompleat = await tx.compleat();
        // this.log(`completed:\n ${txCompleat.toHash()}`);
        const txSigned = await txCompleat.sign();
        this.log(`signed`);
        // try {
        return_ = [
          await this.contract.submitUntippedTx(
            txSigned,
            // mkAckCallback(0, 1),
            trace_.via(`${this.name}.syncEigenValue`),
          ),
        ];
        // } catch (e) {
        //   return [`syncing tx failed - ${e}`];
        // }
      }

      // await redLight;
    }

    return new Result(return_, this.name, `syncEigenValue`, trace_);
  };

  /**
   *
   * @param state
   */
  private showState = (state: number): string => {
    switch (state) {
      case 0:
        return "CONNECTING";
      case 1:
        return "OPEN";
      case 2:
        return "CLOSING";
      case 3:
        return "CLOSED";
      default: {
        this.throw(`unkown websocket state: ${state}`);
        return `UNKNOWN STATE: ${state}`;
      }
    }
  };

  /**
   *
   * @param msg
   * @param {...any} args
   */
  private log = (msg: string, ...args: any) => {
    console.log(`[${this.name}] ${msg}`, ...args, `\n`);
  };

  /**
   *
   * @param msg
   */
  private throw = (msg: string) => {
    this.log(`ERROR: ${msg}\n`);
    if (errorTimeoutMs === null) {
      throw new Error(`${this.name} ERROR: ${msg}\n`);
    } else {
      setTimeout(() => {
        throw new Error(`${this.name} ERROR: ${msg}\n`);
      }, errorTimeoutMs);
    }
  };
}
