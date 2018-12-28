/**
 * @module fs-kernels
 */
/**
 * This module contains methods that allow you to spawn Jupyter kernels.  You
 * can spawn kernels either by name or by a kernelSpec object (see the
 * `kernelspecs` npm package for more information).
 *
 * Usage example:
 * ```js
 * var spawnResults = require('spawnteract').launch('python3');
 *
 * // Print the ip address and port for the shell channel
 * console.log(spawnResults.config.ip + ':' + spawnResults.config.shell_port);
 * ```
 *
 * You'll need to close `spawnResults.spawn` yourself as well as delete
 * `spawnResults.connectionFile` from disk when finished.
 *
 */

/* eslint camelcase: 0 */
// ^--- #justjupyterthings
/**
 *
 */
import path from "path";
import fs from "fs";
import util from "util";

import uuid from "uuid";
import { getPorts as _getPorts } from "portfinder";
import jsonfile from "jsonfile";

import execa, { Options } from "execa";
import mkdirp from "mkdirp";

import { findAll, KernelResourceByName, KernelSpec } from "./kernelspecs";
import jp from "./jupyter-paths";

import {
  JupyterConnectionInfo,
  createMainChannel
} from "enchannel-zmq-backend";
import { Channels } from "@nteract/messaging";

export function cleanup(connectionFile: fs.PathLike) {
  try {
    fs.unlinkSync(connectionFile);
  } catch (e) {
    return;
  }
}

/**
 * Creates a connectionInfo object given an array of ports
 * @private
 * @param  {number[]} ports array of ports to use for the connection, [hb_port,
 *                          control_port, shell_port, stdin_port, iopub_port]
 * @return {object}         connectionInfo object
 */
function createConnectionInfo(
  ports: number[]
): { version: number } & JupyterConnectionInfo {
  return {
    version: 5,
    key: uuid.v4(),
    signature_scheme: "hmac-sha256",
    transport: "tcp",
    ip: "127.0.0.1",
    hb_port: ports[0],
    control_port: ports[1],
    shell_port: ports[2],
    stdin_port: ports[3],
    iopub_port: ports[4]
  };
}

/**
 * Write a connection file
 * @public
 * @param  {object} [portFinderOptions]           connection options
 *                                                see {@link https://github.com/indexzero/node-portfinder/blob/master/lib/portfinder.js }
 * @param  {number} [portFinderOptions.port]
 * @param  {string} [portFinderOptions.host]
 * @return {object} configResults
 * @return {object} configResults.config          connection info
 * @return {string} configResults.connectionFile  path to the connection file
 */
async function writeConnectionFile(portFinderOptions?: {
  port: number;
  host: string;
}): Promise<{ config: JupyterConnectionInfo; connectionFile: string }> {
  const options = Object.assign({}, portFinderOptions);
  options.port = options.port || 9000;
  options.host = options.host || "127.0.0.1";

  const writeFile = util.promisify(fs.writeFile);
  const getPorts = util.promisify(_getPorts);

  try {
    const ports = await getPorts(5, options);
    const runtimeDir = await jp.runtimeDir();
    mkdirp(runtimeDir, error => {
      if (error) throw error;
    });

    // Write the kernel connection file.
    const config = createConnectionInfo(ports);
    const connectionFile = path.join(
      await jp.runtimeDir(),
      `kernel-${uuid.v4()}.json`
    );
    debugger;
    await writeFile(connectionFile, config);
    return {
      config,
      connectionFile
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

/**
 * Launch a kernel for a given kernelSpec
 * @public
 * @param  kernelSpec      describes a specific
 *                         kernel, see the npm
 *                         package `kernelspecs`
 * @param  [spawnOptions] `child_process`-like {@link https://github.com/sindresorhus/execa#options options for execa}
 *                         use `{ cleanupConnectionFile: false }` to disable automatic connection file cleanup
 */
async function launchSpec(kernelSpec: KernelSpec, spawnOptions?: Options) {
  const info = await writeConnectionFile();
  return launchSpecFromConnectionInfo(
    kernelSpec,
    info.config,
    info.connectionFile,
    spawnOptions
  );
}

export type LaunchedKernel = {
  spawn: execa.ExecaChildProcess;
  connectionFile: string;
  config: JupyterConnectionInfo;
  kernelSpec: KernelSpec;
  channels: Channels;
};

/**
 * Launch a kernel for a given kernelSpec and connection info
 * @public
 * @param  {object}       kernelSpec      describes a specific
 *                                        kernel, see the npm
 *                                        package `kernelspecs`
 * @param  {object}       config          connection config
 * @param  {string}       connectionFile  path to the config file
 * @param  {object}       [spawnOptions]  `child_process`-like options for [execa]{@link https://github.com/sindresorhus/execa#options}
 *                                         use `{ cleanupConnectionFile: false }` to disable automatic connection file cleanup
 * @return {object}       spawnResults
 * @return {ChildProcess} spawnResults.spawn           spawned process
 * @return {string}       spawnResults.connectionFile  connection file path
 * @return {object}       spawnResults.config          connection info
 *
 */
async function launchSpecFromConnectionInfo(
  kernelSpec: KernelSpec,
  config: JupyterConnectionInfo,
  connectionFile: string,
  spawnOptions?: Options
): Promise<LaunchedKernel> {
  const argv = kernelSpec.argv.map((x: string) =>
    x === "{connection_file}" ? connectionFile : x
  );

  const defaultSpawnOptions = {
    stdio: "ignore",
    cleanupConnectionFile: true
  };
  const env = Object.assign({}, process.env, kernelSpec.env);
  const fullSpawnOptions = Object.assign(
    {},
    defaultSpawnOptions,
    // TODO: see if this interferes with what execa assigns to the env option
    { env: env },
    spawnOptions
  );

  const runningKernel = execa(argv[0], argv.slice(1), fullSpawnOptions);

  if (fullSpawnOptions.cleanupConnectionFile !== false) {
    runningKernel.on("exit", (_code, _signal) => cleanup(connectionFile));
    runningKernel.on("error", _error => cleanup(connectionFile));
  }

  const channels = await createMainChannel(config);

  return {
    spawn: runningKernel,
    connectionFile,
    config,
    kernelSpec,
    channels
  };
}

/**
 * Launch a kernel by name
 * @public
 * @param  kernelName
 * @param  [specs]                      array of kernelSpec
 *                                                     objects to look through.
 *                                                     See the npm package
 *                                                     `kernelspecs`
 * @param  [spawnOptions]  `child_process`-like options for [execa]{@link https://github.com/sindresorhus/execa#options}
 *                                        use `{ cleanupConnectionFile: false }` to disable automatic connection file cleanup
 */
async function launch(
  kernelName: string,
  spawnOptions?: Options,
  specs?: KernelResourceByName
): Promise<LaunchedKernel> {
  // Let them pass in a cached specs file
  if (!specs) {
    return findAll().then((sp: KernelResourceByName) =>
      launch(kernelName, spawnOptions, sp)
    );
  }
  if (!specs[kernelName]) {
    return Promise.reject(new Error(`No spec available for ${kernelName}`));
  }
  const spec = specs[kernelName].spec;
  return launchSpec(spec, spawnOptions);
}

export { launch, launchSpec, launchSpecFromConnectionInfo };
