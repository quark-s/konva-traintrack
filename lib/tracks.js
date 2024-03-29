
function createUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
    });
}

export class Connector{
    
    constructor(pos, cWidth, cHeight, inverse, parent){
        
        this._options = {
            fill: '#EEE',
            stroke: 'black',
            strokeWidth: 2,
            name: 'connector_m'
        };
        this._backgroundColor = "#FFF";
        this._fill = this._options.fill;
        this._cWidth = !isNaN(cWidth) ? cWidth : 150;
        this._cHeight = !isNaN(cHeight) ? cHeight : 50;
        this._inverse = false;
        this._id = createUUID();
        this.parentTrack = parent;
        this.connectedTrack = null;
        this._isSelected = false;
        if(typeof inverse == "boolean" && inverse){
            this._cHeight = -this._cHeight;
            this._options.fill = this._backgroundColor;
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


    // highlight(p){
    //     if(!!p)
    //         this._boundingBox.stroke("green");
    //     else
    //         this._boundingBox.stroke("red");
    // }

    highlight(p,color,fill){

        if(typeof p == "undefined")
            p = true;
        if(typeof color !== "string")
            color = "green";
        if(typeof fill !== "string")
            fill = "#b6eddb";

        if(!!p && !this._isSelected){
            this._shape.stroke(color);
            this._shape.fill(fill);
            this._isSelected = true;
        }
        else if(this._isSelected){
            this._shape.stroke(this._options.stroke);
            this._shape.fill(this._options.fill);
            this._isSelected = false;
        }
    }    

    flipY(){
        this._group.getChildren().forEach((c)=> {
            c.scaleY(-c.scaleY());
        });
    }

    flipX(){
        this._group.getChildren().forEach((c)=> {
            c.scaleX(-c.scaleX());
        });
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
        if(!!this._shape && this._options.name == "connector_f")
            this._shape.fill(!!track ? this._fill : this._backgroundColor);
    }    

    get inverse(){
        return this._inverse;
    }
}

//abstract class Track
class Track{

    constructor(pos, cWidth, cHeight, cRot, id, label){
        this._options = {
            fill: '#EEE',
            stroke: 'black',
            strokeWidth: 2,
            name: 'Track'
        };        
        this._cWidth = !isNaN(cWidth) ? cWidth : 150;
        this._cHeight = !isNaN(cHeight) ? cHeight : 500;
        this._cRot = (!isNaN(cRot) && cRot <= 180 && cRot >= -180) ? cRot : 0;
        this._pos = !isNaN(pos?.x) && !isNaN(pos?.y) ? pos : {x:0, y:0};
        this._group = null;
        this._isSelected = false;
        this._onSelect = null;
        this._id = id ?? createUUID();
        this._label = !!label ? label : "";
    }

    init() {
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
            document.body.style.cursor = 'url(./css/img/cursor_drag.png) 20 15, auto';
        });
        this._group .on('mouseout', function () {
            document.body.style.cursor = 'url(./css/img/cursor_s.png) 20 15, auto';
        });
        this._group.on('click tap', (e) => {
            if(typeof this._onSelect == "function")
                this._onSelect(this,e);
        });        
    }

    select(p){
        if(typeof p == "undefined")
            p = true; 

        if(!!p && !this._isSelected){
            this.highlight(p);
            this._isSelected = true;
        }
        else if (this._isSelected){
            this.highlight(0);
            this._isSelected = false;
        }        
    }

    highlight(p,color){

    }

    addToLayer(layer){
        layer.add(this._group);
    }

    removeFromLayer(){
        this._group.remove();
    }

    get connectors(){
        return [];
    }

    get selected(){
        return this._isSelected;
    }

    get rotation(){
        return this._cRot;
    }

    set rotation(rot){
        if(isNaN(rot) || rot > 180 || rot < -180)
            return;
        
        this._cRot = rot;

        if(this.shape.getAbsoluteRotation() != rot)
            this.shape.rotation(rot);
    }

