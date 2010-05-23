window.lab = (function(lab){
    
     var fac = [666,[0,-1],[1,0],[0,1],[-1,0]];
    
    /**
     * takes a state object and serialises it
     * @param {Object} state
     * @returns {string} the serialised object
     */
    lab.serialiseState = function(state) {
        return JSON.stringify(state);
    };
    
    /**
     * Checks an array for a value
     * @param {Object} needle
     * @param {Array} haystack
     * @returns {bool} whether or not needle was found
     */
    lab.inArray = function(needle,haystack){
        for(var i in haystack){
            if (haystack[i]==needle){
                return true;
            }
        }
        return false;
    };
    
    /**
     * returns a deep-copied clone
     * @param {Object} obj
     * @returns {Object} clone
     */
    lab.cloneObj = function(obj){
        var clone = new obj.constructor();
        for(var p in obj){
            clone[p] = typeof obj[p] === "object" ? lab.cloneObj(obj[p]) : obj[p];
        }
        return clone;
    };
    
    lab.calculateBorderName = function(x,y,dir){
        if (dir==1 || dir==4){
            return (x+fac[dir][0])+","+(y+fac[dir][1])+(dir==1?"s":"e");
        }
        return x+","+y+(dir==2?"e":"s");
    };
    
    /**
     * finds all collisions for the given entity and builds collision objects
     * @param {Object} lvl
     * @param {Object} state
     * @param {string} entitykey
     * @param {bool} before
     * @returns {array} collisions an array of collision objects
     */
    lab.findCollisions = function(lvl,state,entitykey,before){
        var collisions = [], // key: {obj1: xxx, obj2: xxx}
            dir = state.entities[entitykey].dir,
            x = state.entities[entitykey].x, // + before ? fac[dir][0] : 0,
            y = state.entities[entitykey].y, // + before ? fac[dir][1] : 0;
            type = lab.getEntityType(lvl,state,entitykey),
            otherkey,
            othertype;
        if (before){ // borders, and next square with nextto prop
            // find borders
            if (lab.inArray(lab.calculateBorderName(x,y,dir),lvl.borders)){ // hit a border!
                collisions.push({key:"BORDER"});
            }
            // find squares
            otherkey = (x+fac[dir][0])+","+(y+fac[dir][1]);
            othertype = lab.getSquareType(lvl,state,otherkey);
            if (othertype) { // hit a square!
                collision = lvl.collisions[entitykey + "-" + othertype];
                if (collision && lvl.collisions[collision].kind != "on") {
                    collisions.push({
                        key: collision,
                        'with': otherkey
                    });
                }
            }
            // TODO - also check for entities on next square with correct dir     
        }
        else { // current square and entities on same square
            otherkey = x+","+y;
            othertype = lab.getSquareType(lvl,state,otherkey);
            collision = lvl.collisions[entitykey+"-"+othertype];
            if (collision && lvl.collisions[collision].kind == "on"){
                collisions.push({key: collision,'with':otherkey});
            }
            // TODO - also check here for entities on same square
        }
        for(var c in collisions){
            collisions[c].me = entitykey;
        }
        return collisions;
    };
    
    /**
     * performs the given collisions and returns updated state & anims objects
     * @param {Object} lvl
     * @param {Object} state
     * @param {Object} anims
     * @param {Object} collision
     * @returns {Object} an object containing updated state & anims
     */
    lab.performCollision = function(lvl,state,anims,collision){ // collision object contains key,obj1,obj2
        if (collision.key=="BORDER"){
            state.entities[collision.me].dir = 0;
        }
        // TODO - add support for non-border collisions
        return {
            state: state,
            anims: anims
        };
    };
    
    /**
     * takes a state object and removes all properties not to be included when saved (like in-move data)
     * @param {Object} lvl
     * @param {Object} state
     * @returns {Object} updatedstate
     */
    lab.removeNonSaveStateProperties = function(lvl,state){
        // TODO - need to remove more properties?
        for(var e in state.entities){
            delete state.entities[e].dir;
            delete state.entities[e].movestarted;
            if (state.entities.type == lvl.entities[e].type){
                delete state.entities.type; // only need to store type in state if different from starttype
            }
        }
        return state;
    };
    
    
    /**
     * calculates what type a given entity is at this moment
     * @param {Object} lvl
     * @param {Object} state
     * @param {string} entitykey
     * @returns {string} type
     */
    lab.getEntityType = function(lvl, state, entitykey){
        var type;
        type = state.entities[entitykey].type || lvl.entities[entitykey].type;
        // TODO - add support for conditionals
        return type;
    };
    
    /**
     * calculates what type a given Square is at this moment
     * @param {Object} lvl
     * @param {Object} state
     * @param {string} squarekey
     * @returns {string} type
     */
    lab.getSquareType = function(lvl, state, squarekey){
        var type;
        type = lvl.squares[squarekey];
        // TODO - add support for conditionals
        return type;
    };
    
    /**
     * Calculates what dir an entity would (eventually) start to move in when a move is made
     * @param {Object} lvl
     * @param {Object} state
     * @param {int} dir
     * @param {string} entitykey
     * @returns {int} dir
     */
    lab.getEntityStartDir = function(lvl, state, dir, entitykey){
        var ret = 0, type = lab.getEntityType(lvl,state,entitykey);
        if (type == "dead"){
            return 0;
        }
        if (lvl.types[type].move === "grav"){
            ret = dir;
        }
        // TODO - add support for float and other things
        return ret;
    };
    
    /**
     * Tests if an entity hasn't gone overe the edge
     * @param {Object} lvl
     * @param {Object} state
     * @param {string} entitykey
     * @bool if entity is within level limits or not
     */
    lab.testIfOutOfBounds = function(lvl,state,entitykey){
        var x = state.entities[entitykey].x,
            y = state.entities[entitykey].y;
        return x> lvl.cols || x<1 || y > lvl.rows || y < 1;
    };
    
    /**
     * Takes a state and moves in a given direction
     * @param {Object} lvl
     * @param {Object} state
     * @param {int} dir The direction to move in (1-4)
     * @returns {Object} an object containing updated state & anims
     */
    lab.analyseMove = function(lvl, state, dir){
        var anims = {0:{}}, movestate = lab.cloneObj(state), step = 0, before = true, movedir, sthmoving;
        // set all startdirs
        for(var e in lvl.entities){
            movedir = lab.getEntityStartDir(lvl,state,dir,e);
            if (movedir){
                movestate.entities[e].dir = movedir;
                movestate.entities[e].movestarted = 0;
                anims[0].slides = anims[0].slides || {};
                anims[0].slides[e] = {x: movestate.entities[e].x, y: movestate.entities[e].y};
            }
        }
        do {
            sthmoving = false;
            for(e in lvl.entities){
                var entitydir = movestate.entities[e].dir;
                if (entitydir){
                    if (!before){
                        movestate.entities[e].x += fac[entitydir][0];
                        movestate.entities[e].y += fac[entitydir][1];
                        anims[movestate.entities[e].movestarted].slides[e].x = movestate.entities[e].x;
                        anims[movestate.entities[e].movestarted].slides[e].y = movestate.entities[e].y;
                    }
                    var collisions = lab.findCollisions(lvl,movestate,e,before);
                    for(var c in collisions){
                        var collisionresult = lab.performCollision(lvl,movestate,anims,collisions[c]);
                        movestate = collisionresult.state;
                        anims = collisionresult.anims;
                    }
                    if (lab.testIfOutOfBounds(lvl,movestate,e)){
                        movestate.entities[e].type = type = "dead";
                        movestate.entities[e].dir = 0;
                        anims[step] = anims[step] || {changes:{}};
                        anims[step].changes[e] = "dead";
                        movestate.end = "GAMEOVER"; // TODO - only do this if it was plr that died
                    }
                    if (movestate.entities[e].dir){ // we're still on the move! :)
                        sthmoving = true;
                    }
                    // TODO: update movestate & anims for new/changed moves
                }
            }
            step += before ? 0 : 1;
            before = !before;
        }
        while(sthmoving);
        return {
            state: lab.removeNonSaveStateProperties(lvl,movestate),
            anims: anims
        };
    };
    
    /**
     * Analyses a level, creating the full state structure with inbetween transitions
     * @param {Object} lvl
     * @returns {Object} analysis
     */
    lab.analyseLevel = function(lvl){
        return lab.analyse(lvl, lab.buildStartState(lvl), {statekeys: {nextkey:0},states:{}}, 1).analysis;
    };
    
    /**
     * Build a starting state object for a given level
     * @param {Object} lvl
     * @returns {Object} state
     */
    lab.buildStartState = function(lvl){
        var state = {entities:{}};
        for(var e in lvl.entities){
            state.entities[e] = {
                x : lvl.entities[e].x,
                y : lvl.entities[e].y
            };
        }
        // TODO - build start state for lvl
        return state;
    };
    
    /**
     * updates an analysis for the given state. will also recursively analyse new states reached.
     * @param {Object} lvl
     * @param {Object} state
     * @param {Object} analysis
     * @param {Number} step
     * @returns {Object} object containing updated analysis and key for the analysed state
     */
    lab.analyse = function(lvl, state, analysis, step){
        var serialisedstate = lab.serialiseState(state), key = analysis.statekeys.nextkey++;
        analysis.states[key] = {
            state: state,
            moves: {},
            steps: step
        };
        analysis.statekeys[serialisedstate] = key;
        for (var d = 1; d <= 4; d++) {
            var moveresult, targetserialised, targetkey, end;
            moveresult = lab.analyseMove(lvl, state, d);
            end = moveresult.state.end;
            if (!end) { // game did not end, so we reached another state
                targetserialised = lab.serialiseState(moveresult.state);
                targetkey = analysis.statekeys[targetserialised];
                if (!targetkey) { // reached unanalysed state
                    var stateresult = lab.analyse(lvl, moveresult.state, analysis, step + 1);
                    analysis = stateresult.analysis;
                    targetkey = stateresult.key;
                }
                analysis.states[targetkey].steps = Math.min(analysis.states[targetkey].steps,step);
            }
            analysis.states[key].moves[d] = {
                target: end ? end : targetkey,
                anims: moveresult.anims
            };
        }
        return {
            analysis: analysis,
            key: key
        };
    };
    
    return lab;
    
})(window.lab || {});

