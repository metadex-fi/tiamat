import assert from "assert";
import { Core } from "@blaze-cardano/sdk";
import { AssocMap } from "../../types/general/fundamental/container/map";
import {
  ChainInterface,
  Sent,
  UtxoEvents,
  UtxoSource,
} from "../state/utxoSource";
import { Callback } from "../state/callback";
import {
  // AckMsg,
  AddressSubscriptionMsg,
  CliqueElectionTx,
  CliqueTippedTx,
  ElectionTxMsg,
  cborElectionTx,
  cborTippedTx,
  NewBlockMsg,
  TippedTxMsg,
  UntippedTxMsg,
  UtxoEventMsg,
} from "../state/messages";
import { EigenvectorData, ElectionData, IpPort } from "../state/electionData";
import { f } from "../../types/general/fundamental/type";
import { errorTimeoutMs, maxUserMsgDelay } from "../../utils/constants";
import { Bech32Address, Trace } from "../../utils/wrappers";
import {
  EigenValue,
  PDappConfigT,
  PDappParamsT,
} from "../../types/tiamat/tiamat";

/*
this is for the webapp.

Tasks:
- keep track of current eigenvectors
- manage data feed subscriptions
- submit transactions

Assorted Details:
- needs a way to find current EVs aka nexus upon initialization (i.e. via blockfrost)
- needs to keep track of election cycle and change websocket subscriptions accordingly
- needs to keep track of incoming data-push-updates, count their replication, and
  forward them to subscribed data sources if sufficient number of confirmations reached
- singleton
- needs to reply `ACK` to incoming data-push-updates
  (otherwise EVs will assume we're offline and cancel socket (after a number of failed retries) (TODO))
- subscribe and unsubscribe endpoints
*/

// type VectorMsg = {
//   data: string;
//   ip: string;
// };

// reply from vector to webapp for tx-submission from webapp to vector
// (for use later on)
// interface FeedbackMsg {
//   data: string;
//   label: `accepted` | `rejected`;
// }

export interface Confirmations {
  count: number;
  readonly by: Set<string>;
}

/**
 *
 */
export class SocketClient implements ChainInterface {
  private static instances = new Map<string, number>();
  // private name = `!!! CLIENT NOT INITIALIZED !!!`;
  public readonly name: string;
  private readonly socketType = `client`;
  private readonly vectorSockets: AssocMap<IpPort, WebSocket> = new AssocMap(
    (ip) => `${ip.ip}:${ip.port}`,
  );
  private vectorData: AssocMap<IpPort, EigenvectorData> = new AssocMap(
    (ip) => `${ip.ip}:${ip.port}`,
  );
  private readonly subscribedAddresses: Set<string> = new Set();
  private readonly pendingMsgsIn: Map<string, Confirmations> = new Map();
  private readonly processedMsgsIn: Set<string> = new Set();
  // private readonly unconfirmedMsgsOut: Map<string, Confirmations> = new Map(); // TODO implement this (later)
  private readonly utxoSubscribers: Set<UtxoSource> = new Set();
  private readonly newBlockSubscribers: Set<UtxoSource> = new Set();
  private readonly ackSubscribers: Set<UtxoSource> = new Set();
  private numSupportVectors?: bigint;

  private static singleton?: SocketClient;

  /**
   *
   * @param port
   */
  private constructor(
    name: string,
    private readonly port: number, // for testing
  ) {
    this.name = `${name} SocketClient`;
    const instance = SocketClient.instances.get(this.name) ?? 0;
    SocketClient.instances.set(this.name, instance + 1);
    if (instance) this.name = `${this.name}#${instance}`;
  }

  //////////////////////////////////////////
  // public endpoints

  /**
   *
   * @param port
   */
  public static newTestingInstance(name: string, port: number): SocketClient {
    return new SocketClient(name, port);
  }

