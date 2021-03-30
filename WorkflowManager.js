import { useState, useEffect } from "react";
import { Client } from "paho-mqtt";
import {removeActivityManager,addActivityManager} from "./workflowManager.slice";

import { useDispatch } from "react-redux";

export function WorkflowManager({
  mqttConfig = {
    host: "broker.hivemq.com",
    port: 8000,
    clientId: 'fbtaskr896967579608'
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
        client.subscribe("/session/#");
        client.subscribe("/actor/#");
      }

      // called when the client loses its connection
      function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
          console.log("onConnectionLost:" + responseObject.errorMessage);
          setBadConnFlag(Math.random());
        }
      }

      // called when a message arrives
      function onMessageArrived(message) {
        let processId;
        const activityManager = JSON.parse(message.payloadString);

        if(message.topic.includes('/session/')) {
          dispatch(addActivityManager({ activityManager }));
        } else if (message.topic.includes('/actor/')) {
          dispatch(addActivityManager({ activityManager }));
        } else if(message.topic.includes('/activity/')) {
          dispatch(removeActivityManager({activityManagerId: activityManager.id}))
        } else {
          // console.log('MENSAGEM ELSE', message.topic)
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
          console.log('DISCONECTED', e);
        } finally {
          setMqttClient(null);
          console.log("Disconnected");
        }
      }
    };
  }, [mqttConfig, mqttClient, dispatch, badConnFlag]);

  return children;
}
