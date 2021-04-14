import { useDispatch, useSelector } from "react-redux";

import {
  getAvailableActivityManagerForProcessAsync,
  selectCurrentActivityManager,
  startWorkflowAsync,
  submitActivityToActivityManagerAsync,
  updateDefaultProcess,
} from "./workflowManager.slice";

import { loginAction, updateState as updateLogin } from "./login.slice";

export function useWorkflowManager() {
  const dispatch = useDispatch();
  const currentActivity = useSelector(selectCurrentActivityManager);

  /**
   * Make a Anonymous Login
   * @param {String} URL The URL to request an anonymous Login
   */
  function anonymousLogin(URL) {
    dispatch(loginAction.getAnonymousToken(URL));
  }

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
    startWorkflow,
    submitActivity,
  };
}