  /**
   *
   */
  public static createSingleton(name: string): SocketClient {
    assert(!SocketClient.singleton, `singleton already exists`);
    const port = 0;
    SocketClient.singleton = new SocketClient(name, port);
    return SocketClient.singleton;
  }

  /**
   *
   */
  public static getSingleton(): SocketClient {
    assert(SocketClient.singleton, `singleton does not exist`);
    return SocketClient.singleton;
  }

  public updateConnections = async <
    DC extends PDappConfigT,
    DP extends PDappParamsT,
  >(
    election: ElectionData<DC, DP>,
    _trace: Trace,
  ): Promise<(string | Sent)[]> => {
    this.numSupportVectors = election.tiamatParams.num_support_vectors;
    this.vectorData = election.eligibleEVsValencies;
    const newVectorIpPorts = [...this.vectorData.keys()];
    this.updateVectorConnections(newVectorIpPorts);
    return await Promise.resolve([`${this.name}: connections updated`]);
  };

  /**
   *
   * @param _catchUpCallback
   * @param subscriber
   * @param toAddress
   */
  public subscribeToAddress = (
    _catchUpCallback: Callback<UtxoEvents>,
    subscriber: UtxoSource,
    toAddress: Bech32Address,
  ) => {
    this.log(`subscribed to address ${toAddress}`);
    this.utxoSubscribers.add(subscriber);
    this.subscribedAddresses.add(toAddress.bech32);
    const msg: AddressSubscriptionMsg = {
      payload: Array.from(this.subscribedAddresses),
      tag: `subscribedAddresses`,
    };
    const msg_ = JSON.stringify(msg);
    this.log(`subscribeToAddress: ${this.vectorSockets.size} vector sockets`);
    this.vectorSockets.forEach((ws, ipPort) => {
      this.log(
        `subscribeToAddress: subscribing to ${this.subscribedAddresses.size} addresses with vector ${ipPort}\n${f}${[
          ...this.subscribedAddresses,
        ].join(`\n${f}`)}`,
      );
      ws.send(msg_);
    });
  };

  /**
   *
   * @param _subscriber
   * @param _fromAddress
   */
  public unsubscribeFromAddress = (
    _subscriber: UtxoSource,
    _fromAddress: Bech32Address,
  ) => {
    this.throw("Method not implemented.");
  };

  /**
   *
   * @param subscriber
   */
  public subscribeToNewBlock = (subscriber: UtxoSource) => {
    this.newBlockSubscribers.add(subscriber);
    // const msg: BlockSubscriptionMsg = {
    //   payload: true,
    //   tag: `subscribeToNewBlock`,
    // };
    // const msg_ = JSON.stringify(msg);
    // this.vectorSockets.forEach((ws) => ws.send(msg_));
  };

  /**
   *
   * @param subscriber
   */
  public subscribeToAck = (subscriber: UtxoSource) => {
    this.ackSubscribers.add(subscriber);
  };

  /**
   *
   * @param tx
   * @param trace
   */
  public submitUntippedTx = async (
    tx: Core.Transaction,
    _trace: Trace,
  ): Promise<(string | Sent)[]> => {
    this.log(`submitUntippedTx`);
    const sent = Sent.fromTransaction(tx);
    const msg: UntippedTxMsg = {
      payload: tx.toCbor(),
      tag: `untipped tx`,
    };
    const msg_ = JSON.stringify(msg);
    return [await this.submitTxesMsg(msg_, `all`), sent];
  };

  /**
   *
   * @param txes
   * @param trace
   */
  public submitTippedTxes = async (
    txes: CliqueTippedTx[],
    _trace: Trace,
  ): Promise<(string | Sent)[]> => {
    this.log(`submitTippedTxes`);
    const promises = txes.map(async (tx) => {
      const sent = Sent.fromTransaction(tx.tx.partiallySignedPayloadTx);
      const msg: TippedTxMsg = {
        payload: cborTippedTx(tx.tx),
        tag: `tipped tx`,
      };
      const msg_ = JSON.stringify(msg);
      const result = await this.submitTxesMsg(msg_, tx.supportVectorSet);
      return [result, sent];
    });
    return (await Promise.all(promises)).flat();
  };

