import { StatusBar } from 'expo-status-bar';
import { Button, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { useEffect, useState } from "react";
import { GlobalStyles } from './constants/styles';

export default function App() {
  const db = SQLite.openDatabase('example.db');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [names, setNames] = useState([]);
  const [currentName, setCurrentName] = useState(undefined);

  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql('CREATE TABLE IF NOT EXISTS names (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)');
    });

    db.transaction(tx => {
      tx.executeSql('SELECT * FROM names', null,
       (txObj, resultSet) => setNames(resultSet.rows._array),
       (txObj, error) => console.log(error)
      );
    });

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading names...</Text>
      </View>
    );
  }

  const addName = () => {
    db.transaction(tx => {
      tx.executeSql('INSERT INTO names (name) VALUES (?)', [currentName],
        (txObj, resultSet) => {
          let existingNames = [...names];
          existingNames.push({ id: resultSet.insertId, name: currentName });
          setNames(existingNames);
          setCurrentName(undefined);
        },
        (txObj, error) => console.log(error)
      );
    });
  }

  const deleteName = (id) => {
    db.transaction(tx => {
      tx.executeSql('DELETE FROM names WHERE id = ?', [id],
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            let existingNames = [...names].filter(name => name.id !== id);
            setNames(existingNames);
          }
        },
        (txObj, error) => console.log(error)
      );
    });
  }

  const updateName = (id) => {
    db.transaction(tx => {
      tx.executeSql('UPDATE names SET name = ? WHERE id = ?', [currentName, id],
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            let existingNames = [...names];
            const indexToUpdate = existingNames.findIndex(name => name.id === id);
            existingNames[indexToUpdate].name = currentName;
            setNames(existingNames);
            setCurrentName(undefined);
          }
        },
        (txObj, error) => console.log(error)
      );
    });
  }

  const showNames = () => {
    return names.map((name, index) => {
      return (
        <View key={index} style={styles.row}>
          <Text style={styles.listText}>{name.name}</Text>
          <Pressable 
            onPress={() => deleteName(name.id)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <View style={[styles.button, styles.deleteButton]}>
              <Text style={styles.buttonText}>DELETE</Text>
            </View>
          </Pressable>
          <Pressable 
            onPress={() => {
              setIsUpdating(!isUpdating);
              updateName(name.id);
            }}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <View style={styles.button}>
              <Text style={styles.buttonText}>UPDATE</Text>
            </View>
          </Pressable>
        </View>
      );
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Names Database</Text>
      <TextInput 
        style={styles.textInput}
        value={currentName} 
        placeholder="name" 
        onChangeText={setCurrentName} 
      />
      <View style={styles.buttonContainer}>
        {isUpdating && (
          <Text style={styles.updatingText}>Updating</Text>
        )}
        {!isUpdating && (
          <Pressable 
            onPress={addName}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <View style={[styles.button, styles.addButton]}>
              <Text style={styles.buttonText}>ADD NAME</Text>
            </View>
          </Pressable>
        )}
      </View>
      {showNames()}
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.primary700,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10
  },
  title: {
    fontSize: 30,
    color: GlobalStyles.colors.primary100,
    fontWeight: 'bold'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    margin: 8
  },
  listText: {
    flex: 1,
    color: GlobalStyles.colors.primary100,
    fontSize: 24
  },
  textInput: {
    backgroundColor: GlobalStyles.colors.primary100,
    color: GlobalStyles.colors.primary800,
    marginHorizontal: 10,
    marginVertical: 16,
    fontSize: 20,
    padding: 10,
    minWidth: 300
  },
  updatingText: {
    color: GlobalStyles.colors.primary100,
    fontSize: 21,
    marginVertical: 10
  },
  button: {
    backgroundColor: GlobalStyles.colors.primary400,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 5,
  },
  addButton: {
    marginVertical: 5,
    width: '50%'
  },
  deleteButton: {
    backgroundColor: GlobalStyles.colors.error500
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18
  },
  buttonContainer: {
    borderBottomColor: GlobalStyles.colors.accent500,
    borderBottomWidth: 2,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 70
  },
  pressed: {
    opacity: 0.5
  },
  namesList: {
    flex: 4
  }
});
