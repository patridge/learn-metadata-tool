let gatherMetadataButton = document.getElementById("gatherMetadata");
let msAuthorSpan = document.getElementById("msAuthor");
let gitHubAuthorSpan = document.getElementById("gitHubAuthor");
let msDateSpan = document.getElementById("msDate");
let contentYamlGitUrlAnchor = document.getElementById("repoUrlYaml");
let contentMarkdownGitUrlAnchor = document.getElementById("repoUrlMarkdown");

let displayMetadata = async function (metadata) {
    msAuthorSpan.textContent = metadata.msAuthorMetaTagValue;
    gitHubAuthorSpan.textContent = metadata.gitHubAuthorMetaTagValue;
    msDateSpan.textContent = metadata.msDateMetaTagValue;
    contentYamlGitUrlAnchor.href = metadata.gitHubYamlLocationMaster;
    contentMarkdownGitUrlAnchor.href = metadata.gitHubMarkdownLocationMaster;

    // NOTE: Catching error because it will throw a DOMException ("Document is not focused.") whenever the window isn't focused and we try to copy to clipboard (e.g., debugging in dev tools).
    await navigator.clipboard.writeText(metadata.msAuthorMetaTagValue).catch(error => console.log("Error while trying to copy to clipboard", error));
};

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    switch (request.method) {
        case "metadataCollected":
            await displayMetadata(request.data);

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

chrome.tabs.query({ active: true, currentWindow: true },
    function(tabs) {
        chrome.tabs.executeScript(
            tabs[0].id,
            {
                file: "get-author.js"
            }
        );
    }
);
