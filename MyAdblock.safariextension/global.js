console.log('global page loaded');

var debug = false;
var pckg = "at.woelfel.paul.myadblock";
var facebookBlocked=false;

var REGEX_IDX = 0, DOMAIN_IDX = 1;

sitesToBlock = new Array();
sitesToBlock[REGEX_IDX] = localStorage.blockedRegex;
if (sitesToBlock[REGEX_IDX] == null || sitesToBlock[REGEX_IDX] == undefined) {
	sitesToBlock[REGEX_IDX] = new Array(

	);
} else {
	sitesToBlock[REGEX_IDX] = JSON.parse(sitesToBlock[REGEX_IDX]);
}

if (!sitesToBlock[REGEX_IDX] instanceof Array) {
	sitesToBlock[REGEX_IDX] = new Array();
}

sitesToBlock[DOMAIN_IDX] = localStorage.blockedDomains;
if (sitesToBlock[DOMAIN_IDX] == null || sitesToBlock[DOMAIN_IDX] == undefined) {
	sitesToBlock[DOMAIN_IDX] = new Array();
} else {
	sitesToBlock[DOMAIN_IDX] = JSON.parse(sitesToBlock[DOMAIN_IDX]);
}

if (!sitesToBlock[DOMAIN_IDX] instanceof Array) {
	sitesToBlock[DOMAIN_IDX] = new Array();
}

facebookBlocked = localStorage.fbBlockEnabled;
if (facebookBlocked == null || facebookBlocked == undefined) {
	facebookBlocked=false;
}else {
	facebookBlocked=true;
}



cleanBlockedDomains();

console.log("regexes to block: " + sitesToBlock[REGEX_IDX]);
console.log("domains to block: " + sitesToBlock[DOMAIN_IDX]);

