import React from 'react';
import {  View, Text, TextInput, Pressable, Alert, Linking } from 'react-native';
import AwesomeAlert from 'react-native-awesome-alerts';
import styles from './Styles';
import PackageInfo from './package.json';

/* Home screen */
const HomeScreen = ({ navigation }) => {
  
    const [token, onChangeToken] = React.useState('');
    const [showInvalidCodeAlert, setShowInvalidCodeAlert] = React.useState(false);
    const [showNewVersionAlert, setShowNewVersionAlert] = React.useState(false);
    const [newVersionMessage, setNewVersionMessage] = React.useState('');
    const [appUrl, setAppUrl] = React.useState('');

    /* Check new vesion */
    const checkNewVersion = () => {
        return fetch(global.api_url + 'api/getScoringApp?key=' + global.api_key)
        .then(response => response.json())
        .then(json => {
            if (json != null && json.result && PackageInfo.version != json.version)
            {
                showVersionAlert(json);
            }     
        })
        .catch(error => {
            console.error(error);
        });
    };    

    /* Authentication by code */
    const authenticate = (code) => {
        return fetch(global.api_url + 'match/ctrlwsbycode?key=' + global.api_key + '&code=' + code)
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
                //setNewVersionMessage("Available new version v1.9.0. Update?")
                setShowInvalidCodeAlert(true);
            }
        })
        .catch(error => {
            console.error(error);
        });
    };

    /* Show new version alert */
    const showVersionAlert = (data) => {
        setAppUrl(data.url);
        setNewVersionMessage("Available new version v" + data.version + ". Update?");
        setShowNewVersionAlert(true);
    }

    /* Get invalid token message */
    const getInvalidCodeMessage = () => {
        return "Inserted invalid code " + token;
    }

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
            <AwesomeAlert
                show={showInvalidCodeAlert}
                showProgress={false}
                title="Attention!"
                message={getInvalidCodeMessage()}
                contentStyle={{width:300}}
                titleStyle={styles.alertTitleStyle}
                messageStyle={styles.alertTextStyle}
                confirmButtonTextStyle={styles.alertTextStyle}
                closeOnTouchOutside={false}
                closeOnHardwareBackPress={false}
                showCancelButton={false}
                showConfirmButton={true}
                confirmText="OK"
                confirmButtonColor="#ff0000"
                onCancelPressed={() => {
                    setShowInvalidCodeAlert(false);
                }}
                onConfirmPressed={() => {
                    setShowInvalidCodeAlert(false);
                }}
            />
            <AwesomeAlert
                show={showNewVersionAlert}
                showProgress={false}
                title="Attention!"
                message={newVersionMessage}
                contentStyle={{width:400}}
                titleStyle={styles.alertTitleStyle}
                messageStyle={styles.alertTextStyle}
                confirmButtonTextStyle={styles.alertTextStyle}
                cancelButtonTextStyle={styles.alertTextStyle}
                closeOnTouchOutside={false}
                closeOnHardwareBackPress={false}
                showCancelButton={true}
                showConfirmButton={true}
                confirmText="OK"
                cancelButtonColor="#ff0000"
                confirmButtonColor="#1bc98e"
                onCancelPressed={() => {
                    setShowNewVersionAlert(false);
                }}
                onConfirmPressed={() => {
                    setShowNewVersionAlert(false);
                    Linking.openURL(appUrl);
                }}
            />            
        </View>
    );
};

export default HomeScreen;