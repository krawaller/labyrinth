/************** Test level *********************************************************************/

var lvl = {
	title: "testlevel",
	rows: 6,
	cols: 8,
	objs: {
		"1,2": "w",
		"5,2": "s",
		"6,1s": "w",
		"1,4e": "w",
		"1,5e": "w",
		"2,5s": "w",
		"5,5e": "w",
		"7,4e": "w",
		"7,5s": "w",
		"7,2": "goal"
	},
	entities: [{
		type: "plr",
		x: 5,
		y: 4
	}],
	types: {
		"plr": {
			move: "grav"
		}
	},
	collisions: {
		"plr-goal":{
			"effectsets": ["reachgoal"],
			"kind": "on"
		},
		"plr-w": {
			"effectset": ["hitwall"],
			"kind": "nextto"
		},
		"plr-s": {
			"effectset": ["hitwall"],
			"kind": "on"
		}
	},
	effectsets: {
		"reachgoal": {
			"gameeffects": ["reachgoal"],
			"obj1effects": ["hitwall"]
		},
		"hitwall": {
			"obj1effects": ["hitwall"]
		}
	},
	gameeffects: {
		"reachgoal": {
			end: "win"
		}
	},
	objeffects: {
		"hitwall": {
			setdir: "stop"
		}
	}
};

/**************/ module("Static array methods"); /*******************************************************/

test("lab analyser methods are declare",function(){
		equals(typeof x,"number","x is 7");
	equals(typeof lab.analyse,"function","analyse function exists");
	equals(typeof lab.analyseLevel,"function","analyseLevel function exists");
	equals(typeof lab.analyseMove,"function","analyseMove function exists");
	equals(typeof lab.serialiseState,"function","serialiseState function exists");
});

