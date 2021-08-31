import { useState, useEffect } from 'react';
import { Client } from 'paho-mqtt';
import AsyncStorage from '@callstack/async-storage';

import {
  removeActivityManager,
  addActivityManager,
  setCurrentActivityManager,
  setFocusProcess,
} from './workflowManager.slice';

import { useDispatch } from 'react-redux';

const chars = [
  ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
];
const randomId = [...Array(19)].map(
  (i) => chars[(Math.random() * chars.length) | 0]
).join``;

const MQTT_CONFIG_DEFAULT = {
  host: 'broker.hivemq.com',
  port: 8000,
  clientId: randomId,
};

export function WorkflowManager({
  sessionId,
  subscribeTopics = [],
  mqttConfig = MQTT_CONFIG_DEFAULT,
  children,
}) {
  const dispatch = useDispatch();
  const [mqttClient, setMqttClient] = useState(null);
  const [badConnFlag, setBadConnFlag] = useState(null);

  useEffect(() => {
    console.log('Use effect called');

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
        reconnect: true,
      });

      // called when the client connects
      function onConnect() {
        // Once a connection has been made, make a subscription and send a message.
        console.log('Connected');
        // subscribeTopics.forEach(topic => client.subscribe(topic));
        client.subscribe('/session/+/am/#');
        client.subscribe('/actor/+/am/#');
      }

      // called when the client loses its connection
      function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
          console.log('onConnectionLost:' + responseObject.errorMessage);
          setBadConnFlag(Math.random());
        }
      }

      // called when a message arrives
      async function onMessageArrived(message) {
        const activityManager = JSON.parse(message.payloadString);
        const topic = message.topic;

        const session_id = await AsyncStorage.getItem('@session_id');
        const actor_id = await AsyncStorage.getItem('@actor_id');

        if (session_id) {
          client.unsubscribe('/session/+/am/#');
          client.subscribe(`/session/${session_id}/am/#`);
        }

        if (actor_id) {
          client.unsubscribe('/actor/+/am/#');
          client.subscribe(`/actor/${actor_id}/am/#`);
        }

        switch (topic) {
          case `/session/${session_id}/am/create`:
          case `/actor/${actor_id}/am/create`:
            dispatch(addActivityManager({ activityManager }));
            break;

          case `/session/${session_id}/am/remove`:
          case `/actor/${actor_id}/am/remove`:
            dispatch(
              removeActivityManager({
                activityManagerId: activityManager.activity_manager_id,
              })
            );
            break;

          case `/session/${session_id}/am/focus`:
          case `/actor/${actor_id}/am/focus`:
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
            dispatch(
              setFocusProcess({ processId: activityManager.process_id })
            );
            break;

          default:
            console.log('\n\x1b[31mTÓPICO NÃO ENCONTRADO\x1b[0m\n');
        }
      }

      setMqttClient(client);
    }
  }, [mqttConfig, mqttClient, dispatch, badConnFlag]);

  return children;
}
