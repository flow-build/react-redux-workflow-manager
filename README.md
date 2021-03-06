# @flowbuild/react-redux-workflow-manager

[About](#about) • [Installation](#installation) • [Basic Usage](#basic-usage) • [Bugs?](#bugs)

## About

@flowbuild/react-redux-workflow-manager is a library to help you to use the Workflow Manager.

## Installation

With npm:

    npm i @flowbuild/redux-toolkit-workflow-manager

With yarn:

    yarn add @flowbuild/redux-toolkit-workflow-manager

## Basic Usage

We need to do this steps to migrate to this awesome pattern:

- [Creating a file to reference actions to page names](#creating-file-to-reference-actions-to-page-names)
- [Configuring Redux Store](#configuring-redux-store)
- [Adding Workflow Manager Tag](#adding-workflow-manager-tag)
- [Configuring navigation architecture to use nested router](#configuring-navigation-architecture-to-use-nested-router)
- [Configuring automatic navigate](#configuring-automatic-navigate)

#### Creating file to reference actions to page names

First of all, let's create a javascript file with a JSON. The properties of this object are the actions and the values are the name pages in router file.

```javascript
// referencesPages.js

const ReferencesPages = {
  HOME: "Home",
};

export default ReferencesPages;
```

#### Configuring Redux Store

Let's set the redux store. This lib requires redux ([@redux/toolkit](https://redux-toolkit.js.org/introduction/getting-started)) to manage the workflow, so go to your redux store file and add:

```javascript
import { configureStore } from  '@reduxjs/toolkit';
...
import loginReducer from '@flowbuild/redux-toolkit-workflow-manager/login.slice';
import WorkflowManagerSlice from '@flowbuild/redux-toolkit-workflow-manager/workflowManager.slice';

const  store  =  configureStore({
  reducer: {
    ...
    login: loginReducer,
    workflowManager:  WorkflowManagerSlice(YOUR_HOST),
    ...
  },
});
```

#### Adding Workflow Manager Tag

Ok, now we're able to use the workflow manager tag. We need to use this tag as a parent of Navigation/Router tag of our application. (The navigation tag represents a general function to dealing with the navigation of our application).

```javascript
import React from 'react';
...
import { Provider } from  'react-redux';
import { WorkflowManager } from  '@flowbuild/redux-toolkit-workflow-manager';

import store from  './redux';
...

const App = () => {
  return (
    ...
    <Provider store={store}>
      <WorkflowManager>
        <Navigation />
      </WorkflowManager>
    </Provider>
    ...
  );
}
```

#### Configuring navigation architecture to use nested router

If you already have a router implemented, don't worry, this change is easy to make. We need this to use navigation functions.

Using [`@react-navigation/stack`](https://reactnavigation.org/docs/getting-started), let's declare two consts with createStackNavigator hook.

```javascript
...
import { createStackNavigator } from '@react-navigation/stack';
...

const RootStack = createStackNavigator();
const NestedStack = createStackNavigator();
```

Your application's router gonna be inside NestedStack. Let's make our function to return the router. (If your application start with an workflow, you gonna need to make a Loading Screen).

```javascript
function NavigationWithRoutes({ navigation }) {
  return (
    <NestedStack.Navigator>
      {/* Declare your screens here */}
      <NestedStack.Screen name={"LoadingScreen"} component={/* LoadingComponent */} />
      <NestedStack.Screen name={"Home"} component={/* HomeComponent */} />
    </NestedStack.Navigator>
  );
}
```

After that, let's create our function to be the root of navigation:

```javascript
...
import { NavigationContainer } from '@react-navigation/native';
...

export function Navigation() {
  <NavigationContainer>
    <RootStack.Navigator>
      <RootStack.Screen name="NavigationWithRoutes" component={NavigationWithRoutes} />
    </RootStack.Navigator>
  </NavigationContainer>
}
```

#### Configuring automatic navigate

Let's configure the last step to begin. We have to configure a `useEffect` to watch what is the current activity in your application. To receive the current activity, the lib has a hook (`useWorkflowManager`) that returns the current activity. Inside this `useEffect`, we need to call a function that sets the navigation. Also, the hook has this function.

```javascript
import React, { useEffect } from  'react';
import { useWorkflowManager } from  '@flowbuild/redux-toolkit-workflow-manager/useWorkflowManager';
...

function NavigationWithRoutes({ navigation }) {
  const {currentActivity, setNavigation} = useWorkflowManager();

  useEffect(() => {
    setNavigation(START_WORKFLOW_NAME, manageActivity);
  }, [currentActivity]);

  function manageActivity() { ... }
 
  return (
    ...
  );
}
```

After that, let's make the function to manage the navigate. Inside the `manageActivity` function, our code is:

```javascript
function manageActivity() {
  const {
    props: { action },
  } = currentActivity;

  if (pagesWorkflow[action]) {
    navigation.navigate(ReferencesPages[action]);
  }
}
```

## Bugs?

- [x] Did you try latest release?
- [x] Did you look for existing matching issues?
