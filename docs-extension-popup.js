// NOTE: This script executes in the context of the pop-up itself (vs. below, where we execute a script in the target tab).
let uidSpan = document.querySelector("#uid");
let msAuthorSpan = document.getElementById("msAuthor");
let gitHubAuthorSpan = document.getElementById("gitHubAuthor");
let msDateSpan = document.getElementById("msDate");
let contentYamlSourceSpan = document.getElementById("yamlSourceSpan");
let contentYamlGitUrlAnchor = document.getElementById("repoUrlYaml");
let contentMarkdownSourceSpan = document.getElementById("markdownSourceSpan");
let contentMarkdownGitUrlAnchor = document.getElementById("repoUrlMarkdown");
let contentNotebookSourceSpan = document.getElementById("notebookSourceSpan");
let contentNotebookGitUrlAnchor = document.getElementById("repoUrlNotebook");
let relatedFeedbackWorkItemsQueryUrl = document.getElementById("relatedWorkItemsQueryUrl");
let relatedVerbatimsWorkItemsQueryUrl = document.getElementById("relatedVerbatimsQueryUrl");
let customLink = document.getElementById("customLink");
const customLinkSection = document.getElementById("customLinkSection");

let copyButtons = [...document.getElementsByClassName("copy-field-btn")];
copyButtons.forEach(btn => {
    btn.addEventListener("click", async function(element) {
        // Find nearest sibling `.copy-field-target` and copying its text to clipboard.
        let siblingCopyTargets = [...btn.parentElement.parentElement.getElementsByClassName("copy-field-target")];
        let copyTarget = siblingCopyTargets && siblingCopyTargets[0];
        let copyValue = copyTarget?.innerText ?? "";
        // NOTE: Catching error because it will throw a DOMException ("Document is not focused.") whenever the window isn't focused and we try to copy to clipboard (e.g., debugging in dev tools).
        await navigator.clipboard.writeText(copyValue).catch(error => console.log("Error while trying to copy to clipboard", error));
    });
});

let displayMetadata = function (metadata) {
    let uid = metadata.uid;
    uidSpan.textContent = uid;
    msAuthorSpan.textContent = metadata.msAuthorMetaTagValue;
    gitHubAuthorSpan.textContent = metadata.gitHubAuthorMetaTagValue;
    msDateSpan.textContent = metadata.msDateMetaTagValue;

    if (metadata.gitHubYamlLocation) {
        contentYamlSourceSpan.style.display = "inline";
        contentYamlGitUrlAnchor.setAttribute("href", metadata.gitHubYamlLocation);
    }
    else {
        contentYamlSourceSpan.style.display = "none";
        contentYamlGitUrlAnchor.removeAttribute("href");
    }
    if (metadata.gitHubMarkdownLocation) {
        contentMarkdownSourceSpan.style.display = "inline";
        contentMarkdownGitUrlAnchor.setAttribute("href", metadata.gitHubMarkdownLocation);
    }
    else {
        contentMarkdownSourceSpan.style.display = "none";
        contentMarkdownGitUrlAnchor.removeAttribute("href");
    }
    if (metadata.gitHubNotebookLocation) {
        contentNotebookSourceSpan.style.display = "inline";
        contentNotebookGitUrlAnchor.setAttribute("href", metadata.gitHubNotebookLocation);
    }
    else {
        contentNotebookSourceSpan.style.display = "none";
        contentNotebookGitUrlAnchor.removeAttribute("href");
    }

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
};

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    switch (request.method) {
        case "metadataCollected":
            displayMetadata(request.data);

            sendResponse(
                {
                    result: "success"
                }
            );
            break;
    }
});

// Execute a script in the current tab.
chrome.tabs.query({ active: true, currentWindow: true },
    function(tabs) {
        // NOTE: This system duplicates a lot of the background.js PageStateMatcher system manually. There is probably a better way.
        const microsoftLearnPageScript = "get-docs-metadata.js";
        let tempAnchor = document.createElement("a");
        tempAnchor.href = tabs[0].url;
        let tabId = tabs[0].id;
        if (tempAnchor.hostname.endsWith("docs.microsoft.com")) {
            chrome.tabs.executeScript(
                tabId,
                {
                    file: microsoftLearnPageScript
                }
            );
        }
    }
);

let getCustomLink = async function () {
    let currentSavedCustomLink = await storageHelper.storageSyncGetAsync(
        {
            customLinkLabel: null,
            customLinkUrl: null,
            hasSetCustomLink: false,
            isLinkDisabled: true
        }
    );
    console.log(currentSavedCustomLink);
    return currentSavedCustomLink;
};
let displayCustomLink = async () => {
    customLinkSection.style.display = "none";
    const customLinkDetails = await getCustomLink();
    const showCustomLink = !(customLinkDetails?.isLinkDisabled ?? true);
    if (showCustomLink) {
        if (customLinkDetails.customLinkUrl) {
            customLinkSection.style.display = "block";
            customLink.setAttribute("href", customLinkDetails.customLinkUrl);
            if (customLinkDetails.customLinkLabel) {
                customLink.text = customLinkDetails.customLinkLabel;
            }
        }
    }
};
displayCustomLink();
