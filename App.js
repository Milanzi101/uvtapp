import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import VisitorAccessScreen from './app/VisitorAccessScreen';
import DeviceEnrollmentScreen from './app/DeviceEnrollmentScreen';
import VisitorsScreen from './app/VisitorsScreen';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    const checkEnrollmentStatus = async () => {
      try {
        const enrollmentData = await AsyncStorage.getItem('deviceEnrollment');
        setIsEnrolled(!!enrollmentData);
      } catch (error) {
        console.error('Error checking enrollment status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkEnrollmentStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="forestgreen" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={isEnrolled ? "Visitors" : "DeviceEnrollment"}
        screenOptions={{ 
          headerShown: false,
          animationEnabled: true,
          gestureEnabled: false 
        }}
      >
        <Stack.Screen 
          name="DeviceEnrollment" 
          component={DeviceEnrollmentScreen} 
        />
        <Stack.Screen 
          name="VisitorAccess" 
          component={VisitorAccessScreen} 
        />
        <Stack.Screen 
          name="Visitors" 
          component={VisitorsScreen} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;