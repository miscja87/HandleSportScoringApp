import { useState, useEffect } from 'react';
import {  View, Text, ToastAndroid, Pressable, Vibration } from 'react-native';
import { setupWebSocket, closeWebSocket, sendMessage } from './WebSocket';
import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './Styles';

/* Main screen */
const MainScreen = ({ route, navigation }) => {
  
    /* Params */
    const { id_event, id_ring, id_referee, specialty } = route.params;
    const idEvent = JSON.stringify(id_event);
    const idRing = JSON.stringify(id_ring);
    const idReferee = JSON.stringify(id_referee);
    const specialtyCode = specialty;

    /* Web socket */
    global.WS;

    /* Global vars */  
    global.backupRedScore;
    global.backupBlueScore;

    /* match properties */
    const [blueScore, setBlueScore] = useState(0);
    const [blueScorePending, setBlueScorePending] = useState(false);

    const [redScore, setRedScore] = useState(0);
    const [redScorePending, setRedScorePending] = useState(false);

    const [matchStatus, setMatchStatus] = useState('STOP');
    const [oneButtonMode, setOneButtonMode] = useState(false);
    const [blueOnLeftMode, setBlueOnLeftMode] = useState(false);

    /* Request score */
    function requestScore()
    {
        $msg = { key: global.api_key, action : 'request_score', id_event : idEvent, id_ring: idRing, referee : idReferee };
        
        /* Send message */
        sendMessage(global.WS, $msg);
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
            ToastAndroid.show('Synchronized', ToastAndroid.SHORT);
        }

        /* Ack score */
        if (msg['action'] == 'ack_score' && msg['id_event'] == idEvent && msg['id_ring'] == idRing)
        {
            ackScore(msg['uuid']);
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

    /* Send local score */
    function sendLocalScore(newRedScore, newBlueScore)
    {   
        id = uuid.v4();
        $msg = { key: global.api_key, uuid : id, action : 'score', id_event : idEvent, id_ring: idRing, referee : idReferee, red : newRedScore, blue : newBlueScore };        
        AsyncStorage.setItem(id, JSON.stringify($msg)).then(() => {
            
            /* Send score */
            sendMessage(global.WS, $msg);

            /* Vibration */
            Vibration.vibrate(100);
        });
    }    

    /* Ack score */
    function ackScore($uuid)
    {
        AsyncStorage.getItem($uuid).then((localScore) => {

            if (localScore)
            {
                /* Parse local score */
                parsedlocalScore = JSON.parse(localScore);

                /* Update red score */
                setRedScorePending(false);
                setRedScore((redScore) => 
                    parseFloat(Math.round((parseFloat(redScore) + parseFloat(parsedlocalScore['red'])) * 10) / 10) >= 0 ?
                    Math.round((parseFloat(redScore) + parseFloat(parsedlocalScore['red'])) * 10) / 10 :
                    '0');

                /* Update blue score */
                setBlueScorePending(false);
                setBlueScore((blueScore) => 
                    parseFloat(Math.round((parseFloat(blueScore) + parseFloat(parsedlocalScore['blue'])) * 10) / 10) >= 0 ?
                    Math.round((parseFloat(blueScore) + parseFloat(parsedlocalScore['blue'])) * 10) / 10 :
                    '0');

                /* Remove item from local storage */
                AsyncStorage.removeItem($uuid);
            }          
        });
    }

    /* Get backup red uuid */
    function getBackupRedUuid()
    {
        return idEvent + '-' + idRing + '-' + idReferee + '-backup-red';
    }

    /* Get backup blue uuid */
    function getBackupBlueUuid()
    {
        return idEvent + '-' + idRing + '-' + idReferee + '-backup-blue';
    }    

    /* update red score */
    const updateRedScore = (point) => {    

        if (isMatchStatusPlay())
        {            
            /* Set backup score */
            redBackupUuid = getBackupRedUuid();
            redBackupScore = parseFloat(0 - (parseFloat(redScore) + parseFloat(point) < 0 ? - parseFloat(redScore) : point));
            redBackupScoreMsg = { key: global.api_key, uuid : redBackupUuid, action : 'score', id_event : idEvent, id_ring: idRing, referee : idReferee, red : redBackupScore, blue : "0" };
            AsyncStorage.setItem(redBackupUuid, JSON.stringify(redBackupScoreMsg));

            /* Set new score */
            setRedScorePending(true);
            sendLocalScore(point, "0");
        }
    };

    /* update blue score */
    const updateBlueScore = (point) => {    

        if (isMatchStatusPlay())
        {     
            /* Set backup score */
            blueBackupUuid = getBackupBlueUuid();
            blueBackupScore = parseFloat(0 - (parseFloat(blueScore) + parseFloat(point) < 0 ? - parseFloat(blueScore) : point));
            blueBackupScoreMsg = { key: global.api_key, uuid : blueBackupUuid, action : 'score', id_event : idEvent, id_ring: idRing, referee : idReferee, red : "0", blue : blueBackupScore };
            AsyncStorage.setItem(blueBackupUuid, JSON.stringify(blueBackupScoreMsg));

            /* Set new score */
            setBlueScorePending(true);
            sendLocalScore("0", point);
        }
    };

    /* undo red score */
    const undoRedScore = () => {    
        
        /* Set backup score */
        redBackupUuid = getBackupRedUuid();
        AsyncStorage.getItem(redBackupUuid).then((redBackupScore) => {

            if (redBackupScore)
            {
                /* Send backup red score */
                parsedBackupScore = JSON.parse(redBackupScore);
                sendLocalScore(parsedBackupScore['red'], "0");

                /* Remove item from local storage */
                AsyncStorage.removeItem(redBackupUuid);
            }
        });
    }; 

    /* undo blue score */
    const undoBlueScore = () => {    
        
        /* Set backup score */
        blueBackupUuid = getBackupBlueUuid();
        AsyncStorage.getItem(blueBackupUuid).then((blueBackupScore) => {

            if (blueBackupScore)
            {                
                /* Send backup blue score */
                parsedBackupScore = JSON.parse(blueBackupScore);
                sendLocalScore("0", parsedBackupScore['blue']);

                /* Remove item from local storage */
                AsyncStorage.removeItem(blueBackupUuid);
            }
        });
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

    /* Check if blue score pending */
    function isBlueScorePending()
    {
        return blueScorePending;
    }
    
    /* Check if red score pending */
    function isRedScorePending()
    {
        return redScorePending;
    }    

    /* reload */
    const goBack = () => {
        closeWebSocket(global.WS, requestScore, checkMessage);
        navigation.navigate('Home');;
    }    

    /* reload */
    const reload = () => {
        closeWebSocket(global.WS, requestScore, checkMessage);
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
                    <Text style={ isBlueOnLeftMode() ? (isBlueScorePending() ? [styles.pointText, styles.yellowText] : [styles.pointText]) : (isRedScorePending() ? [styles.pointText, styles.yellowText] : [styles.pointText])}>
                        { isBlueOnLeftMode() ? blueScore : redScore} ↺
                    </Text>
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
                    <Text style={styles.optionsText}>RING {idRing}</Text>
                    <Text style={styles.optionsText}>REFEREE {idReferee}</Text>
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
                        onPress={() => goBack() }>
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
                    <Text style={ isBlueOnLeftMode() ? (isRedScorePending() ? [styles.pointText, styles.yellowText] : [styles.pointText]) : (isBlueScorePending() ? [styles.pointText, styles.yellowText] : [styles.pointText])}>
                        { isBlueOnLeftMode() ? redScore : blueScore} ↺
                    </Text>
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
};

export default MainScreen;