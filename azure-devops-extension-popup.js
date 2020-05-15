// NOTE: This script executes in the context of the pop-up itself (vs. below, where we execute a script in the target tab).
let uidSpan = document.getElementById("uid");

let displayWorkItemData = async function (workItemData) {
    uidSpan.textContent = workItemData.uid;
    // TODO: Offer link to get related work items (by UID or portion of UID)
    // TODO: Offer link to work item URL

    // if (workItemData.uid) {
    //     let relatedItemsUrl = "";
    //     // TODO: Build URL for ad hoc AzDO query to related items.
    //     contentYamlGitUrlAnchor.setAttribute("href", relatedItemsUrl);
    // }
    // else {
    //     contentYamlGitUrlAnchor.removeAttribute('href');
    // }
    // if (workItemData.gitHubMarkdownLocation) {
    //     contentMarkdownGitUrlAnchor.setAttribute("href", workItemData.gitHubMarkdownLocation);
    // }
    // else {
    //     contentMarkdownGitUrlAnchor.removeAttribute('href');
    // }
};

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    switch (request.method) {
        case "workItemCollected":
            await displayWorkItemData(request.data);

            let copyButtons = [...document.getElementsByClassName("copy-field-btn")];
            copyButtons.forEach(btn => {
                btn.onclick = async function(element) {
                    // Find nearest sibling `.copy-field-target` and copying its text to clipboard.
                    let siblingCopyTargets = [...btn.parentNode.parentNode.getElementsByClassName("copy-field-target")];
                    let copyTarget = siblingCopyTargets && siblingCopyTargets[0];
                    let copyValue = copyTarget && copyTarget.innerText;
                    // NOTE: Catching error because it will throw a DOMException ("Document is not focused.") whenever the window isn't focused and we try to copy to clipboard (e.g., debugging in dev tools).
                    await navigator.clipboard.writeText(copyValue).catch(error => console.log("Error while trying to copy to clipboard", error));
                };
            });

            sendResponse(
                {
                    result: "success"
                }
            );
            break;
    }
});

// Have pop-up execute a script in the current tab.
chrome.tabs.query({ active: true, currentWindow: true },
    function(tabs) {
        // NOTE: This system duplicates a lot of the background.js PageStateMatcher system manually. There is probably a better way.
        const azureDevOpsPageScript = "azdo-helpers.js";
        let tempAnchor = document.createElement("a");
        tempAnchor.href = tabs[0].url;
        let tabId = tabs[0].id;
        // TODO: Remove logging after figuring out the structure of tabs and each tab item.
        console.log({ tab0: tabs[0], tabs: tabs, hostname: tempAnchor.hostname });
        if (tempAnchor.hostname.endsWith("visualstudio.com")) {
            chrome.tabs.executeScript(
                tabId,
                {
                    file: azureDevOpsPageScript
                }
            );
        }
    }
);