  /**
   *
   * @param txes
   * @param trace
   */
  public submitElectionTxes = async (
    txes: CliqueElectionTx[],
    _trace: Trace,
  ): Promise<(string | Sent)[]> => {
    this.log(`submitElectionTxes`);
    const promises = txes.map(async (tx) => {
      const sent = Sent.fromTransaction(tx.tx.partiallySignedElectionTx);
      const msg: ElectionTxMsg = {
        payload: cborElectionTx(tx.tx),
        tag: `election-tx`,
      };
      const msg_ = JSON.stringify(msg);
      const result = await this.submitTxesMsg(msg_, tx.supportVectorSet);
      return [result, sent];
    });
    return (await Promise.all(promises)).flat();
  };

  //////////////////////////////////////////
  // internal methods

  /**
   *
   * @param msg
   * @param to
   */
  private submitTxesMsg = async (
    msg: string,
    to: EigenValue[] | `all`,
  ): Promise<string> => {
    // assert(!this.unconfirmedMsgsOut.has(msg), `msg already sent: ${msg}`);
    // const confirmations: Confirmations = {
    //   count: 0,
    //   by: new Set()
    // }
    // this.unconfirmedMsgsOut.set(msg, confirmations)
    if (to === `all`) {
      for (const ws of this.vectorSockets.values()) {
        ws.send(msg);
      }
    } else {
      for (const ev of to) {
        const ipPort = {
          ip: ev.ip,
          port: Number(ev.port),
        };
        const ws = this.vectorSockets.get(ipPort);
        assert(ws, `vector not connected: ${ipPort}`);
        ws.send(msg);
      }
    }
    /*
    TODO

    handle the various responses (or lack thereof) we can get:

    - various errors
    - no response at all
    - a combination of the above

    */

    return await Promise.resolve(
      `sent msg to ${to === `all` ? to : to.length} vectors`,
    );
  };

  /**
   *
   * @param newVectorIpPorts
   */
  private updateVectorConnections = (newVectorIpPorts: IpPort[]) => {
    this.log(
      `UPDATING VECTOR CONNECTIONS\n\tnew:\n`,
      newVectorIpPorts.map((vector) => `${vector.ip}:${vector.port}`),
      `\n\tcurrent:\n`,
      [...this.vectorSockets.keys()].map(
        (ipPort) => `${ipPort.ip}:${ipPort.port}`,
      ),
    );
    this.vectorSockets.forEach((evData, vectorIpPort) => {
      if (
        !newVectorIpPorts.some(
          (vector) =>
            vector.ip === vectorIpPort.ip && vector.port === vectorIpPort.port,
        )
      ) {
        this.disconnectFromVector(vectorIpPort, evData, 1000, `new cycle`);
      }
    });
    newVectorIpPorts.forEach((vectorIpPort) => {
      if (!this.vectorSockets.has(vectorIpPort)) {
        this.connectToVector(vectorIpPort);
      }
    });
  };

