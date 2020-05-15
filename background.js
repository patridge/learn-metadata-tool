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
                actions: [new chrome.declarativeContent.ShowPageAction()]
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
                actions: [(() => {
                    // NOTE: These calls may fire immediately after the extension is loaded, not when deciding when to show something on a given tab. (Maybe they only fire when an applicable tab is already open???)
                    return new chrome.declarativeContent.ShowPageAction();
                })()]
                // NOTE: Lots of attempts to work with this `actions` system didn't work.
                // actions: [(() => {
                //     // NOTE: These calls may fire immediately after the extension is loaded (possibly only if you have an applicable tab open already).
                //     // FAIL: browserAction not defined?
                //     chrome.browserAction.setPopup({
                //         popup: "azure-devops-extension-popup.html"
                //     });
                //     return new chrome.declarativeContent.ShowPageAction();
                // })()]
                // let doThing = function () {
                //     console.log("Made it!!!");
                //     new chrome.declarativeContent.ShowPageAction();
                // };
                // actions: [
                //     doThing()
                //     // new chrome.declarativeContent.ShowPageAction()
                // ]
                // actions: [
                //     console.log("hola!!!"),
                //     new chrome.declarativeContent.ShowPageAction()
                // ]
                // actions: [(() => {
                //     new chrome.declarativeContent.ShowPageAction();
                // })()]
                // actions: [(function () {
                //     new chrome.declarativeContent.ShowPageAction();
                // })()]
            }
        ]);

        // NOTE: chrome.browserAction is still saying it doesn't have setPopup. Maybe it's not available yet?
        chrome.tabs.onActivated.addListener(function (activeInfo) {
            // window.alert(`tab activated (ID: ${activeInfo.tabId}, windowId: ${activeInfo.windowId})`);
            chrome.tabs.get(activeInfo.tabId, function (tab) {
                // NOTE: This system duplicates a lot of the background.js PageStateMatcher system manually. There is probably a better way.
                let tabId = tab.id;
                let tempAnchor = document.createElement("a");
                tempAnchor.href = tab.url;
                let host = tempAnchor.hostname;
                // TODO: Remove logging after figuring out the structure of tabs and each tab item.
                // window.alert(`tab grabbed (url: ${tab.url},\n host: ${host})`);
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
        });
    });
});

// NOTE: chrome.browserAction is still saying it doesn't have setPopup. Maybe it's not available yet?
// chrome.tabs.onActivated.addListener(function (activeInfo) {
//     window.alert(`tab activated (ID: ${activeInfo.tabId}, windowId: ${activeInfo.windowId})`);
//     chrome.tabs.get(activeInfo.tabId, function (tab) {
//         // NOTE: This system duplicates a lot of the background.js PageStateMatcher system manually. There is probably a better way.
//         let tabId = tab.id;
//         let tempAnchor = document.createElement("a");
//         tempAnchor.href = tab.url;
//         let host = tempAnchor.hostname;
//         // TODO: Remove logging after figuring out the structure of tabs and each tab item.
//         window.alert(`tab grabbed (url: ${tab.url},\n host: ${host})`);
//         if (host.endsWith("docs.microsoft.com")) {
//             chrome.browserAction.setPopup({
//                 tabId: tabId,
//                 popup: "learn-extension-popup.html"
//             }, () => { window.alert("docs setPopup callback!"); });
//         }
//         else if (host.endsWith("visualstudio.com")) {
//             chrome.browserAction.setPopup({
//                 tabId: tabId,
//                 popup: "azure-devops-extension-popup.html"
//             }, function () { window.alert("azdo setPopup callback!"); });
//         }
//     });
//     // This query wasn't always returning the activated tab (but sometimes it was).
//     // chrome.tabs.query({ active: true, currentWindow: true },
//     //     function(tabs) {
//     //         window.alert("tab query started");
//     //         // NOTE: This system duplicates a lot of the background.js PageStateMatcher system manually. There is probably a better way.
//     //         const firstTab = tabs[0];
//     //         let tabId = firstTab.id;
//     //         let tempAnchor = document.createElement("a");
//     //         tempAnchor.href = firstTab.url;
//     //         // TODO: Remove logging after figuring out the structure of tabs and each tab item.
//     //         window.alert(`host: ${tempAnchor.hostname}`);
//     //         console.log({ firstTab, tabs, hostname: tempAnchor.hostname });
//     //         if (tempAnchor.hostname.endsWith("docs.microsoft.com")) {
//     //             chrome.browserAction.setPopup({
//     //                 tabId: tabId,
//     //                 popup: "learn-extension-popup.html"
//     //             }, () => { window.alert("docs setPopup callback!"); });
//     //         }
//     //         else if (tempAnchor.hostname.endsWith("visualstudio.com")) {
//     //             chrome.browserAction.setPopup({
//     //                 tabId: tabId,
//     //                 popup: "azure-devops-extension-popup.html"
//     //             }, function () { window.alert("azdo setPopup callback!"); });
//     //         }
//     //     }
//     // );
// });

// chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
//     // NOTE: `onUpdated` fires for several events in the tabs lifetime. Sometimes, the current URL is available at `tab.url || tab.pendingUrl || changeInfo.url`, but sometimes note. (For some reason, I got a URL when I would refresh a Learn page but not on an AzDO page.) We could try tying to `onCreated` or `onActivated` instead. I worry that `onCreated` may not help with any existing tabs when the extension is installed/loaded/refreshed.
//     // NOTE: There is probably a more reliable way to do a `setPopup` call, but I don't know it yet.

//     // Set the pop-up content based on the current tab: one for Learn/Docs pages, one for Azure DevOps pages.

//     console.log({ status: changeInfo.status, changeInfo })
//     if (changeInfo.status === "complete") {
//         let url = tab.url || tab.pendingUrl || changeInfo.url;
//         // window.alert(`tab updated: ${changeInfo.status} (${url})!`);
//         // NOTE: This system duplicates a lot of the background.js PageStateMatcher system manually. There is probably a better way.
//         // window.alert(`logging:\ntabId: ${tabId}, tab: ${tab} (url: ${tab.url}), changeInfo: ${changeInfo} (${changeInfo.url}, ${changeInfo.status})`);
//         console.log({ tabId, tab, changeInfo });
//         // if (tempAnchor.hostname.endsWith("docs.microsoft.com")) {
//         //     chrome.browserAction.setPopup({
//         //         tabId: tabId,
//         //         popup: "learn-extension-popup.html"
//         //     }, () => { window.alert("docs setPopup callback!"); });
//         // }
//         // else if (tempAnchor.hostname.endsWith("visualstudio.com")) {
//         //     chrome.browserAction.setPopup({
//         //         tabId: tabId,
//         //         popup: "azure-devops-extension-popup.html"
//         //     }, function () { window.alert("azdo setPopup callback!"); });
//         // }
//     }


//     // let setPopUpHtml = function () {
//     //     // Set the pop-up content based on the current tab: one for Learn/Docs pages, one for Azure DevOps pages.
//     //     chrome.tabs.query({ active: true, currentWindow: true },
//     //         function(tabs) {
//     //             window.alert("tab query started");
//     //             // NOTE: This system duplicates a lot of the background.js PageStateMatcher system manually. There is probably a better way.
//     //             const firstTab = tabs[0];
//     //             let tempAnchor = document.createElement("a");
//     //             // TODO: Remove logging after figuring out the structure of tabs and each tab item.
//     //             window.alert(`host: ${tempAnchor.hostname}`);
//     //             console.log({ tab0: firstTab, tabs: tabs, hostname: tempAnchor.hostname });
//     //             tempAnchor.href = firstTab.url;
//     //             let tabId = firstTab.id;
//     //             if (tempAnchor.hostname.endsWith("docs.microsoft.com")) {
//     //                 chrome.browserAction.setPopup({
//     //                     tabId: tabId,
//     //                     popup: "learn-extension-popup.html"
//     //                 }, () => { window.alert("docs setPopup callback!"); });
//     //             }
//     //             else if (tempAnchor.hostname.endsWith("visualstudio.com")) {
//     //                 chrome.browserAction.setPopup({
//     //                     tabId: tabId,
//     //                     popup: "azure-devops-extension-popup.html"
//     //                 }, function () { window.alert("azdo setPopup callback!"); });
//     //             }
//     //         }
//     //     );
//     // };
//     // setPopUpHtml();
// });
