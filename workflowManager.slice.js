import { createSlice } from "@reduxjs/toolkit";
import { loginAction } from "./login.slice";

let HOST;

const INITIAL_STATE = {
  activityManagerOrder: [],
  availableActivityManagers: {},
  currentActivityManagerId: null,
  availableWorkflows: [],
  focusProcess: null,
  mqttConfig: {},
  mqttIsConnected: false,
  defaultProcess: null,
};

const getDefaultHeaders = (getState) => {
  const headers = {
    "Content-Type": "application/json",
  };

  let token;

  if (getState() && getState().login && getState().login.token) {
    token = getState().login.token;
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return { headers };
};

export const workflowManagerSlice = createSlice({
  name: "workflowManager",
  initialState: INITIAL_STATE,
  reducers: {
    updateAvailableWorkflows: (state, { payload: { workflowNames } }) => {
      state.availableWorkflows = workflowNames;
    },

    updateAvailableActivityManagers: (
      state,
      { payload: { availableActivityManagers, activityManagerOrder } }
    ) => {
      state.availableActivityManagers = availableActivityManagers;
      state.activityManagerOrder = activityManagerOrder;

      if (state.focusProcess) {
        for (const am of Object.values(availableActivityManagers)) {
          if (am.process_id === state.focusProcess) {
            state.currentActivityManagerId = am.id;
            break;
          }
        }
      }
    },

    setCurrentActivityManager: (state, { payload: { activityManagerId } }) => {
      if (activityManagerId in state.availableActivityManagers) {
        state.currentActivityManagerId = activityManagerId;
      }
    },

    addActivityManager: (state, { payload: { activityManager } }) => {
      if (!(activityManager.id in state.availableActivityManagers)) {
        state.availableActivityManagers[activityManager.id] = activityManager;
      }

      if (state.activityManagerOrder.indexOf(activityManager.id) < 0) {
        state.activityManagerOrder.push(activityManager.id);
      }

      if (state.focusProcess === activityManager.process_id) {
        state.currentActivityManagerId = activityManager.id;
      }
    },

    removeActivityManager: (state, { payload: { activityManagerId } }) => {
      if (activityManagerId in state.availableActivityManagers) {
        delete state.availableActivityManagers[activityManagerId];
      }

      const index = state.activityManagerOrder.indexOf(activityManagerId);
      if (index > -1) {
        state.activityManagerOrder.splice(index, 1);
      }

      if (activityManagerId === state.currentActivityManagerId) {
        state.currentActivityManagerId = INITIAL_STATE.currentActivityManagerId;
      }
    },

    setFocusProcess: (state, { payload: { processId } }) => {
      // state.focusProcess = processId;
      return {
        ...state,
        focusProcess: processId,
      };
    },

    updateDefaultProcess: (state, { payload: { defaultProcess } }) => {
      return {
        ...state,
        defaultProcess,
      };
    },

    resetState: () => INITIAL_STATE,
  },
});

export const {
  setCurrentActivityManager,
  resetState,
  setFocusProcess,
  addActivityManager,
  removeActivityManager,
  updateDefaultProcess,
} = workflowManagerSlice.actions;

/*
@abstract Name of async functions up this line in code 
@async:
  getAvailableWorkflowsAsync
  getAvailableActivityManagersAsync
  getAvailableActivityManagerForProcessAsync
  submitActivityToActivityManagerAsync
  startWorkflowAsync
  setFocusAndFetchActivityManagerAsync
  selectAvailableWorkflows
  selectOrderedAvailableActivityManagers
  selectCurrentActivityManager
  selectFocusProcess
  wfStart
*/

export const getAvailableWorkflowsAsync = () => async (dispatch, getState) => {
  /*
  @abstract : Updates available workflows
  @author   : Bruno Peixoto 
  */
  try {
    const r = await fetch(`${HOST}/workflows`, {
      method: "GET",
      ...getDefaultHeaders(getState),
    });

    if (r.ok) {
      const workflowsResponse = await r.json();
      const workflowNames = workflowsResponse.map((w) => w.name);
      dispatch(
        workflowManagerSlice.actions.updateAvailableWorkflows({ workflowNames })
      );
    } else if (r.status === 401) {
      await dispatch(
        removeActivityManager({
          activityManagerId:
            getState().workflowManager.currentActivityManagerId,
        })
      );
      await dispatch(loginAction.logout());
    }
  } catch (e) {
    console.log(e);
  }
};

export const getAvailableActivityManagersAsync =
  (filter) => async (dispatch, getState) => {
    /*
    @abstract : Updates available activity managers (am for short)
    @author   : Bruno Peixoto 
    */
    try {
      const baseURL = `${HOST}/processes/available`;
      const URL = filter ? `${baseURL}?${filter}` : baseURL;

      const r = await fetch(`${URL}`, {
        method: "GET",
        ...getDefaultHeaders(getState),
      });

      if (r.ok) {
        const responseActivityManagers = await r.json();

        const availableActivityManagers = Object.fromEntries(
          responseActivityManagers.map((am) => [am.id, am])
        );

        const activityManagerOrder = Object.keys(availableActivityManagers);

        dispatch(
          workflowManagerSlice.actions.updateAvailableActivityManagers({
            availableActivityManagers,
            activityManagerOrder,
          })
        );
      } else if (r.status === 401) {
        await dispatch(
          removeActivityManager({
            activityManagerId:
              getState().workflowManager.currentActivityManagerId,
          })
        );
        await dispatch(loginAction.logout());
      }
    } catch (e) {
      console.log(e);
    }
  };

export const getAvailableActivityManagerForProcessAsync =
  (processId, workflow_name_default) => async (dispatch, getState) => {
    /*
    @abstract : Updates available activity managers (am for short) of specific process processId
    @author   : Bruno Peixoto 
    */

    try {
      const r = await fetch(`${HOST}/processes/${processId}/activity`, {
        method: "GET",
        ...getDefaultHeaders(getState),
      });

      if (r.ok) {
        const activityManager = await r.json();

        dispatch(setFocusProcess({ processId: activityManager.process_id }));
        dispatch(
          workflowManagerSlice.actions.addActivityManager({ activityManager })
        );
      } else if (r.status === 404) {
        dispatch(startWorkflowAsync(workflow_name_default, {}));
      } else if (r.status === 401) {
        await dispatch(
          removeActivityManager({
            activityManagerId:
              getState().workflowManager.currentActivityManagerId,
          })
        );
        await dispatch(loginAction.logout());
      }
    } catch (e) {
      console.log(e);
    }
  };

export const submitActivityToActivityManagerAsync =
  (activityManagerId, data) => async (dispatch, getState) => {
    /*
    @abstract : Submit activity to specific activity manager am_id
    @author   : Bruno Peixoto 
    */
    
    try {
      let r = await fetch(
        `${HOST}/activity_manager/${activityManagerId}/submit`,
        {
          method: "POST",
          ...getDefaultHeaders(getState),
          body: JSON.stringify(data),
        }
      );

      if (r.ok) {
        r = await fetch(
          `${HOST}/processes/activity_manager/${activityManagerId}`,
          {
            method: "GET",
            ...getDefaultHeaders(getState),
          }
        );

        r.status === 404 &&
          dispatch(
            workflowManagerSlice.actions.removeActivityManager({
              activityManagerId,
            })
          );
      } else if (r.status === 401) {
        await dispatch(
          removeActivityManager({
            activityManagerId:
              getState().workflowManager.currentActivityManagerId,
          })
        );
        await dispatch(loginAction.logout());
      }
    } catch (e) {
      console.log(e);
    }
  };

export const startWorkflowAsync =
  (workflowName, payload = {}, setFocus = true) =>
  async (dispatch, getState) => {
    try {
      console.log('WorkflowManager/startWorkflowAsync: Start workflow'+workflowName+'process');
      const r = await fetch(`${HOST}/workflows/name/${workflowName}/start`, {
        method: "POST",
        ...getDefaultHeaders(getState),
        body: JSON.stringify(payload),
      });

      if (r.ok && setFocus) {
        const responseWorkflow = await r.json();

        console.log('WorkflowManager/startWorkflowAsync: process id ', responseWorkflow.process_id)

        await dispatch(
          setFocusProcess({
            processId: responseWorkflow.process_id,
          })
        );
      } else if (r.status === 401) {
        await dispatch(
          removeActivityManager({
            activityManagerId:
              getState().workflowManager.currentActivityManagerId,
          })
        );
        await dispatch(loginAction.logout());
      }
    } catch (e) {
      console.log(e);
    }
  };

export const setFocusAndFetchActivityManagerAsync =
  (processId) => async (dispatch, getState) => {
    /*
    @abstract : Prioritize specific process and updates respective activity manager
    @author   : Bruno Peixoto 
    */

    await dispatch(setFocusProcess({ processId }));
    await dispatch(getAvailableActivityManagerForProcessAsync(processId));
  };

/*
  @abstract : Selects the available workflows on ${HOST}
  @author   : Bruno Peixoto 
*/
export const selectAvailableWorkflows = (state) => state.workflowManager.availableWorkflows;

/*
  @abstract : Selects the available workflows on ${HOST} by given order
  @author   : Bruno Peixoto 
*/
export const selectOrderedAvailableActivityManagers = (state) =>
  state.workflowManager.activityManagerOrder.map(
    (id) => state.workflowManager.availableActivityManagers[id]
);

/*
  @abstract : Selects the available workflows on ${HOST} by given order
  @author   : Bruno Peixoto 
*/
export const selectCurrentActivityManager = (state) =>
  !!state.workflowManager.currentActivityManagerId
    ? state.workflowManager.availableActivityManagers[
        state.workflowManager.currentActivityManagerId
      ]
    : null;

/*
  @abstract : Selects the process :process_id under focus
  @author   : Bruno Peixoto 
*/
export const selectFocusProcess = (state) => state.workflowManager.focusProcess;

/*
  @abstract : Selects ???
  @author   : Bruno Peixoto 
*/
export const wfStart = (state) => state.startWorkflow;

const WorkflowManagerSlice = (URL) => {
  HOST = URL;
  return workflowManagerSlice.reducer;
};

export default WorkflowManagerSlice;
