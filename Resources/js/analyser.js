(function(){
	var lab = window.lab || {};
	lab.serialiseState = function(state) {
		return JSON.stringify(state);
	};
	lab.cloneObj = function(obj){
		var clone = new obj.constructor();
		for(var p in obj){
			clone[p] = typeof obj[p] === "object" ? lab.cloneObj(obj[p]) : obj[p];
		}
		return clone;
	};
	lab.findCollisions = function(lvl,state,entity,before){
		var collisions = {}; // key: {obj1: xxx, obj2: xxx}
		// TODO - find collisions
		return collisionkeys;
	};
	lab.performCollision = function(lvl,state,anims,collisionkey,obj1,obj2){
		// TODO - update state & anims
		return {
			state: state,
			anims: anims
		};
	};
	lab.analyseMove = function(lvl, startstate, dir){
		var newstate, anims = {}, movestate = lab.cloneObj(state), sqrs = 0, before = true;
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
		do {
			var sthmoving = false;
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
						var collisionresult = lab.performCollision(lvl,movestate,anims,collisions[c].key,collisions[c].obj1,collisions[c].obj2);
						movestate = collisionresult.state;
						anims = collisionresult.anims;
					}
					if (movestate.entities[e].dir){ // we're still on the move! :)
						sthmoving = true;
					}
					// TODO: update movestate & anims 
				}
			}
			sqrs += before ? 0 : 1;
			before = !before;
		}
		while(sthmoved);
		return {
			state: newstate,
			anims: anims
		};
	};
	lab.analyseLevel = function(lvl){
		var startstate, analysis;
		startstate = {}; // TODO fix!
		analysis = {
			statekeys: {},
			states: {}
		};
		return lab.analyse(lvl, startstate, analysis, 1);
	};
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
	
	window.lab = lab;
})();

