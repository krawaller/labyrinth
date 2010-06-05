window.lab = (function(lab){
    
     var fac = [666,[0,-1],[1,0],[0,1],[-1,0]];
    
    /**
     * takes a state object and serialises it
     * @param {Object} state
     * @returns {string} the serialised object
     */
    lab.serialiseState = function(state) {
        return JSON.stringify(lab.cloneObj(state));
    };
    
  
    /**
     * returns a deep-copied clone with props in sorted order
     * @param {Object} obj
     * @returns {Object} clone
     */
    lab.cloneObj = function(obj){
        var clone = new obj.constructor(), props = [], p;
        for(p in obj){
            props.push([p]);
        }
        props.sort();
        for(p=0;p<props.length;p++){
            clone[props[p]] = typeof obj[props[p]] === "object" ? lab.cloneObj(obj[props[p]]) : obj[props[p]];
        }
        return clone;
    };
    
    /**
     * returns augmented object
     * @param {Object} o1
     * @param {Object} o2
     * @returns {Object} 
     */
    lab.augmentObject = function(o1,o2){
        o1 = lab.cloneObj(o1);
        if (!o2){
            return o1;
        }
        o2 = lab.cloneObj(o2);
        for(var p in o2){
            o1[p] = o2[p];
        }
        return o1;
    };
    
    /**
     * Returns the key for the border in the given direction from the given square
     * @param {int} x
     * @param {int} y
     * @param {int} dir
     * @returns {string} borderkey
     */
    lab.calculateBorderName = function(x,y,dir){
        if (dir==1 || dir==4){
            return (dir==1?"s":"e")+(x+fac[dir][0])+"_"+(y+fac[dir][1]);
        }
        return (dir==3?"s":"e")+x+"_"+y;
    };
    
    /**
     * Tests if a given entity is the plr object (means game over if it dies, or win if reaches goal)
     * @param {Object} lvl
     * @param {Object} state
     * @param {Object} entitykey
     * @returns {bool} if entitykey is plr
     */
    lab.isPlr = function(lvl,state,entitykey){
        return true; // lab.getEntityType(lvl,state,entitykey)==="plr"; // TODO - fix this shit!
    };

    /**
     * Tests if a given entity is alive (not dead or done)
     * @param {Object} lvl
     * @param {Object} state
     * @param {Object} entitykey
     * @returns {bool} if entity is alive
     */
    lab.isAlive = function(lvl,state,entitykey){
        return ["done","dead"].indexOf(lab.getEntityType(lvl,state,entitykey)) === -1;
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
            x = state.entities[entitykey].x, 
            y = state.entities[entitykey].y, 
            type = lab.getEntityType(lvl,state,entitykey),
            otherkey,
            othertype;
        if (before){ // borders, and next square with nextto prop
            // find borders
            if (lvl.borders.indexOf(lab.calculateBorderName(x, y, dir))!=-1) { // hit a border!
                collisions.push({
                    key: "BORDER"
                });
            }
            else {
                // find squares
                otherkey = (x + fac[dir][0]) + "_" + (y + fac[dir][1]);
                othertype = lab.getSquareType(lvl, state, otherkey);
                if (othertype) { // hit a square!
                    collision = lab.resolveObject(lvl,state,lvl.squarecollisions[type + "-" + othertype],entitykey,otherkey);
                    if (collision && !collision.on) {
                        collisions.push({
                            key: type + "-" + othertype,
                            'with': otherkey
                        });
                    }
                }
                // TODO - also check for entities on next square with correct dir     
            }
        }
        else { // current square and entities on same square
            otherkey = x+"_"+y;
            othertype = lab.getSquareType(lvl,state,otherkey);
            if (othertype == "goal" && lab.isPlr(lvl,state,entitykey)) {
                collisions.push({
                    key: "GOAL"
                });
            } 
            else {
                collision = lab.resolveObject(lvl,state,lvl.squarecollisions[type + "-" + othertype],entitykey,otherkey);
                if (collision && collision.on) {
                    collisions.push({
                        key: type + "-" + othertype,
                        'with': otherkey
                    });
                }
            // TODO - also check here for entities on same square
            }
        }
        for(var c in collisions){
            collisions[c].me = entitykey;
        }
        return collisions;
    };

    /**
     * updates the type of an entity and makes necessary changes to state & anims
     * @param {Object} lvl
     * @param {Object} state
     * @param {Object} stepanims
     * @param {string} entitykey
     * @param {string} type
     * @param {int} step
     * @returns {Object} updated state and anims
     */
    lab.updateEntityType = function(lvl,state,stepanims,entitykey,type){
        state = lab.cloneObj(state);
        state.entities[entitykey].type = type;
        stepanims = stepanims || {changes:{}};
        stepanims.changes = stepanims.changes || {};
        stepanims.changes[entitykey] = type;
        if (type=="dead" || type=="done"){
            state.entities[entitykey] = {
                type: type,
                x: 0,
                y: 0,
                dir: 0
            };
        }
        return {
            state: state,
            stepanims: stepanims
        };
    };

    /**
     * updates the type of a square and makes necessary changes to state & anims
     * @param {Object} lvl
     * @param {Object} state
     * @param {Object} anims
     * @param {string} squarekey
     * @param {string} type
     * @returns {Object} updated state and anims
     */
    lab.updateSquareType = function(lvl,state,stepanims,squarekey,type){
        state.squares = state.squares || {};
        state.squares[squarekey] = type;
        stepanims = stepanims || {};
        stepanims.squares = stepanims.squares || {};
        stepanims.squares[squarekey] = type;
        return {
            state: state,
            stepanims: stepanims
        };
    };

    /**
     * performs the given collisions and returns updated state & anims objects
     * @param {Object} lvl
     * @param {Object} state
     * @param {Object} anims
     * @param {Object} collision
     * @param {int} step
     * @returns {Object} an object containing updated state & anims
     */
    lab.performCollision = function(lvl,state,anims,collision,step){ // collision object contains key,obj1,obj2
        if (collision.key=="BORDER"){ // TODO - handle more gracefully
            state.entities[collision.me].dir = 0;
            anims[state.entities[collision.me].movestarted].slides[collision.me].stop = "b";
        }
        if (collision.key == "GOAL" && lab.isPlr(lvl,state,collision.me)){ // TODO - handle more gracefully
            var res = lab.updateEntityType(lvl,state,anims[step],collision.me,"done");
            state = res.state;
            anims[step] = res.stepanims;
        }
        var c = lab.resolveObject(lvl,state,lvl.squarecollisions[collision.key],collision.me,collision["with"]);
        if (c) {
            if (c.stop) {
                state.entities[collision.me].dir = 0;
                if (c.stop != "b") {
                    anims[state.entities[collision.me].movestarted].slides[collision.me].stop = c.stop;
                }
            }
            if (c.setwalltype){
                var ret = lab.updateSquareType(lvl,state,anims[step],collision['with'],c.setwalltype);
                state = ret.state;
                anims[step] = ret.stepanims;
            }
            if (c.setflag){
                state.flags = state.flags || [];
                if (state.flags.indexOf(c.setflag)==-1){
                    state.flags.push(c.setflag);
                    state.flags.sort();
                }
            }
            if (c.tele){
                state.entities[collision.me].x = c.tele.x;
                state.entities[collision.me].y = c.tele.y;
                anims[step] = anims[step] || {};
                anims[step].teles = anims[step].teles || {};
                anims[step].teles[collision.me] = lab.cloneObj(c.tele);
            }
            if (c.setdir){
                state.entities[collision.me].dir = c.setdir;
            }
        }
        return {
            state: state,
            anims: anims
        };
    };
    
    /**
     * tests a set of conditions
     * @param {Object} lvl
     * @param {Object} state
     * @param {Object} conds
     * @param {Object} entitykey
     * @param {Object} otherkey
     */
    lab.resolveConditions = function(lvl,state,conds,entitykey,otherkey){
        for(var c in conds){
            if (c == "hasflag"){
                if (!state.flags || state.flags.indexOf(conds[c])==-1){
                    return false;
                }
            }
            if (c=="diris"){
                if (conds[c]!=state.entities[entitykey].dir){
                    return false;
                }
            }
        }
        return true;
    };
    
    /**
     * Fixes eventual conditions and returns
     * @param {Object} lvl
     * @param {Object} state
     * @param {Object} obj
     * @param {Object} entitykey
     * @param {Object} otherkey
     * @returns {Object} object weee
     */
    lab.resolveObject = function(lvl,state,obj,entitykey,otherkey){
        var ret = {};
        if (!obj){
            return;
        }
        for(var c in obj){
            if (c == "conds") {
                for(var f in obj.conds){
                    var o2 = lab.resolveConditions(lvl, state, obj.conds[f]['if'], entitykey, otherkey) ? obj.conds[f].then : obj.conds[f]['else'];
                    ret = lab.augmentObject(ret, o2);                    
                }
            }
            else {
                ret[c] = obj[c];
            }
        }
        return ret;
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
            delete state.entities[e].pushing;
            delete state.entities[e].pushedby;
           /* if (state.entities[e].type == lvl.entities[e].type){
                delete state.entities[e].type; // only need to store type in state if different from starttype
            } */
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
        type = (state && state.entities && state.entities[entitykey] && state.entities[entitykey].type) || lvl.entities[entitykey].type;
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
        type = state && state.squares && state.squares[squarekey] ? state.squares[squarekey] : lvl.squares[squarekey];
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
        if (type == "dead" || type=="done"){
            return 0;
        }
        if (lvl.types[type].move === "grav"){
            ret = dir;
        }
        // TODO - add support for float and other things
        return ret;
    };
    
    /**
     * Tests if an entity has gone overe the edge
     * @param {Object} lvl
     * @param {Object} state
     * @param {string} entitykey
     * @bool if entity is outside level limits or not
     */
    lab.testIfOutOfBounds = function(lvl,state,entitykey){
        var x = state.entities[entitykey].x,
            y = state.entities[entitykey].y;
        return lab.isAlive(lvl,state,entitykey) && (x> lvl.cols || x<1 || y > lvl.rows || y < 1);
    };
    
    /**
     * Takes a state and moves in a given direction
     * @param {Object} lvl
     * @param {Object} state
     * @param {int} dir The direction to move in (1-4)
     * @returns {Object} an object containing updated state & anims
     */
    lab.analyseMove = function(lvl, state, dir){
        var anims = {0:{slides:{}}}, movestate = lab.cloneObj(state), step = 0, before = true, movedir, sthmoving;
        // set all startdirs
        for(var e in lvl.entities){
            movedir = lab.getEntityStartDir(lvl,state,dir,e);
            if (movedir){
                movestate.entities[e].dir = movedir;
                movestate.entities[e].movestarted = 0;
                anims[0].slides[e] = {
                    x: movestate.entities[e].x,
                    y: movestate.entities[e].y,
                    sqrs: 0,
                    dir:movedir
                };
            }
        }
        do {
            sthmoving = false;
            step += before ? 0 : 1;
            for(e in lvl.entities){ // TODO - sort this shit right
                var entitydir = movestate.entities[e].dir;
                if (entitydir){
                    if (!before){
                        movestate.entities[e].x += fac[entitydir][0];
                        movestate.entities[e].y += fac[entitydir][1];
                        anims[movestate.entities[e].movestarted].slides[e].x = movestate.entities[e].x;
                        anims[movestate.entities[e].movestarted].slides[e].y = movestate.entities[e].y;
                        anims[movestate.entities[e].movestarted].slides[e].sqrs++;
                    }
                    var collisions = lab.findCollisions(lvl,movestate,e,before), prev = lab.cloneObj(movestate.entities[e]);
                    for(var c in collisions){
                        var collisionresult = lab.performCollision(lvl,movestate,anims,collisions[c],step);
                        movestate = collisionresult.state;
                        anims = collisionresult.anims;
                    }
                    if (lab.isAlive(lvl,movestate,e) && lab.testIfOutOfBounds(lvl,movestate,e)){
                        var ret = lab.updateEntityType(lvl,movestate,anims[step],e,"dead");
                        movestate = ret.state;
                        anims[step] = ret.stepanims;
                    }
                    if (movestate.entities[e].dir){ // we're still on the move! :)
                        sthmoving = true;
                        // check if started new slide
                        if (movestate.entities[e].dir != prev.dir || movestate.entities[e].x != prev.x || movestate.entities[e].y != prev.y){
                            if(movestate.entities[e].dir != prev.dir && movestate.entities[e].dir > 0){ // turning
                                anims[movestate.entities[e].movestarted].slides[e].stop = "t" + movestate.entities[e].dir;
                            }
                            movestate.entities[e].movestarted = step;
                            anims[step] = anims[step] || {};
                            anims[step].slides = anims[step].slides || {};
                            anims[step].slides[e] = {
                                x: movestate.entities[e].x,
                                y: movestate.entities[e].y,
                                dir: movestate.entities[e].dir,
                                sqrs: 0
                            };
                        }
                    }
                }
            }
            before = !before;
        }
        while(sthmoving);
        anims.steps = step;
        // check if we can swap entities to lessen states. TODO - support multiple kinds of entities
        if (lab.stillPlaying(lvl,movestate)) { // only need to do this if game will keep going
            ret = lab.sortEntities(movestate.entities);
            if (ret.nbr){
                movestate.entities = ret.sorted;
                anims.swaps = ret.changed;
            }
        }
        //return the result
        return {
            state: lab.removeNonSaveStateProperties(lvl,movestate),
            anims: anims
        };
    };
    
    /**
     * Sorts the entities, used to lessen states
     * @param {Array} entities
     * @returns object with new entity array and list of swaps, and number of swaps made
     */
    lab.sortEntities = function(entities){
        var sorted = lab.cloneObj(entities), changed = {}, nbr = 0;
        for(var e in sorted){
            sorted[e].prev = Number(e);
        }
        sorted.sort(function(a,b){
            return a.type > b.type ? 1 :
                   a.type < b.type ? -1 : 
                   a.x > b.x ? 1 : 
                   a.x < b.x ? -1 : 
                   a.y > b.y ? 1 :
                   a.y < b.y ? -1 : 
                   0;
        });
        for(e in sorted){
            if (Number(e) != sorted[e].prev){
                nbr++;
                changed[e] = sorted[e].prev;
            }
            delete sorted[e].prev;
        }
        return {
            sorted: sorted,
            changed: changed,
            nbr: nbr
        };
    };
    
    /**
     * Tests if a state fulfills all objectives for a perfect win
     * @param {Object} state
     * @param {Object} objectives
     */
    lab.testStateForObjectives = function(lvl,state,objectives){
        for(var s in objectives.squares){
            if (lab.getSquareType(lvl,state,s)!=objectives.squares[s]){
                return false;
            }
        }
        for(var e in objectives.entities){
            if (lab.getEntityType(lvl,state,e)!=objectives.entities[e]){
                return false;
            }
        }
        return true;
        // TODO: add support for other kind of objectives
    };
    
    /**
     * Calculates the conditions that need to be set in a state for it to be a perfect win
     * @param {Object} lvl
     */
    lab.findObjectives = function(lvl){
        var ret = {squares:{},entities:{}};
        for(var s in lvl.squares){
            if (["money","bigmoney"].indexOf(lvl.squares[s])!=-1){
                ret.squares[s] = "done";
            }
        }
        for(var e in lvl.entities){
            if (lab.isPlr(lvl,0,e)){
                ret.entities[e] = "done";
            }
        }
        return ret;
        // TODO: add support for other kind of objectives
    };
    
    /**
     * Analyses a level, creating the full state structure with inbetween transitions
     * @param {Object} lvl
     * @returns {Object} analysis
     */
    lab.analyseLevel = function(lvl){
        var analysis = {
            statekeys: {
                nbrofstates: 0
            },
            states: {},
            objectives: lab.findObjectives(lvl),
            bestwin: {
                f: [],
                s: 666
            }
        };
        return lab.analyse(lvl, lab.buildStartState(lvl), analysis, 0).analysis;
    };
    
    /**
     * Build a starting state object for a given level
     * @param {Object} lvl
     * @returns {Object} state
     */
    lab.buildStartState = function(lvl){
        var state = {entities:[]};
        for(var e in lvl.entities){
            state.entities[e] = {
                x : lvl.entities[e].x,
                y : lvl.entities[e].y,
                type: lvl.entities[e].type
            };
        }
        // TODO - build start state for lvl
        return state;
    };
    
    /**
     * 
     * @param {Object} analysis
     * @param {Number} key
     */
    lab.updateStepCount = function(analysis,key,step){
        analysis.states[key].steps = step;
        step++;
        for(var d in analysis.states[key].moves){
            var tkey = analysis.states[key].moves[d].target;
            if (!isNaN(tkey) && analysis.states[tkey].steps > step){
                analysis = lab.updateStepCount(analysis,tkey,step);
            }
            if (tkey == "PERFECTWIN"){
                if (step<analysis.bestwin.s){
                    analysis.bestwin = {
                        k: [key],
                        s: step
                    };
                }
                if (step==analysis.bestwin.s && analysis.bestwin.k.indexOf(key)==-1){
                    analysis.bestwin.k.push(key);
                }
            }
        }
        return analysis;
    };
    
    /**
     * nbr of escaped entities
     * @param {Object} lvl
     * @param {Object} state
     * @returns {int} how many entities that escaped
     */
    lab.nbrOfEscapedEntities = function(lvl,state){
        var nbr = 0;
        for(var e in state.entities){
            if (lab.isPlr(lvl,state,e) && lab.getEntityType(lvl,state,e) == "done"){
                nbr++;
            }
        }
        return nbr;
    };
    
    /**
     * tests if any plr entity is still playing
     * @param {Object} lvl
     * @param {Object} state
     */
    lab.stillPlaying = function(lvl,state){
        for(var e in state.entities){
            if (lab.isPlr(lvl,state,e) && lab.isAlive(lvl,state,e)){
                return true;
            }
        }
        return false;
    };
    
    /**
     * looks over a state to see if we've won or lost, or if still in progress.
     * @param {Object} lvl
     * @param {Object} state
     * @param {Object} objectives
     * @returns {string} win/perfectwin/gameover/null
     */
    lab.checkGameState = function(lvl,state,objectives){
        if (!lab.stillPlaying(lvl, state)) {
            if (!lab.nbrOfEscapedEntities(lvl, state)) {
                return "GAMEOVER";
            }
            if (lab.testStateForObjectives(lvl, state, objectives)) {
                return "PERFECTWIN";
            }
            return "WIN";
        }
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
        var serialisedstate = lab.serialiseState(state), key = ++analysis.statekeys.nbrofstates;
        analysis.states[key] = {
            state: state,
            moves: {},
            steps: step++,
            from: []
        };
        analysis.statekeys[serialisedstate] = key;
        for (var d = 1; d <= 4; d++) {
            var moveresult, targetserialised, targetkey, end;
            moveresult = lab.analyseMove(lvl, state, d);
            end = lab.checkGameState(lvl,moveresult.state,analysis.objectives);
            if (!end) { // game did not end, so we reached another state
                targetserialised = lab.serialiseState(moveresult.state);
                targetkey = analysis.statekeys[targetserialised];
                if (!targetkey) { // reached unanalysed state
                    var stateresult = lab.analyse(lvl, moveresult.state, analysis, step);
                    analysis = stateresult.analysis;
                    targetkey = stateresult.key;
                }
                if (targetkey != key) { // reached new state (didn't bang wall without changing anything)
                    if (step<analysis.states[targetkey].steps){
                        analysis = lab.updateStepCount(analysis,targetkey,step);
                    }
                    analysis.states[targetkey].from.push({
                        k: key,
                        d: d
                    });
                }
            }
            if (end == "PERFECTWIN"){
                if (step<analysis.bestwin.s){
                    analysis.bestwin = {
                        k: [key],
                        s: step
                    };
                }
                if (step==analysis.bestwin.s && analysis.bestwin.k.indexOf(key)==-1){
                    analysis.bestwin.k.push(key);
                }
            }
            moveresult.anims.target = end ? end : targetkey;
            analysis.states[key].moves[d] = moveresult.anims;
        }
        return {
            analysis: analysis,
            key: key
        };
    };
    
    return lab;
    
})(window.lab || {});

