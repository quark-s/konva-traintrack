import TStage from './lib/TStage.js';
import TraintrackReplayLog from "./lib/components/replayLog.js";


 window.onload = function(){    

    (function(){
            let currentIndex = 0;
            let stageHistory = [];
            let actions = [];
            let slider = $('#playerSlider');
            slider.val(0);
            let playInterval = null;
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

            function loadStageHistory(event, json){
                window.clearInterval(playInterval);
                try {
                    stageHistory = [];
                    actions = [];        
                    let data = json ?? JSON.parse($('#stageData').val());        
                    let stagedata = null;
                    data.sort((a,b) => a.relativeTime - b.relativeTime);
                    relativeTimeDiff = data[0].relativeTime;
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
                        actions.push(element?.action);
                    });
                    if(loadDataProxy(0)){
                        // $('#log')[0].actions = actions.slice(0,1);
                        // stageHistory = data;
                        $('#bNext').removeAttr("disabled");
                        $('#bPlay').removeAttr("disabled");
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
                }
                slider.val(currentIndex);
                if(currentIndex == 0)
                    $('#bPrev').attr("disabled", 1);
            });

            $('#bPlay').on('click', function(){
                $('#bPrev').attr("disabled", 1);
                $('#bNext').attr("disabled", 1);
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

            $('#bPause').on('click', function(){
                window.clearInterval(playInterval);
                $('#bPause').attr("disabled", 1);
                if(currentIndex>0)
                    $('#bPrev').removeAttr("disabled");
                if(currentIndex<stageHistory.length-1)
                    $('#bNext').removeAttr("disabled");
            });

            $('#playerSlider').on("input", function(){
                window.clearInterval(playInterval);
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
