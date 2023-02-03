import {LitElement, html, css, templateContent} from "./lib/lit-all.min.js";

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
        return html`
            <div class="${_class}">
                <div><strong>type: </strong> ${action?.type}</div>
                <div><strong>relative time: </strong> ${action?.relativeTime/1000} s</div>
                <div><strong>timestamp: </strong> ${action?.timeStamp ? new Date(action.timeStamp).toLocaleString() : 'n/a'}</div>
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
            let currentIndex = 0;
            let stageHistory = [];
            let actions = [];
            let slider = $('#playerSlider');
            slider.val(0);
            let playInterval = null;
            let relativeTimeDiff = 0;
            
            TStage.toggleReplayMode();
            
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
            
            function loadStageHistory(event, json){
                window.clearInterval(playInterval);
                try {
                    stageHistory = [];
                    actions = [];        
                    let data = json ?? JSON.parse($('#stageData').val());        
                    let stagedata = null;
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
                    if(TStage.loadTrackData(stageHistory[0])){
                        $('#log')[0].actions = actions.slice(0,1);
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