  /**
   *
   * @param vectorIpPort
   */
  private connectToVector = (vectorIpPort: IpPort) => {
    const vectorIP = vectorIpPort.ip;
    const vectorPort = vectorIpPort.port;
    this.log(`CONNECTING TO VECTOR`, vectorIpPort);
    const ws = new WebSocket(
      `ws://${vectorIP}:${vectorPort}?type=${this.socketType}&port=${this.port}`,
    );
    /**
     *
     */
    ws.onopen = () => {
      this.log(
        `CONNECTED TO`,
        vectorIpPort.ip,
        vectorIpPort.port,
        ws.readyState,
      );
      this.vectorSockets.set(vectorIpPort, ws);
      const msg: AddressSubscriptionMsg = {
        payload: Array.from(this.subscribedAddresses),
        tag: `subscribedAddresses`,
      };
      const data = JSON.stringify(msg);
      this.log(
        `connectToVector: subscribing to ${this.subscribedAddresses.size} addresses with vector ${vectorIP}:${vectorPort}\n${f}${[
          ...this.subscribedAddresses,
        ].join(`\n${f}`)}`,
      );
      ws.send(data);
    };
    /**
     *
     * @param event
     */
    ws.onmessage = async (event) => {
      this.log(
        `RECEIVED`,
        vectorIpPort.ip,
        vectorIpPort.port,
        // event.data,
      );
      // ws.send(`ACK`);
      assert(
        typeof event.data === "string",
        `${this.name}.connectToVector.onmessage: data not string: ${event.data}`,
      );
      const result: (string | Sent)[] = await this.receiveVectorMessage(
        event.data,
        vectorIpPort,
      );
      result.forEach((r) => {
        if (typeof r === "string") this.log(`RESULT`, r);
        else this.log(`RESULT SENT:`, r.txId.txId);
      });
    };
    /**
     *
     */
    ws.onclose = () => {
      this.log(`DISCONNECTED FROM`, vectorIpPort.ip, vectorIpPort.port);
      this.vectorSockets.delete(vectorIpPort);
    };
    /**
     *
     * @param error
     */
    ws.onerror = (error) => {
      this.log(vectorIpPort.ip, vectorIpPort.port, `ERROR:`, error);
    };
  };

  /**
   *
   * @param vectorIpPort
   * @param ws
   * @param code
   * @param reason
   */
  private disconnectFromVector = (
    vectorIpPort: IpPort,
    ws?: WebSocket,
    code?: number,
    reason?: string,
  ) => {
    this.log(`DISCONNECTING FROM VECTOR`, vectorIpPort, reason);
    ws = ws ?? this.vectorSockets.get(vectorIpPort);
    if (ws) {
      ws.close(code, reason);
      this.vectorSockets.delete(vectorIpPort);
    } else {
      this.throw(`vector ws not found: ${vectorIpPort}`);
    }
  };

  /**
   *
   * @param vectorIpPort
   */
  private getVectorValency = (vectorIpPort: IpPort): number | undefined => {
    return this.vectorData.get(vectorIpPort)?.valency;
  };

  /**
   *
   */
  private getNumSupportVectors = (): bigint => {
    assert(this.numSupportVectors, `numSupportVectors not set`);
    return this.numSupportVectors;
  };

