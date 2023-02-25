import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";
import hardSet from "redux-persist/lib/stateReconciler/hardSet";
import storage from "redux-persist/lib/storage";
import discountReducer from "./slice/discount/discountSlice";
import posReducer from "./slice/pos/posSlice";
import securityReducer from "./slice/security/securitySlice";

const persistConfigPos = {
  key: "pos-v3",
  storage,
  stateReconciler: hardSet,
};

const persistedReducerPos = persistReducer<ReturnType<typeof posReducer>>(
  persistConfigPos,
  posReducer
);

const persistConfigSecurity = {
  key: "security-v3",
  version: 1,
  storage,
};
const persistedReducerSecurity = persistReducer(
  persistConfigSecurity,
  securityReducer
);

export const store = configureStore({
  reducer: {
    pos: persistedReducerPos,
    discount: discountReducer,
    security: persistedReducerSecurity,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export let persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
