/************** Test level *********************************************************************/

var lvl = {
	title: "testlevel",
	rows: 6,
	cols: 8,
	borders: ["5,1s","6,1s","1,2e","1,4e","1,5e","2,5s","5,5e","7,4e","7,5s"],
    squares: {
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

