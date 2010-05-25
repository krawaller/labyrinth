window.lab = (function(lab){

    /**
     * Builds the level objects in the given container
     * @param {Object} lvl
     * @param {string} containerid
     */
    lab.buildLevel = function(lvl,containerid){
        var maze = $("#"+containerid)
                   .addClass("board")
                   .css({
                       height: lvl.rows*30,
                       width: lvl.cols*30
                   });
        for(var b in lvl.borders){
            var bordername = lvl.borders[b],
                border = $("<div>")
                         .addClass("border")
                         .addClass(bordername.charAt(3)=="s" ? "hborder" : "vborder")
                         .css({
                             top: (Number(bordername.charAt(2))-1)*30,
                             left: (Number(bordername.charAt(0))-1)*30
                         });
            maze.append(border);
        }
        for(var e in lvl.entities){
            var entity = $("<div>")
                         .addClass("entity")
                         .attr("id","entity"+e)
                         .css({
                             top: (lvl.entities[e].y-1)*30,
                             left: (lvl.entities[e].x-1)*30
                         });
            maze.append(entity);
        }
        for(var s in lvl.squares){
                square = $("<div>")
                         .addClass("square")
                         .css({
                             top: (Number(s.charAt(2))-1)*30,
                             left: (Number(s.charAt(0))-1)*30
                         });
            maze.append(square);
        }
    };

    var analysis, currentstate = 1, animating, currentanims, currentstep;

    lab.playLevel = function(lvl){
        lab.buildLevel(lvl,"main");
        analysis = lab.analyseLevel(lvl);
        document.onkeyup = lab.pressedKey;
    };

    lab.moveInDir = function(dir){
        lab.stopReceiving();
        currentanims = analysis.states[currentstate].moves[dir];
        currentstep = 0;
        lab.animateMoveStep();
    };
    
    lab.stopReceiving = function(){
        animating = true;
    };
    
    lab.pressedKey = function(evt){
        if (!lab.testIfReceiving()){
            return;
        }
        evt = evt || window.event;
        var key = evt.keyCode || evt.which;
        lab.moveInDir({38:1,39:2,40:3,37:4}[key]);
    };
    
    lab.animateMoveStep = function(){
        if (currentanims[currentstep]){
            var a = currentanims[currentstep];
            if (a.slides) {
                for (var e in a.slides) {
                    $("#entity" + e).animate({
                        top: (a.slides[e].y - 1) * 30,
                        left: (a.slides[e].x - 1) * 30
                    }, a.slides[e].sqrs * 500);
                }
            }
        }
        if (currentstep<=currentanims.steps){
            currentstep++;
            setTimeout("lab.animateMoveStep()",500);
            return;
        }
        if (isNaN(currentanims.target)){
            alert(currentanims.target);
        }
        else {
            currentstate = currentanims.target;
            lab.startReceiving();
        }
    };
    
    lab.testIfReceiving = function(){
        return !animating;
    };
    
    lab.startReceiving = function(){
        animating = false;
    };

    return lab;

})(window.lab || {});