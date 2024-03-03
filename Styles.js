import {  StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    button: {
      padding: 10,
      elevation: 2,
      marginBottom: 10,
      width: 120
    },
    alertTitleStyle: {
      fontSize: 30
    },
    alertTextStyle: {
      fontSize: 20
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
      backgroundColor: '#252830'
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
      justifyContent: 'center'
    },
    redButton: {
      flex: 5,
      alignItems : 'center',
      borderColor: 'white',        
      borderWidth: 1,
      backgroundColor: 'red',
      justifyContent: 'center'
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

  export default styles;