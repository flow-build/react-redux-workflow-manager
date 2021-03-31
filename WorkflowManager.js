import { useState, useEffect } from "react";
import { Client } from "paho-mqtt";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  removeActivityManager,
  addActivityManager,
  setCurrentActivityManager,
  setFocusProcess,
} from "./workflowManager.slice";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";

export function WorkflowManager({
  mqttConfig = {
    host: "broker.hivemq.com",
    port: 8000,
    clientId: "fbtaskr896967579608",
  },
  children,
  ...otherProps
}) {
  const dispatch = useDispatch();
  const [mqttClient, setMqttClient] = useState(null);
  const [badConnFlag, setBadConnFlag] = useState(null);

  useEffect(() => {
    console.log("Use effect called");

    if (mqttConfig && !mqttClient) {
      const client = new Client(
        mqttConfig.host,
        mqttConfig.port,
        mqttConfig.clientId
      );

      // set callback handlers
      client.onConnectionLost = onConnectionLost;
      client.onMessageArrived = onMessageArrived;

      // connect the client
      client.connect({
        onSuccess: onConnect,
        onFailure: () => setBadConnFlag(Math.random()),
        keepAliveInterval: 10,
      });

      // called when the client connects
      function onConnect() {
        // Once a connection has been made, make a subscription and send a message.
        console.log("Connected");
        client.subscribe("/session/+/am/#");
        client.subscribe("/actor/+/am/#");
      }

      // called when the client loses its connection
      function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
          console.log("onConnectionLost:" + responseObject.errorMessage);
          setBadConnFlag(Math.random());
        }
      }

      // called when a message arrives
      async function onMessageArrived(message) {
        console.log("Receveid message", message.topic);
        const activityManager = JSON.parse(message.payloadString);
        const topic = message.topic;

        const session_id = await AsyncStorage.getItem("@session_id");
        const actor_id = await AsyncStorage.getItem("@actor_id");

        console.log("ASYNC session_id", session_id);
        console.log("ASYNC actor_id", actor_id);

        let action = "";
        let messageConsole = "";

        switch (topic) {
          case `/session/${session_id}/am/create`:
          case `/actor/${actor_id}/am/create`:
            action = "(A action é " + activityManager.props.action + ").";
            messageConsole = `\x1b[31m${"\n\tEntrou no CREATE."}\x1b[36m${action}\x1b[0m`;
            messageConsole += `\n\x1b[36m\t- Activity Manager adicionado na fila. (ID: ${activityManager.id})\x1b[0m`;
            console.log(messageConsole);

            dispatch(addActivityManager({ activityManager }));
            break;

          case `/session/${session_id}/am/remove`:
          case `/actor/${actor_id}/am/remove`:
            messageConsole = `\x1b[31m${"\n\tEntrou no REMOVE."}.`;
            messageConsole += `\n\x1b[36m\t- Activity Manager removido na fila. (ID: ${activityManager.activity_manager_id})\x1b[0m`;
            console.log(messageConsole);

            dispatch(
              removeActivityManager({
                activityManagerId: activityManager.activity_manager_id,
              })
            );
            break;

          case `/session/${session_id}/am/focus`:
          case `/actor/${actor_id}/am/focus`:
            action = "(A action é " + activityManager?.props?.action + ").";
            messageConsole = `\x1b[31m${"\n\tEntrou no FOCUS da Atividade."}\x1b[36m${action}\x1b[0m`;
            messageConsole += `\n\x1b[36m\t- Foco do processo setado para o da atividade. (${activityManager.process_id})`;
            messageConsole += `\n\x1b[36m\t- Atividade atual setado para o id da atividade. (${activityManager.id})\x1b[0m`;
            console.log(messageConsole);

            dispatch(
              setFocusProcess({ processId: activityManager.process_id })
            );
            dispatch(
              setCurrentActivityManager({
                activityManagerId: activityManager.id,
              })
            );
            break;

          case `/session/${session_id}/process/focus`:
          case `/actor/${actor_id}/process/focus`:
            action = "(A action é " + activityManager?.props?.action + ").";
            messageConsole = `\x1b[31m${"\n\tEntrou no FOCUS do Processo."}\x1b[36m${action}\x1b[0m`;
            messageConsole += `\n\x1b[36m\t- Foco do processo setado para o da atividade. (${activityManager.process_id})\x1b[0m`;
            console.log(messageConsole);

            dispatch(
              setFocusProcess({ processId: activityManager.process_id })
            );
            break;

          default:
            console.log("\n\x1b[31mTÓPICO NÃO ENCONTRADO\x1b[0m\n");
        }
      }

      setMqttClient(client);
    }

    return function cleanup() {
      console.log("Cleanup");
      if (mqttClient) {
        try {
          mqttClient.disconnect();
        } catch (e) {
          console.log("DISCONECTED", e);
        } finally {
          setMqttClient(null);
          console.log("Disconnected");
        }
      }
    };
  }, [mqttConfig, mqttClient, dispatch, badConnFlag]);

  return children;
}
