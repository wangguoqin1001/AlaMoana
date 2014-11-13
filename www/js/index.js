if (navigator.userAgent.match (/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
	document.addEventListener ("deviceready", onDeviceReady, false);
} else {
	onDeviceReady();
}


function pushDB (table, data) {
	var orig = JSON.parse (localStorage.getItem (table)) || [];
	orig.push (data);
	localStorage.setItem (table, JSON.stringify (orig));
}


function popDB (table) {
	var orig = JSON.parse (localStorage.getItem (table)) || [];
	orig.pop();
	localStorage.setItem (table, JSON.stringify (orig));
}


function setDefaultConfig() {
	config = new Object();
	config["colorInWork"] = "magenta";
	config["colorPaused"] = "cyan";
	config["strFree"] = " is really free";
	config["strWorking"] = " working on ";
	config["strPause"] = "Pause";
	config["strPaused"] = " is paused";

	return config;
}


function setDefaultAgent() {
	agent = new Object();
	agent["name"] = "AgentA";
	agent["background"] = "white";

	return agent;
}


function setDefaultWork() {
	work = new Object();
	work["name"] = "WorkA";
	work["background"] = "green";

	return work;
}


function parseAgent (obj, agent, id) {
	obj.find (".agent").html (agent["name"]);
	obj.find (".agent").css ('background', agent["background"]);
	obj.find (".agent_name").val (agent["name"]);
	obj.find (".agent_background").val (agent["background"]);
	obj.find (".agent_id").val (id);
	obj.find (".pause").html (config["strPause"]);
}


function parseWork (obj, work, id) {
	obj.find (".work").html (work["name"]);
	obj.find (".work").css ('background', work["background"]);
	obj.find (".work_name").val (work["name"]);
	obj.find (".work_background").val (work["background"]);
	obj.find (".work_id").val (id);
}


function initVariables() {
	current_agent = null;
	current_work = null;

	colorInWork = config["colorInWork"];
	colorPaused = config["colorPaused"];
	strFree = config["strFree"];
	strWorking = config["strWorking"];
	strPause = config["strPause"];
	strPaused = config["strPaused"];
}


function startTimer() {
	current_agent.parent().find (".agent_work").val (current_work.parent().find (".work_name").val());

	var now = new Date();
	current_agent.parent().find (".agent_periodstarttime").val (now);
	if (current_agent.parent().find (".agent_starttime").val() == "") {
		current_agent.parent().find (".agent_starttime").val (now);
	}

	current_agent = null;
	current_work = null;
}


function stopTimer (agent) {
	var now = new Date();

	if (agent.parent().find (".agent_periodstarttime").val() == "") {
		var duration = parseInt (agent.parent().find (".agent_duration").val()) || 0;
	} else {
		var duration = now - new Date (agent.parent().find (".agent_periodstarttime").val()) + (parseInt (agent.parent().find (".agent_duration").val()) || 0);
	}

	var data = {
		"agent":		agent.parent().find (".agent_name").val(),
		"work":			agent.parent().find (".agent_work").val(),
		"duration":		duration,
		"starttime":	agent.parent().find (".agent_starttime").val(),
		"endtime":		now.toString()
	};
	pushDB ("duration", data);

	agent.parent().find (".agent_work").val("");
	agent.parent().find (".agent_starttime").val("");
	agent.parent().find (".agent_periodstarttime").val("");
	agent.parent().find (".agent_duration").val("0");

	current_agent = null;
	current_work = null;
}


function diffTime (diff) {
	var ms = diff % 1000;
	diff = Math.floor (diff / 1000);
	var sec = diff % 60;
	diff = Math.floor (diff / 60);
	var min = diff % 60;
	diff = Math.floor (diff / 60);
	var hr = diff % 24;
	diff = Math.floor (diff / 24);
	var day = diff;

	ret = ms + 'ms';
	if (sec) {
		ret = sec + 's' + ret;
		if (min) {
			ret = min + 'm' + ret;
			if (hr) {
				ret = hr + 'h' + ret;
				if (day) {
					ret = day + 'd' + ret;
				}
			}
		}
	}
	return ret;
}


function delegates() {
	$("body").delegate (".agent", "click", function() {
		$(".agent").removeClass ("down");

		if ($(this).parent().find (".agent_starttime").val() != "") {
			stopTimer ($(this));
			$(".work").removeClass ("down");
			$(this).html ($(this).parent().find (".agent_name").val() + strFree);
			$(this).css ('background', $(this).parent().find (".agent_background").val());
		} else {
			$(this).addClass ("down");
			current_agent = $(this);

			if (current_work != null) {
				$(this).html ($(this).parent().find (".agent_name").val() + strWorking + current_work.parent().find (".work_name").val());
				$(this).css ('background', colorInWork);
				startTimer();
			}
		}
	});


	$("body").delegate (".pause", "click", function() {
		if ($(this).parent().find (".agent_work").val() != "") {
			if ($(this).parent().find (".agent_periodstarttime").val() != "") {
				now = new Date();
				var duration = now - new Date ($(this).parent().find (".agent_periodstarttime").val()) + (parseInt ($(this).parent().find (".agent_duration").val()) || 0);
				$(this).parent().find (".agent_duration").val (duration);
				$(this).parent().find (".agent_periodstarttime").val("");

				var data = {
					"agent":		$(this).parent().find (".agent_name").val(),
					"work":			$(this).parent().find (".agent_work").val(),
					"duration":		duration,
					"starttime":	$(this).parent().find (".agent_starttime").val(),
					"endtime":		now.toString()
				};
				pushDB ("pause", data);

				$(this).parent().find (".agent").html ($(this).parent().find (".agent_name").val() + strPaused);
				$(this).parent().find (".agent").css ('background', colorPaused);

			} else {
				now = new Date();
				$(this).parent().find (".agent_periodstarttime").val (now);
				if ($(this).parent().find (".agent_starttime").val() == "") {
					$(this).parent().find (".agent_starttime").val (now);
				}

				$(this).parent().find (".agent").html ($(this).parent().find (".agent_name").val() + strWorking + $(this).parent().find (".agent_work").val());
				$(this).parent().find (".agent").css ('background', colorInWork);
			}
		}
	});


	$("body").delegate (".work", "click", function() {
		$(".work").removeClass ("down");
		$(this).addClass ("down");

		current_work = $(this);
		if (current_agent != null) {
			current_agent.html (current_agent.parent().find (".agent_name").val() + strWorking + $(this).parent().find (".work_name").val());
			current_agent.css ('background', colorInWork);
			startTimer();
		}
	});


	$("body").delegate ("#addagent", "click", function() {
		var newparams = {
			"name":			prompt ("Agent Name", "Agent"),
			"background":	prompt ("Agent Color", "white")
		}
		var newagent = $("#agents .agentsrow:first").clone();
		parseAgent (newagent, newparams, $("#agents .agentsrow").length)
		newagent.appendTo ("#agents");
		pushDB ("agentlist", newparams);
	});


	$("body").delegate ("#removeagent", "click", function() {
		if ($("#agents .agentsrow").length > 1) {
			$("#agents .agentsrow:last").remove();
			popDB ("agentlist");
		}
	});


	$("body").delegate ("#addwork", "click", function() {
		var newparams = {
			"name":			prompt ("Work Name", "Work"),
			"background":	prompt ("Work Color", "green")
		}
		var newwork = $("#works .worksrow:first").clone();
		parseWork (newwork, newparams, $("#works .worksrow").length)
		newwork.appendTo ("#works");
		pushDB ("worklist", newparams);
	});


	$("body").delegate ("#removework", "click", function() {
		if ($("#works .worksrow").length > 1) {
			$("#works .worksrow:last").remove();
			popDB ("worklist");
		}
	});


	$("body").delegate ("#showdata", "click", function() {
		var duration = JSON.parse (window.localStorage.getItem ("duration"));
		var duration_table = "<h1 align=center>Duration Record Table</h1><table width=90%><tr><th>ID</th><th>Agent Name</th><th>Work Name</th><th>Whole Period Work Duration</th><th>Start Time</th><th>End Time</th></tr>";
		if (duration) {
			for (var i=0; i < duration.length; i++) {
				var item = duration[i];
				duration_table += "<tr><td>" + i + "</td><td>" + item["agent"] + "</td><td>" + item["work"] + "</td><td>" + diffTime (item["duration"]) + "</td><td>" + item["starttime"] + "</td><td>" + item["endtime"] + "</td></tr>";
			}
		}
		duration_table += "</table>";

		var pause = JSON.parse (window.localStorage.getItem ("pause"));
		var pause_table = "<h1 align=center>Pause Record Table</h1><table width=90%><tr><th>ID</th><th>Agent Name</th><th>Work Name</th><th>Work Time from Beginning</th><th>Beginning Time</th><th>End Time</th></tr>";
		if (pause) {
			for (var i=0; i < pause.length; i++) {
				var item = pause[i];
				pause_table += "<tr><td>" + i + "</td><td>" + item["agent"] + "</td><td>" + item["work"] + "</td><td>" + diffTime (item["duration"]) + "</td><td>" + item["starttime"] + "</td><td>" + item["endtime"] + "</td></tr>";
			}
		}
		pause_table += "</table>";

		$("#agents").html (duration_table);
		$("#works").html (pause_table);

		$("#showdata").html ("Hide Database");
		$("#showdata").click (function() {
			location.reload();
		});
	});
}


function onDeviceReady() {
	config = window.localStorage.getItem ("config");

	if (!config) {
		config = setDefaultConfig();
		window.localStorage.setItem ("config", JSON.stringify (config));
	} else {
		config = JSON.parse (config);
	}

	agentlist = window.localStorage.getItem ("agentlist");

	if (agentlist) {
		agentlist = JSON.parse (agentlist);

		var agent = agentlist.shift();
		parseAgent ($("#agents:first"), agent, 0);

		for (var i=0; i < agentlist.length; i++) {
			var agent = agentlist[i];
			var newagent = $("#agents .agentsrow:first").clone();
			parseAgent (newagent, agent, i+1);
			newagent.appendTo ("#agents");
		}

	} else {
		var list = [setDefaultAgent()];
		window.localStorage.setItem ("agentlist", JSON.stringify (list));
	}

	worklist = window.localStorage.getItem ("worklist");

	if (worklist) {
		worklist = JSON.parse (worklist);

		var work = worklist.shift();
		parseWork ($("#works:first"), work, 0);

		for (var i=0; i < worklist.length; i++) {
			var work = worklist[i];
			var newwork = $("#works .worksrow:first").clone();
			parseWork (newwork, work, i+1);
			newwork.appendTo ("#works");
		}

	} else {
		var list = [setDefaultWork()];
		window.localStorage.setItem ("worklist", JSON.stringify (list));
	}

	initVariables();
	delegates();
}
