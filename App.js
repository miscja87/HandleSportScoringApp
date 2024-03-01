import React, { useState, Component, useEffect, TouchableHighlight } from 'react';
import { StatusBar } from 'expo-status-bar';
import { setupWebSocket, sendMessage, closeWebSocket } from './WebSocket';
import { StyleSheet, TextInput, ToastAndroid, Button, Alert, Text, View, Pressable, Vibration } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

/* Lock screen orientation lanscape */
async function changeScreenOrientation() {
  await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
}

/* Global var */
global.api_key = 'ad258edb273786ddff4a12fcb274eca4';

/* Home screen */
function HomeScreen({ navigation }) {
  
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
}

/* Main screen */
function MainScreen({ route, navigation }) {
  
  /* Params */
  const { id_event, id_ring, id_referee, specialty } = route.params;
  const [idEvent, setIdEvent] = React.useState(JSON.stringify(id_event));
  const [idRing, setIdRing] = React.useState(JSON.stringify(id_ring));
  const [idReferee, setIdReferee] = React.useState(JSON.stringify(id_referee));
  const [specialtyCode, setSpecialtyCode] = React.useState(specialty);

  /* Web socket */
  global.WS;

  /* Global vars */  
  global.backupRedScore;
  global.backupBlueScore;

  /* match properties */
  const [blueScore, setBlueScore] = React.useState(0);
  const [redScore, setRedScore] = React.useState(0);
  const [matchStatus, setMatchStatus] = React.useState('STOP');
  const [oneButtonMode, setOneButtonMode] = React.useState(false);
  const [blueOnLeftMode, setBlueOnLeftMode] = React.useState(true);

  /* ring, referee properties */
  const [ringLabel, setRingLabel] = React.useState('1');
  const [refereeLabel, setRefereeLabel] = React.useState('1');

  /* Request score */
  function requestScore()
  {
      $msg = { key: global.api_key, action : 'request_score', id_event : idEvent, id_ring: idRing, referee : idReferee };
      
      /* Send message */
      sendMessage(WS, $msg);
  }

  /* Received message */
  function checkMessage(msg)
  {
    /* Check if reset or response */
    var actions = ['reset_score', 'response_score'];
    if (actions.includes(msg['action']) && msg['id_event'] == idEvent && msg['id_ring'] == idRing && msg['referee'] == idReferee)
    {
        setRedScore(msg['red']);
        setBlueScore(msg['blue']);
        changeMatchStatus(msg['state']);
        //ToastAndroid.show('Synchronized', ToastAndroid.SHORT);
        Alert.alert("sync");
    }

    /* Check if state update */
    if (msg['action'] == 'update_state' && msg['id_event'] == idEvent && msg['id_ring'] == idRing)
    {
        changeMatchStatus(msg['state']);
    }    
  }

  /* Change match status */
  function changeMatchStatus($status)
  {
      setMatchStatus($status.toUpperCase());
  }

  /* Check match status stop */
  function isMatchStatusStopped()
  {
    return matchStatus == 'STOP';
  }

  /* Check match status play */
  function isMatchStatusPlay()
  {
    return matchStatus == 'PLAY';
  }  

  /* Send score */
  function sendScore(newRedScore, newBlueScore)
  {   
      $msg = { key: global.api_key, action : 'score', id_event : idEvent, id_ring: idRing, referee : idReferee, red : newRedScore, blue : newBlueScore };
      
      /* Send score */
      sendMessage(WS, $msg);

      /* Set scores */
      setRedScore(newRedScore);
      setBlueScore(newBlueScore);

      /* Vibration */
      Vibration.vibrate(100);
  }  

  /* update red score */
  const updateRedScore = (point) => {    

    if (isMatchStatusPlay())
    {
      /* Set backup score */
      global.backupRedScore = redScore;

      /* Set new score */
      newScore = Math.round((parseFloat(redScore) + parseFloat(point)) * 10) / 10;
      newScore = parseFloat(newScore) >= 0 ? newScore : '0';
      sendScore(newScore, blueScore);
    }
  };

  /* update blue score */
  const updateBlueScore = (point) => {    

    if (isMatchStatusPlay())
    {     
      /* Set backup score */
      global.backupBlueScore = blueScore;

      /* Set new score */
      newScore = Math.round((parseFloat(blueScore) + parseFloat(point)) * 10) / 10;
      newScore = parseFloat(newScore) >= 0 ? newScore : '0';
      sendScore(redScore, newScore);
    }
  };

  /* undo red score */
  const undoRedScore = () => {    
    
    /* Set backup score */
    sendScore(global.backupRedScore, blueScore);
  }; 

  /* undo blue score */
  const undoBlueScore = () => {    
    
    /* Set backup score */
    sendScore(redScore, global.backupBlueScore);
  }; 

  /* Check if one button mode */
  function isOneButtonMode()
  {
    return oneButtonMode;
  }

  /* Check if defalut blue on left mode */
  function isBlueOnLeftMode()
  {
    return blueOnLeftMode;
  }

  /* Check if sparring */
  function isSparring()
  {
    return specialtyCode === 'SP';
  }

  /* reload */
  const reload = () => {
    closeWebSocket(WS);
    global.WS = setupWebSocket(requestScore, checkMessage);
  }

  /* On screen load */
  const onScreenLoad = () => {
    global.WS = setupWebSocket(requestScore, checkMessage);
  }

  useEffect(() => {
    onScreenLoad();
  }, [])

  return (
    <View
      style={[
        styles.container,
        {
          flexDirection: 'column',
        },
      ]}>      
      <View style={{flex: 1}}>
        <View
            style={[
            styles.container,
            {
              flexDirection: 'row',
            },
          ]}>        
            <View
              style={[
              styles.container,
              {
                flexDirection: 'column',
                flex: 5
              },
            ]}>
              <View style={ isBlueOnLeftMode() ? styles.blueButton : styles.redButton} onTouchEnd={() => isBlueOnLeftMode() ? undoBlueScore() : undoRedScore()}>
                  <Text style={styles.pointText}>{ isBlueOnLeftMode() ? blueScore : redScore} ↺</Text>
              </View>
              <View style={styles.empty}>
              </View>                      
              <View style={[isBlueOnLeftMode() ? styles.blueButton : styles.redButton, { flex: isOneButtonMode() ? 15 : 5}]} onTouchEnd={() => isBlueOnLeftMode() ? updateBlueScore(isSparring() ? '1' : '-0.2') : updateRedScore(isSparring() ? '1' : '-0.2')}>
                  <Text style={styles.pointText}>{ isSparring() ? '+ 1' : '- 0.2' }</Text>
              </View>
              <View style={[isBlueOnLeftMode() ? styles.blueButton : styles.redButton, { display: isOneButtonMode() ? 'none' : 'block'}]} onTouchEnd={() => isBlueOnLeftMode() ? updateBlueScore(isSparring() ? '2' : '-0.5') : updateRedScore(isSparring() ? '2' : '-0.5')}>
                <Text style={styles.pointText}>{ isSparring() ? '+ 2' : '- 0.5' }</Text>
              </View>
              <View style={[isBlueOnLeftMode() ? styles.blueButton : styles.redButton, { display: isOneButtonMode() ? 'none' : 'block'}]} onTouchEnd={() => isBlueOnLeftMode() ? updateBlueScore(isSparring() ? '3' : '-10') : updateRedScore(isSparring() ? '3' : '-10')}>
                <Text style={styles.pointText}>{ isSparring() ? '+ 3' : '0' }</Text>
              </View>
            </View>
            <View
              style={[
              styles.container,
              {
                flexDirection: 'column',
                flex: 3
              },
            ]}>           
              <View style={styles.centerPanel}>              
                  <Text style={styles.optionsText}>RING {ringLabel}</Text>
                  <Text style={styles.optionsText}>REFEREE {refereeLabel}</Text>
                  <Text style={[styles.optionsText, styles.uppercaseText, isMatchStatusStopped() ? styles.redText : styles.greenText]}>{matchStatus}</Text>
                  <Pressable
                      style={[styles.button, styles.buttonClose]}
                      onPress={() => reload()}>
                      <Text style={styles.textStyle}>RELOAD 🔃</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.button, styles.buttonClose]}
                    onPress={() => setOneButtonMode(!oneButtonMode)}>
                    <Text style={styles.textStyle}>1/3 BTN MODE</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.button, styles.buttonClose]}
                    onPress={() => setBlueOnLeftMode(!blueOnLeftMode)}>
                    <Text style={styles.textStyle}>BLUE 🔀 RED</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.button, styles.buttonClose]}
                    onPress={() => navigation.navigate('Home') }>
                    <Text style={styles.textStyle}>EXIT ❌</Text>
                  </Pressable>
              </View>
            </View>            
            <View
              style={[
              styles.container,
              {
                flexDirection: 'column',
                flex: 5
              },
            ]}>
              <View style={ isBlueOnLeftMode() ? styles.redButton : styles.blueButton} onTouchEnd={() => isBlueOnLeftMode() ? undoRedScore() : undoBlueScore()}>              
                  <Text style={styles.pointText}>{ isBlueOnLeftMode() ? redScore : blueScore} ↺</Text>
              </View>
              <View style={styles.empty}>
              </View>                           
              <View style={[ isBlueOnLeftMode() ? styles.redButton : styles.blueButton, { flex: isOneButtonMode() ? 15 : 5}]} onTouchEnd={() => isBlueOnLeftMode() ? updateRedScore(isSparring() ? '1' : '-0.2') : updateBlueScore(isSparring() ? '1' : '-0.2')}>              
                  <Text style={styles.pointText}>{ isSparring() ? '+ 1' : '- 0.2' }</Text>
              </View>
              <View style={[ isBlueOnLeftMode() ? styles.redButton : styles.blueButton, { display: isOneButtonMode() ? 'none' : 'block'}]} onTouchEnd={() => isBlueOnLeftMode() ? updateRedScore(isSparring() ? '2' : '-0.5') : updateBlueScore(isSparring() ? '2' : '-0.5')}>
                <Text style={styles.pointText}>{ isSparring() ? '+ 2' : '- 0.5' }</Text>
              </View>
              <View style={[ isBlueOnLeftMode() ? styles.redButton : styles.blueButton, { display: isOneButtonMode() ? 'none' : 'block'}]} onTouchEnd={() => isBlueOnLeftMode() ? updateRedScore(isSparring() ? '3' : '-10') : updateBlueScore(isSparring() ? '3' : '-10')}>
                <Text style={styles.pointText}>{ isSparring() ? '+ 3' : '0' }</Text>
              </View>
            </View>            
          </View>
      </View>
    </View>
  );
}

