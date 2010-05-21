var lab = {
	serialiseState: function(state){
		return JSON.stringify(state);
	},
	analyseMove: function(lvl,state,dir){
		var newstate, transition, entitydirs = {};
		// TODO gamelogic
		return {
			state: newstate,
			transition: transition
		};
	},
	analyseLevel: function(lvl){
		var startstate, analysis;
		startstate = {}; // TODO fix!
		analysis = {
			statekeys: {},
			states: {}
		};
		return lab.analyse(lvl,startstate,analysis,1);
	},
    analyse: function(lvl,state,analysis,step){
		var serialisedstate = serialiseState(state), key = analysis.statekeys.nextkey++;
		analysis.states[key] = {
			state: state,
			moves: {},
			steps: step
		};
		analysis.statekeys[serialisedstate] = key;
		for(var d=1;d<=4;d++){
			var moveresult, targetserialised, targetkey, end;
			moveresult = lab.analyseMove(lvl,state,d);
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
	}
};