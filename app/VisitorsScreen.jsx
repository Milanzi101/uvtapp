import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VisitorsScreen = ({ route }) => {
  const navigation = useNavigation();
  const { employeeCodeIdFromPreviousScreen, userName } = route.params || {};
  const [visitHistory, setVisitHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisits();
    navigation.setOptions({
      headerRight: () => (
        <Text style={styles.headerRight}>{userName}</Text>
      ),
    });
  }, []);

  const fetchVisits = async () => {
    try {
      const storedVisits = await AsyncStorage.getItem('visitHistory');
      const visits = storedVisits ? JSON.parse(storedVisits) : [];
      const formattedVisits = visits.map((visit) => ({
        id: visit.id,
        visitDate: new Date(visit.visitDate).toLocaleDateString('en-GB'),
        details: `Visit to ${visit.visitDetails[0].location}, ${visit.visitDetails[0].shaft}, ${visit.visitDetails[0].priority}`,
      }));
      setVisitHistory(formattedVisits);
    } catch (error) {
      console.error('Failed to fetch visit history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="forestgreen" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Image source={require('../assets/images/newlogo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.headerTitle}>Visit History</Text>
      </View>
      <FlatList
        data={visitHistory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.visitCard}>
            <Text style={styles.visitText}>Date: {item.visitDate}</Text>
            <Text style={styles.visitText}>Details: {item.details}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No visit history available.</Text>}
      />
      <TouchableOpacity style={styles.requestButton} onPress={() => navigation.navigate('VisitorAccess', { employeeCodeIdFromPreviousScreen })}>
        <Text style={styles.buttonText}>Request Another Visit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  headerBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'forestgreen', padding: 16, borderRadius: 10, marginBottom: 16, elevation: 3 },
  logo: { width: 40, height: 50, marginRight: 12 },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  visitCard: { backgroundColor: 'white', borderRadius: 8, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.22, shadowRadius: 2.22 },
  visitText: { fontSize: 16, marginBottom: 5 },
  emptyText: { textAlign: 'center', color: '#666', fontSize: 16, marginTop: 24 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRight: { color: 'white', fontSize: 16, marginRight: 16 },
  requestButton: { backgroundColor: 'forestgreen', padding: 15, borderRadius: 8, alignItems: 'center', margin: 16, elevation: 2 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default VisitorsScreen;
