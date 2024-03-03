import React from 'react';
import {  View, Text, ToastAndroid, Pressable, Vibration } from 'react-native';
import { setupWebSocket, closeWebSocket, sendMessage } from './WebSocket';
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
    const [blueScore, setBlueScore] = React.useState(0);
    const [redScore, setRedScore] = React.useState(0);
    const [matchStatus, setMatchStatus] = React.useState('STOP');
    const [oneButtonMode, setOneButtonMode] = React.useState(false);
    const [blueOnLeftMode, setBlueOnLeftMode] = React.useState(true);

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
        sendMessage(global.WS, $msg);

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

    React.useEffect(() => {
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
};

export default MainScreen;