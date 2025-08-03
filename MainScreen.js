import { useState, useEffect } from 'react';
import {  View, Text, ToastAndroid, Pressable, Vibration } from 'react-native';
import { loginAsReferee, onSnapshot, getStatusDocRef, getRefereeDocRef, loadRefereeDoc, updateRefereeDoc } from './Firestore';
import styles from './Styles';

/* Main screen */
const MainScreen = ({ route, navigation }) => {
  
    /* Params */
    const { id_event, id_ring, id_referee, specialty } = route.params;
    const idEvent = JSON.stringify(id_event);
    const idRing = JSON.stringify(id_ring);
    const idReferee = JSON.stringify(id_referee);
    const specialtyCode = specialty;

    // Constants
    const STATUS_OK = 'ok';
    const ACTION_RESET_SCORE = 'reset_score';
    const ACTION_UPDATE_SCORE = 'update_score';
    const STATUS_PLAY = 'PLAY';
    const STATUS_STOP = 'STOP';

    /* match properties */
    const [blueScore, setBlueScore] = useState(isSparring() ? 0 : 10.0);
    const [redScore, setRedScore] = useState(isSparring() ? 0 : 10.0);

    const [matchStatus, setMatchStatus] = useState('STOP');
    const [oneButtonMode, setOneButtonMode] = useState(false);
    const [blueOnLeftMode, setBlueOnLeftMode] = useState(false);

    function login()
    {
        /* Login as referee */
        loginAsReferee(idEvent, idRing, idReferee, STATUS_OK).then(() => {

            /* Load initial referee data */
            loadRefereeDoc(idEvent, idRing, idReferee).then((data) => {
                if (data && data.score)
                {
                    setRedScore(Number.isInteger(data.score.red) ? data.score.red : parseFloat(data.score.red).toFixed(1));
                    setBlueScore(Number.isInteger(data.score.blue) ? data.score.blue : parseFloat(data.score.blue).toFixed(1));
                }
            });

            /* Setup status snapshots */
            onSnapshot(getStatusDocRef(idEvent, idRing), (doc) => {
                if (doc.exists())
                {
                    const data = doc.data();
                    console.log("Updated status:", data.state);
                    changeMatchStatus(data.state);
                }
            });

            /* Setup referee docs */
            onSnapshot(getRefereeDocRef(idEvent, idRing, idReferee), (doc) => {
                if (doc.exists())
                {
                    const data = doc.data();
                    if (data.action && data.score && data.action === ACTION_RESET_SCORE)
                    {
                        setRedScore(Number.isInteger(data.score.red) ? data.score.red : parseFloat(data.score.red).toFixed(1));
                        setBlueScore(Number.isInteger(data.score.blue) ? data.score.blue : parseFloat(data.score.blue).toFixed(1));
                        ToastAndroid.show('Score updated from server', ToastAndroid.SHORT);
                    }
                }
            });

            /* Show toast */
            ToastAndroid.show('Logged referee ' + idReferee, ToastAndroid.SHORT);
        });
    }

    /* Change match status */
    function changeMatchStatus($status)
    {
        setMatchStatus($status.toUpperCase());
    }

    /* Check match status stop */
    function isMatchStatusStopped()
    {
        return matchStatus == STATUS_STOP;
    }

    /* Check match status play */
    function isMatchStatusPlay()
    {
        return matchStatus == STATUS_PLAY;
    }

    /* Send score */
    function sendScore(newRedScore, newBlueScore)
    {
        const update = { action: ACTION_UPDATE_SCORE, score: { red: newRedScore, blue: newBlueScore } };
        updateRefereeDoc(idEvent, idRing, idReferee, update);
        Vibration.vibrate(100);
    }

    /* update red score */
    const updateRedScore = (point) => {    

        if (isMatchStatusPlay())
        {            
            /* Set backup score */
            redBackupScore = parseFloat(redScore);                        

            /* Set new score */
            const newRedScore = parseFloat(redScore) + parseFloat(point) < 0 ? 0 : parseFloat(redScore) + parseFloat(point);
            setRedScore(Number.isInteger(newRedScore) ? newRedScore : parseFloat(newRedScore).toFixed(1));
            sendScore(Number.isInteger(newRedScore) ? newRedScore : parseFloat(newRedScore).toFixed(1), blueScore);
        }
    };

    /* update blue score */
    const updateBlueScore = (point) => {    

        if (isMatchStatusPlay())
        {     
            /* Set backup score */
            blueBackupScore = parseFloat(blueScore);

            /* Set new score */
            const newBlueScore = parseFloat(blueScore) + parseFloat(point) < 0 ? 0 : parseFloat(blueScore) + parseFloat(point);
            setBlueScore(Number.isInteger(newBlueScore) ? newBlueScore : parseFloat(newBlueScore).toFixed(1));
            sendScore(redScore, Number.isInteger(newBlueScore) ? newBlueScore : parseFloat(newBlueScore).toFixed(1));
        }
    };

    /* undo red score */
    const undoRedScore = () => {    
        
        /* Set backup score */
        if (redBackupScore)
        {
            setRedScore(Number.isInteger(redBackupScore) ? redBackupScore : parseFloat(redBackupScore).toFixed(1));
            sendScore(Number.isInteger(redBackupScore) ? redBackupScore : parseFloat(redBackupScore).toFixed(1), blueScore);
        }
    }; 

    /* undo blue score */
    const undoBlueScore = () => {    
        
        /* Set backup score */
        if (blueBackupScore)
        {
            setBlueScore(Number.isInteger(blueBackupScore) ? blueBackupScore : parseFloat(blueBackupScore).toFixed(1));
            sendScore(redScore, Number.isInteger(blueBackupScore) ? blueBackupScore : parseFloat(blueBackupScore).toFixed(1));
        }
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
        navigation.navigate('Home');;
    }    

    /* reload */
    const reload = () => {
        login();
    }

    /* On screen load */
    const onScreenLoad = () => {
        login();
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
                    <Text style={styles.pointText}>
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
                    <Text style={styles.pointText}>
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