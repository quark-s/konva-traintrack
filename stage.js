// first we need to create a stage
var stage = new Konva.Stage({
    container: 'container',   // id of container <div>
    width: 1024,
    height: 768
});
  
// then create layer
var layer = new Konva.Layer();
var gridLayer = new Konva.Layer();

let trackMap = new Map();
let connectorMap = new Map();
let selectedTrack = null;

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

let trackData = [
    {
        type: "TrackCrossType1",
        pos: {x:450, y:550},
        width: 2,
        height: 10
    },
    {
        type: "TrackJunctionType1",
        pos: {x:500, y:300},
        width: 2,
        height: 10
    },
    {
        type: "TrackJunctionType2",
        pos: {x:300, y:50},
        width: 2,
        height: 10
    },
    {
        type: "TrackType1",
        pos: {x:50, y:450},
        width: 2,
        height: 10
    },
    {
        type: "TrackType1",
        pos: {x:150, y:450},
        width: 2,
        height: 4
    },
    {
        type: "TrackType1",
        pos: {x:150, y:300},
        width: 2,
        height: 4
    },
    {
        type: "TrackType2",
        pos: {x:100, y:50},
        width: 2,
        height: 6
    },
    {
        type: "TrackType2",
        pos: {x:150, y:100},
        width: 2,
        height: 6
    },
    {
        type: "TrackType2",
        pos: {x:290, y:420},
        width: -2,
        height: 6
    },
    {
        type: "TrackType2",
        pos: {x:240, y:360},
        width: -2,
        height: 6
    },
    {
        type: "TrackType3",
        pos: {x:500, y:50},
        width: -2,
        height: 10
    },
    {
        type: "TrackType3",
        pos: {x:550, y:50},
        width: 2,
        height: 10
    },
]

function updateInfo(track){
    let info = document.getElementById("info");
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

trackData.forEach( (d) => {
    try {
        let factor = config.unitSize;
        let tmp = eval(`new ${d.type}(${JSON.stringify(d.pos)}, ${factor*d.width}, ${factor*d.height})`);
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
});


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
                    console.log(rot1, rot2);
                    if(Math.abs(rot1-rot2)<=config.snapMaxRot){
                        alignTracks(c1,c2);
                    }                  
                }                
            }
        });
    });

    updateInfo(trackMap.get(target.id()));

  });



(function() {

    function rotate(dir){
        let rot = !!dir ? 45 : -45;
        if(!!selectedTrack){
            var tween = new Konva.Tween({
                node: selectedTrack.shape,
                duration: .5,
                rotation: selectedTrack.shape.getAbsoluteRotation() + rot,
                onFinish: () => updateInfo(selectedTrack)
              });
              tween.play();
              // selectedTrack.shape.rotate(45);
        }
    }

    document.getElementById("bRotateRight").onclick = (e) => rotate(1);
    document.getElementById("bRotateLeft").onclick = (e) => rotate(0);

 })();
