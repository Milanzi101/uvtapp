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

const Visit = ({ route, navigation }) => {
  const { employeeCodeIdFromPreviousScreen } = route.params || {}; // Receive data from DeviceEnrollmentScreen

  const [visitHeaders, setVisitHeaders] = useState([
    {
      id: Date.now().toString(), // Ensure each item has a unique id for rendering purposes
      employeeCode: employeeCodeIdFromPreviousScreen || '', // Pre-fill employeeCodeId
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
          employeeCode: employeeCodeIdFromPreviousScreen || '', // Include employeeCode in visit details
        },
      ],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [showVisitDatePicker, setShowVisitDatePicker] = useState({});
  const [showEntryTimePicker, setShowEntryTimePicker] = useState({});
  const [showExitTimePicker, setShowExitTimePicker] = useState({});

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

  const handleSave = async () => {
    setLoading(true);

    for (const header of visitHeaders) {
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

        // Format data to match the expected structure
        const headerData = {
          deviceId: updatedHeader.deviceId,
          visitDate: updatedHeader.visitDate.toISOString(),
          entryTime: updatedHeader.entryTime.toISOString(),
          exitTime: updatedHeader.exitTime.toISOString(),
          comment: updatedHeader.comment,
          transactionDate: updatedHeader.transactionDate,
          isSync: updatedHeader.isSync,
          dateSync: updatedHeader.dateSync,
          employeeCode: updatedHeader.employeeCode,
        };

        const headerResponse = await fetch('https://223e-41-77-146-22.ngrok-free.app/api/VisitHeader', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(headerData),
        });

        if (!headerResponse.ok) throw new Error('Failed to save visit header.');

        // Format visit details data to match the expected structure
        const detailsData = updatedHeader.visitDetails.map(detail => ({
          category: detail.category,
          priority: detail.priority,
          shaft: detail.shaft,
          location: detail.location,
          fullComment: detail.fullComment,
          imagePath: detail.imagePath,
          transactionDate: detail.transactionDate,
          employeeCode: detail.employeeCode,
        }));

        const detailsResponse = await fetch('https://223e-41-77-146-22.ngrok-free.app/api/VisitDetails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(detailsData),
        });

        if (!detailsResponse.ok) throw new Error('Failed to save visit details.');

        Alert.alert('Success', 'Data saved successfully!');
        navigation.replace('VisitorsScreen', { 
            employeeCodeIdFromPreviousScreen: employeeCode.trim() 
          });
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
    setShowVisitDatePicker((prev) => ({ ...prev, [headerId]: false }));
    setShowEntryTimePicker((prev) => ({ ...prev, [headerId]: false }));
    setShowExitTimePicker((prev) => ({ ...prev, [headerId]: false }));

    if (type === 'visitDate') {
      handleHeaderChange(headerId, 'visitDate', currentDate);
    } else if (type === 'entryTime') {
      handleHeaderChange(headerId, 'entryTime', currentDate);
    } else if (type === 'exitTime') {
      handleHeaderChange(headerId, 'exitTime', currentDate);
    }
  };

  const formatDate = (date) => {
    return date ? new Date(date).toISOString() : '';
  };

  const formatTime = (date) => {
    return date ? new Date(date).toISOString() : '';
  };

  const renderVisitDetails = (headerId, visitDetails) => (
    <View style={styles.detailsContainer}>
      {visitDetails.map((detail, index) => (
        <View key={index} style={styles.detailItem}>
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
            value={detail.location}
            onChangeText={(value) =>
              handleDetailChange(headerId, index, 'location', value)
            }
            placeholder="Location"
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
          <TextInput
            style={styles.input}
            value={formatDate(detail.transactionDate)}
            editable={false}
            placeholder="Transaction Date"
          />
          <TextInput
            style={styles.input}
            value={detail.employeeCode}
            onChangeText={(value) =>
              handleDetailChange(headerId, index, 'employeeCode', value)
            }
            placeholder="Employee Code"
          />
        </View>
      ))}
    </View>
  );

  const renderVisitHeader = ({ item }) => (
    <View style={styles.headerContainer}>
      <TextInput
        style={styles.input}
        value={item.category}
        onChangeText={(value) => handleHeaderChange(item.id, 'category', value)}
        placeholder="Category"
      />
      <TextInput
        style={styles.input}
        value={item.priority}
        onChangeText={(value) => handleHeaderChange(item.id, 'priority', value)}
        placeholder="Priority"
      />
      <TextInput
        style={styles.input}
        value={item.shaft}
        onChangeText={(value) => handleHeaderChange(item.id, 'shaft', value)}
        placeholder="Shaft"
      />
      <TextInput
        style={styles.input}
        value={item.location}
        onChangeText={(value) => handleHeaderChange(item.id, 'location', value)}
        placeholder="Location"
      />
      <TextInput
        style={styles.input}
        value={item.fullComment}
        onChangeText={(value) => handleHeaderChange(item.id, 'fullComment', value)}
        placeholder="Full Comment"
      />
      <TextInput
        style={styles.input}
        value={item.imagePath}
        onChangeText={(value) => handleHeaderChange(item.id, 'imagePath', value)}
        placeholder="Image Path"
      />
      <TextInput
        style={styles.input}
        value={formatDate(item.transactionDate)}
        editable={false}
        placeholder="Transaction Date"
      />
      <TextInput
        style={styles.input}
        value={item.employeeCode}
        onChangeText={(value) => handleHeaderChange(item.id, 'employeeCode', value)}
        placeholder="Employee Code"
      />
      <TextInput
        style={styles.input}
        value={item.deviceId}
        editable={false} // Auto-generated Device ID
        placeholder="Device ID"
      />
      <TouchableOpacity onPress={() => setShowVisitDatePicker((prev) => ({ ...prev, [item.id]: true }))}>
        <TextInput
          style={styles.input}
          value={formatDate(item.visitDate)}
          placeholder="Select Visit Date"
          placeholderTextColor="#888"
          editable={false}
        />
      </TouchableOpacity>
      {showVisitDatePicker[item.id] && (
        <DateTimePicker
          value={item.visitDate}
          mode="date"
          display="default"
          onChange={(event, date) => onDateChange(event, date, 'visitDate', item.id)}
        />
      )}
      <TouchableOpacity onPress={() => setShowEntryTimePicker((prev) => ({ ...prev, [item.id]: true }))}>
        <TextInput
          style={styles.input}
          value={formatTime(item.entryTime)}
          placeholder="Select Entry Time"
          placeholderTextColor="#888"
          editable={false}
        />
      </TouchableOpacity>
      {showEntryTimePicker[item.id] && (
        <DateTimePicker
          value={item.entryTime}
          mode="time"
          display="default"
          onChange={(event, date) => onDateChange(event, date, 'entryTime', item.id)}
        />
      )}
      <TouchableOpacity onPress={() => setShowExitTimePicker((prev) => ({ ...prev, [item.id]: true }))}>
        <TextInput
          style={styles.input}
          value={formatTime(item.exitTime)}
          placeholder="Select Exit Time"
          placeholderTextColor="#888"
          editable={false}
        />
      </TouchableOpacity>
      {showExitTimePicker[item.id] && (
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
        <Text style={styles.headerTitle}>Visitor Access Management</Text>
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

export default Visit;