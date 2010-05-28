window.lab = (function(lab){

    var squaresize = 30;

    /**
     * Builds the level objects in the given container
     * @param {Object} lvl
     * @param {string} containerid
     */
    lab.buildLevel = function(lvl,containerid){
        var maze = $("#"+containerid)
                   .addClass("board")
                   .css({
                       height: lvl.rows*squaresize,
                       width: lvl.cols*squaresize
                   });
        for(var b in lvl.borders){
            var bordername = lvl.borders[b],
                border = $("<div>")
                         .addClass("border")
                         .addClass(bordername.charAt(3)=="s" ? "hborder" : "vborder")
                         .css({
                             top: (Number(bordername.charAt(2))-1)*squaresize, // TODO: support size > 9
                             left: (Number(bordername.charAt(0))-1)*squaresize
                         });
            maze.append(border);
        }
        for(var e in lvl.entities){
            var entity = $("<div>")
                         .addClass("entity")
                         .attr("id","entity"+e)
                         .css({
                             top: (lvl.entities[e].y-1)*squaresize,
                             left: (lvl.entities[e].x-1)*squaresize
                         });
            maze.append(entity);
        }
        for(var s in lvl.squares){
                square = $("<div>")
                         .addClass("square")
                         .addClass(lab.getSquareType(lvl,0,s))
                         .attr("id",s)
                         .css({
                             top: (Number(s.charAt(2))-1)*squaresize, // TODO: support size > 9
                             left: (Number(s.charAt(0))-1)*squaresize
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
        var steptime = 200;
        if (currentanims[currentstep]){
            var a = currentanims[currentstep];
            if (a.slides) {
                for (var e in a.slides) {
                    $("#entity" + e).animate({
                        top: (a.slides[e].y - 1) * squaresize,
                        left: (a.slides[e].x - 1) * squaresize
                    }, a.slides[e].sqrs * steptime);
                }
            }
            if (a.squares){
                for (var s in a.squares){
                    $("#"+s).attr("class","square "+a.squares[s]);
                }
            }
        }
        if (currentstep<=currentanims.steps){
            currentstep++;
            setTimeout(lab.animateMoveStep,steptime);
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