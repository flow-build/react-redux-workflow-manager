import { createSlice } from "@reduxjs/toolkit";
import jwtDecode from "jwt-decode";
import AsyncStorage from "@callstack/async-storage";

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
    updateState: (_, { payload }) => ({ ...payload }),
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

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.message = message;
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        stacktrace: this.stack,
      },
    };
  }
}

const loginAction = {
  getAnonymousToken: (URL) => async (dispatch) => {
    try {
      const params = { claims: ["anonymous"] };

      const response = await fetch(URL, {
        method: "POST",
        ...getDefaultHeaders(),
        body: JSON.stringify(params),
      });

      if (response.ok) {
        const data = await response.json();
        const { account_id, actor_id, session_id } = jwtDecode(data.jwtToken);

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

  login: (URL, body) => async (dispatch) => {
    try {
      const response = await fetch(URL, {
        method: "POST",
        ...getDefaultHeaders(),
        body: JSON.stringify(body),
      });
      console.log("response", response);

      if (response.ok) {
        const data = await response.json();
        const { account_id, actor_id, session_id } = jwtDecode(data.token);

        await AsyncStorage.removeItem("@session_id");
        await AsyncStorage.removeItem("@actor_id");

        await AsyncStorage.setItem("TOKEN", data.token);
        await AsyncStorage.setItem("@session_id", session_id);
        await AsyncStorage.setItem("@actor_id", actor_id);

        dispatch(
          loginSlice.actions.updateState({
            actor_id,
            claims: data.claims,
            token: data.token,
            refresh_token: data.refresh_token,
            account_id,
            session_id,
          })
        );
      } else if (response.status === 401) {
        throw new ValidationError("Credenciais Inválidas");
      }
    } catch (error) {
      throw error;
    }
  },
};

export { loginAction };

export default loginSlice.reducer;
