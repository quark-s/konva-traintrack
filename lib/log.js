//stub: provide logging features in a test environment

const LogHistory  = (function () {
    
    let logs = [];
    
    function _downloadTxt(txt,filename) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(txt));
        element.setAttribute('download', filename);
      
        element.style.display = 'none';
        document.body.appendChild(element);
      
        element.click();
      
        document.body.removeChild(element)            
    }

    return {
        pushLog : function (data) { logs.push(data) },
        getLogs : (complete) => {
            if(!!complete)
                return JSON.stringify(logs);
            return JSON.stringify(logs.map(event => event?.stagedata ? {...event, stagedata: "placeholder-for-stagedata"} : event));
        },
        downloadLogs : () => {            
            _downloadTxt(LogHistory.getLogs(), "dump.json");
        },
        downloadLogsComplete : () => {
            _downloadTxt(LogHistory.getLogs(true), "dump.json");
        }
    };
    
})();

function postLogEvent(event){
    LogHistory.pushLog(event);
    console.log("postLogEvent", event);
}