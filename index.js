
let trackTypes = [
    "TrackType1",
    "TrackType2",
    "TrackType3",
    "TrackCrossType1",
    "TrackJunctionType1",
    "TrackJunctionType2"
];

TStage.loadTrackData(trackData);
// TStage.zoom(1.5);

(function() {

	let rotmap = new Map();

    function rotate(dir, button){
        let rot = !!dir ? 45 : -45;
        let selectedTrack = TStage.getSelectedTrack();
        let logdata = {
            type: "rotate",
            data: {
				id: selectedTrack.id,
				rotation: rot,
				start: new Date().getTime(),
				end: null
			}
        }
        if(!!selectedTrack){
            TStage.hookBeforeMod(logdata);
			// console.log(selectedTrack.shape.rotation(),selectedTrack.shape.getAbsoluteRotation());
			let _crotation = selectedTrack.shape.getAbsoluteRotation();
			if(rotmap.has(selectedTrack.shape.id()))
				_crotation = rotmap.get(selectedTrack.shape.id());
            let _rotation = _crotation + rot;
            button.setAttribute("disabled", 1);
            var tween = new Konva.Tween({
                node: selectedTrack.shape,
                duration: .5,
                rotation: _rotation,
                onFinish: () => { 
                    button.removeAttribute("disabled");
                    selectedTrack.rotation = _rotation;
                    TStage.updateInfo(selectedTrack);
					logdata.data.end = new Date().getTime();
                    TStage.hookAfterMod(logdata);
					if (_rotation>0 && (_rotation-360)>0)
						_rotation-=360;
					else if(_rotation<0 && (_rotation+360)<0)
						_rotation+=360;
					rotmap.set(selectedTrack.shape.id(), _rotation);
					selectedTrack.shape.rotation(_rotation);
					// console.log(rotmap, rot, _crotation, _rotation);
               }
            });
            tween.play();            
            // selectedTrack.shape.rotate(45);
        }
    }

    document.getElementById("bRotateRight").onclick = function(e) {rotate(1,this);}
    document.getElementById("bRotateLeft").onclick = function(e) {rotate(0,this);}
    if(!!document.getElementById("bDelete")){
		document.getElementById("bDelete").onclick = function(e) {if(!!TStage.getSelectedTrack()) TStage.removeTrack(TStage.getSelectedTrack());}
	}
	
	if(!!document.getElementById("bSaveStage")){
		document.getElementById("bSaveStage").onclick = function(e) {
			TStage.saveCurrentStage();
			document.getElementById("bRestoreStage").removeAttribute("disabled");
			console.log(TStage.getSavedTrackData());
		}
	}

	if(!!document.getElementById("bRestoreStage")){
		document.getElementById("bRestoreStage").onclick = function(e) {
			TStage.restoreTrackData();
			document.getElementById("bForward").setAttribute("disabled", 1);
			document.getElementById("bBack").setAttribute("disabled", 1);
		}
	}

	
	if(!!document.getElementById("bBack")){
		document.getElementById("bBack").onclick = function(e) {        
			if(TStage.undo())
				document.getElementById("bForward").removeAttribute("disabled");
			if(TStage.getCurrentIndex() == 0)
				document.getElementById("bBack").setAttribute("disabled", 1);        
		};
	}

	if(!!document.getElementById("bForward")){
		document.getElementById("bForward").onclick = function(e) {
			if(TStage.redo()){
				document.getElementById("bBack").removeAttribute("disabled");
			}
			if(TStage.getCurrentIndex() == TStage.getStageDataHistory().length-1 )
				document.getElementById("bForward").setAttribute("disabled", 1);
		};
	}

	if(!!document.getElementById("bZoomIn")){
		document.getElementById("bZoomIn").onclick = function(e) {
			// TStage.zoom(2);
			if((scale+0.1)<=0.85){
				scale+=0.1;
				document.querySelector('#wrapper-inner').style.transform = "scale(" + scale + ")";
				TStage.setScale(scale);
				if(scale>=0.85)
					document.querySelector('#bZoomIn').setAttribute("disabled", 1);
					// e.target.setAttribute("disabled", 1);
				document.querySelector('#bZoomOut').removeAttribute("disabled");
				postLogEvent({
					action: {
						type: "zoom-in",
						data: {
							scale: scale,
							timestamp: new Date().getTime()
						}
					}
				});				
			}
		};
	}

	if(!!document.getElementById("bZoomOut")){
		document.getElementById("bZoomOut").onclick = function(e) {
			// TStage.zoom(0.5);
			if((scale-0.1)>=0.5){
				scale-=0.1;
				TStage.setScale(scale);
				document.querySelector('#wrapper-inner').style.transform = "scale(" + scale + ")";
				if(scale<=0.59)
					// e.target.setAttribute("disabled", 1);
					document.querySelector('#bZoomOut').setAttribute("disabled", 1);				
				document.querySelector('#bZoomIn').removeAttribute("disabled");
				postLogEvent({
					action: {
						type: "zoom-out",
						data: {
							scale: scale,
							timestamp: new Date().getTime()
						}
					}
				});
			}		
		};
	}


	if(!!document.getElementById("addTrackType")){
		let trackSel = document.getElementById("addTrackType");
		trackTypes.forEach(t => {
			var option = document.createElement("option");
			option.value = t;
			option.text = t;
			trackSel.appendChild(option);
		});
	}

	if(!!document.getElementById("bAddTrack")){
		document.getElementById("bAddTrack").onclick = function(e) {
			var button = this;
			button.setAttribute("disabled", 1);
			TStage.addTrack(
				{           
					type: document.getElementById("addTrackType").value || "TrackType1",
					pos: {x:50, y:50},
					width: parseInt(document.getElementById("addTrackWidth").value) || 2,
					height: parseInt(document.getElementById("addTrackHeight").value) || 6  
				}         
			);
			window.setTimeout(e => {
				button.removeAttribute("disabled");
			}, 1000);
		};
	}

	let scale = 0.85;
	document.querySelector('#wrapper-inner').style.transform = "scale(" + scale + ")";
	document.getElementById("bZoomIn").setAttribute("disabled", 1);

 })();
