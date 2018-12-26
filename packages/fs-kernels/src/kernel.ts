/**
 * @module fs-kernels
 */
import { ExecaChildProcess } from "execa";
import pidusage from "pidusage";

import { Observable, Observer, of, merge } from "rxjs";
import {
  map,
  tap,
  mergeMap,
  catchError,
  timeout,
  first,
  toArray
} from "rxjs/operators";

import {
  Channels,
  shutdownRequest,
  childOf,
  ofMessageType
} from "@nteract/messaging";
import { createKernelRef, KernelRef } from "@nteract/types";

import { JupyterConnectionInfo } from "enchannel-zmq-backend";

import { launch, launchSpec, LaunchedKernel, cleanup } from "./spawnteract";
import { KernelSpec } from "./kernelspecs";

export class Kernel {
  id: KernelRef;
  kernelSpec: KernelSpec;
  process: ExecaChildProcess;
  connectionInfo: JupyterConnectionInfo;
  connectionFile: string;
  channels: Channels;

  constructor(launchedKernel: LaunchedKernel) {
    this.id = createKernelRef();
    this.process = launchedKernel.spawn;
    this.connectionInfo = launchedKernel.config;
    this.kernelSpec = launchedKernel.kernelSpec;
    this.connectionFile = launchedKernel.connectionFile;
    this.channels = launchedKernel.channels;
  }

  shutdownEpic() {
    const request = shutdownRequest({ restart: false });

    // Try to make a shutdown request
    // If we don't get a response within X time, force a shutdown
    // Either way do the same cleanup
    const shutDownHandling = this.channels.pipe(
      childOf(request),
      ofMessageType("shutdown_reply"),
      first(),
      // If we got a reply, great! :)
      map((msg: { content: { restart: boolean } }) => {
        return {
          content: msg.content,
          id: this.id
        };
      }),
      // If we don't get a response within 2s, assume failure :(
      timeout(1000 * 2),
      catchError(err => of({ error: err, id: this.id })),
      mergeMap(async action => {
        // End all communication on the channels
        this.channels.complete();

        await this.shutdownProcess();

        return merge(
          // Pass on our intermediate action (whether or not kernel ACK'd shutdown request promptly)
          of(action),
          // Indicate overall success (channels cleaned up)
          of({
            id: this.id
          }),
          // Inform about the state
          of({
            status: "shutting down",
            id: this.id
          })
        );
      }),
      catchError(err =>
        // Catch all, in case there were other errors here
        of({ error: err, id: this.id })
      )
    );

    // On subscription, send the message
    return Observable.create((observer: Observer<any>) => {
      const subscription = shutDownHandling.subscribe(observer);
      this.channels.next(request);
      return subscription;
    });
  }

  async shutdownProcess() {
    cleanup(this.connectionFile);
    if (!this.process.killed && this.process.pid) {
      process.kill(this.process.pid);
    }
    this.process.removeAllListeners();
  }

  async shutdown() {
    const observable = this.shutdownEpic();
    return observable.pipe(toArray()).toPromise();
  }

  async getUsage() {
    return await pidusage(this.process.pid);
  }
}

export async function launchKernel(input: string | KernelSpec) {
  let launchedKernel;
  if (typeof input === "string") {
    launchedKernel = await launch(input);
  } else {
    launchedKernel = await launchSpec(input);
  }
  return new Kernel(launchedKernel);
}
