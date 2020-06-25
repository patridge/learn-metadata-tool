// NOTE: This script executes in the context of the pop-up itself (vs. below, where we execute a script in the target tab).
let uidSpan = document.querySelector("#uid");
let msAuthorSpan = document.getElementById("msAuthor");
let gitHubAuthorSpan = document.getElementById("gitHubAuthor");
let msDateSpan = document.getElementById("msDate");
let contentYamlGitUrlAnchor = document.getElementById("repoUrlYaml");
let contentMarkdownGitUrlAnchor = document.getElementById("repoUrlMarkdown");

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

let displayMetadata = function (metadata) {
    uidSpan.textContent = metadata.uid;
    msAuthorSpan.textContent = metadata.msAuthorMetaTagValue;
    gitHubAuthorSpan.textContent = metadata.gitHubAuthorMetaTagValue;
    msDateSpan.textContent = metadata.msDateMetaTagValue;

    if (metadata.gitHubYamlLocation) {
        contentYamlGitUrlAnchor.setAttribute("href", metadata.gitHubYamlLocation);
    }
    else {
        contentYamlGitUrlAnchor.removeAttribute('href');
    }
    if (metadata.gitHubMarkdownLocation) {
        contentMarkdownGitUrlAnchor.setAttribute("href", metadata.gitHubMarkdownLocation);
    }
    else {
        contentMarkdownGitUrlAnchor.removeAttribute('href');
    }
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
