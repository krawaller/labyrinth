(function(){
	var lab = window.lab || {};
	lab.serialiseState = function(state) {
		return JSON.stringify(state);
	};
	lab.cloneObj = function(obj){
		var clone = obj.constructor === [].constructor ? [] : {};
		for(var p in obj){
			clone[p] = typeof obj[p] === "object" ? lab.cloneObj(obj[p]) : obj[p];
		}
		return clone;
	};
	lab.findCollisions = function(lvl,state,entitystatuses,entity){
		var collisionkeys = [];
		// TODO - find collisions
		return collisionkeys;
	};
	lab.performCollision = function(lvl,state,entitystatuses,anims,collisionkey){
		var changes = {};
		return changes;
	};
	lab.analyseMove = function(lvl, startstate, dir){
		var newstate, anims = {}, movestate = lab.cloneObj(state), sqrs = 0, before = true;
		// set all startdirs
		for(var e in lvl.entities){
			movestate.entities[e].type = state.entities[e].type || lvl.entities[e].type;
			if (lvl.types[state.entities[e].type].move === "grav"){ // set all that will fall with gravity
				movestate.entities[e].dir = dir;
				movestate.entities[e].movestarted = 0;
			}
		}
		do {
			var sthmoved = false;
			for(e in lvl.entities){
				if (movestate.entities[e].dir){
					sthmoved = true;
					
				}
			}
			before = !before;
			sqrs++;
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