    get shape(){
        return this._group;
    }

    get id(){
        return this._id;
    }

    set id(id){
        this._id = id;
    }

    get label(){
        return this._label;
    }    

    get data(){
        let connectors = this.connectors.map((e) => {
            if(e && e?.connectedTrack)
                return e.connectedTrack.id;
            else
                return null;
        });
        return {
            // pos:{
            //     x: this._group.x(),
            //     y: this._group.y()
            // },
            id: this._id,
            label: this._label,
            type: this._options.name,
            pos: this._group.absolutePosition(),
            width: this._cWidth,
            height: this._cHeight,
            rotation: this._group.getAbsoluteRotation(),
            actualWidth: this._group.width(),
            actualHeight: this._group.height(),
            initialPos: this._pos,
            initialRotation: this._cRot,
            connectors: connectors
        }
    }

    get onSelect(){
        return this._onSelect;
    }

    set onSelect(callback){
        if(typeof callback == "function")
            this._onSelect = callback;
    }

    get draggable(){
        return this._group.draggable();
    }

    set draggable(d){
        return this._group.draggable(Boolean(d));
    }
}


export class DemoShape1 extends Track{

    constructor(pos, cWidth, cHeight, cRot, id, label){
        super(pos, cWidth, cHeight, cRot, id, label);
        this._options = {
            fill: '#EEE',
            stroke: 'black',
            strokeWidth: 2,
            name: 'DemoShape1'
        };
        this._connector1 = null;
        this._connector2 = null;
        this._track = null;
        this.init();        
    }
    
    init() {
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
        this._group.offsetX(this._cWidth/2);
        this._group.offsetY(this._cHeight/2);
        this._group .add( this._track);    

        this._group .on('mouseover', function () {
            document.body.style.cursor = 'url(./css/img/cursor_drag.png) 20 15, auto';
        });
        this._group .on('mouseout', function () {
            document.body.style.cursor = 'url(./css/img/cursor_s.png) 20 15, auto';
        });

        // this._group.on('dblclick dbltap', (e) => {
        this._group.on('click tap', (e) => {
            if(typeof this._onSelect == "function")
                this._onSelect(this,e);
        });
        this.rotation = this._cRot;
    }



    highlight(p,color,fill){
        if(typeof p == "undefined")
            p = true;
        if(typeof color !== "string")
            color = "green";  
        if(typeof fill !== "string")
        fill = "#b6eddb";

        if(!!p){
            this._track.stroke(color);
            this._track.fill(fill);
            this._isSelected = true;
        }
        else{
            this._track.stroke(this._options.stroke);
            this._track.fill(this._options.fill);
            this._isSelected = false;
        }
    }

    get connectors(){
        return [];
    }
}

export class DemoShape2 extends Track{

    constructor(pos, cWidth, cHeight, cRot, id, label){
        super(pos, cWidth, cHeight, cRot, id, label);
        this._options = {
            fill: '#EEE',
            stroke: 'black',
            strokeWidth: 2,
            name: 'DemoShape2'
        };
        this._connector1 = null;
        this._connector2 = null;
        this._track = null;
        this.init();        
    }
    
