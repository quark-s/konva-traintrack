let currentIndex = 0;
let stageHistory = [];
let slider = $('#playerSlider');
let playInterval = null;

$('#bLoadStage').on('click', function(){
    try {
        data = JSON.parse($('#stageData').val());        
        if(TStage.loadTrackData(data[0])){
            stageHistory = data;
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
});

$('#bNext').on('click', function(){
    
    if(currentIndex<stageHistory.length-1){
        TStage.loadTrackData(stageHistory[++currentIndex]);
        $('#bPrev').removeAttr("disabled");
    }
    slider.val(currentIndex);
    if(currentIndex == stageHistory.length-1)
        $('#bNext').attr("disabled", 1);
});

$('#bPrev').on('click', function(){
    
    if(currentIndex>0){
        TStage.loadTrackData(stageHistory[--currentIndex]);
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

    if(!!stageHistory[this.value]){
        TStage.loadTrackData(stageHistory[this.value]);
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

