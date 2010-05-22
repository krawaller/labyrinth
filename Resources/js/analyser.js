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
        // TODO - remove move-related properties from state
        return state;
    };
    
    /**
     * Takes a state and moves in a given direction
     * @param {Object} lvl
     * @param {Object} state
     * @param {int} dir The direction to move in (1-4)
     * @returns {Object} an object containing updated state & anims
     */
    lab.analyseMove = function(lvl, state, dir){
        var anims = {}, movestate = lab.cloneObj(state), sqrs = 0, before = true;
        // set all startdirs
        for(var e in lvl.entities){
            movestate.entities[e].type = state.entities[e].type || lvl.entities[e].type;
            if (lvl.types[state.entities[e].type].move === "grav"){ // set all that will fall with gravity
                movestate.entities[e].dir = dir;
                movestate.entities[e].movestarted = 0;
                anim[0].slides = anim[0].slides || {};
                anims[0].slides[e] = {x: movestate.entities[e].x, y: movestate.entities[e].y};
            }
        }
        var sthmoving = false;
        do {
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
                if (analysis.states[targetkey].steps > step) {
                    analysis.states[targetkey].steps = step;
                }
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

