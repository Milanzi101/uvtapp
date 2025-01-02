import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import VisitorAccessScreen from './VisitorAccessScreen';
import DeviceEnrollmentScreen from './DeviceEnrollmentScreen';

const Stack = createStackNavigator();

const Layout = ({ isEnrolled }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isEnrolled ? "VisitorAccessScreen" : "DeviceEnrollmentScreen"}>
        <Stack.Screen
          name="DeviceEnrollmentScreen"
          component={DeviceEnrollmentScreen}
          options={{ headerShown: false }} // Hide the header for DeviceEnrollmentScreen
        />
        <Stack.Screen
          name="VisitorAccessScreen"
          component={VisitorAccessScreen}
          options={{ title: 'Visit Request', headerTitleAlign: 'center', headerShown: false }} // Center the title for VisitorAccessScreen
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Layout;