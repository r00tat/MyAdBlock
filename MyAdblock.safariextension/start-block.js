
var pckg = "at.woelfel.paul.myadblock";

function getPageBlockedAnswer(event){
	if(event.name===pckg+".pageBlockAnswer"){
//		console.log("pageBlockAnswer received");
		if(event.message === true){
			console.log("page should be blocked "+location.href);
//			safari.self.tab.dispatchMessage("CloseActiveTabRequest",null);
//			location.href="about:blank";
			location.href=safari.extension.baseURI+"close.html";
//			window.close();
		}else {
			console.log("page is ok");
		}
	}	
}

safari.self.addEventListener("message", getPageBlockedAnswer, false);

function checkBeforeLoad(event){
//	console.log("checking if allowed to load");
	var notallowed=safari.self.tab.canLoad(event,event.url);
	if(notallowed === "block"){
		console.log("not allowed, preventing "+event.url);
		event.preventDefault();
	}
}

document.addEventListener("beforeload", checkBeforeLoad, true);

// check if this site is blocked
safari.self.tab.dispatchMessage(pckg+".GetBlockedRequest",location.href);

