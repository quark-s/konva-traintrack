import TStage from './lib/TStage.js';
import TraintrackReplayLog from "./lib/components/replayLog.js";


 window.onload = function(){    

    (function(){
            let currentIndex = 0;
            let stageHistory = [];
            let actions = [];
            let slider = $('#playerSlider');
            slider.val(0);
            let relativeTimeDiff = 0;

            const zoomMap = new Map();
            const zoomMax = 0.85;
            const zoomMin = 0.55;
            const zoomStep = 0.1;
            const baseWidth = 1024;
            const baseHeight = 768;
            const zoomInitial = zoomMax;
            const effectiveWidth = Math.round(baseWidth/zoomMin);

            let z = zoomMin;
            while (z<=zoomMax) {
                let factor = Math.round(baseWidth/z) / effectiveWidth;
                zoomMap.set(z, factor);
                z+=zoomStep;
            }

            let playInterval = null;
            let playTimeoutRealtime = null;
            let playIntervalRealtimeInfo = null;

            TStage.toggleReplayMode();
            $('#log')[0].stage = TStage;
            
            const input = document.querySelector('#history-upload');
            input.addEventListener('change', () => {
                const file = input.files[0];
                var reader = new FileReader();                
                reader.onload = event => {
                    // console.log(JSON.parse(event.target.result));
                    try {
                        let result = JSON.parse(event.target.result);
                        loadStageHistory(event, result);
                    } catch (error) {
                        console.error(error);
                    }
                };
                reader.readAsText(file);
                console.log(file);
            });

            function scaleVisibleArea(scale){
                let _node = document.getElementById("visible-area");
                if(!!_node && scale && zoomMap.has(scale)){
                    _node.style.width = Math.round(zoomMap.get(scale) * baseWidth)+"px";
                    _node.style.height = Math.round(zoomMap.get(scale) * baseHeight)+"px";
                }                
            }
            
            function loadDataProxy(index) {
                //resize visible area
                let ret = TStage.loadTrackData(stageHistory[index]);
                if(ret && actions[index]){
                    $('#log')[0].actions = actions.slice(0,parseInt(index)+1);
                    if(actions[index].type == "zoom-in" || actions[index].type == "zoom-out"){
                        let _action = actions[index];
                        if(_action && _action?.data?.scale)
                            scaleVisibleArea(_action?.data?.scale);
                    }
                    else if(actions[index].type == "loaded"){
                        scaleVisibleArea(zoomInitial);
                    }
                }
                return ret;
            }

            function setNextActionInfo(show){
                window.clearInterval(playIntervalRealtimeInfo);
                if(show){
                    $('#infoNextAction')[0].style.display = "inline";
                    let delay = actions[currentIndex+1]["relativeTime"] - actions[currentIndex]["relativeTime"];
                    let targetTime = Date.now() + delay;
                    playIntervalRealtimeInfo = window.setInterval(e => {
                        let remaining = Math.round((targetTime - Date.now())/1000);
                        $("#infoNextActionSeconds").html(`<span>${remaining}</span>`);
                    }, 1000);
                }
                else{
                    $('#infoNextAction')[0].style.display = "none";                    
                }
            }

            function loadStageHistory(event, json){
                window.clearInterval(playInterval);
                try {
                    stageHistory = [];
                    actions = [];        
                    let data = json ?? JSON.parse($('#stageData').val());        
                    let stagedata = null;
                    data.sort((a,b) => a.relativeTime - b.relativeTime);
                    relativeTimeDiff = data[0]?.relativeTime ? data[0].relativeTime : data[0]?.action?.data?.timestamp;
                    slider.val(0);
                    currentIndex = 0;
                    let i = 0;
                    
                    do {
                        if(!!data[i].stagedata && Object.keys(data[i].stagedata).length>0)
                            stagedata = data[i].stagedata;
                        i++;
                    } while (!stagedata && i < data.length-1);
                    
                    data.forEach(element => {
                        if(!!element.stagedata && Object.keys(element.stagedata).length>0)
                            stagedata = element.stagedata;            
                        stageHistory.push(stagedata);
                        if(element?.action?.relativeTime)
                            element.action.relativeTime -= relativeTimeDiff;
                        else
                            element.action.relativeTime = element.action?.data?.timestamp - relativeTimeDiff;
                        actions.push(element?.action);
                    });
                    if(loadDataProxy(0)){
                        // $('#log')[0].actions = actions.slice(0,1);
                        // stageHistory = data;
                        if(stageHistory.length-1>0){
                            $('#bNext').removeAttr("disabled");
                            $('#bPlay').removeAttr("disabled");
                            $('#bPlayRealtime').removeAttr("disabled");
                        }
                        $('#playerSlider').attr("min", 0);
                        $('#playerSlider').attr("max", stageHistory.length-1);
                        $('#playerSlider').attr("value", 0);

                        $('#pasteModal').modal('hide');
                        $('body').removeClass('modal-open');
                        $('.modal-backdrop').remove();
                    }
                        else throw new Error("stage data history must be an array of ")
                } catch (error) {
                    console.error("could parse stage data: ", error);
                }
            }

            $('#btn-history-upload').on('click', function(){
                input.click();
            });

            $('#bLoadStage').on('click', loadStageHistory);

            $('#bNext').on('click', function(){
                
                if(currentIndex<stageHistory.length-1){
                    loadDataProxy(++currentIndex);
                    // $('#log')[0].actions = actions.slice(0,currentIndex+1);
                    $('#bPrev').removeAttr("disabled");
                }
                slider.val(currentIndex);
                if(currentIndex == stageHistory.length-1)
                    $('#bNext').attr("disabled", 1);
            });

            $('#bPrev').on('click', function(){
                
                if(currentIndex>0){
                    loadDataProxy(--currentIndex);
                    // $('#log')[0].actions = actions.slice(0,currentIndex+1);
                    $('#bNext').removeAttr("disabled");
                    $('#bPlayRealtime').removeAttr("disabled");
                    $('#bPlay').removeAttr("disabled");
                }
                slider.val(currentIndex);
                if(currentIndex == 0)
                    $('#bPrev').attr("disabled", 1);
            });

            $('#bPlay').on('click', function(){
                $('#bPrev').attr("disabled", 1);
                $('#bNext').attr("disabled", 1);
                $('#bPlayRealtime').attr("disabled", 1);
                $('#bPlay').attr("disabled", 1);
                $('#bPause').removeAttr("disabled");
                playInterval = window.setInterval(e => {
                    if(currentIndex<stageHistory.length-1){
                        loadDataProxy(++currentIndex);
                        // $('#log')[0].actions = actions.slice(0,currentIndex+1);
                        slider.val(currentIndex);
                    }
                    else{
                        window.clearInterval(playInterval);
                        $('#bPrev').removeAttr("disabled");
                    }
                }, 2000);
            });



            let playRealtime = () => {

                if(currentIndex>=stageHistory.length-1){
                    playTimeoutRealtime=null;
                    $('#bPrev').removeAttr("disabled");
                    $('#bPause').attr("disabled", 1);
                    setNextActionInfo(false);
                    return;
                }

                $('#bNext').attr("disabled", 1);
                $('#bPrev').attr("disabled", 1);
                $('#bPlay').attr("disabled", 1);
                $('#bPlayRealtime').attr("disabled", 1);
                $('#bPause').removeAttr("disabled");
                setNextActionInfo(true);

                let delay = actions[currentIndex+1]["relativeTime"] - actions[currentIndex]["relativeTime"];

                playTimeoutRealtime = window.setTimeout(e => {
                    loadDataProxy(++currentIndex);
                    slider.val(currentIndex);
                    console.log(delay);
                    if(currentIndex<=stageHistory.length-1 && playTimeoutRealtime){
                        playRealtime();
                    } 
                    else
                    {
                        playTimeoutRealtime=null;
                        $('#bPrev').removeAttr("disabled");    
                    }
                }, delay);
            }

            $('#bPlayRealtime').on('click', function(){
                playRealtime();
            });

            $('#bPause').on('click', function(){

                window.clearInterval(playInterval);
                window.clearTimeout(playTimeoutRealtime);
                playTimeoutRealtime = null;
                setNextActionInfo(false);

                $('#bPause').attr("disabled", 1);
                if(currentIndex>0)
                    $('#bPrev').removeAttr("disabled");
                if(currentIndex<stageHistory.length-1){
                    $('#bNext').removeAttr("disabled");
                    $('#bPlayRealtime').removeAttr("disabled");
                    $('#bPlay').removeAttr("disabled");
                }
            });

            $('#playerSlider').on("input", function(){
                window.clearInterval(playInterval);
                window.clearInterval(playIntervalRealtimeInfo);                
                setNextActionInfo(false);

                playTimeoutRealtime = null;                
                if(!!stageHistory[this.value]){
                    loadDataProxy(this.value);                    
                    currentIndex = this.value;
                }

                $('#bPrev').removeAttr("disabled");
                $('#bNext').removeAttr("disabled");

                if(currentIndex == 0){
                    $('#bPrev').attr("disabled", 1);
                }

                else if(currentIndex == stageHistory.length-1){
                    $('#bNext').attr("disabled", 1);        
                }

                console.log(this.value);
            });

            let scale = 0.55;
            
            document.querySelector('#wrapper-inner').style.transform = "scale(" + scale + ")";
    })()
};
