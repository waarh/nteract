import { combineReducers } from "redux-immutable";
import { Action } from "redux";
import * as Immutable from "immutable";

import {
  makeKernelspecsByRefCommunicationRecord,
  makeKernelspecsCommunicationRecord,
  KernelspecsCommunicationRecordProps,
  KernelspecsByRefCommunicationRecordProps
} from "@nteract/types";
import * as actionTypes from "@nteract/actions";

export const byRef = (
  state = Immutable.Map<
    string,
    Immutable.RecordOf<KernelspecsByRefCommunicationRecordProps>
  >(),
  action: Action
) => {
  let typedAction;
  switch (action.type) {
    case actionTypes.FETCH_KERNELSPECS:
      typedAction = action as actionTypes.FetchKernelspecs;
      return state.set(
        typedAction.payload.kernelspecsRef,
        makeKernelspecsByRefCommunicationRecord({ loading: true, error: null })
      );
    case actionTypes.FETCH_KERNELSPECS_FULFILLED:
      typedAction = action as actionTypes.FetchKernelspecsFulfilled;
      return state.set(
        typedAction.payload.kernelspecsRef,
        makeKernelspecsByRefCommunicationRecord({ loading: false, error: null })
      );
    case actionTypes.FETCH_KERNELSPECS_FAILED:
      typedAction = action as actionTypes.FetchKernelspecsFailed;
      return state.set(
        typedAction.payload.kernelspecsRef,
        makeKernelspecsByRefCommunicationRecord({
          loading: false,
          error: typedAction.payload.error
        })
      );
    default:
      return state;
  }
};

export const kernelspecs = combineReducers<
  Immutable.RecordOf<KernelspecsCommunicationRecordProps>
>({ byRef }, makeKernelspecsCommunicationRecord as any);
