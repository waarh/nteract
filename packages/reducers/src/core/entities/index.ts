import { combineReducers } from "redux-immutable";

import {
  makeEntitiesRecord,
  EntitiesRecord,
  EntitiesRecordProps
} from "@nteract/types";

import { Action } from "redux";

import { contents } from "./contents";
import { hosts } from "./hosts";
import { kernels } from "./kernels";
import { kernelspecs } from "./kernelspecs";
import { modals } from "./modals";

export const entities = combineReducers<EntitiesRecordProps, Action, string>(
  {
    contents,
    hosts,
    kernels,
    kernelspecs,
    modals
  },
  makeEntitiesRecord
);
