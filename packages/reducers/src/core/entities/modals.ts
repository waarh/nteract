import { combineReducers } from "redux-immutable";
import * as Immutable from "immutable";

import * as actions from "@nteract/actions";
import { makeModalsRecord, ModalsRecordProps } from "@nteract/types";

const modalType = (
  state = "",
  action: actions.OpenModal | actions.CloseModal
) => {
  switch (action.type) {
    case actions.OPEN_MODAL:
      return action.payload.modalType;
    case actions.CLOSE_MODAL:
      return "";
    default:
      return state;
  }
};

export const modals = combineReducers<Immutable.RecordOf<ModalsRecordProps>>(
  { modalType },
  makeModalsRecord
);
