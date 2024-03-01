/* Setup websocket */
export function setupWebSocket(onopenCallback, onmessageCallback)
{
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
}

/* Close websocket */
export function closeWebSocket(WS)
{
    WS.close();
}

/* Setup websocket */
export function sendMessage(WS, $msg)
{
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
}