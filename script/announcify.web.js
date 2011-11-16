var API_TOKEN = "b72fef8077d8741f511f929533291683";
var API_URL = "http://www.diffbot.com/api/article?token=" + API_TOKEN + "&url=";
var API_URL_APPENDIX = "&html=true";

var lastIndex = -1;
var lang;
var paragraphs;
var _done = false;

document.addEventListener("keyup", onKeyUp, false);
document.getElementById("backward").addEventListener("click", previous, false);
document.getElementById("play").addEventListener("click", pause, false);
document.getElementById("forward").addEventListener("click", next, false);
fetchArticle();

ANNOUNCIFY.setEventListener(onUtteranceCompleted);

chrome.extension.sendRequest({name: 'language', value: getParameter('lang')});

window.onunload = function() {
   ANNOUNCIFY.stop();
};


// from http://www.netlobo.com/url_query_string_javascript.html
function getParameter(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    regexS = "[\\?&]" + name + "=([^&#]*)";
    regex = new RegExp(regexS);
    results = regex.exec(window.location.href);
    if (!results) {
        return "";
    } else {
        return results[1];
    }
}

function fetchArticle() {
    // TODO: ugly, but it seems to be necessary (onUtteranceCompleted not fired without warming up)
    chrome.tts.speak("");
    if (!getParameter("warmedUp")) {
        window.location.href = window.location.href + "&warmedUp=true";
        return;
    }

    url = getParameter("url");
    if (url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', API_URL + url + API_URL_APPENDIX, true);
        xhr.onreadystatechange = function(event) {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    article = JSON.parse(xhr.responseText);

                    displayArticle(article);
                } else {
                    var confirmReload = window.confirm("Something went wrong. :/ Do you want to reload and try again?");
                    if (confirmReload) window.location.reload(true);
                }
            }
        };
	        xhr.send(null);
    } else {
        article = {html: "<p>" + unescape(getParameter("text")) + "</p>", title: unescape(getParameter("title"))};
		displayArticle(article);
	}
}

function displayArticle(article) {
    articleDiv = document.createElement("div");
    articleDiv.setAttribute("id", "div_article");
    articleDiv.innerHTML = article.html;
    document.body.appendChild(articleDiv);
    setTitle(article.title);
    hideLoading();
    speak();
}

function speak() {
    ANNOUNCIFY.announcify("You're now listening to: " + getTitle(), "en-US");
    lang = getParameter("lang");
    paragraphs = document.getElementsByTagName("p");
}

function onUtteranceCompleted(event) {
    if (event.type == "end") {
       next(false);
    } else {
        chrome.extension.sendRequest({name: 'error', value: event});
    }
}


function next(shouldStop){
	console.log(lastIndex + " from " + paragraphs.length);
	if(lastIndex < paragraphs.length-1){
    	if(shouldStop)
    	    ANNOUNCIFY.stop();

    	lastIndex++;

    	var text = TAGSOUP.getText(paragraphs[lastIndex].innerHTML);
    	ANNOUNCIFY.announcify(text, lang);
    	highlight(lastIndex);
    }else{
    	done(paragraphs.length);
    	lastIndex = -1;
    	_done = true;
    }
}

function previous(){
	if(lastIndex > 0){
    	lastIndex--;
    	var text = TAGSOUP.getText(paragraphs[lastIndex].innerHTML);

    	ANNOUNCIFY.stop();
    	ANNOUNCIFY.announcify(text, lang);
    	highlight(lastIndex);
	}
}

function pause(){
    if(!_done)
    	if(ANNOUNCIFY.isPaused())
        	ANNOUNCIFY.continue();
    	else
        	ANNOUNCIFY.pause();
    else{
    	speak();
    	_done = false;
    }
}




function onKeyUp(e) {

    switch(e.keyCode) {
        case 38:/*UP*/
            previous();
            chrome.extension.sendRequest({name: 'key', value: 'up'});
            break;

        case 40:/*DOWN*/
            next(true);
            chrome.extension.sendRequest({name: 'key', value: 'down'});
            break;

        case 32: /*SPACE*/
            pause();
            chrome.extension.sendRequest({name: 'key', value: 'space'});
            break;
    }


}


document.onkeydown = function(e) {
    //Prevent scrolling
    if(e.keyCode == 38 || e.keyCode == 40 || e.keyCode == 32) {
          e.preventDefault();
          return false;
    }
    return true;
};
