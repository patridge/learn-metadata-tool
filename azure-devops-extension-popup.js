// NOTE: This script executes in the context of the pop-up itself (vs. below, where we execute a script in the target tab).
let uidSpan = document.getElementById("uid");
let contentUrl = document.getElementById("contentUrl");
let relatedFeedbackWorkItemsQueryUrl = document.getElementById("relatedWorkItemsQueryUrl");
let relatedVerbatimsWorkItemsQueryUrl = document.getElementById("relatedVerbatimsQueryUrl");

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

let displayWorkItemData = async function (workItemData) {
    // NOTE: Semi-brittle here, since AzDO fields can have custom labels. Fields show the raw field name in a hover on the label, but I can't seem to find where that data is hiding in the rendered HTML yet. For module work items, the UID field is aliased as "Module UID", so we have to look there as a fallback.
    /**
     * @type {string}
     */
    let uid = workItemData.UID || workItemData["Module UID"];
    if (uid) {
        uidSpan.textContent = uid;
        uidSpan.title = uid;

        // For related items, search for immediate UID and next level up
        // e.g., learn.area.module.1-unit -> [ learn.area.module.1-unit, learn.area.module ]
        //let uidPeriodCount = uid.length - uid.replace(".", "").length;
        let uidWithoutLastSection = uid.slice(0, uid.lastIndexOf("."));
        let uidSubstrings = [uid, uidWithoutLastSection];
        let uidQuery = `'${uidSubstrings.join("','")}'`;
        let issueQuery = `SELECT [System.Id],[Title],[Severity],[Created Date],[Work Item Type],[Assigned To],[Triage Status],[Feedback Type],[UID],[URL],[Repo MSFT Learn] FROM workitems WHERE [Team Project] = @project AND [Work Item Type] = 'Customer Feedback' AND [State] = 'New'
        AND [UID] IN (${uidQuery}) AND [Feedback Source]='Report an issue' ORDER BY [UID], [Severity]`;
        let uidMatchIssuesQuery = `https://ceapex.visualstudio.com/Microsoft%20Learn/_queries/query/?wiql=${encodeURIComponent(issueQuery)}`;
        relatedFeedbackWorkItemsQueryUrl.setAttribute("href", uidMatchIssuesQuery);
        let verbatimQuery = `SELECT [System.Id],[Title],[Severity],[Created Date],[Work Item Type],[Assigned To],[Triage Status],[Feedback Type],[UID],[URL],[Repo MSFT Learn] FROM workitems WHERE [Team Project] = @project AND [Work Item Type] = 'Customer Feedback' AND [State] = 'New'
        AND [UID] IN (${uidQuery}) AND [Feedback Source]='Star rating verbatim' ORDER BY [UID], [Severity]`;
        let uidMatchVerbatimQuery = `https://ceapex.visualstudio.com/Microsoft%20Learn/_queries/query/?wiql=${encodeURIComponent(verbatimQuery)}`;
        relatedFeedbackWorkItemsQueryUrl.setAttribute("href", uidMatchIssuesQuery);
        relatedVerbatimsWorkItemsQueryUrl.setAttribute("href", uidMatchVerbatimQuery);
    }
    else {
        uidSpan.textContent = "<no work item found>";
        relatedFeedbackWorkItemsQueryUrl.removeAttribute("href");
        relatedVerbatimsWorkItemsQueryUrl.removeAttribute("href");
    }

    // NOTE: Module work items won't have a URL field, so we don't get a link for those work items.
    if (workItemData.URL) {
        contentUrl.setAttribute("href", workItemData.URL);
    }
    else {
        contentUrl.removeAttribute('href');
    }
};

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    switch (request.method) {
        case "workItemCollected":
            await displayWorkItemData(request.data);

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
        let host = tempAnchor.hostname;
        if (host.endsWith("visualstudio.com") || host === "dev.azure.com") {
            chrome.tabs.executeScript(
                tabId,
                {
                    file: azureDevOpsPageScript
                }
            );
        }
    }
);
