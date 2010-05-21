(function(){
	var lab = window.lab || {};
	lab.serialiseState = function(state) {
		return JSON.stringify(state);
	};
	lab.analyseMove = function(lvl, state, dir){
		var newstate, transition = {}, entitystatuses = {}, sqrs = 0;
		// set all startdirs
		for(var e in lvl.entities){
			entitystatuses[e] = {
				x: state.entities[e].x,
				y: state.entities[e].y,
				type: state.entities[e].type || lvl.entities[e].type
			};
			if (lvl.types[state.entities[e].type].move === "grav"){ // set all that will fall with gravity
				entitystatuses[e].dir = dir;
				entitystatuses[e].movestarted = 0;
			}
		}
		do {
			var sthmoved = false;
			for(e in lvl.entities){
				if (entitystatuses[e].dir){
					sthmoved = true;
					
				}
			}
			sqrs++;
		}
		while(sthmoved);
		return {
			state: newstate,
			transition: transition
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
				transition: moveresult.transition
			};
		}
		return {
			analysis: analysis,
			key: key
		};
	};
	window.lab = lab;
})();

