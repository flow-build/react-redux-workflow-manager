import { useDispatch, useSelector } from "react-redux";

import {
  getAvailableActivityManagerForProcessAsync,
  selectCurrentActivityManager,
  startWorkflowAsync,
  submitActivityToActivityManagerAsync,
  updateDefaultProcess,
} from "./workflowManager.slice";

import { loginAction, updateState as updateLogin } from "./login.slice";

let handler = null;
let flag = false;

export function useWorkflowManager() {
  const dispatch = useDispatch();
  const currentActivity = useSelector(selectCurrentActivityManager);
  const { defaultProcess } = useSelector((state) => state.workflowManager);

  /**
   * Make a Anonymous Login
   * @param {String} URL The URL to request an anonymous Login
   */
  function anonymousLogin(URL) {
    dispatch(loginAction.getAnonymousToken(URL));
  }

  /**
   * Get the available activities by processId
   * @param {String} processId It represents the process' Id
   */
  function getAvailableActivityByProcessId(processId) {
    dispatch(getAvailableActivityManagerForProcessAsync(processId));
  }

  /**
   * Set the default process
   * @param {String} processId It represents the default process' Id
   */
  function setDefaultProcess(processId) {
    dispatch(updateDefaultProcess({ defaultProcess: processId }));
  }

  /**
   * Set login data
   * @param {Object} login Represents login info (eg.: actor_id)
   */
  function setLogin(login) {
    dispatch(updateLogin(login));
  }

  /**
   * Function to set the default process and navigation
   * @param {String} defaultWF The name of workflow to be set as the default
   * @param {Function} customFn Custom function to manage screen navigation
   * @returns {Function} Returns the function that was provided in customFn
   */
  function setNavigation(defaultWF, customFn) {
    try {
      if (!currentActivity && !handler) {
        handler = setTimeout(async () => {
          if (!defaultProcess || flag) {
            startWorkflow(defaultWF);
            flag = false;
          } else {
            getAvailableActivityByProcessId(defaultProcess);
            flag = true;
            clearTimeout(handler);
            handler = null;
          }
        }, 1000);
      } else if (currentActivity) {
        clearTimeout(handler);
        handler = null;
        flag = false;

        if (!defaultProcess) {
          setDefaultProcess(currentActivity.process_id);
        }

        return customFn();
      }
    } catch (error) {
      getAvailableActivityByProcessId(defaultProcess);
      const message = "Erro ao tentar mudar de página na navigation.";
      console.error(message, error);
    }
  }

  /**
   * Start an workflow
   * @param {String} workflowName Represents the workflow's name
   */
  function startWorkflow(workflowName, body = {}) {
    dispatch(startWorkflowAsync(workflowName, body));
  }

  /**
   * This function submits a payload for a specific acitivity
   * @param {String} activityId It represents the activity's ID
   * @param {Object} payload It represents what you want to send
   */
  function submitActivity(activityId, payload) {
    dispatch(submitActivityToActivityManagerAsync(activityId, payload));
  }

  return {
    anonymousLogin,
    currentActivity,
    getAvailableActivityByProcessId,
    setDefaultProcess,
    setLogin,
    setNavigation,
    startWorkflow,
    submitActivity,
  };
}
