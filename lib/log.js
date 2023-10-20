//stub: provide logging features in a test environment

import KonvaConfig from '../conf.js';

const LogHistory = (function () {

    let logs = [];
    let currentTimestamp = Date.now();

    function _downloadTxt(txt, filename) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(txt));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element)
    }

    return {
        pushLog: function (data) {
            data.relativeTime = data.action.relativeTime = data?.action?.data?.timestamp - currentTimestamp;
            logs.push(data)
        },
        getLogs: (complete) => {
            if (!!complete)
                return JSON.stringify(logs);
            return JSON.stringify(logs.map(event => event?.stagedata ? { ...event, stagedata: "placeholder-for-stagedata" } : event));
        },
        downloadLogs: () => {
            _downloadTxt(LogHistory.getLogs(), "dump.json");
        },
        downloadLogsComplete: () => {
            _downloadTxt(LogHistory.getLogs(true), "dump.json");
        }
    };

})();

var traceCount = 0;

export function postLogEvent(event) {

    if (KonvaConfig.assessment) {

        console.debug("Trace Message: ", event);

        try {
            var pass_data = {
                indexPath: indexPath,
                userDefIdPath: userDefIdPath,
                traceMessage: {
                    action: event,
                },
                traceCount: traceCount++
            };

            window.parent.postMessage(JSON.stringify(pass_data), '*');
        }
        catch (e) {
            console.debug(e);
        }

    }

    else {
        LogHistory.pushLog(event);
        console.log("postLogEvent", event);
    }

}


// Trigger an fsm event (e.g., to end the item)

export function postFsmEvent(event) {
    console.debug("FSM Event: " + event);

    try {
        var pass_data = {
            indexPath: indexPath,
            userDefIdPath: userDefIdPath,
            microfinEvent: event,
            traceMessage: {
                action: 'sending FSM event ' + event,
            },
            traceCount: '1'
        };

        window.parent.postMessage(JSON.stringify(pass_data), '*');
    }
    catch (e) {
        console.debug(e);
    }
}

// Not required (Restore the page from a previously stored state as string, e.g., XML/JSON)

export function theSetState(stateString) {
    try {
        console.debug("Set State: " + stateString);
    }
    catch (e) {
        console.debug(e);
    }
}

// Not implemented (Save the state of the page as string (e.g., XML/JSON)

export function theGetState() {
    try {
        console.debug("Get State");
        var x = "state of the page";
        return x;
    }
    catch (e) {
        console.debug(e);
    }
}

// Helper

export function getQueryVariable(variable) {
    const parsedUrl = new URL(window.location.href);
    return parsedUrl.searchParams.get(variable);
}

export const indexPath = getQueryVariable('indexPath');
export const userDefIdPath = getQueryVariable('userDefIdPath');

console.log(indexPath);
console.log(userDefIdPath);

