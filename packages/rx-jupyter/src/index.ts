/**
 * @module rx-jupyter
 */
import { ajax, AjaxResponse } from "rxjs/ajax";
import { createAJAXSettings, ServerConfig } from "./base";

import * as kernels from "./kernels";
import * as kernelspecs from "./kernelspecs";
import * as sessions from "./sessions";
import * as contents from "./contents";
import * as terminals from "./terminals";
import { Observable } from "rxjs";

/**
 * Get the version of the API for a given server.
 *
 * @param serverConfig The server configuration
 *
 * @returns An Observable containing the API version information
 */
export const apiVersion = (
  serverConfig: ServerConfig
): Observable<AjaxResponse> => ajax(createAJAXSettings(serverConfig, "/api"));

/**
 * Creates an AjaxObservable for shutting down a notebook server.
 *
 * @param serverConfig The server configuration
 *
 * @returns An Observable with the request/response
 */
export const shutdown = (
  serverConfig: ServerConfig
): Observable<AjaxResponse> =>
  ajax(createAJAXSettings(serverConfig, "/api/shutdown", { method: "POST" }));

export { kernels, kernelspecs, sessions, contents, terminals, ServerConfig };
