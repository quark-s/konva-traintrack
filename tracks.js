class Connector{
    
    constructor(pos, cWidth, cHeight, inverse, parent){
        
        this._options = {
            fill: '#EEE',
            stroke: 'black',
            strokeWidth: 2,
            name: 'connector_m'
        };
        this._cWidth = !isNaN(cWidth) ? cWidth : 150;
        this._cHeight = !isNaN(cHeight) ? cHeight : 50;
        this._inverse = false;
        this._id = createUUID();
        this.parentTrack = parent;
        this.connectedTrack = null;
        this._isSelected = false;
        if(typeof inverse == "boolean" && inverse){
            this._cHeight = -this._cHeight;
            this._options.fill = "#FFF";
            this._inverse = true;
            this._options.name =  'connector_f';
        }
        this._pos = !isNaN(pos?.x) && !isNaN(pos?.y) ? pos : {x:0, y:0};

        this.init();
    }

    init(){
        let that = this;

        this._group = new Konva.Group({
            x: this._pos.x,
            y: this._pos.y,
            width: this._cWidth,
            height: this._cHeight,            
            name: this._options.name,
            id: this._id
        });
        
        this._shape = new Konva.Shape({
                sceneFunc: function(context) {
                context.beginPath();
                context.moveTo(that._cWidth/3, 0);
                context.quadraticCurveTo(
                                            (that._cWidth/3) - that._cWidth/6, 
                                            that._cHeight, 
                                            ( that._cWidth/3) + that._cWidth/6, 
                                            that._cHeight
                                        );
                context.quadraticCurveTo(
                                            2*that._cWidth/3 + that._cWidth/6,
                                            that._cHeight,
                                            2*that._cWidth/3,
                                            0
                                        );        
                context.fillStrokeShape(this);
            },
            fill: this._options.fill,
            stroke: this._options.stroke,
            strokeWidth: this._options.strokeWidth,
            name: this._options.name + "_shape",
            id: createUUID()
        });
        this._group.add(this._shape);
        
        this._boundingBox = new Konva.Rect({
            x: this._cWidth/3,
            y: 0,
            width: this._cWidth/3,
            height: this._cHeight,
            stroke: 'red',
            strokeWidth: 0,
            // strokeWidth: 1,
            name: this._options.name + "_bounding",
            id: createUUID()
        });
        this._group.add(this._boundingBox);      
    }


    highlight(p){
        if(!!p)
            this._boundingBox.stroke("green");
        else
            this._boundingBox.stroke("red");
    }

    select(p){
        if(typeof p == "undefined")
            p = true; 
        if(!!p && !this._isSelected){
            this._shape.stroke("green");
            this._isSelected = true;
        }
        else if(this._isSelected){
            this._shape.stroke(this._options.stroke);
            this._isSelected = false;
        }
    }    

    get selected(){
        return this._isSelected;
    }

    get shape(){
        return this._group;
    }

    get id(){
        return this._id;
    }

    get boundingBox(){
        return this._boundingBox;
    }


    get parentTrack(){
        return this._track;
    }
    set parentTrack(track){
        //TODO validation
        this._track = track;
    }    
    
    get connectedTrack(){
        return this._connectedTrack;
    }
    set connectedTrack(track){
        //TODO validation
        this._connectedTrack = track;
    }    

    get inverse(){
        this._inverse
    }
}


class TrackType1{

    constructor(pos, cWidth, cHeight){
        this._options = {
            fill: '#EEE',
            stroke: 'black',
            strokeWidth: 2,
            name: 'trackType1'
        };
        this._cWidth = !isNaN(cWidth) ? cWidth : 150;
        this._cHeight = !isNaN(cHeight) ? cHeight : 500;
        this._pos = !isNaN(pos?.x) && !isNaN(pos?.y) ? pos : {x:0, y:0};
        this._connector1 = null;
        this._connector2 = null;
        this._track = null;
        this._group = null;
        this._isSelected = false;
        this._onSelect = null;
        this._id = createUUID();
        this.init();        
    }
    
