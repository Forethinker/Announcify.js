var API_TOKEN = "b72fef8077d8741f511f929533291683";
var API_URL = "http://www.diffbot.com/api/article?token=" + API_TOKEN + "&url=";
var API_URL_APPENDIX = "&html=true";

var lastIndex = -1;
var lang;
var paragraphs;

document.addEventListener('keyup', onKeyUp, false);
fetchArticle();

chrome.extension.sendRequest({type: 'track', name: 'language', value: getParameter('lang')});

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

    setTitle(unescape(getParameter("title")));

    var article;
    var url = getParameter("url");
    var selected = getParameter("selected");
    if (!selected) {
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
    hideLoading();
    speak();
}

function speak() {
    ANNOUNCIFY.announcify("You're now listening to: " + getTitle(), "en-US", onUtteranceCompleted);
    lang = getParameter("lang");
    paragraphs = document.getElementsByTagName("p");
}

function onUtteranceCompleted(event) {
    if (event.type == "end") {
        lastIndex++;

        var text = TAGSOUP.getText(paragraphs[lastIndex].innerHTML);
        ANNOUNCIFY.announcify(text, lang, onUtteranceCompleted);
        highlight(lastIndex);
    } else {
        chrome.extension.sendRequest({type: 'track', name: 'error', value: event});
    }
}

function onKeyUp(e) {
    var text = TAGSOUP.getText(paragraphs[lastIndex].innerHTML);

    switch(e.keyCode) {
        case 38: /*UP*/
            lastIndex--;
            ANNOUNCIFY.stop();

            ANNOUNCIFY.announcify(text, lang, onUtteranceCompleted);
            highlight(lastIndex);

            chrome.extension.sendRequest({type: 'track', name: 'key', value: 'up'});
            break;

        case 40:/*DOWN*/
            lastIndex++;
            ANNOUNCIFY.stop();

            ANNOUNCIFY.announcify(text, lang, onUtteranceCompleted);
            highlight(lastIndex);

            chrome.extension.sendRequest({type: 'track', name: 'key', value: 'down'});
            break;

        case 32: /*SPACE*/
            chrome.tts.isSpeaking(function(speaking) {
                if (speaking) {
                    ANNOUNCIFY.stop();
                } else {
                    ANNOUNCIFY.announcify(text, lang, onUtteranceCompleted);
                }
            });

            chrome.extension.sendRequest({type: 'track', name: 'key', value: 'space'});
            break;
    }
}