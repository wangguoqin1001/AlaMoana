if (navigator.userAgent.match (/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
	document.addEventListener ("deviceready", onDeviceReady, false);
} else {
	onDeviceReady();
}


function setDefaultConfig() {
	config = new Object();
	config["colorInWork"] = "magenta";
	config["colorPaused"] = "cyan";
	config["strFree"] = " is really free";
	config["strWorking"] = " working on ";
	config["strPause"] = "Pause";
	config["strPaused"] = "is paused";

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


function parseAgent (obj, agent) {
	obj.find (".agent").html (agent["name"]);
	obj.find (".agent").css ('background', agent["background"]);
}


function parseWork (obj, work) {
	obj.find (".work").html (work["name"]);
	obj.find (".work").css ('background', work["background"]);
}


function onDeviceReady() {
	config = window.localStorage.getItem ("config");

	if (!config) {
		var config = setDefaultConfig();
		window.localStorage.setItem ("config", JSON.stringify (config));
	}

	agentlist = window.localStorage.getItem ("agentlist");

	if (agentlist) {
		agentlist = JSON.parse (agentlist);

		var agent = agentlist.shift();
		parseAgent ($("#agents:first"), agent);

		for (var i=0; i < agentlist.length; i++) {
			var agent = agentlist[i];
			var newagent = $("#agents .agentsrow:first").clone();
			parseAgent (newagent, agent);
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
		parseWork ($("#works:first"), work);

		for (var i=0; i < worklist.length; i++) {
			var work = worklist[i];
			var newwork = $("#works .worksrow:first").clone();
			parseWork (newwork, work);
			newwork.appendTo ("#works");
		}

	} else {
		var list = [setDefaultWork()];
		window.localStorage.setItem ("worklist", JSON.stringify (list));
	}
}
