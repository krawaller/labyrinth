window.lab = (function(lab){
    /**
     * takes a state object and serialises it
     * @param {Object} state
     * @returns {string} the serialised object
     */
    lab.serialiseState = function(state) {
        return JSON.stringify(state);
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
    
    /**
     * finds all collisions for the given entity and builds collision objects
     * @param {Object} lvl
     * @param {Object} state
     * @param {string} entity
     * @param {bool} before
     * @returns {array} collisions an array of collision objects
     */
    lab.findCollisions = function(lvl,state,entity,before){
        var collisions = []; // key: {obj1: xxx, obj2: xxx}
        // TODO - find collisions with given entity
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
        // TODO - update state & anims
        return {
            state: state,
            anims: anims
        };
    };
    
    /**
     * takes a state object and removes all properties not to be included when saved (like in-move data)
     * @param {Object} state
     * @returns {Object} updatedstate
     */
    lab.removeNonSaveStateProperties = function(state){
        // TODO - need to remove more properties?
        for(var e in state.entities){
            delete state.entities[e].dir;
            delete state.entities[e].movestarted;
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
        // TODO - calculate type
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
        if (lvl.types[type].move === "grav"){
            ret = dir;
        }
        // TODO - add support for float and other things
        return ret;
    };
    
    /**
     * Takes a state and moves in a given direction
     * @param {Object} lvl
     * @param {Object} state
     * @param {int} dir The direction to move in (1-4)
     * @returns {Object} an object containing updated state & anims
     */
    lab.analyseMove = function(lvl, state, dir){
        var anims = {}, movestate = lab.cloneObj(state), sqrs = 0, before = true, movedir, sthmoving;
        // set all startdirs
        for(var e in lvl.entities){
            movedir = lab.getEntityStartDir(lvl,state,dir,e);
            if (movedir){
                movestate.entities[e].dir = movedir;
                movestate.entities[e].movestarted = 0;
                anim[0].slides = anim[0].slides || {};
                anims[0].slides[e] = {x: movestate.entities[e].x, y: movestate.entities[e].y};
            }
        }
        do {
            sthmoving = false;
            for(e in lvl.entities){
                var entitydir = movestate.entities[e].dir;
                if (entitydir){
                    if (!before){
                        var fac = [[0,-1],[1,0],[0,1],[-1,0]];
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
                    if (movestate.entities[e].dir){ // we're still on the move! :)
                        sthmoving = true;
                    }
                    // TODO: update movestate & anims for new/changed moves
                }
            }
            sqrs += before ? 0 : 1;
            before = !before;
        }
        while(sthmoving);
        return {
            state: lab.removeNonSaveStateProperties(movestate),
            anims: anims
        };
    };
    
    /**
     * Analyses a level, creating the full state structure with inbetween transitions
     * @param {Object} lvl
     * @returns {Object} analysis
     */
    lab.analyseLevel = function(lvl){
        return lab.analyse(lvl, lab.buildStartState(lvl), {statekeys: {nextstatekey:0},states:{}}, 1).analysis;
    };
    
    /**
     * Build a starting state object for a given level
     * @param {Object} lvl
     * @returns {Object} state
     */
    lab.buildStartState = function(lvl){
        var state = {};
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
        var serialisedstate = serialiseState(state), key = analysis.statekeys.nextkey++;
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
                    var stateresult = analyse(lvl, moveresult.state, analysis, step + 1);
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
    
})(window.lab || {});

