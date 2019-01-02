import { combineReducers } from "redux-immutable";
import { Action } from "redux";
import * as Immutable from "immutable";

import {
  makeKernelCommunicationRecord,
  makeKernelsCommunicationRecord,
  KernelsCommunicationRecordProps,
  KernelCommunicationRecordProps
} from "@nteract/types";
import * as actions from "@nteract/actions";

// TODO: we should spec out a way to watch the killKernel lifecycle.
const byRef = (
  state = Immutable.Map<
    string,
    Immutable.RecordOf<KernelCommunicationRecordProps>
  >(),
  action: Action
) => {
  let typedAction;
  switch (action.type) {
    case actions.RESTART_KERNEL:
    case actions.LAUNCH_KERNEL:
    case actions.LAUNCH_KERNEL_BY_NAME:
      typedAction = action as actions.LaunchKernelAction;
      return state.set(
        typedAction.payload.kernelRef,
        makeKernelCommunicationRecord({
          error: null,
          loading: true
        })
      );
    case actions.RESTART_KERNEL_SUCCESSFUL:
    case actions.LAUNCH_KERNEL_SUCCESSFUL:
      typedAction = action as actions.RestartKernelSuccessful;
      return state.set(
        typedAction.payload.kernelRef,
        makeKernelCommunicationRecord({
          error: null,
          loading: false
        })
      );
    case actions.RESTART_KERNEL_FAILED:
    case actions.LAUNCH_KERNEL_FAILED:
      typedAction = action as actions.LaunchKernelFailed;
      return typedAction.payload.kernelRef
        ? state.set(
            typedAction.payload.kernelRef,
            makeKernelCommunicationRecord({
              error: typedAction.payload.error,
              loading: false
            })
          )
        : state;
    default:
      return state;
  }
};

export const kernels = combineReducers<
  Immutable.RecordOf<KernelsCommunicationRecordProps>
>({ byRef }, makeKernelsCommunicationRecord);
