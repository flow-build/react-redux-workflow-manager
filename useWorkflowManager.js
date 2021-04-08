import { useDispatch, useSelector } from "react-redux";

import {
  selectCurrentActivityManager,
  startWorkflowAsync,
  submitActivityToActivityManagerAsync,
} from "./workflowManager.slice";

export function useWorkflowManager() {
  const dispatch = useDispatch();
  const currentActivity = useSelector(selectCurrentActivityManager);

  /**
   * Start an workflow
   * @param {String} workflowName Represents the workflow's name
   */
  function startWorkflow(workflowName) {
    dispatch(startWorkflowAsync(workflowName));
  }

  /**
   * This function submits a payload for a specific acitivity
   * @param {String} activityId It represents the activity's ID
   * @param {Object} payload It represents what you want to send
   */
  function submitActivity(activityId, payload) {
    dispatch(submitActivityToActivityManagerAsync(activityId, payload));
  }

  return { currentActivity, startWorkflow, submitActivity };
}
