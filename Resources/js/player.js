window.lab = (function(lab){

    var squaresize = 30;

    /**
     * Parses a string for coordinates
     * @param {string} str The string to parse
     * @param {bool} skipfirst Whether or not to skip the first letter
     * @return {Object} An object with x & y property
     */
    lab.getCoords = function(str,skipfirst){
        var divpos = str.indexOf("_"),start = skipfirst ? 1 : 0;
        return {
            x: Number(str.substr(start,divpos-start)),
            y: Number(str.substr(divpos+1,666))
        };
    };

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
        var coords;
        for(var b in lvl.borders){
            var bordername = lvl.borders[b],border;
            coords = lab.getCoords(bordername,true);
            border = $("<div>")
                     .addClass("border")
                     .addClass(bordername.charAt(0)=="s" ? "hborder" : "vborder")
                     .css({
                         top: (coords.y-1)*squaresize, 
                         left: (coords.x-1)*squaresize
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
            coords = lab.getCoords(s);
            square = $("<div>")
                     .addClass("square")
                     .addClass(lab.getSquareType(lvl,0,s))
                     .attr("id","s"+s)
                     .css({
                         top: (coords.y-1)*squaresize, 
                         left: (coords.x-1)*squaresize
                     });
            maze.append(square);
        }
    };

    var analysis, currentstate = 1, animating, currentanims, currentstep, nbrofmoves = 0;

    lab.events = {
        touchstart: 'ontouchstart' in document.documentElement ? 'touchstart' : 'mousedown',
        touchmove: 'ontouchmove' in document.documentElement ? 'touchmove' : 'mousemove',
        touchend: 'ontouchend' in document.documentElement ? 'touchend' : 'mouseup'
    };

    lab.playLevel = function(lvl){
        lab.buildLevel(lvl,"main");
        analysis = lab.analyseLevel(lvl);
        document.onkeyup = lab.pressedKey;
        
        lab.initSwiping();
    };
    
    lab.initSwiping = function(){
        var touch,
            tmp,
            threshold = 30;
            
        document.addEventListener(lab.events.touchstart, function(e){
            e.preventDefault();
            touch = (tmp = e.changedTouches ? e.changedTouches[0] : e) && {
                pageX: tmp.pageX,
                pageY: tmp.pageY
            };
        }, false);

        document.addEventListener(lab.events.touchmove, function(e){
            e.preventDefault();
            if(!touch){ return; }
             
            var t = (tmp = e.changedTouches ? e.changedTouches[0] : e) && {
                    pageX: tmp.pageX,
                    pageY: tmp.pageY
                },
                dx = t.pageX - touch.pageX,
                dy = t.pageY - touch.pageY;
            
            if(dx > threshold){
                if (!lab.testIfReceiving()){ return; }
                lab.moveInDir(2);
            } else if(dx < -threshold){
                if (!lab.testIfReceiving()){ return; }
                lab.moveInDir(4);
            } else if(dy > threshold){
                if (!lab.testIfReceiving()){ return; }
                lab.moveInDir(3);
            } else if(dy < -threshold){
                if (!lab.testIfReceiving()){ return; }
                lab.moveInDir(1);
            }
            
            if(Math.abs(dx) > 30 || Math.abs(dy) > 30){ 
                touch = t;
            }
        }, false);
    };

    lab.moveInDir = function(dir){
        currentanims = analysis.states[currentstate].moves[dir];
        if (!currentanims){
            return;
        }
        lab.stopReceiving();
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
        nbrofmoves++;
    };
    
    lab.animateMoveStep = function(){
        var steptime = 200, e;
        if (currentanims[currentstep]){
            var a = currentanims[currentstep];
            if (a.teles){
                for (e in a.teles){
                    $("#entity" + e).stop().css({
                        top: (a.teles[e].y - 1) * squaresize,
                        left: (a.teles[e].x - 1) * squaresize
                    });
                }
            }
            if (a.slides) {
                for (e in a.slides) {
                    $("#entity" + e).animate({
                        top: (a.slides[e].y - 1) * squaresize,
                        left: (a.slides[e].x - 1) * squaresize
                    }, a.slides[e].sqrs * steptime);
                }
            }
            if (a.squares){
                for (var s in a.squares){
                    $("#s"+s).attr("class","square "+a.squares[s]);
                }
            }
            if (a.changes){
                for (e in a.changes){
                    $("#entity"+e).addClass(a.changes[e]); // TODO - handle more clever? effects?
                }
            }
        }
        if (currentstep<=currentanims.steps){
            currentstep++;
            setTimeout(lab.animateMoveStep,steptime);
            return;
        }
        if (isNaN(currentanims.target)){ // Game ended
            if (currentanims.target == "PERFECTWIN"){
                if (nbrofmoves==analysis.bestwin.s){
                    alert("Woo, you reached all objectives within the optimal amount of steps! You roxxors!");
                }
                else {
                    alert("So you did all you set out to, but took WAY too long doing it! Loser! Used "+nbrofmoves+" moves, but need only "+analysis.bestwin.s+"!");
                }                
            }
            else if (currentanims.target == "WIN") {
                alert("You reached the goal! Too bad you didn't fulfil all objectives, dumbass!");
            }
            else { // died
                alert("GAME OVER! boo!");
            }
        }
        else {
            currentstate = currentanims.target;
            // eventual entity swapping.
            if (currentanims.swaps){
                var me,saved = {};
                for(e in currentanims.swaps){
                    me = $("#entity" + e);
                    saved[e] = {
                        top: me.css("top"),
                        left: me.css("left"),
                        cssclass: me.attr("class")
                    };
                }
                for(e in currentanims.swaps) {
                    $("#entity" + e).stop().css({
                        top: saved[currentanims.swaps[e]].top,
                        left: saved[currentanims.swaps[e]].left
                    }).attr("class",saved[currentanims.swaps[e]].cssclass);
                }
            }
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