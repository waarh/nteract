import { combineReducers } from "redux-immutable";
import { Action } from "redux";
import * as Immutable from "immutable";

import {
  makeContentCommunicationRecord,
  makeContentsCommunicationRecord,
  ContentsCommunicationRecordProps,
  ContentCommunicationRecordProps
} from "@nteract/types";
import * as actions from "@nteract/actions";

const byRef = (
  state = Immutable.Map<
    string,
    Immutable.RecordOf<ContentCommunicationRecordProps>
  >(),
  action: Action
) => {
  let typedAction;
  switch (action.type) {
    case actions.FETCH_CONTENT:
      typedAction = action as actions.FetchContent;
      return state.set(
        typedAction.payload.contentRef,
        makeContentCommunicationRecord({
          loading: true,
          saving: false,
          error: null
        })
      );
    case actions.FETCH_CONTENT_FULFILLED:
      typedAction = action as actions.FetchContentFulfilled;
      return state.set(
        typedAction.payload.contentRef,
        makeContentCommunicationRecord({
          loading: false,
          saving: false,
          error: null
        })
      );
    case actions.FETCH_CONTENT_FAILED:
      typedAction = action as actions.FetchContentFailed;
      return state.set(
        typedAction.payload.contentRef,
        makeContentCommunicationRecord({
          loading: false,
          saving: false,
          error: typedAction.payload.error
        })
      );
    case actions.SAVE:
    case actions.SAVE_AS:
      typedAction = action as actions.SaveAs;
      return state.set(
        typedAction.payload.contentRef,
        makeContentCommunicationRecord({
          loading: false,
          saving: true,
          error: null
        })
      );
    case actions.SAVE_FULFILLED:
      typedAction = action as actions.SaveFulfilled;
      return state.set(
        typedAction.payload.contentRef,
        makeContentCommunicationRecord({
          loading: false,
          saving: false,
          error: null
        })
      );
    case actions.SAVE_FAILED:
      typedAction = action as actions.SaveFailed;
      return state.set(
        typedAction.payload.contentRef,
        makeContentCommunicationRecord({
          loading: false,
          saving: false,
          error: typedAction.payload.error
        })
      );
    default:
      return state;
  }
};

export const contents = combineReducers<
  ContentsCommunicationRecordProps,
  Action,
  string
>({ byRef }, makeContentsCommunicationRecord as any);
