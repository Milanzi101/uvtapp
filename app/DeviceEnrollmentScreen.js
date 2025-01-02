import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from "@react-native-community/netinfo";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const DeviceEnrollmentScreen = () => {
  const navigation = useNavigation(); // Hook for navigation
  const [employeeCode, setEmployeeCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [designation, setDesignation] = useState('');
  const [dateEnrolled, setDateEnrolled] = useState(new Date());
  const [lastSync, setLastSync] = useState(new Date());
  const [showDateEnrolledPicker, setShowDateEnrolledPicker] = useState(false);
  const [showLastSyncPicker, setShowLastSyncPicker] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const checkExistingEnrollment = async () => {
      try {
        const enrollmentData = await AsyncStorage.getItem('deviceEnrollment');
        if (enrollmentData) {
          // If enrollment exists, navigate to Visitors Access Screen
          navigation.replace('VisitorAccessScreen');
        }
      } catch (error) {
        console.error('Error checking enrollment:', error);
      }
    };

    checkExistingEnrollment();

    // Network status check
    const checkNetworkStatus = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => {
      checkNetworkStatus();
    };
  }, [navigation]);

  // Format date to readable string
  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('en-GB') : '';
  };

  const validateFields = () => {
    const newErrors = {};
    if (!employeeCode.trim()) newErrors.employeeCode = 'Employee Code is required.';
    if (!firstName.trim()) newErrors.firstName = 'First Name is required.';
    if (!lastName.trim()) newErrors.lastName = 'Last Name is required.';
    if (!designation.trim()) newErrors.designation = 'Designation is required.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEnrollDevice = async () => {
    Keyboard.dismiss();

    if (!validateFields()) {
      return;
    }

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert('No Internet Connection', 'Please check your internet connection and try again.');
      return;
    }

    const enrollment = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      employeeCode: employeeCode.trim(),
      designation: designation.trim(),
      dateEnrolled: dateEnrolled.toISOString(),
      status: state.isConnected,
      lastSync: lastSync.toISOString()
    };

    setIsLoading(true);

    try {
      const response = await axios.post('https://67db-41-175-27-174.ngrok-free.app/api/DeviceUserEnrollment', 
        enrollment, 
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.status === 200) {
        // Save enrollment data to AsyncStorage
        await AsyncStorage.setItem('deviceEnrollment', JSON.stringify(enrollment));
      } else {
        throw new Error(`Server responded with status ${response.status}`);
      }
    } catch (error) {
      console.error('Enrollment error:', error);
    } finally {
      setIsLoading(false);
      // Navigate to Visitors Access Screen regardless of the result
      navigation.replace('VisitorAccessScreen');
    }
  };

  // Optional: Method to clear enrollment (for testing or logout)
  const clearEnrollment = async () => {
    try {
      await AsyncStorage.removeItem('deviceEnrollment');
      Alert.alert('Success', 'Enrollment data cleared.');
    } catch (error) {
      console.error('Error clearing enrollment:', error);
    }
  };

  const onDateChange = (event, selectedDate, type) => {
    const currentDate = selectedDate || new Date();
    if (type === 'dateEnrolled') {
      setShowDateEnrolledPicker(false);
      setDateEnrolled(currentDate);
    } else {
      setShowLastSyncPicker(false);
      setLastSync(currentDate);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Image
          source={require('../assets/images/newlogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>UnderGround Visit Management</Text>
      </View>

      <Text style={styles.screenTitle}>Device Enrollment</Text>

      <View style={styles.formContainer}>
        <TextInput
          style={[styles.input, errors.employeeCode && styles.errorInput]}
          value={employeeCode}
          onChangeText={(text) => {
            setEmployeeCode(text);
            setErrors(prev => ({ ...prev, employeeCode: undefined }));
          }}
          placeholder="Employee Code"
          placeholderTextColor="#888"
        />
        {errors.employeeCode && <Text style={styles.errorText}>{errors.employeeCode}</Text>}

        <TextInput
          style={[styles.input, errors.firstName && styles.errorInput]}
          value={firstName}
          onChangeText={(text) => {
            setFirstName(text);
            setErrors(prev => ({ ...prev, firstName: undefined }));
          }}
          placeholder="First Name"
          placeholderTextColor="#888"
        />
        {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

        <TextInput
          style={[styles.input, errors.lastName && styles.errorInput]}
          value={lastName}
          onChangeText={(text) => {
            setLastName(text);
            setErrors(prev => ({ ...prev, lastName: undefined }));
          }}
          placeholder="Last Name"
          placeholderTextColor="#888"
        />
        {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

        <TextInput
          style={[styles.input, errors.designation && styles.errorInput]}
          value={designation}
          onChangeText={(text) => {
            setDesignation(text);
            setErrors(prev => ({ ...prev, designation: undefined }));
          }}
          placeholder="Designation"
          placeholderTextColor="#888"
        />
        {errors.designation && <Text style={styles.errorText}>{errors.designation}</Text>}
      </View>

      <View style={styles.formContainer}>
        <TouchableOpacity onPress={() => setShowDateEnrolledPicker(true)}>
          <TextInput
            style={[styles.input, errors.dateEnrolled && styles.errorInput]}
            value={formatDate(dateEnrolled)}
            placeholder="Select Date Enrolled"
            placeholderTextColor="#888"
            editable={false}
          />
        </TouchableOpacity>
        {errors.dateEnrolled && <Text style={styles.errorText}>{errors.dateEnrolled}</Text>}

        {showDateEnrolledPicker && (
          <DateTimePicker
            value={dateEnrolled}
            mode="date"
            display="default"
            onChange={(event, date) => onDateChange(event, date, 'dateEnrolled')}
          />
        )}

        <TouchableOpacity onPress={() => setShowLastSyncPicker(true)}>
          <TextInput
            style={styles.input}
            value={formatDate(lastSync)}
            placeholder="Select Last Sync"
            placeholderTextColor="#888"
            editable={false}
          />
        </TouchableOpacity>

        {showLastSyncPicker && (
          <DateTimePicker
            value={lastSync}
            mode="date"
            display="default"
            onChange={(event, date) => onDateChange(event, date, 'lastSync')}
          />
        )}

        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status:</Text>
          <View
            style={[
              styles.statusButton,
              { backgroundColor: isConnected ? 'green' : 'orange' },
            ]}
          >
            <Text style={styles.statusText}>{isConnected ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.enrollButton}
          onPress={handleEnrollDevice}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Enroll Device</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.enrollButton, { backgroundColor: 'orange', marginTop: 10 }]}
          onPress={clearEnrollment}
        >
          <Text style={styles.buttonText}>Clear Enrollment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  errorInput: {
    borderColor: 'red',
    backgroundColor: '#fff0f0', 
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 5,
    marginLeft: 5,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'forestgreen',
    padding: 15,
    marginBottom: 20,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: 'forestgreen',
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: 'lightgreen',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f9fff9',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    fontWeight: 'bold',
  },
  statusButton: {
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  enrollButton: {
    backgroundColor: 'forestgreen',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DeviceEnrollmentScreen;