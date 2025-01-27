import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

type RootStackParamList = {
  VisitFormScreen: { employeeCodeIdFromPreviousScreen: string };
  VisitorsScreen: { employeeCodeIdFromPreviousScreen: string };
};

type VisitFormScreenRouteProp = RouteProp<RootStackParamList, 'VisitFormScreen'>;

interface VisitDetail {
  category: string;
  priority: string;
  shaft: string;
  location: string;
  fullComment: string;
  imagePath: string;
  transactionDate: string;
  employeeCode: string;
}

interface VisitHeader {
  id: string;
  employeeCode: string;
  deviceId: string;
  visitDate: Date;
  entryTime: Date;
  exitTime: Date;
  comment: string;
  isSync: boolean;
  dateSync: string;
  visitDetails: VisitDetail[];
}

const CATEGORIES = ['Maintenance', 'Inspection', 'Emergency', 'Regular Check'];
const PRIORITIES = ['Urgent', 'High', 'Low'];
const SHAFTS = ['SOB', 'Central Shaft', 'MSV', 'SYNC'];
const LOCATIONS = ['Nkana', 'Mufulira'];

const VisitFormScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<VisitFormScreenRouteProp>();
  const { employeeCodeIdFromPreviousScreen } = route.params || {};
  const [employeeCode] = useState<string>(employeeCodeIdFromPreviousScreen || '');

  const [visitHeaders, setVisitHeaders] = useState<VisitHeader[]>([
    {
      id: Date.now().toString(),
      employeeCode: employeeCodeIdFromPreviousScreen || '',
      deviceId: '',
      visitDate: new Date(),
      entryTime: new Date(),
      exitTime: new Date(),
      comment: '',
      isSync: false,
      dateSync: '',
      visitDetails: [
        {
          category: '',
          priority: '',
          shaft: '',
          location: '',
          fullComment: '',
          imagePath: '',
          transactionDate: new Date().toISOString(),
          employeeCode: employeeCodeIdFromPreviousScreen || '',
        },
      ],
    },
  ]);

  const [loading, setLoading] = useState<boolean>(false);
  const [showVisitDatePicker, setShowVisitDatePicker] = useState<{ [key: string]: boolean }>({});
  const [showEntryTimePicker, setShowEntryTimePicker] = useState<{ [key: string]: boolean }>({});
  const [showExitTimePicker, setShowExitTimePicker] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const generateDeviceId = () => {
      const deviceId = `DEV-${Math.floor(Math.random() * 1000000)}`;
      setVisitHeaders((prevHeaders) =>
        prevHeaders.map((header) => ({
          ...header,
          deviceId,
        }))
      );
    };

    generateDeviceId();
  }, []);

  const handleSave = async () => {
    if (!employeeCode) {
      Alert.alert('Error', 'Employee code does not exist');
      return;
    }

    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      for (const header of visitHeaders) {
        for (const detail of header.visitDetails) {
          const detailPayload = {
            category: detail.category,
            priority: detail.priority,
            shaft: detail.shaft,
            location: detail.location,
            fullComment: detail.fullComment,
            imagePath: detail.imagePath,
            transactionDate: new Date().toISOString(),
            employeeCode: detail.employeeCode || header.employeeCode,
          };

          const detailsResponse = await fetch('https://4497-41-175-27-174.ngrok-free.app/api/VisitDetails', {
            method: 'POST',
            headers: {
              accept: 'text/plain',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(detailPayload),
          });

          if (!detailsResponse.ok) {
            throw new Error('Failed to save visit detail');
          }
        }

        const headerResponse = await fetch('https://4497-41-175-27-174.ngrok-free.app/api/VisitHeader', {
          method: 'POST',
          headers: {
            accept: 'text/plain',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deviceId: header.deviceId,
            visitDate: header.visitDate.toISOString(),
            entryTime: header.entryTime.toISOString(),
            exitTime: header.exitTime.toISOString(),
            comment: header.comment,
            transactionDate: new Date().toISOString(),
            isSync: true,
            dateSync: new Date().toISOString(),
            employeeCode: header.employeeCode,
          }),
        });

        if (!headerResponse.ok) {
          throw new Error('Failed to save visit header');
        }
      }
      
      Alert.alert('Success', 'Data saved successfully!');
      navigation.navigate('VisitorsScreen', {
        employeeCodeIdFromPreviousScreen: employeeCode.trim(),
      });
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    // Add your form validation logic here
    return true;
  };

  const onDateChange = (event: any, date: Date | undefined, field: string, headerId: string) => {
    if (date) {
      setVisitHeaders((prevHeaders) =>
        prevHeaders.map((header) =>
          header.id === headerId ? { ...header, [field]: date } : header
        )
      );
      if (field === 'visitDate') setShowVisitDatePicker((prev) => ({ ...prev, [headerId]: false }));
      if (field === 'entryTime') setShowEntryTimePicker((prev) => ({ ...prev, [headerId]: false }));
      if (field === 'exitTime') setShowExitTimePicker((prev) => ({ ...prev, [headerId]: false }));
    }
  };

  const handleHeaderChange = (headerId: string, field: string, value: string) => {
    setVisitHeaders((prevHeaders) =>
      prevHeaders.map((header) =>
        header.id === headerId ? { ...header, [field]: value } : header
      )
    );
  };

  const renderVisitDetails = (headerId: string, visitDetails: VisitDetail[]) => {
    return visitDetails.map((detail, index) => (
      <View key={`${headerId}-${index}`} style={styles.detailContainer}>
        <Text style={styles.inputLabel}>Category</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={detail.category}
            onValueChange={(itemValue) => handleDetailChange(headerId, index, 'category', itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Category" value="" />
            {CATEGORIES.map((category) => (
              <Picker.Item key={category} label={category} value={category} />
            ))}
          </Picker>
        </View>

        <Text style={styles.inputLabel}>Priority</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={detail.priority}
            onValueChange={(itemValue) => handleDetailChange(headerId, index, 'priority', itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Priority" value="" />
            {PRIORITIES.map((priority) => (
              <Picker.Item key={priority} label={priority} value={priority} />
            ))}
          </Picker>
        </View>

        <Text style={styles.inputLabel}>Shaft</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={detail.shaft}
            onValueChange={(itemValue) => handleDetailChange(headerId, index, 'shaft', itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Shaft" value="" />
            {SHAFTS.map((shaft) => (
              <Picker.Item key={shaft} label={shaft} value={shaft} />
            ))}
          </Picker>
        </View>

        <Text style={styles.inputLabel}>Location</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={detail.location}
            onValueChange={(itemValue) => handleDetailChange(headerId, index, 'location', itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Location" value="" />
            {LOCATIONS.map((location) => (
              <Picker.Item key={location} label={location} value={location} />
            ))}
          </Picker>
        </View>

        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={detail.fullComment}
          onChangeText={(value) => handleDetailChange(headerId, index, 'fullComment', value)}
          placeholder="Full Comment"
          placeholderTextColor="#666"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.inputLabel}>Image Path</Text>
        <TextInput
          style={styles.input}
          value={detail.imagePath}
          onChangeText={(value) => handleDetailChange(headerId, index, 'imagePath', value)}
          placeholder="Image Path"
          placeholderTextColor="#666"
        />
      </View>
    ));
  };

  const handleDetailChange = (headerId: string, index: number, field: string, value: string) => {
    setVisitHeaders((prevHeaders) =>
      prevHeaders.map((header) =>
        header.id === headerId
          ? {
              ...header,
              visitDetails: header.visitDetails.map((detail, i) =>
                i === index ? { ...detail, [field]: value } : detail
              ),
            }
          : header
      )
    );
  };

  const renderVisitHeader = (header: VisitHeader) => {
    return (
      <View key={header.id} style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Visit Details</Text>
        
        <Text style={styles.inputLabel}>Employee Code</Text>
        <TextInput
          style={styles.input}
          value={header.employeeCode}
          onChangeText={(value) => handleHeaderChange(header.id, 'employeeCode', value)}
          placeholder="Employee Code"
          placeholderTextColor="#666"
        />
        
        <Text style={styles.inputLabel}>Device ID</Text>
        <TextInput
          style={styles.input}
          value={header.deviceId}
          placeholder="Device ID"
          placeholderTextColor="#666"
          editable={false}
        />
        
        <Text style={styles.inputLabel}>Visit Date</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowVisitDatePicker((prev) => ({ ...prev, [header.id]: true }))}
        >
          <Text style={styles.datePickerText}>
            {header.visitDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
        
        {showVisitDatePicker[header.id] && (
          <DateTimePicker
            value={new Date(header.visitDate)}
            mode="date"
            display="default"
            onChange={(event, date) => onDateChange(event, date, 'visitDate', header.id)}
          />
        )}
        
        <Text style={styles.inputLabel}>Entry Time</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowEntryTimePicker((prev) => ({ ...prev, [header.id]: true }))}
        >
          <Text style={styles.datePickerText}>
            {new Date(header.entryTime).toLocaleTimeString()}
          </Text>
        </TouchableOpacity>
        
        {showEntryTimePicker[header.id] && (
          <DateTimePicker
            value={new Date(header.entryTime)}
            mode="time"
            display="default"
            onChange={(event, date) => onDateChange(event, date, 'entryTime', header.id)}
          />
        )}
        
        <Text style={styles.inputLabel}>Exit Time</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowExitTimePicker((prev) => ({ ...prev, [header.id]: true }))}
        >
          <Text style={styles.datePickerText}>
            {new Date(header.exitTime).toLocaleTimeString()}
          </Text>
        </TouchableOpacity>
        
        {showExitTimePicker[header.id] && (
          <DateTimePicker
            value={new Date(header.exitTime)}
            mode="time"
            display="default"
            onChange={(event, date) => onDateChange(event, date, 'exitTime', header.id)}
          />
        )}
        
        <Text style={styles.inputLabel}>Comment</Text>
        <TextInput
          style={styles.input}
          value={header.comment}
          onChangeText={(value) => handleHeaderChange(header.id, 'comment', value)}
          placeholder="Comment"
          placeholderTextColor="#666"
        />

        {renderVisitDetails(header.id, header.visitDetails)}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('VisitorsScreen', { employeeCodeIdFromPreviousScreen: employeeCode.trim() })}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Image source={require('../assets/images/newlogo.png')} style={styles.logo} />
        <Text style={styles.headerTitle}>Underground Visit Management</Text>
      </View>
      <KeyboardAvoidingView style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          {visitHeaders.map((header) => renderVisitHeader(header))}
          <Animated.View style={[styles.submitButton]}>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Save</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 80,
    backgroundColor: 'forestgreen',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'forestgreen',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'lightgreen',
    borderRadius: 5,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: 'white',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    padding: 12,
    backgroundColor: '#c8e6c9', // Soft green
    borderRadius: 8,
    marginBottom: 15,
  },
  datePickerText: {
    fontSize: 16,
    color: 'black',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: 'lightgreen',
    borderRadius: 5,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  detailContainer: {
    padding: 15,
    backgroundColor: '#f0fff0',
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  submitButton: {
    backgroundColor: 'forestgreen',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    elevation: 2,
  },
  submitButtonDisabled: {
    backgroundColor: 'gray',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'forestgreen',
    padding: 15,
    borderRadius: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default VisitFormScreen;