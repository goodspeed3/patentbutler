chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        var results = start(request.message);
        sendResponse(results)
    }
 );

function start(message){
    var results = '';
    var nodesFound = $(message)
    for (var i=0; i<nodesFound.length; i++) {
        var node = nodesFound[i]
        results = results + node.innerText + "\n"
    }
    return results
}