    init() {
        this._connector1 = new Connector({x:0, y: this._options.strokeWidth/2}, this._cWidth, -this._cWidth/3, false, this);
        this._connector2 = new Connector({x:0, y: this._cHeight + this._options.strokeWidth/2}, this._cWidth, this._cWidth/3, true, this);
        this._track = new Konva.Rect({
            x: 0,
            y: 0,
            width: this._cWidth,
            height: this._cHeight,
            fill: this._options.fill,
            stroke: this._options.stroke,
            strokeWidth: this._options.strokeWidth,
            name: this._options.name + '_body',
            id: createUUID()
        });               

        this._group = new Konva.Group({
            draggable: true,
            name: this._options.name,
            x: this._pos.x,
            y: this._pos.y,
            width: this._cWidth,
            height: this._cHeight,
            id: this.id
        });
        this._group .add( this._track, this._connector1.shape, this._connector2.shape);
        this._group .on('mouseover', function () {
            document.body.style.cursor = 'pointer';
        });
        this._group .on('mouseout', function () {
            document.body.style.cursor = 'default';
        });

        // this._group.on('dblclick dbltap', (e) => {
        this._group.on('click tap', (e) => {
            if(typeof this._onSelect == "function")
                this._onSelect(this);
        });
    }

    select(p){       
        if(typeof p == "undefined")
            p = true; 
        if(!!p && !this._isSelected){
            this._track.stroke("green");
            this.connectors.forEach((c) => c.select(1));
            this._isSelected = true;
        }
        else if (this._isSelected){
            this._track.stroke(this._options.stroke);
            this.connectors.forEach((c) => c.select(0));
            this._isSelected = false;
        }
    }

    addToLayer(layer){
        layer.add(this._group);
    }

    get selected(){
        return this._isSelected;
    }

    get shape(){
        return this._group;
    }

    get id(){
        return this._id;
    }

    get connectors(){
        return [this._connector1, this._connector2];
    }

    get onSelect(){
        return this._onSelect;
    }

    set onSelect(callback){
        if(typeof callback == "function")
            this._onSelect = callback;
    }
}


class TrackType2{

    constructor(pos, cWidth, cHeight){
        this._options = {
            fill: '#EEE',
            stroke: 'black',
            strokeWidth: 2,
            name: 'trackType2'
        };
        this._cWidth = !isNaN(cWidth) ? cWidth : 150;
        this._cHeight = !isNaN(cHeight) ? cHeight : 500;
        this._innerRadius = this._cHeight - this._cWidth;
        this._outerRadius = this._cHeight;
        this._angle = 90;
        this._pos = !isNaN(pos?.x) && !isNaN(pos?.y) ? pos : {x:0, y:0};
        this._connector1 = null;
        this._connector2 = null;
        this._track = null;
        this._group = null;
        this._isSelected = false;
        this._onSelect = null;
        this._id = createUUID();
        this.init();
    }
    
    init(){

        this._connector1 = new Connector({x:this._cHeight - this._cWidth, y: this._options.strokeWidth/2}, this._cWidth, -this._cWidth/3, false, this);

        this._connector2 = new Connector({x:-this._options.strokeWidth/2, y: this._cHeight}, this._cWidth, this._cWidth/3, true, this);
        this._connector2.shape.rotation(90);
        this._connector2.shape.y(this._connector2.shape.y()-this._cWidth);

        this._track = new Konva.Arc({
            x: 0,
            y: 0,
            innerRadius: this._innerRadius,
            outerRadius: this._outerRadius,
            fill: this._options.fill,
            stroke: this._options.stroke,
            strokeWidth: this._options.strokeWidth,
            name: this._options.name + '_body',
            angle: this._angle,
            id: createUUID(),
        });

        let boundingBox = this._track.getClientRect();
        this._boundingBox = new Konva.Rect({
            x: boundingBox.x,
            y: boundingBox.y,
            width: boundingBox.width,
            height: boundingBox.height,
            stroke: 'red',
            strokeWidth: 0,
            // strokeWidth: 1,
            name: this._options.name + "_bounding",
            id: createUUID()
        });        

        this._group = new Konva.Group({
            draggable: true,
            name: this._options.name,
            x: this._pos.x,
            y: this._pos.y,
            // width: this._cWidth,
            // height: this._cHeight,
            id: this.id
        });

        this._group.on('mouseover', function () {
            document.body.style.cursor = 'pointer';
        });
        this._group.on('mouseout', function () {
            document.body.style.cursor = 'default';
        });

        // this._group.on('dblclick dbltap', (e) => {
        this._group.on('click tap', (e) => {
            if(typeof this._onSelect == "function")
                this._onSelect(this);
        })        

        // this._group.add(this._boundingBox);
        this._group .add( this._track, this._connector1.shape, this._connector2.shape);
    }

