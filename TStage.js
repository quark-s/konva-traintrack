var TStage = (function () {

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
        let savedTrackData = [];
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

        function hookBeforeMod(modinfo){    
            if(currentIndex<StageDataHistory.length)
                StageDataHistory = StageDataHistory.slice(0,currentIndex);
            StageDataHistory.push(saveTrackData());
        }
        function hookAfterMod(modinfo){
            document.getElementById("bForward").setAttribute("disabled",1);
            document.getElementById("bBack").removeAttribute("disabled");
            currentIndex = StageDataHistory.length;
        }

        function initGrid(){
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
            trackMap.forEach(element => {
                removeTrack(element);
            });
            data.forEach(element => {
                addTrack(element);
            });
            trackMap.forEach(element => {
                applyConnectors(element);
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

        function applyConnectors(track){
            if(!track)
                return;    
            track.connectors.forEach(c1 => {
                connectorMap.forEach(c2 => {
                    if(c1 != c2 && c2.parentTrack != c1.parentTrack){
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
                                c2.inverse == c1.inverse
                                && Math.abs((Math.abs(rot1) + Math.abs(rot2)) - 180) <= config.snapMaxRot 
                            ){
                                rejectTracks(c1,c2);
                                c1.parentTrack.highlight(1,"red");
                                c2.parentTrack.highlight(1,"red");
                            }
                            else 
                            {
                                c1.parentTrack.highlight(0);
                                c2.parentTrack.highlight(0);
                            }
                            console.log(rot1,rot2);
                        }
                        else 
                        {
                            c1.parentTrack.highlight(0);
                            c2.parentTrack.highlight(0);
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

        function removeTrack(_track){
            if(!_track)
                return false;

            _track.removeFromLayer();
            deselectAllTracks();
            return trackMap.delete(_track.id);        
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
            
            let track = trackMap.get(target.id());
            // target.find(".connector_f, .connector_m").forEach(c => {
            applyConnectors(track);
            updateInfo(trackMap.get(target.id()));
        
        });        

        //public elements
        return {
            "gridLayer": gridLayer,
            "layer": layer,
            "loadTrackData": loadTrackData,
            "getSelectedTrack": function(){return selectedTrack;},
            "hookBeforeMod": hookBeforeMod,
            "hookAfterMod": hookAfterMod,
            "updateInfo": updateInfo,
            "removeTrack": removeTrack,
            "addTrack": addTrack,
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

