/**
 * @module fs-kernels
 */
import { ExecaChildProcess } from "execa";
import pidusage from "pidusage";

import { Observable, Observer, of } from "rxjs";
import { map, mergeMap, catchError, timeout, first } from "rxjs/operators";

import {
  Channels,
  shutdownRequest,
  childOf,
  ofMessageType
} from "@nteract/messaging";

import { JupyterConnectionInfo } from "enchannel-zmq-backend";

import { launch, launchSpec, LaunchedKernel, cleanup } from "./spawnteract";
import { KernelSpec } from "./kernelspecs";

export class Kernel {
  kernelSpec: KernelSpec;
  process: ExecaChildProcess;
  connectionInfo: JupyterConnectionInfo;
  connectionFile: string;
  channels: Channels;

  constructor(launchedKernel: LaunchedKernel) {
    this.process = launchedKernel.spawn;
    this.connectionInfo = launchedKernel.config;
    this.kernelSpec = launchedKernel.kernelSpec;
    this.connectionFile = launchedKernel.connectionFile;
    this.channels = launchedKernel.channels;
  }

  shutdownEpic(timeoutMs: number = 2000) {
    const request = shutdownRequest({ restart: false });

    // Try to make a shutdown request
    // If we don't get a response within X time, force a shutdown
    // Either way do the same cleanup
    const shutDownHandling = this.channels.pipe(
      /* Get the first response to our message request. */
      childOf(request),
      ofMessageType("shutdown_reply"),
      first(),
      // If we got a reply, great! :)
      map((msg: { content: { restart: boolean } }) => {
        return {
          status: "shutting down",
          content: msg.content
        };
      }),
      /**
       * If we don't get a response within timeoutMs, then throw an error.
       */
      timeout(timeoutMs),
      catchError(err => of({ error: err })),
      /**
       * Even if we don't receive a shutdown_reply from the kernel to our
       * shutdown_request, we will go forward with cleaning up the RxJS
       * subject and killing the kernel process.
       */
      mergeMap(async event => {
        // End all communication on the channels
        this.channels.complete();
        await this.shutdownProcess();

        const finalResponse = { status: "shutdown" };
        if (event.error) {
          finalResponse.error = event.error;
          finalResponse.status = "error";
        }

        return of(finalResponse);
      }),
      catchError(err =>
        // Catch all, in case there were other errors here
        of({ error: err, status: "error" })
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

  async shutdown(timeoutMs: number = 2000) {
    const observable = this.shutdownEpic(timeoutMs);
    return observable.toPromise();
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