    select(p){       
        if(typeof p == "undefined")
            p = true; 
        if(!!p && !this._isSelected){
            this._track.stroke("green");
            this.connectors.forEach((c) => c.select(1));
            this._isSelected = true;
        }
        else if (this._isSelected){
            this._track.stroke(this._options.stroke);
            this.connectors.forEach((c) => c.select(0));
            this._isSelected = false;
        }
    }

    addToLayer(layer){
        layer.add(this._group);
    }

    get selected(){
        return this._isSelected;
    }

    get shape(){
        return this._group;
    }

    get id(){
        return this._id;
    }

    get connectors(){
        return [this._connector1, this._connector2];
    }

    get onSelect(){
        return this._onSelect;
    }

    set onSelect(callback){
        if(typeof callback == "function")
            this._onSelect = callback;
    }    
}




class TrackJunctionType1{

    constructor(pos, cWidth, cHeight){
        this._options = {
            fill: '#EEE',
            stroke: 'black',
            strokeWidth: 2,
            name: 'TrackJunctionType1'
        };
        this._cWidth = !isNaN(cWidth) ? cWidth : 150;
        this._cHeight = !isNaN(cHeight) ? cHeight : 500;
        this._pos = !isNaN(pos?.x) && !isNaN(pos?.y) ? pos : {x:0, y:0};
        this._connector1 = null;
        this._connector2 = null;
        this._connector3 = null;
        this._track = null;
        this._group = null;
        this._isSelected = false;
        this._onSelect = null;
        this._id = createUUID();
        this.init();
    }
    
    init(){
        
        let twidth = this._cWidth;
        let theight = this._cHeight;

        this._connector2 = new Connector({x:0, y: this._options.strokeWidth/2}, this._cWidth, -this._cWidth/3, false, this);
        this._connector1 = new Connector({x:0, y: 3*twidth+this._options.strokeWidth/2}, twidth, twidth/3, true, this);

        this._connector3 = new Connector({x:3*twidth+twidth/2 - this._options.strokeWidth/2, y: 3*twidth+twidth/2}, twidth, -twidth/3, true, this);
        this._connector3.shape.rotation(-90);
        this._connector3.shape.scaleY(-this._connector3.shape.scaleY());
        this._connector3.shape.move({x: this._options.strokeWidth});

        this._track = new Konva.Shape({
            sceneFunc: function(context) {
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(twidth, 0);
                context.quadraticCurveTo(
                    twidth,
                    2*twidth+twidth/2, 
                    3*twidth+twidth/2, 
                    2*twidth+twidth/2
                );
                context.lineTo(3*twidth+twidth/2, 3*twidth+twidth/2);
                context.quadraticCurveTo(
                    //twidth,
                    twidth+twidth/4, 
                    3*twidth+twidth/2, 
                    twidth, 
                    2*twidth+twidth/2
                );
                context.lineTo(twidth, 3*twidth);
                context.lineTo(0, 3*twidth);
                context.lineTo(0, 0);
                context.closePath();
                context.fillStrokeShape(this);
            },
            fill: this._options.fill,
            stroke: this._options.stroke,
            strokeWidth: this._options.strokeWidth,
            name: this._options.name + '_body',
            id: createUUID(),
        });        

        this._group = new Konva.Group({
            draggable: true,
            name: this._options.name,
            x: this._pos.x,
            y: this._pos.y,
            width: 2*twidth+twidth/2,
            height: theight,
            id: this.id
        });

        this._group.on('mouseover', function () {
            document.body.style.cursor = 'pointer';
        });
        this._group.on('mouseout', function () {
            document.body.style.cursor = 'default';
        });

        // this._group.on('dblclick dbltap', (e) => {
        this._group.on('click tap', (e) => {
            if(typeof this._onSelect == "function")
                this._onSelect(this);
        })        

        // this._group .add( this._track);
        this._group .add( this._track, this._connector1.shape, this._connector2.shape, this._connector3.shape);
    }

