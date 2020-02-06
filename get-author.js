(async function () {
    // TODO: get all meta first, then query that instead of document.
    let retrievedMetadata = {
        msAuthorMetaTagValue: document.querySelectorAll("meta[name='ms.author']")[0].attributes["content"].value,
        gitHubAuthorMetaTagValue: document.querySelectorAll("meta[name='author']")[0].attributes["content"].value,
        msDateMetaTagValue: document.querySelectorAll("meta[name='ms.date']")[0].attributes["content"].value,
        gitHubLocationMaster: document.querySelectorAll("meta[name='original_ref_skeleton_git_url']")[0].attributes["content"].value.replace("/live/", "/master/"),
    };

    chrome.runtime.sendMessage(
        {
            method: 'metadataCollected',
            data: retrievedMetadata
        },
        function (response) {
            console.log(`Metadata handled: ${response.result}`);
        }
    );
})();