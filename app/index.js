import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import DeviceEnrollmentScreen from './DeviceEnrollmentScreen';
import VisitorAccessScreen from './VisitorAccessScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SplashScreen">
        <Stack.Screen
          name="DeviceEnrollmentScreen"
          component={DeviceEnrollmentScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VisitorAccessScreen"
          component={VisitorAccessScreen}
          options={{ title: 'Visit Request', headerTitleAlign: 'center', headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;