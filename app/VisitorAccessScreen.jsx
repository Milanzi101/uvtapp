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
      employeeCode: employeeCodeIdFromPreviousScreen || '',
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
         navigation.replace('VisitorsScreen', { 
        employeeCodeIdFromPreviousScreen: employeeCode.trim() 
      });
        return;
      }  
    const validateFields = () => {
    const newErrors = {};
    visitHeaders.forEach((header, index) => {
      if (!header.deviceId) newErrors[`deviceId_${index}`] = 'Device ID is required';
      header.visitDetails.forEach((detail, detailIndex) => {
        if (!detail.category) newErrors[`category_${index}_${detailIndex}`] = 'Category is required';
        if (!detail.priority) newErrors[`priority_${index}_${detailIndex}`] = 'Priority is required';
        if (!detail.shaft) newErrors[`shaft_${index}_${detailIndex}`] = 'Shaft is required';
        if (!detail.location) newErrors[`location_${index}_${detailIndex}`] = 'Location is required';
      });
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
    try {
      const storedVisits = await AsyncStorage.getItem('visitHistory');
      const visits = storedVisits ? JSON.parse(storedVisits) : [];

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

          const detailsResponse = await fetch('https://223e-41-77-146-22.ngrok-free.app/api/VisitDetails', {
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

        const headerPayload = {
          deviceId: header.deviceId,
          visitDate: header.visitDate.toISOString(),
          entryTime: header.entryTime.toISOString(),
          exitTime: header.exitTime.toISOString(),
          comment: header.comment,
          transactionDate: new Date().toISOString(),
          isSync: true,
          dateSync: new Date().toISOString(),
          employeeCode: header.employeeCode,
        };

        const headerResponse = await fetch('https://223e-41-77-146-22.ngrok-free.app/api/VisitHeader', {
          method: 'POST',
          headers: {
            accept: 'text/plain',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(headerPayload),
        });

        if (!headerResponse.ok) {
          throw new Error('Failed to save visit header');
        }

        visits.push(headerPayload);
      }
 const handleHeaderChange = (id, field, value) => {
    setVisitHeaders((prevHeaders) =>
      prevHeaders.map((header) => (header.id === id ? { ...header, [field]: value } : header))
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
          <Text style={styles.inputLabel}>Category</Text>
          <TextInput
            style={[styles.input, errors[`category_${headerId}_${index}`] && styles.errorInput]}
            value={detail.category}
            onChangeText={(value) => handleDetailChange(headerId, index, 'category', value)}
            placeholder="Enter Category"
          />
          {errors[`category_${headerId}_${index}`] && <Text style={styles.errorText}>{errors[`category_${headerId}_${index}`]}</Text>}
          
          <Text style={styles.inputLabel}>Priority</Text>
          <View style={[styles.pickerContainer, errors[`priority_${headerId}_${index}`] && styles.errorInput]}>
            <Picker
              style={styles.picker}
              selectedValue={detail.priority}
              onValueChange={(value) => handleDetailChange(headerId, index, 'priority', value)}
            >
              <Picker.Item label="Select Priority" value="" />
              {PRIORITIES.map((priority) => (
                <Picker.Item key={priority} label={priority} value={priority} />
              ))}
            </Picker>
          </View>
          {errors[`priority_${headerId}_${index}`] && <Text style={styles.errorText}>{errors[`priority_${headerId}_${index}`]}</Text>}

          <Text style={styles.inputLabel}>Shaft</Text>
          <View style={[styles.pickerContainer, errors[`shaft_${headerId}_${index}`] && styles.errorInput]}>
            <Picker
              style={styles.picker}
              selectedValue={detail.shaft}
              onValueChange={(value) => handleDetailChange(headerId, index, 'shaft', value)}
            >
              <Picker.Item label="Select Shaft" value="" />
              {SHAFTS.map((shaft) => (
                <Picker.Item key={shaft} label={shaft} value={shaft} />
              ))}
            </Picker>
          </View>
          {errors[`shaft_${headerId}_${index}`] && <Text style={styles.errorText}>{errors[`shaft_${headerId}_${index}`]}</Text>}

          <Text style={styles.inputLabel}>Location</Text>
          <View style={[styles.pickerContainer, errors[`location_${headerId}_${index}`] && styles.errorInput]}>
            <Picker
              style={styles.picker}
              selectedValue={detail.location}
              onValueChange={(value) => handleDetailChange(headerId, index, 'location', value)}
            >
              <Picker.Item label="Select Location" value="" />
              {LOCATIONS.map((location) => (
                <Picker.Item key={location} label={location} value={location} />
              ))}
            </Picker>
          </View>
          {errors[`location_${headerId}_${index}`] && <Text style={styles.errorText}>{errors[`location_${headerId}_${index}`]}</Text>}

          <Text style={styles.inputLabel}>Full Comment</Text>
          <TextInput
            style={styles.input}
            value={detail.fullComment}
            onChangeText={(value) => handleDetailChange(headerId, index, 'fullComment', value)}
            placeholder="Enter Full Comment"
            multiline
            numberOfLines={3}
          />

          <Text style={styles.inputLabel}>Image Path</Text>
          <TextInput
            style={styles.input}
            value={detail.imagePath}
            onChangeText={(value) => handleDetailChange(headerId, index, 'imagePath', value)}
            placeholder="Enter Image Path"
          />
        </View>
      ))}
    </View>
  );

  const renderVisitHeader = ({ item }) => (
    <View style={styles.detailsContainer}>
      <Text style={styles.inputLabel}>Employee Code</Text>
      <TextInput
        style={[styles.input, errors[`employeeCode_${item.id}`] && styles.errorInput]}
        value={item.employeeCode}
        onChangeText={(value) => handleHeaderChange(item.id, 'employeeCode', value)}
        placeholder="Employee Code"
        editable={false}
      />
      {errors[`employeeCode_${item.id}`] && <Text style={styles.errorText}>{errors[`employeeCode_${item.id}`]}</Text>}

      <Text style={styles.inputLabel}>Device ID</Text>
      <TextInput
        style={[styles.input, errors[`deviceId_${item.id}`] && styles.errorInput]}
        value={item.deviceId}
        editable={false}
        placeholder="Device ID"
      />
      {errors[`deviceId_${item.id}`] && <Text style={styles.errorText}>{errors[`deviceId_${item.id}`]}</Text>}

      <Text style={styles.inputLabel}>Visit Date</Text>
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

      <Text style={styles.inputLabel}>Entry Time</Text>
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

      <Text style={styles.inputLabel}>Exit Time</Text>
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

      <Text style={styles.inputLabel}>Comment</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={item.comment}
        onChangeText={(value) => handleHeaderChange(item.id, 'comment', value)}
        placeholder="Enter Comment"
        multiline
        numberOfLines={3}
      />
      {renderVisitDetails(item.id, item.visitDetails)}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Image source={require('../assets/images/newlogo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.headerTitle}>Underground Visitor Management</Text>
      </View>
      <Text style={styles.screenTitle}>Visit Details</Text>
      <ScrollView>
        <FlatList
          data={visitHeaders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderVisitHeader}
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.buttonText}>Submit</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
 container: { flex: 1, backgroundColor: '#f9f9f9', padding: 20 },
  headerBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'forestgreen', padding: 15, borderRadius: 10 },
  logo: { width: 40, height: 50, marginRight: 10 },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  screenTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: 'forestgreen' },
  input: { borderWidth: 1, borderColor: 'lightgreen', borderRadius: 5, padding: 10, marginBottom: 10, backgroundColor: '#fff' },
  pickerContainer: { borderWidth: 1, borderColor: 'lightgreen', borderRadius: 5, marginBottom: 16, backgroundColor: '#fff' },
  picker: { height: 50 },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveButton: { backgroundColor: 'forestgreen', padding: 15, borderRadius: 5, alignItems: 'center', marginVertical: 20 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  headerContainer: { padding: 15, borderRadius: 8, backgroundColor: '#fff', marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  detailsContainer: { padding: 16, backgroundColor: '#f0fff0', borderRadius: 8, marginTop: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 8 },
  detailItem: { marginBottom: 24 },
  errorInput: { borderColor: 'red', backgroundColor: '#fff0f0' },
  errorText: { color: 'red', fontSize: 12, marginBottom: 12, marginLeft: 4 }, 
});

export default VisitorAccessScreen;
