import WebSocket from "isomorphic-ws";

function environmentIsNodeJs(): boolean {
  return (
    typeof process !== "undefined" &&
    typeof process.versions !== "undefined" &&
    typeof process.versions.node !== "undefined"
  );
}

export interface SocketWrapperCloseEvent {
  readonly wasClean: boolean;
  readonly code: number;
}

export interface SocketWrapperErrorEvent {
  // fields available in browsers
  readonly isTrusted?: boolean;

  // fields available in node
  readonly type?: string;
  readonly message?: string;
}

export interface SocketWrapperMessageEvent {
  readonly data: string;
  readonly type: string;
}

/**
 * A thin wrapper around isomorphic-ws' WebSocket class that adds
 * - constant message/error/open/close handlers
 * - explict connection via a connect() method
 * - type support for events
 * - handling of corner cases in the open and close behaviour
 */
export class SocketWrapper {
  public readonly connected: Promise<void>;

  private connectedResolver: (() => void) | undefined;
  private connectedRejecter: ((reason: any) => void) | undefined;
  private socket: WebSocket | undefined;
  private timeoutId: NodeJS.Timeout | undefined;
  private closed = false;
  private readonly url: string;
  private readonly messageHandler: (event: SocketWrapperMessageEvent) => void;
  private readonly errorHandler: (event: SocketWrapperErrorEvent) => void;
  private readonly openHandler?: () => void;
  private readonly closeHandler?: (event: SocketWrapperCloseEvent) => void;
  private readonly timeout: number;

  public constructor(
    url: string,
    messageHandler: (event: SocketWrapperMessageEvent) => void,
    errorHandler: (event: SocketWrapperErrorEvent) => void,
    openHandler?: () => void,
    closeHandler?: (event: SocketWrapperCloseEvent) => void,
    timeout = 10_000,
  ) {
    this.connected = new Promise((resolve, reject) => {
      this.connectedResolver = resolve;
      this.connectedRejecter = reject;
    }).catch((e) => {
       console.log("Caught Error: SocketWrapper.connected rejected.",e)
    });

    this.url = url;
    this.messageHandler = messageHandler;
    this.errorHandler = errorHandler;
    this.openHandler = openHandler;
    this.closeHandler = closeHandler;
    this.timeout = timeout;
  }

  /**
   * returns a promise that resolves when connection is open
   */
  public connect(): void {
    const socket = new WebSocket(this.url);

    socket.onerror = (error) => {
      this.clearTimeout();
      if (this.errorHandler) {
        this.errorHandler(error);
      }
    };
    socket.onmessage = (messageEvent) => {
      this.messageHandler({
        type: messageEvent.type,
        data: messageEvent.data as string,
      });
    };
    socket.onopen = (_) => {
      this.clearTimeout();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.connectedResolver!();

      if (this.openHandler) {
        this.openHandler();
      }
    };
    socket.onclose = (closeEvent) => {
      this.closed = true;
      if (this.closeHandler) {
        this.closeHandler(closeEvent);
      }
    };

    const started = Date.now();
    this.timeoutId = setTimeout(() => {
      socket.onmessage = () => 0;
      socket.onerror = () => 0;
      socket.onopen = () => 0;
      socket.onclose = () => 0;
      socket.close();
      this.socket = undefined;

      const elapsed = Math.floor(Date.now() - started);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.connectedRejecter!(`Connection attempt timed out after ${elapsed} ms`);
    }, this.timeout);

    this.socket = socket;
  }

  /**
   * Closes an established connection and aborts other connection states
   */
  public disconnect(): void {
    if (!this.socket) {
      throw new Error("Socket undefined. This must be called after connecting.");
    }

    this.clearTimeout();

    switch (this.socket.readyState) {
      case WebSocket.OPEN:
        this.socket.close(1000 /* Normal Closure */);
        break;
      case WebSocket.CLOSED:
        // nothing to be done
        break;
      case WebSocket.CONNECTING:
        // imitate missing abort API
        this.socket.onopen = () => 0;
        this.socket.onclose = () => 0;
        this.socket.onerror = () => 0;
        this.socket.onmessage = () => 0;
        this.socket = undefined;
        if (this.closeHandler) {
          this.closeHandler({ wasClean: false, code: 4001 });
        }
        break;
      case WebSocket.CLOSING:
        // already closing. Let it proceed
        break;
      default:
        throw new Error(`Unknown readyState: ${this.socket.readyState}`);
    }
  }

  public async send(data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        throw new Error("Socket undefined. This must be called after connecting.");
      }

      if (this.closed) {
        throw new Error("Socket was closed, so no data can be sent anymore.");
      }

      // this exception should be thrown by send() automatically according to
      // https://developer.mozilla.org/de/docs/Web/API/WebSocket#send() but it does not work in browsers
      if (this.socket.readyState !== WebSocket.OPEN) {
        throw new Error("Websocket is not open");
      }

      if (environmentIsNodeJs()) {
        this.socket.send(data, (err) => (err ? reject(err) : resolve()));
      } else {
        // Browser websocket send method does not accept a callback
        this.socket.send(data);
        resolve();
      }
    });
  }

  /**
   * Clears the timeout function, such that no timeout error will be raised anymore. This should be
   * called when the connection is established, a connection error occurred or the socket is disconnected.
   *
   * This method must not be called before `connect()`.
   * This method is idempotent.
   */
  private clearTimeout(): void {
    if (!this.timeoutId) {
      throw new Error(
        "Timeout ID not set. This should not happen and usually means connect() was not called.",
      );
    }

    // Note: do not unset this.timeoutId to allow multiple calls to this function
    clearTimeout(this.timeoutId);
  }
}
