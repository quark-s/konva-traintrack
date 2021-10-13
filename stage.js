// first we need to create a stage
var stage = new Konva.Stage({
    container: 'container',   // id of container <div>
    width: 1024,
    height: 768
});
  
// then create layer
var layer = new Konva.Layer();

let trackMap = new Map();
let connectorMap = new Map();
let selectedTrack = null;

let config = {
    snapMaxRot: 20
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
    console.log("align");
    return true;
}

function unplugTracks(c1, c2){
    if(!(c1 instanceof Connector) || !(c2 instanceof Connector))
        return false;
    console.log("unplug");
    c1.connectedTrack = null;
    c2.connectedTrack = null;    
}

let trackData = [
    {
        type: "TrackCrossType1",
        pos: {x:450, y:550},
        width: 50,
        height: 250
    },
    {
        type: "TrackJunctionType1",
        pos: {x:500, y:300},
        width: 50,
        height: 250
    },
    {
        type: "TrackJunctionType2",
        pos: {x:300, y:50},
        width: 50,
        height: 250
    },
    {
        type: "TrackType1",
        pos: {x:50, y:450},
        width: 50,
        height: 250
    },
    {
        type: "TrackType1",
        pos: {x:150, y:450},
        width: 50,
        height: 100
    },
    {
        type: "TrackType1",
        pos: {x:150, y:50},
        width: 50,
        height: 100
    },
    {
        type: "TrackType2",
        pos: {x:100, y:50},
        width: 50,
        height: 150
    },
    {
        type: "TrackType2",
        pos: {x:100, y:50},
        width: 50,
        height: 150
    },
]


function updateInfo(track){
    let info = document.getElementById("info");
    if(!!track){
        let type = track.shape.name();
        let id = track.shape.id();
        let rot = track.shape.getAbsoluteRotation();
        let tmp = "";
        track.connectors.forEach((c,i) => {
            let shape = c?.connectedTrack ? c.connectedTrack.shape.id() : "none";
            tmp += `<div>connector ${i}: ${shape} </div>`;
        });
        info.innerHTML = `
        <div>id: ${id}</div>
        <div>selected type: ${type}</div>
        <div>current rotation: ${rot}</div>
        <br/>
        <div>connectors: ${tmp}</div>
        `
    }
    else info.innerHTML = "";
    // else info.innerHTML = `
    // <div>selected type: <span id="infoSel">none</span></div>
    // `;
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
        let tmp = eval(`new ${d.type}(${JSON.stringify(d.pos)}, ${d.width}, ${d.height})`);
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


let twidth = 100;
let theight = 400;

let tmp = new Konva.Shape({
    sceneFunc: function(context) {
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, -theight);
        context.lineTo(twidth, -theight);
        context.lineTo(twidth, -(5*theight/9));
        context.quadraticCurveTo(
            twidth+twidth/2,
            -(3*theight/4), 
            twidth+twidth/2, 
            -theight
        );
        context.lineTo(2*twidth+twidth/2, -theight);
        context.quadraticCurveTo(
            2*twidth+twidth/2,
            -(theight/2),
            twidth,
            -(theight/9)
        );
        context.lineTo(twidth, 0);
        context.lineTo(0, 0);
        context.closePath();
        context.fillStrokeShape(this);
    },
    fill: "#eee",
    stroke: "red",
    strokeWidth: 2
});

let test = new Konva.Group({
    x: 200,
    y: 500,           
});

test.add(tmp);

// layer.add(tr);
// layer.add(test);
// console.log(nodeMap.values());

// add the layer to the stage
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
    
    console.log(target);
    let track = trackMap.get(target.id());
    if(!track)
        return;
    
    track.connectors.forEach(c1 => {
        if(!!c1.connectedTrack){
            c1.connectedTrack.connectors.forEach(c2 => {
                if(!!c2.connectedTrack && c2.connectedTrack == track){
                    if(!Konva.Util.haveIntersection(c1.boundingBox.getClientRect(), c2.boundingBox.getClientRect())){
                        unplugTracks(c1, c2);
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
        
    target.find(".connector_f, .connector_m").forEach(c => {
        let c1 = connectorMap.get(c.id());
        if(!c1)
            return;

        let _inverse = c.getName() == "connector_f" ? false: true;
        connectorMap.forEach(c2 => {
            if(c1 != c2 && c2.parentTrack != c1.parentTrack && c2.inverse != _inverse){
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
