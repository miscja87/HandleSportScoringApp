import React from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen';
import MainScreen from './MainScreen';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

/* Lock screen orientation lanscape */
async function changeScreenOrientation() {
  await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
}

/* Global var */
global.api_key = 'ad258edb273786ddff4a12fcb274eca4';
global.api_url = 'https://www.handlesport.com/';

/* Create navigation stack */
const Stack = createNativeStackNavigator();

function App() {

  /* On screen load */
  const onScreenLoad = () => {
    changeScreenOrientation();
  }

  React.useEffect(() => {
    onScreenLoad();
  }, [])  

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Main" component={MainScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;