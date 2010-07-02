(function(container){

    var lab = container.lab || {}, squaresize = 30, transitions = typeof WebKitTransitionEvent == 'object';
    
console.log(transitions);

    function xyToTransform(x,y){
        return 'translate3d(' + x + 'px, ' + y + 'px, 0px)'; 
    }

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
    
    lab.positionEntity = function(o){
        var x = o.x, y = o.y, entity = $("#entity"+o.id);
        if(transitions){
            entity.css('-webkit-transform', xyToTransform(x,y));
            entity.data('pos', {x:x,y:y});         
        } else {
            entity.css({ top: y, left: x });
        }  
    }

    /**
     * Fixes position and css class for all entities and squares according to a state
     * @param {Object} state
     * @param {Number} statenumber
     */
    lab.renderState = function(lvl,state){
        for(var e in lvl.entities){
            var edata = state.state.entities[e],
                entity = $("#entity"+e).attr("class","entity"),
                x = (edata.x-1)*squaresize,
                y = (edata.y-1)*squaresize;
            lab.positionEntity({x:x,y:y,id:e});           
        }
        for(var s in lvl.squares){
            $("#s"+s).attr("class","square "+lab.getSquareType(lvl,state,s))
        }
        currentstate = 1;
        nbrofmoves = 0;
    };

    /**
     * Builds the level objects in the given container
     * @param {Object} lvl
     * @param {string} containerid
     */
    lab.buildLevel = function(lvl,containerid){
        var maze = $("#"+containerid)
                   .html("")
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
                         .append( $('<div>') );
            maze.append(entity);
        }
        for(var s in lvl.squares){
            coords = lab.getCoords(s);
            square = $("<div>")
                     .addClass("square")
                    // .addClass(lab.getSquareType(lvl,0,s))
                     .attr("id","s"+s)
                     .css({
                         top: (coords.y-1)*squaresize, 
                         left: (coords.x-1)*squaresize
                     });
            maze.append(square);
        }
    };

    var level, analysis, currentstate = 1, animating, currentanims, currentstep = 0, nbrofmoves = 0, controlsinitiated = false;

    lab.events = {
        touchstart: 'ontouchstart' in document.documentElement ? 'touchstart' : 'mousedown',
        touchmove: 'ontouchmove' in document.documentElement ? 'touchmove' : 'mousemove',
        touchend: 'ontouchend' in document.documentElement ? 'touchend' : 'mouseup'
    };

    lab.playLevel = function(lvl){
        lab.buildLevel(lvl,"main");
        analysis = lab.analyseLevel(lvl);
        level = lvl;
        lab.renderState(lvl,analysis.states[1]);
        document.onkeyup = lab.pressedKey;
        if (!controlsinitiated){
            controlsinitiated = true;
            lab.initControls();
        }
    };
    
    lab.initControls = function(){
        lab.initSwiping();
        lab.initGyro();
        lab.initBounce();        
    }
    
    lab.initGyro = function(){
        if(window.Ti){
            Ti.App.addEventListener('move', function(e){
                if(lab.testIfReceiving()){
                    lab.moveInDir(e.dir);
                }    
            });
        }
    }
    
    lab.initBounce = function(){
        /*window.addEventListener('webkitTransitionEnd', function(e){
            $el = $(e.target);
            if (e.target.childNodes.length) {
                e.target.childNodes[0].className = 'bounce_' + $el.data('dir');
            }
        }, false);*/
        window.addEventListener('webkitAnimationEnd', function(e){
            e.target.className = '';
            console.log("MOO");
        }, false);
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
        
        document.addEventListener(lab.events.touchend, function(e){
            e.preventDefault();
            touch = false;
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
        evt = evt || window.event;
        var key = evt.keyCode || evt.which;
        if (!lab.testIfReceiving() || key < 37 || key > 40){
            return;
        }
        lab.moveInDir({38:1,39:2,40:3,37:4}[key]);
        nbrofmoves++;
    };
    
    lab.animateMoveStep = function(){
        var steptime = 200, e;
        if (currentanims[currentstep]){
            var a = currentanims[currentstep];
            
            if (a.teles){        
                for (e in a.teles){
                    var $el = $("#entity" + e),
                        el = $el[0],
                        x = (a.teles[e].x - 1) * squaresize,
                        y = (a.teles[e].y - 1) * squaresize;
                    if (transitions){            
                        el.style.webkitTransition = 'none';
                        //FIXME
                        // Eeeh... this line makes the transition behave (sometimes). 
                        // Should solve with timeouts or something instead.
                        console.log('humbug'); 
                        el.style.webkitTransform = 'translate3d(' + x + 'px, ' + y + 'px, 0px)';
                    } else {
                        $("#entity" + e).stop().css({
                            top: y,
                            left: x
                        });
                    }
                }
            }
            if (a.slides) {           
                for (e in a.slides) {
                    var x = (a.slides[e].x - 1) * squaresize,
                        y = (a.slides[e].y - 1) * squaresize;
console.log("entity "+e+" is now at Y="+$("#entity"+e).css("top")+", X="+$("#entity"+e).css("left"));
console.log("now going to Y="+y+", X="+x);                     
                    $("#entity" + e).animate({
                        top: y,
                        left: x
                    }, a.slides[e].sqrs * steptime);
console.log("entity "+e+" started, now at Y="+$("#entity"+e).css("top")+", X="+$("#entity"+e).css("left"));
                }
            }
            if (a.squares){
                for (var s in a.squares){
                    $("#s"+s).attr("class","square "+a.squares[s]);
                }
            }
            if (a.changes){ // TODO - this not used? check analyser logic!
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
            lab.renderState(level,analysis.states[1]);
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
        }
        lab.startReceiving();
    };
    
    lab.testIfReceiving = function(){
        return !animating;
    };
    
    lab.startReceiving = function(){
        animating = false;
    };

    container.lab = lab;

})(window);