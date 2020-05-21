let setPopUpByTabId = function (tabId) {
    if (!tabId) { return; }

    chrome.tabs.get(tabId, function (tab) {
        // NOTE: This system manually duplicates a lot of what is being done in background.js PageStateMatcher system. There is probably a better way.
        let tabId = tab.id;
        let tempAnchor = document.createElement("a");
        tempAnchor.href = tab.url;
        let host = tempAnchor.hostname;
        if (host.endsWith("docs.microsoft.com")) {
            chrome.browserAction.setPopup({
                tabId: tabId,
                popup: "learn-extension-popup.html"
            });
        }
        else if (host.endsWith("visualstudio.com")) {
            chrome.browserAction.setPopup({
                tabId: tabId,
                popup: "azure-devops-extension-popup.html"
            });
        }
    });
}
let setPopUpViaActiveTabQuery = function () {
    chrome.tabs.query({ active: true, currentWindow: true },
        function(tabs) {
            let tabId = tabs[0]?.id;
            setPopUpByTabId(tabId);
        }
    );
}
chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        // TODO: Find out if conditions in the array are AND or OR. If OR, we can combine them both (possible example evidence for OR: https://github.com/kudos/combine.fm/blob/8ea8b4d279bf411064cf1328710e8a343fe021d5/chrome/src/background.js#L5-L42).
        chrome.declarativeContent.onPageChanged.addRules([
            {
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: {
                            // We are hoping to allow this extension whenever we can. That includes the following URL examples.
                            // * Microsoft Docs: https://docs.microsoft.com/en-us/xamarin/essentials/platform-feature-support?context=xamarin/android
                            // * Microsoft Learn (modules, units): https://docs.microsoft.com/en-us/learn/modules/welcome-to-azure/2-what-is-azure
                            // * Microsoft Learn Docs: https://review.docs.microsoft.com/learn-docs/docs/support-triage-issues
                            // Not super specific here, but may be good enough (other options: https://developer.chrome.com/extensions/declarativeContent#type-PageStateMatcher).
                            // We could make a bunch of nearly identical rules for these or catch more than intended and handle edge cases elsewhere in code. So far, we are choosing the later.
                            hostSuffix: "docs.microsoft.com",
                        },
                    })
                ],
                actions: [
                    new chrome.declarativeContent.ShowPageAction()
                ]
            },
            {
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: {
                            // We are hoping to allow this extension whenever we can. That includes the following URL examples.
                            // * Azure DevOps: https://*.visualstudio.com/
                            // Not super specific here, but may be good enough (other options: https://developer.chrome.com/extensions/declarativeContent#type-PageStateMatcher).
                            // We could make a bunch of nearly identical rules for these or catch more than intended and handle edge cases elsewhere in code. So far, we are choosing the later.
                            hostSuffix: "visualstudio.com",
                        },
                    })
                ],
                actions: [
                    new chrome.declarativeContent.ShowPageAction()
                ]
                // actions: [(() => {
                //     // NOTE: These calls may fire immediately after the extension is loaded, not when deciding when to show something on a given tab. (Maybe they only fire when an applicable tab is already open???)
                //     setPopUpViaActiveTabQuery();
                //     return new chrome.declarativeContent.ShowPageAction();
                // })()]
            }
        ]);

        // NOTE: This handles when you switch between tabs to readdress which pop-up is shown.
        chrome.tabs.onActivated.addListener(function (activeInfo) {
            setPopUpByTabId(activeInfo.tabId);
        });
        // NOTE: This handles when you navigate between pages _within_ a tab to readdress which pop-up is shown. (Sometimes, if a page didn't need a pop-up and you navigated to one that should have a pop-up, it wasn't being shown.)
        chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
            // This gets called a lot! Restrict to only onUpdated calls where the URL in the tab was changed.
            if (changeInfo.url) {
                setPopUpByTabId(tabId);
            }
        });
        // TODO: Add a default pop-up that isn't set for a page, in case we haven't run anything yet.
    });
});
