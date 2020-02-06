let gatherMetadataButton = document.getElementById("gatherMetadata");
let msAuthorSpan = document.getElementById("msAuthor");
let gitHubAuthorSpan = document.getElementById("gitHubAuthor");
let msDateSpan = document.getElementById("msDate");
let originalGitUrlSpan = document.getElementById("repoUrl");

let displayMetadata = async function (metadata) {
    console.log("Content script received: " + metadata);

    msAuthorSpan.textContent = metadata.msAuthorMetaTagValue;
    gitHubAuthorSpan.textContent = metadata.gitHubAuthorMetaTagValue;
    msDateSpan.textContent = metadata.msDateMetaTagValue;
    originalGitUrlSpan.textContent = metadata.gitHubLocationMaster;

    await navigator.clipboard.writeText(metadata.msAuthorMetaTagValue);
    // window.alert(`Copied '${metadata.msAuthorMetaTagValue}' to clipboard.`);
    // window.open(metadata.gitHubLocationMaster, "_blank");
};

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    switch (request.method) {
        case "metadataCollected":
            await displayMetadata(request.data);
            sendResponse(
                {
                    result: "success"
                }
            );
            break;
    }
});

gatherMetadataButton.onclick = function(element) {
    chrome.tabs.query({ active: true, currentWindow: true },
        function(tabs) {
            chrome.tabs.executeScript(
                tabs[0].id,
                {
                    //original_ref_skeleton_git_url
                    // code: 'console.log("hola!!!");', //commentMinimizer.hideOutdatedBotComments();
                    file: "get-author.js"
                }
            );
        }
    );
};
