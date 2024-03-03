/* Setup websocket */
export const setupWebSocket = (onopenCallback, onmessageCallback) => {
    
    /* Create ws */
    var WS = new WebSocket('wss://handlesport-websocket.fly.dev');

    /* Request score */
    WS.onopen = () => {
        onopenCallback();
    };

    /* Receive messages */
    WS.onmessage = (event) => {
        onmessageCallback(JSON.parse(event.data));
    }

    return WS;
};

/* Close websocket */
export const closeWebSocket = (WS, onopenCallback, onmessageCallback) => {
    WS.removeEventListener("open", onopenCallback);
    WS.removeEventListener("message", onmessageCallback);    
    WS.close();
    WS = null;
};

/* Setup websocket */
export const sendMessage = (WS, $msg) => {
    /* Check ws state */
    if (WS.readyState == 1)
    {
        /* Send message */
        WS.send(JSON.stringify($msg));
    }
    else
    {
        /* Restore connection */
        setupWebSocket();

        /* Send message */
        WS.send(JSON.stringify($msg));
    }
};