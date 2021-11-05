// first we need to create a stage
var stage = new Konva.Stage({
    container: 'container',   // id of container <div>
    width: 1366,
    height: 768
});
  
// then create layer
var layer = new Konva.Layer();
var gridLayer = new Konva.Layer();

let trackMap = new Map();
let connectorMap = new Map();
let selectedTrack = null;
let savedStageData = [];
let StageDataHistory = [];
let currentIndex = 0;

let config = {
    snapMaxRot: 20,
    unitSize: 25        //pixels per grid unit
}

var tr = new Konva.Transformer();
tr.rotationSnaps([0, 45, 90, 135, 180, 225, 270, 315]);
tr.rotationSnapTolerance(40);
tr.resizeEnabled(false);
tr.anchorSize(20);




function createUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
       var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
       return v.toString(16);
    });
 }


function hookBeforeMod(modinfo){    
    if(currentIndex<StageDataHistory.length)
        StageDataHistory = StageDataHistory.slice(0,currentIndex);
    StageDataHistory.push(saveStageData());
}
function hookAfterMod(modinfo){
    document.getElementById("bForward").setAttribute("disabled",1);
    document.getElementById("bBack").removeAttribute("disabled");
    currentIndex = StageDataHistory.length;
}


function saveStageData(){
    let _savedStageData = [];
    trackMap.forEach(element => {
        let data = element.data;
        data.width = Math.floor(data.width/config.unitSize);
        data.height = Math.floor(data.height/config.unitSize);
        _savedStageData.push(data);
    });
    return _savedStageData;
}


function loadTrackData(data){
    trackMap.forEach(element => {
        removeTrack(layer, element);
    });            
    data.forEach(element => {
        addTrack(element);
    });
}

function haveIntersection(r1, r2) {
    return !(
      r2.x > r1.x + r1.width ||
      r2.x + r2.width < r1.x ||
      r2.y > r1.y + r1.height ||
      r2.y + r2.height < r1.y
    );
}

function alignTracks(c1, c2){
    if(!(c1 instanceof Connector) || !(c2 instanceof Connector))
        return false;
    
    let rotDiff = c1.shape.getAbsoluteRotation() - c2.shape.getAbsoluteRotation();
    let pos1 = c1.shape.absolutePosition();
    let pos2 = c2.shape.absolutePosition();
    xDiff = pos1.x - pos2.x;
    yDiff = pos1.y - pos2.y;
    let trackShape = c1.parentTrack.shape;
    trackShape.x(trackShape.x()-xDiff);
    trackShape.y(trackShape.y()-yDiff);
    trackShape.rotation(trackShape.rotation()-rotDiff);
    c1.connectedTrack = c2.parentTrack;
    c2.connectedTrack = c1.parentTrack;
    // if(!c1.inverse)
    //     c1.parentTrack.shape.moveToTop();
    // else
    //     c2.parentTrack.shape.moveToTop();
    // console.log("align");
    return true;
}

function unplugTracks(c1, c2){
    if(!(c1 instanceof Connector) || !(c2 instanceof Connector))
        return false;
    // console.log("unplug");
    c1.connectedTrack = null;
    c2.connectedTrack = null;    
}

let trackTypes = [
    "TrackType1",
    "TrackType2",
    "TrackType3",
    "TrackCrossType1",
    "TrackJunctionType1",
    "TrackJunctionType2"
]


function updateInfo(track){
    let info = document.getElementById("info");
    track = !!track ? track : selectedTrack;
    if(!!track){
        let type = track.shape.name();
        let id = track.shape.id();
        let rot = track.shape.getAbsoluteRotation();
        let pos = track.shape.x() + ", " + track.shape.y();
        let tmp = "";
        track.connectors.forEach((c,i) => {
            let shape = c?.connectedTrack ? c.connectedTrack.shape.id() : "none";
            tmp += `<div>connector ${i}: ${shape} </div>`;
        });
        info.innerHTML = `
        <div>id: ${id}</div>
        <div>type: ${type}</div>
        <div>pos: ${pos}</div>
        <div>rotation: ${rot}</div>
        <br/>
        <div>connectors: ${tmp}</div>
        `
    }
    // else info.innerHTML = "";
    else info.innerHTML = `
    <div>nothing selected</div>
    `;
}

