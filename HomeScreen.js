import React from 'react';
import {  View, Text, TextInput, Pressable, Alert, Linking } from 'react-native';
import styles from './Styles';
import PackageInfo from './package.json';

/* Home screen */
const HomeScreen = ({ navigation }) => {
  
    const [token, onChangeToken] = React.useState('');

    /* Check new vesion */
    const checkNewVersion = () => {
        return fetch('https://www.handlesport.com/api/getScoringApp?key=' + global.api_key)
        .then(response => response.json())
        .then(json => {
            if (json != null && json.result && PackageInfo.version != json.version)
            {
                Alert.alert(
                    "New version available",
                    "Available new version v" + json.version + ". Update?",
                    [
                      {
                        text: "No",
                        style: "cancel"
                      },
                      {
                        text: "OK",
                        onPress: () => Linking.openURL(json.url)
                      }
                    ]
                  );
            }     
        })
        .catch(error => {
            console.error(error);
        });
    };    

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

    /* On screen load */
    const onScreenLoad = () => {
        checkNewVersion();
    }

    React.useEffect(() => {
        onScreenLoad();
    }, [])    

    return (
        <View style={[styles.container, { alignItems: 'center'}]}>
        <Text style={[styles.titleText, {fontSize: 30}]}>HandleSport Scoring v{PackageInfo.version}</Text>
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