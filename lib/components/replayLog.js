import {LitElement, html, css, templateContent} from "../lit-all.min.js";

class TraintrackReplayLog extends LitElement {

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
        stage: {type: Object, attribute: false},
        actions: {type: Array, attribute: false },
        max: {type: Number},
        height: {type: Number}
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

    updated(){
        try {
            if(this.height>0)
                this.renderRoot.querySelector("#replay-container ul li div.last").scrollIntoView();            
        } catch (error) {
            console.error(error);
        }
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
        let _class = "";
        if(this.max>0)
            _class = i == this.actions.slice(-this.max).length-1 ? "last" : "";
        else
            _class = i == this.actions.length-1 ? "last" : "";
        let _relativeTime = moment.duration(action?.relativeTime);
        let _timeStamp = action?.timeStamp ? action.timeStamp : (action?.data?.timestamp ? action.data.timestamp : 0);
        return html`
            <div class="${_class}">
                <div><strong>type: </strong> ${action?.type}</div>
                <div><strong>relative time (hh:mm:ss.ms): </strong> ${_relativeTime.hours().toString().padStart(2, "0")}:${_relativeTime.minutes().toString().padStart(2, "0")}:${_relativeTime.seconds().toString().padStart(2, "0")}.${_relativeTime.milliseconds()}</div>
                <div><strong>relative time (seoconds): </strong> ${action?.relativeTime/1000} s</div>
                <div><strong>timestamp: </strong> ${_timeStamp ? new Date(_timeStamp).toLocaleString('de-DE', {timeZone: 'CET'}) : 'n/a'}</div>
                <div><strong><a data-bs-toggle="collapse" href="#collapse-${i}" role="button" aria-expanded="false" aria-controls="collapse-${i}">details</a></strong></div>
                <div class="collapse" id="collapse-${i}">${this.renderActionDetails(action.data)}</div>
            </div>
        `
    }
  
    render() {

        if(this.actions.length==0)
            return "";
        
        let _actions = this.actions.slice(0);
        
        if(this.max>0)
            _actions = this.actions.slice(-this.max);

        if(this.stage){
            try {
                this.stage.selectTrack(_actions[_actions.length-1]?.data?.id);
            } catch (error) {
                console.error(error);   
            }
        }

        let style = "";
        if(this.height>0 && this.height<5000){
            style = `overflow-y: auto; height: ${this.height}px`;
        }

        return html`
            <div id="replay-container" style="${style}">
                <ul>
                    ${_actions.map((action, i) => {                    
                            return html`<li>${this.renderAction(action, i)}</li>`
                        }
                    )}
                </ul>
            </div>
        `;
    }
  }

  customElements.define('traintrack-replay-log', TraintrackReplayLog);

  export default TraintrackReplayLog;