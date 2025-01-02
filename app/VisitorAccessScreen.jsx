import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const VisitorAccessScreen = ({ route, navigation }) => {
  const { employeeCodeIdFromPreviousScreen } = route.params || {}; // Receive data from DeviceEnrollmentScreen

  const [visitHeaders, setVisitHeaders] = useState([
    {
      id: Date.now().toString(), // Ensure each item has a unique id for rendering purposes
      deviceId: '',
      visitDate: new Date(),
      entryTime: new Date(),
      exitTime: new Date(),
      comment: '',
      transactionDate: new Date().toISOString(),
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
          employeeCode: employeeCodeIdFromPreviousScreen || '', // Include employeeCode in visit details
        },
      ],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [showVisitDatePicker, setShowVisitDatePicker] = useState(false);
  const [showEntryTimePicker, setShowEntryTimePicker] = useState(false);
  const [showExitTimePicker, setShowExitTimePicker] = useState(false);

  // Auto-generate deviceId and check network status when component mounts
  useEffect(() => {
    const initializeDeviceId = async () => {
      try {
        let deviceId = await AsyncStorage.getItem('deviceId');
        if (!deviceId) {
          deviceId = `DEV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          await AsyncStorage.setItem('deviceId', deviceId);
        }
        const state = await NetInfo.fetch();
        setVisitHeaders((prevHeaders) =>
          prevHeaders.map((header) => ({
            ...header,
            deviceId,
            isSync: state.isConnected, // Set isSync based on network status
            dateSync: state.isConnected ? new Date().toISOString() : '', // Set dateSync if connected
          }))
        );
      } catch (error) {
        console.error('Error initializing device ID:', error);
      }
    };

    initializeDeviceId();
  }, []);

  const validateHeader = (header) => {
    const { employeeCode, deviceId, visitDate, entryTime } = header;
    console.log('Validating Header:', { employeeCode, deviceId, visitDate, entryTime });
    return employeeCode && deviceId && visitDate && entryTime;
  };

  const validateDetails = (details) => {
    return details.every(({ location, category, priority, shaft }) => {
      console.log('Validating Detail:', { location, category, priority, shaft });
      return location && category && priority && shaft;
    });
  };

  const handleSave = async () => {
    setLoading(true);

    for (const header of visitHeaders) {
      if (!validateHeader(header) || !validateDetails(header.visitDetails)) {
        Alert.alert(
          'Validation Error',
          'Please fill in all required fields in headers and details.'
        );
        setLoading(false);
        return;
      }

      try {
        // Ensure transactionDate is updated before sending data
        const updatedHeader = {
          ...header,
          transactionDate: new Date().toISOString(),
          visitDetails: header.visitDetails.map(detail => ({
            ...detail,
            transactionDate: new Date().toISOString(),
          })),
        };

        // Send visit header data without the id
        const { id, ...headerData } = updatedHeader;
        const headerResponse = await fetch('http://localhost:5295/api/VisitHeaders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(headerData),
        });

        if (!headerResponse.ok) throw new Error('Failed to save visit header.');

        // Send visit details data
        const detailsResponse = await fetch('http://localhost:5295/api/VisitDetails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedHeader.visitDetails),
        });

        if (!detailsResponse.ok) throw new Error('Failed to save visit details.');

        Alert.alert('Success', 'Data saved successfully!');
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    }

    setLoading(false);
  };

  const handleHeaderChange = (id, field, value) => {
    setVisitHeaders((prevHeaders) =>
      prevHeaders.map((header) =>
        header.id === id ? { ...header, [field]: value } : header
      )
    );
  };

  const handleDetailChange = (headerId, detailIndex, field, value) => {
    setVisitHeaders((prevHeaders) =>
      prevHeaders.map((header) =>
        header.id === headerId
          ? {
              ...header,
              visitDetails: header.visitDetails.map((detail, index) =>
                index === detailIndex ? { ...detail, [field]: value } : detail
              ),
            }
          : header
      )
    );
  };

  const onDateChange = (event, selectedDate, type, headerId) => {
    const currentDate = selectedDate || new Date();
    setShowVisitDatePicker(false);
    setShowEntryTimePicker(false);
    setShowExitTimePicker(false);

    if (type === 'visitDate') {
      handleHeaderChange(headerId, 'visitDate', currentDate);
    } else if (type === 'entryTime') {
      handleHeaderChange(headerId, 'entryTime', currentDate);
    } else if (type === 'exitTime') {
      handleHeaderChange(headerId, 'exitTime', currentDate);
    }
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('en-GB') : '';
  };

  const formatTime = (date) => {
    return date ? new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
  };

  const renderVisitDetails = (headerId, visitDetails) => (
    <View style={styles.detailsContainer}>
      {visitDetails.map((detail, index) => (
        <View key={index} style={styles.detailItem}>
          <TextInput
            style={styles.input}
            value={detail.location}
            onChangeText={(value) =>
              handleDetailChange(headerId, index, 'location', value)
            }
            placeholder="Location"
          />
          <TextInput
            style={styles.input}
            value={detail.category}
            onChangeText={(value) =>
              handleDetailChange(headerId, index, 'category', value)
            }
            placeholder="Category"
          />
          <TextInput
            style={styles.input}
            value={detail.priority}
            onChangeText={(value) =>
              handleDetailChange(headerId, index, 'priority', value)
            }
            placeholder="Priority"
          />
          <TextInput
            style={styles.input}
            value={detail.shaft}
            onChangeText={(value) =>
              handleDetailChange(headerId, index, 'shaft', value)
            }
            placeholder="Shaft"
          />
          <TextInput
            style={styles.input}
            value={detail.fullComment}
            onChangeText={(value) =>
              handleDetailChange(headerId, index, 'fullComment', value)
            }
            placeholder="Full Comment"
          />
          <TextInput
            style={styles.input}
            value={detail.imagePath}
            onChangeText={(value) =>
              handleDetailChange(headerId, index, 'imagePath', value)
            }
            placeholder="Image Path"
          />
        </View>
      ))}
    </View>
  );

  const renderVisitHeader = ({ item }) => (
    <View style={styles.headerContainer}>
      <TextInput
        style={styles.input}
        value={item.employeeCode}
        editable={false} // Pre-filled from previous screen
        placeholder="Employee Code"
      />
      <TextInput
        style={styles.input}
        value={item.deviceId}
        editable={false} // Auto-generated Device ID
        placeholder="Device ID"
      />
      <TouchableOpacity onPress={() => setShowVisitDatePicker(true)}>
        <TextInput
          style={styles.input}
          value={formatDate(item.visitDate)}
          placeholder="Select Visit Date"
          placeholderTextColor="#888"
          editable={false}
        />
      </TouchableOpacity>
      {showVisitDatePicker && (
        <DateTimePicker
          value={item.visitDate}
          mode="date"
          display="default"
          onChange={(event, date) => onDateChange(event, date, 'visitDate', item.id)}
        />
      )}
      <TouchableOpacity onPress={() => setShowEntryTimePicker(true)}>
        <TextInput
          style={styles.input}
          value={formatTime(item.entryTime)}
          placeholder="Select Entry Time"
          placeholderTextColor="#888"
          editable={false}
        />
      </TouchableOpacity>
      {showEntryTimePicker && (
        <DateTimePicker
          value={item.entryTime}
          mode="time"
          display="default"
          onChange={(event, date) => onDateChange(event, date, 'entryTime', item.id)}
        />
      )}
      <TouchableOpacity onPress={() => setShowExitTimePicker(true)}>
        <TextInput
          style={styles.input}
          value={formatTime(item.exitTime)}
          placeholder="Select Exit Time"
          placeholderTextColor="#888"
          editable={false}
        />
      </TouchableOpacity>
      {showExitTimePicker && (
        <DateTimePicker
          value={item.exitTime}
          mode="time"
          display="default"
          onChange={(event, date) => onDateChange(event, date, 'exitTime', item.id)}
        />
      )}
      <TextInput
        style={styles.input}
        value={item.comment}
        onChangeText={(value) => handleHeaderChange(item.id, 'comment', value)}
        placeholder="Comment"
      />
      {renderVisitDetails(item.id, item.visitDetails)}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Image source={require('../assets/images/newlogo.png')} style={styles.logo} />
        <Text style={styles.headerTitle}>UnderGround Visit Management</Text>
      </View>
      <Text style={styles.screenTitle}>Visit Details</Text>
      <ScrollView>
        <FlatList
          data={visitHeaders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderVisitHeader}
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.buttonText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'forestgreen', padding: 15 },
  logo: { width: 40, height: 50, marginRight: 10 },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: 'forestgreen',
  },
  input: { borderWidth: 1, borderColor: 'lightgreen', borderRadius: 5, padding: 10, marginBottom: 10 },
  saveButton: { backgroundColor: 'forestgreen', padding: 15, borderRadius: 5, alignItems: 'center', marginVertical: 20 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  headerContainer: { padding: 15, borderRadius: 8, backgroundColor: 'white', marginBottom: 15 },
  detailsContainer: { padding: 10, backgroundColor: '#f0fff0', borderRadius: 5 },
});

export default VisitorAccessScreen;