    init() {
        this._track = new Konva.Circle({
            x: 0,
            y: 0,
            radius: this._cWidth,
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
        this._group .add( this._track);    

        this._group .on('mouseover', function () {
            document.body.style.cursor = 'url(./css/img/cursor_drag.png) 20 15, auto';
        });
        this._group .on('mouseout', function () {
            document.body.style.cursor = 'url(./css/img/cursor_s.png) 20 15, auto';
        });

        // this._group.on('dblclick dbltap', (e) => {
        this._group.on('click tap', (e) => {
            if(typeof this._onSelect == "function")
                this._onSelect(this,e);
        });
        this.rotation = this._cRot;
    }

    highlight(p,color,fill){
        if(typeof p == "undefined")
            p = true;
        if(typeof color !== "string")
            color = "green";  
        if(typeof fill !== "string")
        fill = "#b6eddb";

        if(!!p){
            this._track.stroke(color);
            this._track.fill(fill);
            this._isSelected = true;
        }
        else{
            this._track.stroke(this._options.stroke);
            this._track.fill(this._options.fill);
            this._isSelected = false;
        }
    }

    get connectors(){
        return [];
    }
}

export class DemoShape3 extends Track{

    constructor(pos, cWidth, cHeight, cRot, id, label){
        super(pos, cWidth, cHeight, cRot, id, label);
        this._options = {
            fill: '#EEE',
            stroke: 'black',
            strokeWidth: 2,
            name: 'DemoShape3'
        };
        this._connector1 = null;
        this._connector2 = null;
        this._track = null;
        this.init();        
    }
    
    init() {
        this._track = new Konva.RegularPolygon({
            x: 0,
            y: 0,
            sides: 3,
            radius: this._cWidth,
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
        // this._group.offsetX(this._cWidth/2);
        // this._group.offsetY(this._cHeight/2);
        this._group .add( this._track);    

        this._group .on('mouseover', function () {
            document.body.style.cursor = 'url(./css/img/cursor_drag.png) 20 15, auto';
        });
        this._group .on('mouseout', function () {
            document.body.style.cursor = 'url(./css/img/cursor_s.png) 20 15, auto';
        });

        // this._group.on('dblclick dbltap', (e) => {
        this._group.on('click tap', (e) => {
            if(typeof this._onSelect == "function")
                this._onSelect(this,e);
        });
        this.rotation = this._cRot;
    }



    highlight(p,color,fill){
        if(typeof p == "undefined")
            p = true;
        if(typeof color !== "string")
            color = "green";  
        if(typeof fill !== "string")
        fill = "#b6eddb";

        if(!!p){
            this._track.stroke(color);
            this._track.fill(fill);
            this._isSelected = true;
        }
        else{
            this._track.stroke(this._options.stroke);
            this._track.fill(this._options.fill);
            this._isSelected = false;
        }
    }

    get connectors(){
        return [];
    }
}

export class TrackType1 extends Track{

    constructor(pos, cWidth, cHeight, cRot, id, label){
        super(pos, cWidth, cHeight, cRot, id, label);
        this._options = {
            fill: '#EEE',
            stroke: 'black',
            strokeWidth: 2,
            name: 'TrackType1'
        };
        this._connector1 = null;
        this._connector2 = null;
        this._track = null;
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
        this._group.offsetX(this._cWidth/2);
        this._group.offsetY(this._cHeight/2);
        this._group .add( this._track, this._connector1.shape, this._connector2.shape);    

        this._group .on('mouseover', function () {
            document.body.style.cursor = 'url(./css/img/cursor_drag.png) 20 15, auto';
        });
        this._group .on('mouseout', function () {
            document.body.style.cursor = 'url(./css/img/cursor_s.png) 20 15, auto';
        });

        // this._group.on('dblclick dbltap', (e) => {
        this._group.on('click tap', (e) => {
            if(typeof this._onSelect == "function")
                this._onSelect(this,e);
        });
        this.rotation = this._cRot;
    }



    highlight(p,color,fill){
        if(typeof p == "undefined")
            p = true;
        if(typeof color !== "string")
            color = "green";  
        if(typeof fill !== "string")
        fill = "#b6eddb";

        if(!!p){
            this._track.stroke(color);
            this._track.fill(fill);
            this.connectors.forEach((c) => 
                {
                    if(!c.inverse)
                        c.highlight(1,color,fill)
                }
            );
            this._isSelected = true;
        }
        else{
            this._track.stroke(this._options.stroke);
            this._track.fill(this._options.fill);
            this.connectors.forEach((c) =>
                { 
                    c.highlight(0);
                }
            );
            this._isSelected = false;
        }
    }

    get connectors(){
        return [this._connector1, this._connector2];
    }
}


export class TrackType2 extends Track{

    constructor(pos, cWidth, cHeight, cRot, id, label){
        super(pos, cWidth, cHeight, cRot, id, label);
        this._options = {
            fill: '#EEE',
            stroke: 'black',
            strokeWidth: 2,
            name: 'TrackType2'
        };
        this._innerRadius = this._cHeight - Math.abs(this._cWidth);
        this._outerRadius = this._cHeight;
        this._angle = 90;
        this._connector1 = null;
        this._connector2 = null;
        this._track = null;
        this.init();
    }
    
    init(){

        let theight = this._cHeight;
        let twidth = this._cWidth;

        if(twidth<0){
            twidth = Math.abs(twidth);
            this._connector1 = new Connector({x:theight, y: -this._options.strokeWidth/2}, twidth, twidth/3, true, this);
            this._connector1.shape.rotate(-180);

            this._connector2 = new Connector({x:this._options.strokeWidth/2, y: theight}, twidth, -twidth/3, false, this);
            this._connector2.shape.rotation(-90);
        }
        else{
            this._connector1 = new Connector({x:theight - twidth, y: this._options.strokeWidth/2}, twidth, -twidth/3, false, this);

            this._connector2 = new Connector({x:-this._options.strokeWidth/2, y: theight-twidth}, twidth, twidth/3, true, this);
            this._connector2.shape.rotation(90);
            // this._connector2.flipX();
            // this._connector2.shape.scaleX(-this._connector2.shape.scaleX());
        }

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

        // let boundingBox = this._track.getClientRect();
        // this._boundingBox = new Konva.Rect({
        //     x: boundingBox.x,
        //     y: boundingBox.y,
        //     width: boundingBox.width,
        //     height: boundingBox.height,
        //     stroke: 'red',
        //     strokeWidth: 0,
        //     // strokeWidth: 1,
        //     name: this._options.name + "_bounding",
        //     id: createUUID()
        // });        

        this._group = new Konva.Group({
            draggable: true,
            name: this._options.name,
            x: this._pos.x,
            y: this._pos.y,
            // width: this._cWidth,
            // height: this._cHeight,
            id: this.id
        });

        this._group.offsetX(this._outerRadius/2);
        this._group.offsetY(this._outerRadius/2);

        this._group.on('mouseover', function () {
            document.body.style.cursor = 'url(./css/img/cursor_drag.png) 20 15, auto';
        });
        this._group.on('mouseout', function () {
            document.body.style.cursor = 'url(./css/img/cursor_s.png) 20 15, auto';
        });

        // this._group.on('dblclick dbltap', (e) => {
        this._group.on('click tap', (e) => {
            if(typeof this._onSelect == "function")
                this._onSelect(this,e);
        })        

        // this._group.add(this._boundingBox);
        this._group .add( this._track, this._connector1.shape, this._connector2.shape);
        this.rotation = this._cRot;
    }

    // highlight(p,color){       
    //     if(typeof p == "undefined")
    //         p = true; 
    //     if(typeof color !== "string")
    //         color = "green";            
    //     if(!!p){
    //         this._track.stroke(color);
    //         this.connectors.forEach((c) => c.highlight(1,color));
    //         this._isSelected = true;
    //     }
    //     else{
    //         this._track.stroke(this._options.stroke);
    //         this.connectors.forEach((c) => c.highlight(0));
    //         this._isSelected = false;
    //     }
    // }

    highlight(p,color,fill){
        if(typeof p == "undefined")
            p = true;
        if(typeof color !== "string")
            color = "green";  
        if(typeof fill !== "string")
        fill = "#b6eddb";

        if(!!p){
            this._track.stroke(color);
            this._track.fill(fill);
            this.connectors.forEach((c) => 
                {
                    if(!c.inverse)
                        c.highlight(1,color,fill)
                }
            );
            this._isSelected = true;
        }
        else{
            this._track.stroke(this._options.stroke);
            this._track.fill(this._options.fill);
            this.connectors.forEach((c) =>
                { 
                    c.highlight(0);
                }
            );
            this._isSelected = false;
        }
    }    
    
    get connectors(){
        return [this._connector1, this._connector2];
    } 
}



export class TrackType3 extends Track{

    constructor(pos, cWidth, cHeight, cRot, id, label){
        super(pos, cWidth, cHeight, cRot, id, label);
        this._options = {
            fill: '#EEE',
            stroke: 'black',
            strokeWidth: 2,
            name: 'TrackType3'
        };
        this._connector1 = null;
        this._connector2 = null;
        this._track = null;
        this.init();
    }
    
    init(){

        let twidth = this._cWidth;
        let theight = this._cHeight;

        if(twidth<0){
            this._connector1 = new Connector({x:twidth, y: this._options.strokeWidth/2}, Math.abs(this._cWidth), this._cWidth/3, false, this);
            this._connector2 = new Connector({x:twidth+1.5*twidth, y: theight+this._options.strokeWidth/2}, Math.abs(this._cWidth), -this._cWidth/3, true, this);
        }else
        {        
            this._connector1 = new Connector({x:0, y: this._options.strokeWidth/2}, this._cWidth, -this._cWidth/3, false, this);
            this._connector2 = new Connector({x:twidth+0.5*twidth, y: theight+this._options.strokeWidth/2}, this._cWidth, this._cWidth/3, true, this);
        }
        this._track = new Konva.Shape({
            sceneFunc: function(context) {
                context.beginPath();
                context.moveTo(0, 0);
                context.bezierCurveTo(
                    0,
                    0.5*theight, 
                    twidth+0.5*twidth,
                    0.5*theight, 
                    twidth+0.5*twidth, 
                    theight
                );
                context.lineTo(2.5*twidth, theight);
                context.bezierCurveTo(
                    2.5*twidth,
                    0.5*theight, 
                    twidth,
                    0.5*theight, 
                    twidth, 
                    0
                );                
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
            // width: this._cWidth,
            // height: this._cHeight,
            id: this.id
        });

        this._group.offsetX(1.25*twidth);
        this._group.offsetY(0.5*theight);

        this._group.on('mouseover', function () {
            document.body.style.cursor = 'url(./css/img/cursor_drag.png) 20 15, auto';
        });
        this._group.on('mouseout', function () {
            document.body.style.cursor = 'url(./css/img/cursor_s.png) 20 15, auto';
        });

        // this._group.on('dblclick dbltap', (e) => {
        this._group.on('click tap', (e) => {
            if(typeof this._onSelect == "function")
                this._onSelect(this,e);
        })        

        // this._group.add(this._boundingBox);
        this._group .add( this._track, this._connector1.shape, this._connector2.shape);
        this.rotation = this._cRot;
    }

    highlight(p,color,fill){
        if(typeof p == "undefined")
            p = true;
        if(typeof color !== "string")
            color = "green";  
        if(typeof fill !== "string")
        fill = "#b6eddb";

        if(!!p){
            this._track.stroke(color);
            this._track.fill(fill);
            this.connectors.forEach((c) => 
                {
                    if(!c.inverse)
                        c.highlight(1,color,fill)
                }
            );
            this._isSelected = true;
        }
        else{
            this._track.stroke(this._options.stroke);
            this._track.fill(this._options.fill);
            this.connectors.forEach((c) =>
                { 
                    c.highlight(0);
                }
            );
            this._isSelected = false;
        }
    }

    get connectors(){
        return [this._connector1, this._connector2];
    }
}


export class TrackJunctionType1 extends Track{

    constructor(pos, cWidth, cHeight, cRot, id, label){
        super(pos, cWidth, cHeight, cRot, id, label);
        this._options = {
            fill: '#EEE',
            stroke: 'black',
            strokeWidth: 2,
            name: 'TrackJunctionType1'
        };
        this._connector1 = null;
        this._connector2 = null;
        this._connector3 = null;
        this._track = null;
        this.init();
    }
    
    init(){
        
        let twidth = this._cWidth;
        let theight = this._cHeight;

        this._connector2 = new Connector({x:0, y: this._options.strokeWidth/2}, this._cWidth, -this._cWidth/3, false, this);
        this._connector1 = new Connector({x:0, y: 4*twidth+this._options.strokeWidth/2}, twidth, twidth/3, true, this);

        this._connector3 = new Connector({x:3*twidth - this._options.strokeWidth/2, y: 4*twidth}, twidth, twidth/3, true, this);
        this._connector3.shape.rotation(-90);
        // this._connector3.shape.scaleY(-this._connector3.shape.scaleY());
        this._connector3.shape.move({x: this._options.strokeWidth});

        this._track = new Konva.Shape({
            sceneFunc: function(context) {
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(twidth, 0);
                context.quadraticCurveTo(
                    twidth,
                    3*twidth, 
                    3*twidth, 
                    3*twidth
                );
                context.lineTo(3*twidth, 4*twidth);
                context.quadraticCurveTo(
                    //twidth,
                    1.5*twidth, 
                    4*twidth, 
                    twidth, 
                    3*twidth
                );
                context.lineTo(twidth, 4*twidth);
                context.lineTo(0, 4*twidth);
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

        this._group.offsetX(1.5*twidth);
        this._group.offsetY(2*twidth);

        this._group.on('mouseover', function () {
            document.body.style.cursor = 'url(./css/img/cursor_drag.png) 20 15, auto';
        });
        this._group.on('mouseout', function () {
            document.body.style.cursor = 'url(./css/img/cursor_s.png) 20 15, auto';
        });

        // this._group.on('dblclick dbltap', (e) => {
        this._group.on('click tap', (e) => {
            if(typeof this._onSelect == "function")
                this._onSelect(this,e);
        })        

        // this._group .add( this._track);
        this._group .add( this._track, this._connector1.shape, this._connector2.shape, this._connector3.shape);
        this.rotation = this._cRot;
    }

    highlight(p,color,fill){
        if(typeof p == "undefined")
            p = true;
        if(typeof color !== "string")
            color = "green";  
        if(typeof fill !== "string")
        fill = "#b6eddb";

        if(!!p){
            this._track.stroke(color);
            this._track.fill(fill);
            this.connectors.forEach((c) => 
                {
                    if(!c.inverse)
                        c.highlight(1,color,fill)
                }
            );
            this._isSelected = true;
        }
        else{
            this._track.stroke(this._options.stroke);
            this._track.fill(this._options.fill);
            this.connectors.forEach((c) =>
                { 
                    c.highlight(0);
                }
            );
            this._isSelected = false;
        }
    }
    
    get connectors(){
        return [this._connector1, this._connector2, this._connector3];
    }
}





export class TrackJunctionType2 extends Track{

    constructor(pos, cWidth, cHeight, cRot, id, label){
        super(pos, cWidth, cHeight, cRot, id, label);
        this._options = {
            fill: '#EEE',
            stroke: 'black',
            strokeWidth: 2,
            name: 'TrackJunctionType2'
        };
        this._connector1 = null;
        this._connector2 = null;
        this._connector3 = null;
        this._track = null;
        this.init();
    }
    
    init(){
        
        let twidth = this._cWidth;
        // let theight = this._cHeight;
        let theight = 5*this._cWidth;

        this._connector1 = new Connector({x:0, y: theight+this._options.strokeWidth/2}, twidth, twidth/3, true, this);
        this._connector2 = new Connector({x:0, y: this._options.strokeWidth/2}, this._cWidth, -this._cWidth/3, false, this);
        this._connector3 = new Connector({x:2*twidth, y: theight+this._options.strokeWidth/2}, twidth, twidth/3, true, this);

        // this._connector2.shape.rotation(90);
        // this._connector2.shape.y(this._connector2.shape.y()-this._cWidth);

        this._track = new Konva.Shape({
            sceneFunc: function(context) {
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(0, theight);
                context.lineTo(twidth, theight);
                context.lineTo(twidth, 3.5*twidth);
                // context.lineTo(2*twidth, theight);
                context.quadraticCurveTo(
                    2*twidth,
                    3.5*twidth,
                    2*twidth, 
                    theight
                );
                context.lineTo(3*twidth, theight);
                context.bezierCurveTo(
                    3*twidth,
                    3*twidth,
                    1*twidth,
                    2*twidth,
                    twidth,
                    twidth
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

        this._group.offsetX(1.5*twidth);
        this._group.offsetY(2.5*twidth);

        this._group.on('mouseover', function () {
            document.body.style.cursor = 'url(./css/img/cursor_drag.png) 20 15, auto';
        });
        this._group.on('mouseout', function () {
            document.body.style.cursor = 'url(./css/img/cursor_s.png) 20 15, auto';
        });

        // this._group.on('dblclick dbltap', (e) => {
        this._group.on('click tap', (e) => {
            if(typeof this._onSelect == "function")
                this._onSelect(this,e);
        })        

        // this._group .add( this._track);
        this._group .add( this._track, this._connector1.shape, this._connector2.shape, this._connector3.shape);
        this.rotation = this._cRot;
    }

    highlight(p,color,fill){
        if(typeof p == "undefined")
            p = true;
        if(typeof color !== "string")
            color = "green";  
        if(typeof fill !== "string")
            fill = "#b6eddb";

        if(!!p){
            this._track.stroke(color);
            this._track.fill(fill);
            this.connectors.forEach((c) => 
                {
                    if(!c.inverse)
                        c.highlight(1,color,fill)
                }
            );
            this._isSelected = true;
        }
        else{
            this._track.stroke(this._options.stroke);
            this._track.fill(this._options.fill);
            this.connectors.forEach((c) =>
                { 
                    c.highlight(0);
                }
            );
            this._isSelected = false;
        }
    }

    get connectors(){
        return [this._connector1, this._connector2, this._connector3];
    }    
}

export class TrackCrossType1 extends Track{

    constructor(pos, cWidth, cHeight, cRot, id, label){
        super(pos, cWidth, cHeight, cRot, id, label);
        this._options = {
            fill: '#EEE',
            stroke: 'black',
            strokeWidth: 2,
            name: 'TrackCrossType1'
        };
        this._connector1 = null;
        this._connector2 = null;
        this._connector3 = null;
        this._connector4 = null;
        this._track = null;
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

        this._group.offsetX(1.5*twidth);
        this._group.offsetY(1.5*twidth);

        this._group.on('mouseover', function () {
            document.body.style.cursor = 'url(./css/img/cursor_drag.png) 20 15, auto';
        });
        this._group.on('mouseout', function () {
            document.body.style.cursor = 'url(./css/img/cursor_s.png) 20 15, auto';
        });

        // this._group.on('dblclick dbltap', (e) => {
        this._group.on('click tap', (e) => {
            if(typeof this._onSelect == "function")
                this._onSelect(this,e);
        })        

        // this._group .add( this._track);
        this._group .add( this._track, this._connector1.shape, this._connector2.shape, this._connector3.shape, this._connector4.shape);
        this.rotation = this._cRot;
    }

    highlight(p,color,fill){
        if(typeof p == "undefined")
            p = true;
        if(typeof color !== "string")
            color = "green";  
        if(typeof fill !== "string")
        fill = "#b6eddb";

        if(!!p){
            this._track.stroke(color);
            this._track.fill(fill);
            this.connectors.forEach((c) => 
                {
                    if(!c.inverse)
                        c.highlight(1,color,fill)
                }
            );
            this._isSelected = true;
        }
        else{
            this._track.stroke(this._options.stroke);
            this._track.fill(this._options.fill);
            this.connectors.forEach((c) =>
                { 
                    c.highlight(0);
                }
            );
            this._isSelected = false;
        }
    }

    get connectors(){
        return [this._connector1, this._connector2, this._connector3, this._connector4];
    }
}