function cbTrackSelected(track){
    deselectAllTracks(layer);
    track.select();
    tr.nodes([track.shape]);
    selectedTrack = track;
    track.shape.moveToTop();
    updateInfo(selectedTrack);
}

function deselectAllTracks(_layer){
    _layer.getChildren((node) => {
        return node.getType() === "Group"
    }).forEach((node) => {
        if(trackMap.has(node.id()))
        trackMap.get(node.id()).select(0);        
    });
    tr.nodes([]);
    selectedTrack = null;
    updateInfo(null);
}

function addTrack(d){    
    try {
        let factor = config.unitSize;
        let tmp = eval(`new ${d.type}(${JSON.stringify(d.pos)}, ${factor*parseInt(d.width)}, ${factor*parseInt(d.height)}, ${d.rotation})`);
        // let tmp = new window[d.type](d.pos, d.width, d.height);
        tmp.onSelect = cbTrackSelected;
        trackMap.set(tmp.id, tmp);
        tmp.connectors.forEach((c) => {
            if(!!c)
                connectorMap.set(c.id, c);
        });
        tmp.addToLayer(layer);
    
    } catch (error) {
        console.log(error)
    }   
}

function removeTrack(_layer, _track){
    if(!_track)
        return false;

    _track.removeFromLayer();
    deselectAllTracks(_layer);
    return trackMap.delete(_track.id);        
}

trackData.forEach( (d) => {
    addTrack(d);
});




/****** grid ********/

let nLinesV = Math.floor(stage.width() / config.unitSize);
let nLinesH = Math.floor(stage.height() / config.unitSize);

for(let i=0; i<nLinesV; i++){
    let x0 = (i)*config.unitSize;
    var line = new Konva.Line({
        x: x0,
        y: 0,
        points: [0, 0, 0, stage.height()],
        stroke: '#aaa',
        strokeWidth: 1,
        // tension: 1,
        dash: [2,2]
      });
      gridLayer.add(line);
}

for(let i=0; i<nLinesH; i++){
    let y0 = (i)*config.unitSize;
    var line = new Konva.Line({
        x: 0,
        y: y0,
        points: [0, 0, stage.width(), 0],
        stroke: '#aaa',
        strokeWidth: 1,
        tension: 1,
        dash: [2,2]
      });
      gridLayer.add(line);
}




// layer.add(tr);
// layer.add(test);
// console.log(nodeMap.values());

// add the layer to the stage
stage.add(gridLayer);
stage.add(layer);

// draw the image
layer.draw();



stage.on('click tap', (e) => {    
    if(!!selectedTrack && e.target === stage || e.target === layer){
        deselectAllTracks(layer);
    }
});


layer.on('dragstart', function (e) {

    var target = e.target;
    if(target.getType() !== "Group")
        return;

    e.target.moveToTop();
    hookBeforeMod({type: "move"});
});

layer.on('dragend', function (e) {
    var target = e.target;
    if(target.getType() !== "Group")
        return;
    
    // console.log(target);
    let track = trackMap.get(target.id());
    if(!track)
        return;
    
    track.connectors.forEach(c1 => {
        if(!!c1.connectedTrack){
            c1.connectedTrack.connectors.forEach(c2 => {
                if(!!c2.connectedTrack && c2.connectedTrack == track){
                    if(!Konva.Util.haveIntersection(c1.boundingBox.getClientRect(), c2.boundingBox.getClientRect())){
                        unplugTracks(c1, c2);
                        updateInfo(track);
                    }
                }
            })
        }
    });

    hookAfterMod({type: "move"});
});

