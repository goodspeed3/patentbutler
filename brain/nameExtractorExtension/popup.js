document.addEventListener('DOMContentLoaded', function () {
    $("#similar").click(function () {
        chrome.storage.local.set({exactId: $("#exactId").val()}, function() {
            console.log('Value is set to ' + $("#exactId").val());
          });
  
        chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
            var activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {"message": $("#exactId").val()}, function (res) {
                $("#output").val(res)
            });
           });
        


    })
    chrome.storage.local.get(['exactId'], function(result) {
        $("#exactId").val(result.exactId)
    });


});

