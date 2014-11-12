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


function agentsAllRaised() {
	$(".agent").removeClass ("down");
}


function worksAllRaised() {
	$(".work").removeClass ("down");
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
		"endtime":		now
	};
	pushDB ("duration", data);

	agent.parent().find (".agent_work").val("");
	agent.parent().find (".agent_starttime").val("");
	agent.parent().find (".agent_periodstarttime").val("");
	agent.parent().find (".agent_duration").val("0");

	current_agent = null;
	current_work = null;
}


function setAgent() {
	agentsAllRaised();

	if ($(this).parent().find (".agent_starttime").val() != "") {
		stopTimer ($(this));
		worksAllRaised();
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
}


function setAgentPause() {
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
				"endtime":		now
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
}


function setWork() {
	worksAllRaised();
	$(this).addClass ("down");

	current_work = $(this);
	if (current_agent != null) {
		current_agent.html (current_agent.parent().find (".agent_name").val() + strWorking + $(this).parent().find (".work_name").val());
		current_agent.css ('background', colorInWork);
		startTimer();
	}
}


function delegates() {
	$("body").delegate (".agent", "click", setAgent);
	$("body").delegate (".pause", "click", setAgentPause);
	$("body").delegate (".work", "click", setWork);
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
