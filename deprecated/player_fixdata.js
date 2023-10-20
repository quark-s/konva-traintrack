import {LitElement, html, css, templateContent} from "../lib/lit-all.min.js";

class TraintrackLog extends LitElement {

    // static get styles() {
    //   return css`
    //     :host {
    //       /* display: block;
    //       border: solid 1px gray;
    //       padding: 16px;
    //       max-width: 800px; */
    //       font-size: .5em;
    //       max-width: 200px;
    //     }
    //   `;
    // }
  
    static get properties() {
      return {
        actions: {type: Array, attribute: false },
        max: {type: Number}
      };
    }
  
    constructor() {
      super();
      this.actions = [];
      this.max = 5;
    }

    //shadow to light
    createRenderRoot() {
        return this;
    }

    renderActionDetails(data){
        if(!data || !Object.keys(data).length)
            return '';
        return html`
            ${Object.keys(data).map(e => {
                return html`
                    <strong>${e}: </strong>${JSON.stringify(data[e])}<br/>
                `
            })}
        `;
    }

    renderAction(action, i){
        let _class = i==this.actions.slice(-this.max).length-1 ? "last" : "";
        let _relativeTime = moment.duration(action?.relativeTime);
        return html`
            <div class="${_class}">
                <div><strong>type: </strong> ${action?.type}</div>
                <div><strong>relative time (hh:mm:ss.ms): </strong> ${_relativeTime.hours().toString().padStart(2, "0")}:${_relativeTime.minutes().toString().padStart(2, "0")}:${_relativeTime.seconds().toString().padStart(2, "0")}.${_relativeTime.milliseconds()}</div>
                <div><strong>relative time (seoconds): </strong> ${action?.relativeTime/1000} s</div>
                <div><strong>timestamp: </strong> ${action?.timeStamp ? new Date(action.timeStamp).toLocaleString('de-DE', {timeZone: 'CET'}) : 'n/a'}</div>
                <div><strong><a data-bs-toggle="collapse" href="#collapse-${i}" role="button" aria-expanded="false" aria-controls="collapse-${i}">details</a></strong></div>
                <div class="collapse" id="collapse-${i}">${this.renderActionDetails(action.data)}</div>
            </div>
        `
    }
  
    render() {

        if(this.actions.length==0)
            return "";
        
        if(TStage){
            try {
                let _actions = this.actions.slice(-this.max);
                TStage.selectTrack(_actions[_actions.length-1]?.data?.id);
            } catch (error) {
                console.error(error);   
            }
        }

        return html`
        <ul>
            ${this.actions.slice(-this.max).map((action, i) => {                    
                    return html`<li>${this.renderAction(action, i)}</li>`
                }
            )}
        </ul>
        `;
    }
  }

  customElements.define('traintrack-log', TraintrackLog);

 window.onload = function(){

    (function(){

            async function storeStageHistory(userId, itemId, data){
                let response = await fetch(`http://localhost:4000/storeData/${userId}/${itemId}`,
                    {
                        method: "POST",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)                      
                    }
                );
                if(!response.ok)
                    throw new Error(`HTTP error! status: ${response.status}`);
            }

            let currentIndex = 0;
            let stageHistory = [];
            let actions = [];
            let slider = $('#playerSlider');
            slider.val(0);
            let playInterval = null;
            
            TStage.toggleReplayMode();

            fetch("http://localhost:4000/getData")
            .then((response) => response.json())
            .then(async (_data) => {
                
                for(let userIdx in _data){

                    for(let itmIdx in _data[userIdx]["items"]){

                        currentIndex = 0;
                        stageHistory = _data[userIdx]["items"][itmIdx]["history"];
                        stageHistory.sort((a,b) => a.relativeTime - b.relativeTime);
                        // loadStageHistory(data);
        
                        let _id = _data[userIdx]["id"];
                        let _item = _data[userIdx]["items"][itmIdx]["item"];
                        let stagedata = false;
        
                        //
                        do {
                            if(!!stageHistory[currentIndex].stagedata && Object.keys(stageHistory[currentIndex].stagedata).length>0)
                                stagedata = stageHistory[currentIndex].stagedata;
                            else
                                currentIndex++;
                            slider.val(currentIndex);
                        } while (!stagedata && currentIndex < stageHistory.length-1);                
        
                        if(!!stagedata)
                            TStage.loadTrackData(stagedata);                            
                        else {
                            await storeStageHistory(_id, _item, stageHistory);
                            continue;
                        }
        
                        // var promiseResolve, promiseReject;
        
                        var promise = new Promise(function(resolve, reject){
                            playInterval = window.setInterval(async (e) => {
                            
                                TStage.saveCurrentStage();
                                stageHistory[currentIndex].stagedata = TStage.getSavedTrackData();  
                                // slider.val(currentIndex);
                                console.log(currentIndex);
                                                        
                                if(currentIndex<stageHistory.length-1){
                                    currentIndex++;
                                    if(!!stageHistory[currentIndex].stagedata && Object.keys(stageHistory[currentIndex].stagedata).length>0)
                                        TStage.loadTrackData(stageHistory[currentIndex].stagedata);
                                }
                                else{
                                    window.clearInterval(playInterval);
                                    await storeStageHistory(_id, _item, stageHistory);
                                    currentIndex = 0;
                                    resolve(stageHistory);
                                }
            
                            }, 200);
                        });
        
                        let _result = await promise;
                        window.clearInterval(playInterval);
                        // console.log(_result);
                        location.reload();
                    }
                }

            });
        

            $('#btn-history-upload').on('click', function(){
                input.click();
            });


            $('#bNext').on('click', function(){
                
                if(currentIndex<stageHistory.length-1){
                    TStage.loadTrackData(stageHistory[++currentIndex]);
                    $('#log')[0].actions = actions.slice(0,currentIndex+1);
                    $('#bPrev').removeAttr("disabled");
                }
                slider.val(currentIndex);
                if(currentIndex == stageHistory.length-1)
                    $('#bNext').attr("disabled", 1);
            });

            $('#bPrev').on('click', function(){
                
                if(currentIndex>0){
                    TStage.loadTrackData(stageHistory[--currentIndex]);
                    $('#log')[0].actions = actions.slice(0,currentIndex+1);
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
                        TStage.loadTrackData(stageHistory[++currentIndex]);
                        $('#log')[0].actions = actions.slice(0,currentIndex+1);
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
                    TStage.loadTrackData(stageHistory[this.value]);
                    $('#log')[0].actions = actions.slice(0,parseInt(this.value)+1);
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

            let scale = 0.65;
            document.querySelector('#wrapper-inner').style.transform = "scale(" + scale + ")";
    })()
};