/* Create navigation stack */
const Stack = createNativeStackNavigator();

function App() {

  /* On screen load */
  const onScreenLoad = () => {
    changeScreenOrientation();
  }

  useEffect(() => {
    onScreenLoad();
  }, [])  

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Main" component={MainScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;

const styles = StyleSheet.create({
  button: {
    padding: 10,
    elevation: 2,
    marginBottom: 10,
    width: 120
  },
  proceedButton: {
    padding: 10,
    elevation: 2,
    marginBottom: 10,    
    width: 300,
    backgroundColor: '#1997c6'
  },
  buttonClose: {
    backgroundColor: '#1997c6',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    //alignItems: 'center',
    backgroundColor: '#252830',
    padding: 2,
    paddingTop: 10
  },
  empty: {
    flex: 1
  },
  centerPanel: {
    alignItems: 'center'
  },  
  optionsButton: {
    color: 'red'
  },  
  blueButton: {
    flex: 5,
    alignItems : 'center',
    borderColor: 'white',
    borderWidth: 1,
    backgroundColor: 'blue',
  },
  redButton: {
    flex: 5,
    alignItems : 'center',
    borderColor: 'white',        
    borderWidth: 1,
    backgroundColor: 'red'
  },
  pointText: {
    color: '#fff',
    fontSize: 60
  },
  optionsText: {
    color: '#fff',
    fontSize: 20,
    bottom: 10
  },
  redText: {
    color: '#ff0000',
  },
  greenText: {
    color: '#1bc98e',
  },
  uppercaseText: {
    textTransform: 'uppercase',
    fontWeight: 'bold'
  },
  input: {
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 20,
    padding: 10,
    color: '#fff',
    fontSize: 30,
    width: 300,
    textAlign: 'center',
    backgroundColor: '#434857'
  },
  fixToText: {
    marginLeft: 20,
    marginRight: 20,
    justifyContent: 'center',
  }, 
  titleText: {
    fontSize: 20,
    color: '#1997c6',
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});