    select(p){       
        if(typeof p == "undefined")
            p = true; 
        if(!!p && !this._isSelected){
            this._track.stroke("green");
            this.connectors.forEach((c) => c.select(1));
            this._isSelected = true;
        }
        else if (this._isSelected){
            this._track.stroke(this._options.stroke);
            this.connectors.forEach((c) => c.select(0));
            this._isSelected = false;
        }
    }

    addToLayer(layer){
        layer.add(this._group);
    }

    get selected(){
        return this._isSelected;
    }

    get shape(){
        return this._group;
    }

    get id(){
        return this._id;
    }

    get connectors(){
        return [this._connector1, this._connector2, this._connector3];
    }

    get onSelect(){
        return this._onSelect;
    }

    set onSelect(callback){
        if(typeof callback == "function")
            this._onSelect = callback;
    }    
}





class TrackJunctionType2{

    constructor(pos, cWidth, cHeight){
        this._options = {
            fill: '#EEE',
            stroke: 'black',
            strokeWidth: 2,
            name: 'TrackJunctionType2'
        };
        this._cWidth = !isNaN(cWidth) ? cWidth : 150;
        this._cHeight = !isNaN(cHeight) ? cHeight : 500;
        this._pos = !isNaN(pos?.x) && !isNaN(pos?.y) ? pos : {x:0, y:0};
        this._connector1 = null;
        this._connector2 = null;
        this._connector3 = null;
        this._track = null;
        this._group = null;
        this._isSelected = false;
        this._onSelect = null;
        this._id = createUUID();
        this.init();
    }
    
    init(){
        
        let twidth = this._cWidth;
        let theight = this._cHeight;

        this._connector1 = new Connector({x:0, y: theight+this._options.strokeWidth/2}, twidth, twidth/3, true, this);
        this._connector2 = new Connector({x:0, y: this._options.strokeWidth/2}, this._cWidth, -this._cWidth/3, false, this);
        this._connector3 = new Connector({x:twidth+twidth/2, y: theight+this._options.strokeWidth/2}, twidth, twidth/3, true, this);

        // this._connector2.shape.rotation(90);
        // this._connector2.shape.y(this._connector2.shape.y()-this._cWidth);

        this._track = new Konva.Shape({
            sceneFunc: function(context) {
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(0, theight);
                context.lineTo(twidth, theight);
                context.lineTo(twidth, (5*theight/9));
                context.quadraticCurveTo(
                    twidth+twidth/2,
                    (3*theight/4), 
                    twidth+twidth/2, 
                    theight
                );
                context.lineTo(2*twidth+twidth/2, theight);
                context.quadraticCurveTo(
                    2*twidth+twidth/2,
                    (theight/2),
                    twidth,
                    2*(theight/9)
                );
                context.lineTo(twidth, 0);
                context.lineTo(0, 0);
                context.closePath();
                context.fillStrokeShape(this);
            },
            fill: this._options.fill,
            stroke: this._options.stroke,
            strokeWidth: this._options.strokeWidth,
            name: this._options.name + '_body',
            id: createUUID(),
        });        

        this._group = new Konva.Group({
            draggable: true,
            name: this._options.name,
            x: this._pos.x,
            y: this._pos.y,
            width: 2*twidth+twidth/2,
            height: theight,
            id: this.id
        });

        this._group.on('mouseover', function () {
            document.body.style.cursor = 'pointer';
        });
        this._group.on('mouseout', function () {
            document.body.style.cursor = 'default';
        });

        // this._group.on('dblclick dbltap', (e) => {
        this._group.on('click tap', (e) => {
            if(typeof this._onSelect == "function")
                this._onSelect(this);
        })        

        // this._group .add( this._track);
        this._group .add( this._track, this._connector1.shape, this._connector2.shape, this._connector3.shape);
    }

    select(p){       
        if(typeof p == "undefined")
            p = true; 
        if(!!p && !this._isSelected){
            this._track.stroke("green");
            this.connectors.forEach((c) => c.select(1));
            this._isSelected = true;
        }
        else if (this._isSelected){
            this._track.stroke(this._options.stroke);
            this.connectors.forEach((c) => c.select(0));
            this._isSelected = false;
        }
    }

    addToLayer(layer){
        layer.add(this._group);
    }

    get selected(){
        return this._isSelected;
    }

