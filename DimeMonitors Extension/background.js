/*chrome.storage.local.set({ toggle: true }, function () {
 
});

chrome.commands.onCommand.addListener(function (command) {
  if (command === "toggle") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      let result = chrome.storage.local.get(["toggle"], function (result) {
        console.log(result);
        return result.toggle;
      });
      chrome.tabs.sendMessage(tabs[0].id, { data: result });
    });
  }
});*/
