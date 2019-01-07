/**
 * @module enchannel-zmq-backend
 */
import { EventEmitter } from "events";

import Message from "jmp";

class Socket extends EventEmitter {
  constructor(public type: any, public scheme: any, public key: any) {
    super();
  }

  throttle = false;

  monitor() {}
  unmonitor() {}
  connect() {
    if (this.throttle) {
      setTimeout(() => this.emit("connect"), 0);
    } else {
      this.emit("connect");
    }
  }
  close() {}
}

export { Message, Socket };
