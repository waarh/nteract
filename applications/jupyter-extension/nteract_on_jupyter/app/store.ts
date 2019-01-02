import {
  combineReducers,
  createStore,
  applyMiddleware,
  compose,
  Action,
  AnyAction
} from "redux";
import { createEpicMiddleware, combineEpics, Epic } from "redux-observable";
import { AppState } from "@nteract/core";
import {
  reducers,
  epics as coreEpics,
  middlewares as coreMiddlewares
} from "@nteract/core";

const composeEnhancers =
  (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const rootReducer = combineReducers<AppState, any>({
  app: reducers.app,
  comms: reducers.comms,
  config: reducers.config,
  core: reducers.core
});

export default function configureStore(initialState: Partial<AppState>) {
  const rootEpic = combineEpics<Epic>(...coreEpics.allEpics);
  const epicMiddleware = createEpicMiddleware();
  const middlewares = [epicMiddleware, coreMiddlewares.errorMiddleware];

  const store = createStore<AppState, Action<any>, {}, {}>(
    rootReducer,
    initialState,
    composeEnhancers(applyMiddleware(...middlewares))
  );

  epicMiddleware.run(rootEpic);

  return store;
}