layer.on('dragmove', function (e) {
    var target = e.target;
    if(target.getType() !== "Group")
        return;
    
    if(!trackMap.has(target.id()))
        return;
    
    target.find(".connector_f, .connector_m").forEach(c => {
        let c1 = connectorMap.get(c.id());
        if(!c1)
            return;

        connectorMap.forEach(c2 => {
            if(c1 != c2 && c2.parentTrack != c1.parentTrack && c2.inverse == !c1.inverse){
                if(Konva.Util.haveIntersection(c1.boundingBox.getClientRect(), c2.boundingBox.getClientRect())){
                    let rot1 = c1.shape.getAbsoluteRotation();
                    let rot2 = c2.shape.getAbsoluteRotation();
                    // console.log(rot1, rot2);
                    if(
                        Math.abs(rot1-rot2) <= config.snapMaxRot 
                        || (180 - Math.abs(rot1) <= config.snapMaxRot && 180 - Math.abs(rot2) <= config.snapMaxRot )
                        ){
                            alignTracks(c1,c2);
                        }                  
                }
            }
        });
    });

    updateInfo(trackMap.get(target.id()));

  });



(function() {

    function rotate(dir, button){
        let rot = !!dir ? 45 : -45;
        if(!!selectedTrack){
            hookBeforeMod({type: "rotate"});
            let _rotation = selectedTrack.shape.getAbsoluteRotation() + rot;
            button.setAttribute("disabled", 1);
            var tween = new Konva.Tween({
                node: selectedTrack.shape,
                duration: .5,
                rotation: _rotation,
                onFinish: () => { 
                    button.removeAttribute("disabled");
                    selectedTrack.rotation = _rotation;
                    updateInfo(selectedTrack);
               }
            });
            tween.play();
            hookAfterMod({type: "rotate"});
            // selectedTrack.shape.rotate(45);
        }
    }

    document.getElementById("bRotateRight").onclick = function(e) {rotate(1,this);}
    document.getElementById("bRotateLeft").onclick = function(e) {rotate(0,this);}
    document.getElementById("bDelete").onclick = function(e) {if(!!selectedTrack) removeTrack(layer, selectedTrack);}

    document.getElementById("bSaveStage").onclick = function(e) {
        savedStageData = saveStageData();
        document.getElementById("bRestoreStage").removeAttribute("disabled");
        // console.log(savedStageData);
    }

    document.getElementById("bRestoreStage").onclick = function(e) {
        if(savedStageData.length==0)
            return;
        StageDataHistory = [];
        document.getElementById("bForward").setAttribute("disabled", 1);
        document.getElementById("bBack").setAttribute("disabled", 1);
        loadTrackData(savedStageData);
    }

    document.getElementById("bBack").onclick = function(e) {
        if(StageDataHistory.length){
            if(currentIndex==StageDataHistory.length)
                StageDataHistory.push(saveStageData());
            loadTrackData(StageDataHistory[--currentIndex]);
            document.getElementById("bForward").removeAttribute("disabled");
        }
        if(currentIndex==0)
            document.getElementById("bBack").setAttribute("disabled", 1);        
    };

    document.getElementById("bForward").onclick = function(e) {
        if(currentIndex<StageDataHistory.length-1){
            loadTrackData(StageDataHistory[++currentIndex]);
            document.getElementById("bBack").removeAttribute("disabled");
        }
        
        if(currentIndex==StageDataHistory.length-1)
            document.getElementById("bForward").setAttribute("disabled", 1);
    };



    let trackSel = document.getElementById("addTrackType");
    trackTypes.forEach(t => {
        var option = document.createElement("option");
        option.value = t;
        option.text = t;
        trackSel.appendChild(option);
    });

    document.getElementById("bAddTrack").onclick = function(e) {
        var button = this;
        button.setAttribute("disabled", 1);
        addTrack(
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



 })();
