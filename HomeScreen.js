import React from 'react';
import {  View, Text, TextInput, Pressable, Alert } from 'react-native';
import styles from './Styles';

/* Home screen */
const HomeScreen = ({ navigation }) => {
  
    const [token, onChangeToken] = React.useState('');

    /* Authentication by code */
    const authenticate = (code) => {
        return fetch('https://www.handlesport.com/match/ctrlwsbycode?key=' + global.api_key + '&code=' + code)
        .then(response => response.json())
        .then(json => {
            if (json != null)
            {
            navigation.navigate('Main', {
                id_event : parseInt(json.id_event),
                id_ring : parseInt(json.ring),
                id_referee : parseInt(json.referee),
                specialty: json.specialty
            });
            }
            else
            {
            Alert.alert("Invalid code " + code);
            }
        })
        .catch(error => {
            console.error(error);
        });
    };

    return (
        <View style={[styles.container, { alignItems: 'center'}]}>
        <Text style={[styles.titleText, {fontSize: 30}]}>Welcome to HandleSport Scoring System</Text>
        <TextInput
            style={styles.input}
            onChangeText={onChangeToken}
            value={token}
            placeholder="Insert token"
            placeholderTextColor="#fff"
        />
        <Pressable
            style={[styles.proceedButton]}
            onPress={() => authenticate(token.toUpperCase())}>
            <Text style={[styles.textStyle, { fontSize: 30}]}>PROCEED</Text>
        </Pressable>
        </View>
    );
};

export default HomeScreen;