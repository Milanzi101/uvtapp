import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import DeviceEnrollmentScreen from './DeviceEnrollmentScreen';
import VisitorsScreen from './VisitorsScreen';
import VisitFormScreen from './VisitFormScreen';

const Stack = createStackNavigator();

const Layout = ({ isEnrolled }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="forestgreen" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={isEnrolled ? "VisitorsScreen" : "DeviceEnrollmentScreen"}
        screenOptions={{
          headerShown: false,
          gestureEnabled: false
        }}
      >
        <Stack.Screen name="DeviceEnrollmentScreen" component={DeviceEnrollmentScreen} />
        <Stack.Screen name="VisitorsScreen" component={VisitorsScreen} />
        <Stack.Screen name="VisitFormScreen">
          {props => <VisitFormScreen {...props} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Layout;