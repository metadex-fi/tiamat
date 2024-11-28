import assert from "assert";
import { Core } from "@blaze-cardano/sdk";
import { IpPort } from "../state/electionData";
import { Semaphore } from "./semaphore";
import { f } from "../../types/general/fundamental/type";
import { WebSocket } from "ws";

export interface VectorSocket {
  readonly ipPort: IpPort;
  readonly keyHash: Core.Ed25519KeyHashHex;
  readonly ws: WebSocket;
  role: "client" | "server";
}

/**
 *
 */
export class VectorSockets {
  private sockets: VectorSocket[] = [];

  /**
   *
   * @param ip
   * @param port
   */
  public has = (ip: string, port: number): "client" | "server" | false => {
    const socket = this.sockets.find((socket) => {
      return socket.ipPort.ip === ip && socket.ipPort.port === port;
    });
    if (socket) {
      return socket.role;
    } else {
      return false;
    }
  };

  /**
   *
   * @param ip
   * @param port
   */
  public getByIpPort = (ip: string, port: number) => {
    return this.sockets.find((socket) => {
      return socket.ipPort.ip === ip && socket.ipPort.port === port;
    });
  };

  /**
   *
   * @param keyHash
   */
  public getByKeyHash = (keyHash: Core.Ed25519KeyHashHex) => {
    return this.sockets.find((socket) => {
      return socket.keyHash === keyHash;
    });
  };

  /**
   *
   * @param ipPort
   * @param ws
   * @param keyHash
   * @param role
   */
  public insert = (
    ipPort: IpPort,
    ws: WebSocket,
    keyHash: Core.Ed25519KeyHashHex,
    role: "client" | "server",
  ) => {
    const socket: VectorSocket = {
      ipPort,
      keyHash,
      ws,
      role,
    };
    this.sockets.push(socket);
  };

  /**
   *
   * @param ip
   * @param port
   */
  public delete = (ip: string, port: number) => {
    const index = this.sockets.findIndex((socket) => {
      return socket.ipPort.ip === ip && socket.ipPort.port === port;
    });
    if (index !== -1) {
      this.sockets.splice(index, 1);
      return true;
    } else {
      console.warn(`VectorSockets: delete failed for`, ip, port);
      return false;
    }
  };

  /**
   *
   */
  public clear = () => {
    this.sockets = [];
  };

  /**
   *
   * @param callback
   */
  public forEach = async (
    callback: (ws: WebSocket, ipPort: IpPort) => Promise<void> | void,
  ) => {
    for (const socket of this.sockets) {
      await callback(socket.ws, socket.ipPort);
    }
  };

  /**
   *
   */
  public show = (): string => {
    let result = "VectorSockets: [\n";
    this.sockets.forEach((socket) => {
      result += `${f}${socket.ipPort.ip}:${socket.ipPort.port}\n`;
    });
    result += "]";
    return result;
  };
}

/**
 *
 */
export class UserSockets {
  // keys are ip/port
  private sockets: Map<string, WebSocket> = new Map();

  /**
   *
   * @param ip
   * @param port
   */
  public has = (ip: string, port: number): "client" | false => {
    if (this.sockets.has(`${ip}:${port}`)) {
      return "client";
    } else {
      return false;
    }
  };

  /**
   *
   * @param ip
   * @param port
   */
  public getByIpPort = (ip: string, port: number) => {
    return this.sockets.get(`${ip}:${port}`);
  };

  /**
   *
   * @param ipPort
   * @param ws
   * @param keyHash
   * @param role
   */
  public insert = (
    ipPort: IpPort,
    ws: WebSocket,
    keyHash: string,
    role: "client" | "server",
  ) => {
    assert(keyHash === "user", `UserSockets: keyHash must be "user"`);
    assert(role === "client", `UserSockets: role must be "client"`);
    const ipPort_ = `${ipPort.ip}:${ipPort.port}`;
    this.sockets.set(ipPort_, ws);
  };

  /**
   *
   * @param ip
   * @param port
   */
  public delete = (ip: string, port: number) => {
    const ipPort = `${ip}:${port}`;
    return this.sockets.delete(ipPort);
  };

  /**
   *
   */
  public clear = () => {
    this.sockets.clear();
  };

  /**
   *
   * @param callback
   */
  public forEach = async (
    callback: (ws: WebSocket) => Promise<void> | void,
  ) => {
    for (const ws of this.sockets.values()) {
      await callback(ws);
    }
  };

  /**
   *
   */
  public show = (): string => {
    let result = "UserSockets: [\n";
    this.sockets.forEach((_, ipPort) => {
      result += `${f}${ipPort}\n`;
    });
    result += "]";
    return result;
  };
}

/**
 *
 */
export class SocketPraetor<T extends UserSockets | VectorSockets> {
  private static instances = new Map<string, number>();
  public readonly name: string;

  private readonly semaphore: Semaphore; // = new Semaphore();
  private currentHolder: string = "none";

  /**
   *
   * @param name
   * @param sockets
   */
  constructor(
    name: string,
    private readonly sockets: T,
  ) {
    this.name = `${name} SocketPraetor`;
    const instance = SocketPraetor.instances.get(this.name) ?? 0;
    SocketPraetor.instances.set(this.name, instance + 1);
    if (instance) this.name = `${this.name}#${instance}`;
    this.semaphore = new Semaphore(this.name);
  }

  //////////////////////////////////////////
  // public endpoints

  /**
   *
   */
  public get holder(): string {
    return this.currentHolder;
  }

  /**
   *
   * @param from
   * @param timeout
   */
  public latch = async (
    from: string,
    timeout?: number,
  ): Promise<[T, string]> => {
    const id = await this.semaphore.latch(from, timeout);
    console.log(`[${this.name}] ${id} latchd sockets`);
    return [this.sockets, id];
  };

  /**
   *
   * @param from
   */
  public seize = (from: string) => {
    this.semaphore.seize();
    console.warn(
      `${from} seized sockets (current holder: ${this.currentHolder})`,
    );
    this.currentHolder = from;
    return this.sockets;
  };

  /**
   *
   * @param id
   */
  public discharge = (id: string) => {
    this.semaphore.discharge(id);
    console.log(`[${this.name}] ${id} discharge sockets`);
  };
}