  /**
   *
   * @param data
   * @param vectorIpPort
   */
  private receiveVectorMessage = async (
    data: string,
    vectorIpPort: IpPort,
  ): Promise<(string | Sent)[]> => {
    if (maxUserMsgDelay !== null) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * maxUserMsgDelay!),
      );
    }
    if (this.processedMsgsIn.has(data)) {
      return [`already processed ${data}`];
    }

    let count = this.getVectorValency(vectorIpPort);
    if (!count) {
      this.disconnectFromVector(
        vectorIpPort,
        undefined,
        1001,
        `not elected anymore`,
      );
      this.throw(`this should not happen`);
      return [`this should not happen`];
    } else {
      const confirmations = this.pendingMsgsIn.get(data);
      const by = confirmations?.by ?? new Set();
      const vectorKeyHash = this.vectorData.get(vectorIpPort)?.keyHash;
      assert(
        vectorKeyHash,
        `${this.name}: vectorKeyHash not found: ${vectorKeyHash}`,
      );
      if (confirmations) {
        if (by.has(vectorKeyHash.concise())) {
          return [`already confirmed by ${vectorKeyHash}: ${data}`];
        } else {
          count += confirmations.count;
        }
      }

      const requiredConfirmations = this.getNumSupportVectors();
      if (count >= requiredConfirmations) {
        this.pendingMsgsIn.delete(data);
        this.processedMsgsIn.add(data);
        return await this.processVectorMessage(data);
      } else {
        by.add(vectorKeyHash.concise());
        const confirmations_: Confirmations = { count, by };
        this.pendingMsgsIn.set(data, confirmations_);
        return [`${count}/${requiredConfirmations} confirmations for ${data}`];
      }
    }
  };

  /**
   *
   * @param data
   */
  private processVectorMessage = async (
    data: string,
  ): Promise<(string | Sent)[]> => {
    // const msgs: NewBlockMsg | UtxoEventMsg[] | AckMsg = JSON.parse(data);
    const msgs: NewBlockMsg | UtxoEventMsg[] = JSON.parse(data);

    const promises: Promise<(string | Sent)[]>[] = [];
    if (msgs instanceof Array) {
      this.log(`multiple messages (${msgs.length})`);
      const utxoEvents = new UtxoEvents(
        [],
        Date.now(),
        `${this.name}.processVectorMessage`,
      );
      msgs.forEach((msg) => {
        const fields = Object.keys(msg);
        this.log(`msg`, msg.tag);
        assert(
          fields.length === 2,
          `wrong number of fields in ${fields}\n\nmsgs: ${msgs}\n\nraw: ${data}`,
        );
        assert(
          fields[0] === `payload`,
          `first field not "payload": ${
            fields[0]
          }\n\nmsgs: ${msgs}\n\nraw: ${data}`,
        );
        assert(
          fields[1] === `tag`,
          `first field not "tag": ${fields[1]}\n\nmsgs: ${msgs}\n\nraw: ${data}`,
        );

        assert(
          msg.tag === "create" || msg.tag === "destroy",
          `wrong tag "${msg.tag}"`,
        );

        const utxo = Core.TransactionUnspentOutput.fromCbor(msg.payload);
        const type = msg.tag;
        utxoEvents.events.push({
          type,
          utxo,
        });
      });

      this.utxoSubscribers.forEach((sub) => {
        promises.push(
          sub.notifyUtxoEvents(
            this,
            utxoEvents,
            Trace.source(
              `SOCKET`,
              `${this.name}.processVectorMessage.notifyUtxoEvents`,
            ),
          ),
        );
      });
    } else {
      const msg = msgs;
      this.log(`single msg`, msg.tag);
      const fields = Object.keys(msg);
      assert(
        fields.length === 2,
        `wrong number of fields in ${fields}\n\nmsg: ${msg}\n\nraw: ${data}`,
      );
      assert(
        fields[0] === `payload`,
        `first field not "payload": ${fields[0]}\n\nmsg: ${msg}\n\nraw: ${data}`,
      );
      assert(
        fields[1] === `tag`,
        `first field not "tag": ${fields[1]}\n\nmsg: ${msg}\n\nraw: ${data}`,
      );

      // if (msg.tag === "ACK") {
      //   assert(
      //     typeof msg.payload === "string",
      //     `wrong ACK txId data type`,
      //   );
      //   const txId = TxId.fromTxId(msg.payload);
      //   this.log(`received ACK for`, txId);
      //   this.ackSubscribers.forEach((sub) => {
      //     promises.push(
      //       sub.notifyAck(
      //         this,
      //         txId,
      //         Trace.source(
      //           `SOCKET`,
      //           `${this.name}.processVectorMessage.notifyAck`,
      //         ),
      //       ),
      //     );
      //   });
      // } else if (msg.tag === "new block") {
      assert(
        typeof msg.payload === "number",
        `wrong new block timestamp data type`,
      );
      const newBlock = msg.payload;
      this.log(`received new block:`, newBlock);
      this.newBlockSubscribers.forEach((sub) => {
        promises.push(
          sub.notifyNewBlock(
            this,
            newBlock,
            Trace.source(
              `SOCKET`,
              `${this.name}.processVectorMessage.notifyNewBlock`,
            ),
          ),
        );
      });
      // } else {
      //   this.throw(`wrong tag on ${msg}`);
      // }
    }

    return (await Promise.all(promises)).flat();
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
