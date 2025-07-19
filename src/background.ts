const hostPopupMap: { hostSuffix: string; popupHtml: string }[] = [
    // We are hoping to allow this extension whenever we can. That includes the following URL examples.
    // * Microsoft Docs: https://learn.microsoft.com/en-us/xamarin/essentials/platform-feature-support?context=xamarin/android
    // * Microsoft Learn (modules, units): https://learn.microsoft.com/en-us/training/modules/welcome-to-azure/2-what-is-azure
    // * Microsoft Learn Docs: https://review.learn.microsoft.com/learn-docs/docs/support-triage-issues
    // Not super specific here, but may be good enough (other options: https://developer.chrome.com/extensions/declarativeContent#type-PageStateMatcher).
    // We could make a bunch of nearly identical rules for these or catch more than intended and handle edge cases elsewhere in code. So far, we are choosing the later.
    { hostSuffix: "learn.microsoft.com", popupHtml: "docs-extension-popup.html" },
    // * Azure DevOps (current location): https://dev.azure.com/
    { hostSuffix: "dev.azure.com", popupHtml: "azure-devops-extension-popup.html" },
    // * Azure DevOps (legacy location): https://*.visualstudio.com/
    { hostSuffix: "visualstudio.com", popupHtml: "azure-devops-extension-popup.html" },
];

function getPopupForHost(host: string): string | null {
    const found = hostPopupMap.find(entry => host.endsWith(entry.hostSuffix));
    return found?.popupHtml ?? null;
}

// NOTE: When this was written, we didn't know that a `null` tab ID would use the current tab.
// TODO: Determine if all the tab query and ID stuff here could instead by replaced with `null` tabId (defaults to current window per docs [https://developer.chrome.com/extensions/tabs#method-executeScript]).
let setPopUpByTabId = function (tabId: number | undefined): void {
    if (!tabId) {
        console.log(`Tab ID (${tabId}) wasn't provided?`);
        return;
    }

    chrome.tabs.get(tabId, function (tab: chrome.tabs.Tab) {
        // Use the tab mapping system to determine which pop-up to show for the current tab.

        // Sometimes Chrome will record a pair of error messages in the extension log when accessing `tab` that doesn't make sense [yet]. They definitely do not align with tabs being actively edited, though. It seems to happen when reloading the extension and switching tabs via click. (Avoided when switching via Ctrl[+Shift]+Tab for some reason.)
        // > Unchecked runtime.lastError: Tabs cannot be edited right now (user may be dragging a tab).
        // > Error handling response: TypeError: Cannot read property 'id' of undefined
        // A try-catch around these two `tab.*` calls was supposed to keep that noise from polluting the extension log, but didn't appear to help at all.
        let tabId = tab.id!;
        let tabUrl = tab.url!;

        if (!tabUrl || (!tabUrl.startsWith("http://") && !tabUrl.startsWith("https://"))) {
            // Skip tabs without a valid HTTP(S) URL (e.g., new tab page).
            console.log(`Tab ID ${tabId} doesn't have a valid URL: ${tabUrl}`);
            return;
        }

        let tabUrlHostUrl = new URL(tabUrl);
        let host = tabUrlHostUrl.hostname;

        const popupHtml = getPopupForHost(host);
        if (popupHtml) {
            console.log(`Setting pop-up for tab ID ${tabId} to '${popupHtml}' for host '${host}'`);
            chrome.action.setPopup({
                tabId: tabId,
                popup: popupHtml
            });
        }
    });
}

chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([
            {
                conditions: hostPopupMap.map(entry =>
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: {
                            hostSuffix: entry.hostSuffix
                        }
                    })
                ),
                actions: [
                    new chrome.declarativeContent.ShowPageAction()
                ]
                // To call other code during actions, wrap up things in an immediately executed function and return the `ShowPageAction` result.
                // actions: [(() => {
                //     // NOTE: These calls may fire immediately after the extension is loaded, not when deciding when to show something on a given tab. (Maybe they only fire when an applicable tab is already open???)
                //     setPopUpViaActiveTabQuery();
                //     return new chrome.declarativeContent.ShowPageAction();
                // })()]
            }
        ]);
    });
});

// TODO: Figure out why background.js doesn't seem to receive any messages like this. (Or I don't see the console output in the page console or pop-up console.)
// Listen for a request to have the background script request another page (avoids CORB errors with cross-site requests).
// chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
//     console.log(`Message received (background.js): ${request.method}`, request);
//     switch (request.method) {
//         case "requestLearnContentPage":
//             sendResponse(
//                 {
//                     result: "test",
//                     data: {},
//                 }
//             );
//             break;
//     }
// });

// NOTE: This handles when you switch between tabs to readdress which pop-up is shown.
chrome.tabs.onActivated.addListener(function (activeInfo: chrome.tabs.TabActiveInfo) {
    setPopUpByTabId(activeInfo.tabId);
});
// NOTE: This handles when you navigate between pages _within_ a tab to readdress which pop-up is shown. (Sometimes, if a page didn't need a pop-up and you navigated to one that should have a pop-up, it wasn't being shown.)
chrome.tabs.onUpdated.addListener(function (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    // This gets called a lot! Restrict to only onUpdated calls where the URL in the tab was changed.
    if (changeInfo.url) {
        setPopUpByTabId(tabId);
    }
});
// TODO: Add a default pop-up that isn't set for a page, in case we haven't run anything yet.
