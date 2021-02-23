var purchaseButton = document.querySelector("[data-testid = 'button-pay-with-crypto']");
if (purchaseButton) purchaseButton.click();
chrome.extension.onMessage.addListener(handleMessage);
function handleMessage(request) {
  console.log(request.data);
}
