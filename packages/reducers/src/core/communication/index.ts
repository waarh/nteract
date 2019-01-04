import { combineReducers } from "redux-immutable";
import { Action } from "redux";

import {
  makeCommunicationRecord,
  CommunicationRecordProps
} from "@nteract/types";

import { contents } from "./contents";
import { kernels } from "./kernels";
import { kernelspecs } from "./kernelspecs";

export const communication = combineReducers<
  CommunicationRecordProps,
  Action,
  string
>(
  {
    contents,
    kernels,
    kernelspecs
  },
  makeCommunicationRecord as any
);
