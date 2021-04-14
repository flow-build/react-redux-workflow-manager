import { createSlice } from "@reduxjs/toolkit";
import jwtDecode from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";

const INITIAL_STATE = {
  actor_id: null,
  claims: [],
  token: null,
  refresh_token: null,
  account_id: null,
  session_id: null,
};

export const loginSlice = createSlice({
  name: "login",
  initialState: INITIAL_STATE,
  reducers: {
    updateState: (state, { payload }) => ({ ...payload }),
    resetState: () => ({ ...INITIAL_STATE }),
  },
});

export const { updateState, resetState } = loginSlice.actions;

const getDefaultHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };

  return { headers };
};

const loginAction = {
  getAnonymousToken: (URL) => async (dispatch) => {
    try {
      const params = { claims: ["anonymous"] };

      const response = await fetch(URL, {
        method: "POST",
        ...getDefaultHeaders(),
        body: JSON.stringify(params),
      });

      console.log("ok", response.ok);
      if (response.ok) {
        const data = await response.json();
        const { account_id, actor_id, session_id } = jwtDecode(data.jwtToken);

        // console.log("data.jwtToken", data.jwtToken);

        await AsyncStorage.removeItem("@session_id");
        await AsyncStorage.removeItem("@actor_id");
        await AsyncStorage.setItem("TOKEN", data.jwtToken);
        await AsyncStorage.setItem("@session_id", session_id);
        await AsyncStorage.setItem("@actor_id", actor_id);

        dispatch(
          loginSlice.actions.updateState({
            actor_id,
            claims: data.payload.claims,
            token: data.jwtToken,
            refresh_token: null,
            account_id,
            session_id,
          })
        );
      }
    } catch (error) {
      const message = "Erro ao tentar obter token anônimo.";
      console.error(message, error);
      throw error;
    }
  },
};

export { loginAction };

export default loginSlice.reducer;
