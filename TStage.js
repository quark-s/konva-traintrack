var TStage = (function () {

        // first we need to create a stage
        var stage = new Konva.Stage({
            container: 'container',   // id of container <div>
            // width: 1366,
            // height: 768
            width: 1024*2,
            height: 768*2
        });
        
        // then create layer
        var layer = new Konva.Layer();
        var gridLayer = new Konva.Layer();

        let trackMap = new Map();
        let connectorMap = new Map();
        let selectedTrack = null;
        let savedTrackData = [];
        let StageDataHistory = [];
        let currentIndex = 0;

        let replayMode = false;

        let scale = 0.85;
        let boundaries = {
            0.85: {
                x: 1043,
                y: 745
            },
            0.75: {
                x: 1177,
                y: 845
            },
            0.65: {
                x: 1360,
                y: 975
            },
            0.55: {
                x: 1610,
                y: 1150
            },
        }

        let currentMove = {
            id: null,
            start: null,
            end: null,
            pos1:{
                    x:0,
                    y:0
            },
            pos2:{
                    x:0,
                    y:0
            }
        }        

        let config = {
            snapMaxRot: 20,
            unitSize: 25        //pixels per grid unit
        }
        let actionStack = [];

        var tr = new Konva.Transformer();
        tr.rotationSnaps([0, 45, 90, 135, 180, 225, 270, 315]);
        tr.rotationSnapTolerance(40);
        tr.resizeEnabled(false);
        tr.anchorSize(20);

        function hookBeforeMod(modinfo){    
            if(currentIndex<StageDataHistory.length)
                StageDataHistory = StageDataHistory.slice(0,currentIndex);
            StageDataHistory.push(saveTrackData());
        }
        function hookAfterMod(modinfo){
            if(!!document.getElementById("bForward") && !!document.getElementById("bBack")){
                document.getElementById("bForward").setAttribute("disabled",1);
                document.getElementById("bBack").removeAttribute("disabled");
            }
            postLogEvent({
                stagedata: saveTrackData(),
                action: modinfo
            });            
            currentIndex = StageDataHistory.length;
            actionStack.push(modinfo);
        }

        function initGrid(){
            gridLayer.destroyChildren()
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
        }

        function saveTrackData(){
            let _savedTrackData = [];
            trackMap.forEach(element => {
                let data = element.data;
                data.width = Math.floor(data.width/config.unitSize);
                data.height = Math.floor(data.height/config.unitSize);
                _savedTrackData.push(data);
            });
            return _savedTrackData;
        }


        function loadTrackData(data){
            try {
                trackMap.forEach(element => {
                    removeTrack(element);
                });
                data.forEach(element => {
                    addTrack(element);
                });
                trackMap.forEach(element => {
                    applyConnectors(element);
                });
                return true;
            } catch (error) {
                throw new Error("couldn't load stage data: \n" + error);
            }
        }

        function haveIntersection(r1, r2) {
            return !(
            r2.x > r1.x + r1.width ||
            r2.x + r2.width < r1.x ||
            r2.y > r1.y + r1.height ||
            r2.y + r2.height < r1.y
            );
        }

        function applyConnectors(track){
            if(!track)
                return;
            let numFalseIntersections = 0;
            track.connectors.forEach(c1 => {
                connectorMap.forEach(c2 => {
                    if(c1 != c2 && c2.parentTrack.id != c1.parentTrack.id){                        
                        if(Konva.Util.haveIntersection(c1.boundingBox.getClientRect(), c2.boundingBox.getClientRect())){
                            let rot1 = c1.shape.getAbsoluteRotation();
                            let rot2 = c2.shape.getAbsoluteRotation();                            
                            // console.log(rot1, rot2);
                            if(
                                c2.inverse == !c1.inverse
                                && Math.abs(rot1-rot2) <= config.snapMaxRot 
                                || (180 - Math.abs(rot1) <= config.snapMaxRot && 180 - Math.abs(rot2) <= config.snapMaxRot )
                            ){
                                alignTracks(c1,c2);
                            }

                            else if(
                                !replayMode
                                && c2.inverse == c1.inverse
                                && Math.abs((Math.abs(rot1) + Math.abs(rot2)) - 180) <= config.snapMaxRot 
                            ){
                                rejectTracks(c1,c2);
                                c1.parentTrack.highlight(1,"red", "#fd9fa8");
                                c2.parentTrack.highlight(1,"red", "#fd9fa8");
								numFalseIntersections++;
                            }
                            else
                            {
                                c1.parentTrack.highlight(c1.parentTrack._group.isDragging());
                                c2.parentTrack.highlight(c2.parentTrack._group.isDragging());
                            }
                            // console.log(rot1,rot2);
                        }
                        else if(numFalseIntersections==0)
                        {
                            c1.parentTrack.highlight(c1.parentTrack._group.isDragging());
                            c2.parentTrack.highlight(c2.parentTrack._group.isDragging());
                        }
                    }
                });
            });
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


        function rejectTracks(c1, c2){
            console.log("rejectTracks");
        }

        function unplugTracks(c1, c2){
            if(!(c1 instanceof Connector) || !(c2 instanceof Connector))
                return false;
            // console.log("unplug");
            c1.connectedTrack = null;
            c2.connectedTrack = null;    
        }

        function updateInfo(track){
            let info = document.getElementById("info");
            track = !!track ? track : selectedTrack;
            let mpos = stage.getPointerPosition().x + ", " + stage.getPointerPosition().y;
            if(!!track){
                let type = track.shape.name();
                let id = track.id;
                let rot = track.shape.getAbsoluteRotation();
                let abspos = track.shape.absolutePosition().x + ", " + track.shape.absolutePosition().y;
                let abspos_ = track.shape.getAbsolutePosition(stage).x + ", " + track.shape.getAbsolutePosition(stage).y;
                let pos = track.shape.x() + ", " + track.shape.y();
                let tmp = "";
                track.connectors.forEach((c,i) => {
                    let shape = c?.connectedTrack ? c.connectedTrack.id : "none";
                    tmp += `<div>connector ${i}: ${shape} </div>`;
                });
                info.innerHTML = `
                <div>id: ${id}</div>
                <div>type: ${type}</div>
                <div>pos: ${pos}</div>
                <div>abs pos: ${abspos}</div>
                <div>abs pos (stage): ${abspos_}</div>
                <div>rotation: ${rot}</div>
                <br/>
                <div>connectors: ${tmp}</div>
                <div>mouse position: ${mpos}</div>
                `
            }
            // else info.innerHTML = "";
            else info.innerHTML = `
                 <div>nothing selected</div>
                 <div>mouse position: ${mpos}</div>
            `;
        }

        function selectTrack(id){
            if(trackMap.has(id))
                cbTrackSelected(trackMap.get(id))
        }

        function cbTrackSelected(track){
            deselectAllTracks(layer);
            track.select();
            tr.nodes([track.shape]);
            selectedTrack = track;
            track.shape.moveToTop();
            updateInfo(selectedTrack);
        }

        function deselectAllTracks(){
            layer.getChildren((node) => {
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
                let _pos = {x: d.pos.x * stage.scaleX(), y: d.pos.y * (1/stage.scaleX())};
                let factor = config.unitSize;
                // let tmp = eval(`new ${d.type}(${JSON.stringify(_pos)}, ${factor*parseInt(d.width)}, ${factor*parseInt(d.height)}, ${d.rotation})`);
                let tmp = eval(`new ${d.type}(${JSON.stringify(d.pos)}, ${factor*parseInt(d.width)}, ${factor*parseInt(d.height)}, ${d.rotation})`);
                // let tmp = new window[d.type](d.pos, d.width, d.height);
                if(!!d.id && replayMode)
                    tmp.id = d.id;
                if(!replayMode){
                    tmp.onSelect = cbTrackSelected;
                    tmp.shape.on('dragstart', dragstart);
                    tmp.shape.on('dragend', dragend);
                    tmp.shape.on('dragmove', dragmove);
                }

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

        function removeTrack(_track){
            if(!_track)
                return false;

            _track.removeFromLayer();
            deselectAllTracks();
            return trackMap.delete(_track.id);        
        }

        function zoom(scaleBy){
            // e.evt.preventDefault();
            var oldScale = stage.scaleX();
        
            var center = {
                x: stage.width() / 2,
                y: stage.height() / 2,
            };
        
            var relatedTo = {
                x: (center.x - stage.x()) / oldScale,
                y: (center.y - stage.y()) / oldScale,
            };
        
            var newScale = scaleBy;
            // oldScale * scaleBy;
            // e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        
            stage.scale({
                x: newScale,
                y: newScale
            });
        
            var newPos = {
                x: center.x - relatedTo.x * newScale,
                y: center.y - relatedTo.y * newScale,
            };
            
            initGrid();
            stage.position(newPos);
            stage.batchDraw();
        }        


        function setScale(_scale){
            scale = (!isNaN(_scale) && _scale <= 0.85 && _scale >= 0.5) ? _scale : 0.85;
        }

        function dragstart(e) {
            // console.log("dragstart");
            var target = e.target;
            if(target.getType() !== "Group")
                return;
        
            let track = trackMap.get(target.id());
            if(!track)
                return;

            e.target.moveToTop();

            // dragging while a transformer contains nodes will cause an exception => deselect all first
            deselectAllTracks();
            // make it appear selected visually
            track.highlight();

            currentMove.id = track.id;
            currentMove.pos1.x = track.shape.absolutePosition().x;  
            currentMove.pos1.y = track.shape.absolutePosition().y;
            currentMove.start = new Date().getTime();
            // currentMove.start = new Date().toUTCString();
            // currentMove.pos1.x = track.shape.x();
            // currentMove.pos1.y = track.shape.y();
            hookBeforeMod({
                type: "move",
                data: _.cloneDeep(currentMove)
            });
        }

        function dragend (e) {
            // console.log("dragend");
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
        
            currentMove.pos2.x = track.shape.absolutePosition().x;
            currentMove.pos2.y = track.shape.absolutePosition().y;
            currentMove.end = new Date().getTime();
            // currentMove.end = new Date().toUTCString();
            // currentMove.pos2.x = track.shape.x();
            // currentMove.pos2.y = track.shape.y();            
            hookAfterMod({
                type: "move",
                data: _.cloneDeep(currentMove)
            });

            // @see dragstart => add track to transformer again 
            cbTrackSelected(track);
        }

        function dragmove(e) {
            // console.log("dragmove");
            var target = e.target;
            if(target.getType() !== "Group")
                return;
            
            if(!trackMap.has(target.id()))
                return;
            
            let mpos = stage.getPointerPosition();
            if(mpos.x<=0){
                target.x(0);
            }
            if(mpos.y<=0){
                target.y(0);
            }
            if(mpos.x >= boundaries[scale].x){
                target.x(boundaries[scale].x);
            }
            if(mpos.y >= boundaries[scale].y){
                target.y(boundaries[scale].y);
            }

            let track = trackMap.get(target.id());
            // target.find(".connector_f, .connector_m").forEach(c => {
            applyConnectors(track);
            updateInfo(trackMap.get(target.id()));
        }

        initGrid();
        stage.add(gridLayer);
        stage.add(layer);        
        // layer.draw();        

        stage.on('click tap', (e) => {    
            if(!!selectedTrack && e.target === stage || e.target === layer){
                deselectAllTracks(layer);
            }
        });

        stage.on('mousemove', function (e) {
            updateInfo();
        });

        // stage.on('dragstart', dragstart);        
        // stage.on('dragend', dragend);        
        // stage.on('dragmove', dragmove);        

        //public elements
        return {
            "gridLayer": gridLayer,
            "layer": layer,
            "loadTrackData": loadTrackData,
            "getSelectedTrack": function(){return selectedTrack;},
            "selectTrack": function(id){return selectTrack(id);},
            "hookBeforeMod": hookBeforeMod,
            "hookAfterMod": hookAfterMod,
            "updateInfo": updateInfo,
            "removeTrack": removeTrack,
            "addTrack": addTrack,
            "zoom": zoom,
            "setScale": setScale,
            
            "initGrid": initGrid,
            "gridlayer": gridLayer,
            "layer": layer,
            "stage": stage,
            "toggleReplayMode": function(){
                replayMode = !replayMode;
            },

            "saveCurrentStage": function(){
                savedTrackData = saveTrackData();
            },
            "restoreTrackData": function(){
                if(savedTrackData.length==0)
                    return;                
                StageDataHistory = [];
                loadTrackData(savedTrackData);
            },
            "undo": function(){
                if(StageDataHistory.length){
                    if(currentIndex==StageDataHistory.length)
                        StageDataHistory.push(saveTrackData());
                    loadTrackData(StageDataHistory[--currentIndex]);
                    return true;
                }
                return false;
            },
            "redo": function(){
                if(currentIndex<StageDataHistory.length-1){
                    loadTrackData(StageDataHistory[++currentIndex]);
                    return true;
                }
                return false;
            },
            "getCurrentIndex": function(){return currentIndex},
            "getSavedTrackData": function(){return savedTrackData},
            "getStageDataHistory": function(){return StageDataHistory},
        }
})();