    get shape(){
        return this._group;
    }

    get id(){
        return this._id;
    }

    get connectors(){
        return [this._connector1, this._connector2, this._connector3];
    }

    get onSelect(){
        return this._onSelect;
    }

    set onSelect(callback){
        if(typeof callback == "function")
            this._onSelect = callback;
    }    
}

class TrackCrossType1{

    constructor(pos, cWidth){
        this._options = {
            fill: '#EEE',
            stroke: 'black',
            strokeWidth: 2,
            name: 'TrackCrossType1'
        };
        this._cWidth = !isNaN(cWidth) ? cWidth : 150;
        this._pos = !isNaN(pos?.x) && !isNaN(pos?.y) ? pos : {x:0, y:0};
        this._connector1 = null;
        this._connector2 = null;
        this._connector3 = null;
        this._connector4 = null;
        this._track = null;
        this._group = null;
        this._isSelected = false;
        this._onSelect = null;
        this._id = createUUID();
        this.init();
    }
    
    init(){
        
        let twidth = this._cWidth;
        let theight = this._cHeight;

        this._connector1 = new Connector({x:twidth, y: this._options.strokeWidth/2}, twidth, -twidth/3, false, this);
        this._connector2 = new Connector({x:twidth, y: 3*twidth+this._options.strokeWidth/2}, twidth, twidth/3, true, this);

        this._connector3 = new Connector({x:0+this._options.strokeWidth/2, y: 2*twidth}, twidth, -twidth/3, false, this);
        this._connector3.shape.rotation(-90);
        
        this._connector4 = new Connector({x:3*twidth+this._options.strokeWidth/2, y: 2*twidth}, twidth, twidth/3, true, this);
        this._connector4.shape.rotation(-90);

        this._track = new Konva.Shape({
            sceneFunc: function(context) {
                context.beginPath();
                context.moveTo(twidth, 0);
                context.lineTo(2*twidth, 0);
                context.lineTo(2*twidth, twidth);
                context.lineTo(3*twidth, twidth);
                context.lineTo(3*twidth, 2*twidth);
                context.lineTo(2*twidth, 2*twidth);
                context.lineTo(2*twidth, 3*twidth);
                context.lineTo(twidth, 3*twidth);
                context.lineTo(twidth, 2*twidth);
                context.lineTo(0, 2*twidth);
                context.lineTo(0, twidth);
                context.lineTo(twidth, twidth);
                context.lineTo(twidth, 0);
                context.closePath();
                context.fillStrokeShape(this);
            },
            fill: this._options.fill,
            stroke: this._options.stroke,
            strokeWidth: this._options.strokeWidth,
            name: this._options.name + '_body',
            id: createUUID(),
        });        

        this._group = new Konva.Group({
            draggable: true,
            name: this._options.name,
            x: this._pos.x,
            y: this._pos.y,
            width: 2*twidth+twidth/2,
            height: theight,
            id: this.id
        });

        this._group.on('mouseover', function () {
            document.body.style.cursor = 'pointer';
        });
        this._group.on('mouseout', function () {
            document.body.style.cursor = 'default';
        });

        // this._group.on('dblclick dbltap', (e) => {
        this._group.on('click tap', (e) => {
            if(typeof this._onSelect == "function")
                this._onSelect(this);
        })        

        // this._group .add( this._track);
        this._group .add( this._track, this._connector1.shape, this._connector2.shape, this._connector3.shape, this._connector4.shape);
    }

    select(p){       
        if(typeof p == "undefined")
            p = true; 
        if(!!p && !this._isSelected){
            this._track.stroke("green");
            this.connectors.forEach((c) => c.select(1));
            this._isSelected = true;
        }
        else if (this._isSelected){
            this._track.stroke(this._options.stroke);
            this.connectors.forEach((c) => c.select(0));
            this._isSelected = false;
        }
    }

    addToLayer(layer){
        layer.add(this._group);
    }

    get selected(){
        return this._isSelected;
    }

    get shape(){
        return this._group;
    }

    get id(){
        return this._id;
    }

    get connectors(){
        return [this._connector1, this._connector2, this._connector3, this._connector4];
    }

    get onSelect(){
        return this._onSelect;
    }

    set onSelect(callback){
        if(typeof callback == "function")
            this._onSelect = callback;
    }    
}