function checkBlocked(location) {

	if (location == null || location == undefined)
		return false;

	// console.log('checking blocked');

	// we do not want to block about pages or extension preferences
	if (location.match(/about:/i) || location.match(/safari-extension:/i))
		return false;

	var domain = location.replace(/^[a-z]+:\/\//ig, "").replace(/\/.*$/ig, '');

	if (domain != null && domain.length > 0)
		for ( var i = 0; i < sitesToBlock[DOMAIN_IDX].length; i++) {
			if (domain.indexOf(sitesToBlock[DOMAIN_IDX][i]) >= 0) {
				console.log("blocking because of domain " + sitesToBlock[DOMAIN_IDX][i] + ":" + location);
				return true;
			}
		}

	for ( var i = 0; i < sitesToBlock[REGEX_IDX].length; i++) {
		if (location.match(new RegExp(sitesToBlock[REGEX_IDX][i], "i"))) {
			console.log('blocking because of regex ' + sitesToBlock[REGEX_IDX][i] + ':' + location);
			return true;
		}
	}

	return false;
}

function closeActiveTab() {
	safari.application.activeBrowserWindow.activeTab.close();
}

// function openBlockHandler(event) {
// console.log("openBlock!");
// }
// safari.application.addEventListener("open", openBlockHandler, true);

function beforeNavigateBlockHandler(event) {
	// console.log("befornavigate");
	if (checkBlocked(event.url)) {
		console.log("befornavigate blocked url " + event.url);
		
		// search for tab to close

		if (event.currentTarget instanceof SafariApplication) {

			// only close an empty tab
			if (safari.application.activeBrowserWindow.activeTab.url == "") {
				// close active tab
				safari.application.activeBrowserWindow.activeTab.close();
			}
		
		}
		event.preventDefault();
		if (event.cancelable)
			event.stopPropagation();
	}
}
safari.application.addEventListener("beforeNavigate", beforeNavigateBlockHandler, true);

function handleGlobalMessage(event) {
//	console.log("event "+event.name+" received");
	if (event.name ===  "canLoad") {

		var url=event.message;
		if (debug) {
			console.log("can load check " + url);
		}
		if(checkBlocked(url)===true){
			event.message = "block";
			console.log("blocking "+url+" with canLoad ");
		}else {
			event.message = "allow";
		}
	
	}


	if (event.name.indexOf(pckg) == 0) {

		var name = event.name.replace(pckg + ".", "");
		// console.log("event received: "+event.name+" ,"+name);
		switch (name) {
		case "GetBlockedRequest":
			var data = event.message;
			if (debug) {
				console.log("Get Block Request");
				console.log(data);
			}
			var result = checkBlocked(data);

			event.target.page.dispatchMessage(pckg + ".pageBlockAnswer", result);
			break;
		case "CloseActiveTabRequest":
			closeActiveTab();
			break;
		case "showPrefs":
			openPreferences();
			break;
		case "getPrefs":
			console.log("get prefs");
			event.target.page.dispatchMessage(pckg + ".getPrefsCallback", new Array(sitesToBlock[REGEX_IDX], sitesToBlock[DOMAIN_IDX]));
			break;
		case "savePrefs":
			console.log("save prefs");
			savePrefs(event.message);
			event.target.page.dispatchMessage(pckg + ".savePrefsCallback", "preferences saved!");
			break;
		// case "addRegex":
		// console.log("add regex");
		// addBlockedSiteRegex(event.message);
		// event.target.page.dispatchMessage(pckg+".addRegexCallback","regex
		// added!");
		// break;
		// case "addDomain":
		// console.log("add domain");
		// addBlockedSiteDomain(event.message);
		// event.target.page.dispatchMessage(pckg+".addDomainCallback","domain
		// or host added!");
		// break;
		}
	}
}
safari.application.addEventListener("message", handleGlobalMessage, false);

function openPreferences() {
	var newTab = safari.application.activeBrowserWindow.openTab();
	newTab.url = safari.extension.baseURI + "preferences.html";
	newTab.activate();
}

function handleCommands(event) {
	if (event.command === pckg + ".stop") {
		openPreferences();
	}
}
safari.application.addEventListener("command", handleCommands, false);

function savePrefs(data) {
	if (data instanceof Array && data[0] instanceof Array && data[1] instanceof Array) {
		sitesToBlock[REGEX_IDX] = data[0];
		sitesToBlock[DOMAIN_IDX] = data[1];
		saveBlockedSites();
	}
}

function addBlockedSiteRegex(regex) {
	sitesToBlock[REGEX_IDX].push(regex);
	saveBlockedSites();
}

function removeBlockedSiteRegex(regex) {
	var idx = regex.indexOf(sitesToBlock[REGEX_IDX]);
	if (idx >= 0) {
		delete sitesToBlock[REGEX_IDX][idx];
		sitesToBlock[REGEX_IDX] = sitesToBlock[REGEX_IDX].compact();
		saveBlockedSites();
		return true;
	} else {
		return false;
	}
}

function addBlockedSiteDomain(domain) {
	sitesToBlock[DOMAIN_IDX].push(domain);
	saveBlockedSites();
}

function removeBlockedSiteDomain(domain) {
	var idx = domain.indexOf(sitesToBlock[REGEX_IDX]);
	if (idx >= 0) {
		delete sitesToBlock[DOMAIN_IDX][idx];
		sitesToBlock[DOMAIN_IDX] = sitesToBlock[DOMAIN_IDX].compact();
		saveBlockedSites();
		return true;
	} else {
		return false;
	}
}

function cleanBlockedDomains() {
	for ( var j = 0; j < 2; j++) {

		if (sitesToBlock[j] == null || sitesToBlock[j] == undefined || !sitesToBlock[j] instanceof Array) {
			sitesToBlock[j] = new Array();
		}
		for ( var i = 0; i < sitesToBlock[j].length; i++) {
			if (sitesToBlock[j][i] == null || sitesToBlock[j][i] == undefined || sitesToBlock[j][i] == "" || sitesToBlock[j][i].match(/^\s*$/i)) {
				delete sitesToBlock[j][i];
				sitesToBlock[j] = sitesToBlock[j].compact();
				i--;
			}
		}
	}
}

function saveBlockedSites() {

	cleanBlockedDomains();

	localStorage.setItem("blockedRegex", JSON.stringify(sitesToBlock[REGEX_IDX]));
	localStorage.setItem("blockedDomains", JSON.stringify(sitesToBlock[DOMAIN_IDX]));
	localStorage.setItem("fbBlockEnabled", JSON.stringify(facebookBlockEnabled);
}
