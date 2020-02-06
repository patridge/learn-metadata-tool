(async function () {
    // TODO: get all meta first, then query that instead of document.

    let metaTags = document.getElementsByTagName("meta");
    let msAuthor = [...metaTags].filter(meta => meta.getAttribute("name") === "ms.author")[0].getAttribute("content");
    let author = [...metaTags].filter(meta => meta.getAttribute("name") === "author")[0].getAttribute("content");
    let msDate = [...metaTags].filter(meta => meta.getAttribute("name") === "ms.date")[0].getAttribute("content");
    let gitUrl = [...metaTags].filter(meta => meta.getAttribute("name") === "original_ref_skeleton_git_url")[0].getAttribute("content");
    let gitYamlMasterUrl = gitUrl.replace("/live/", "/master/");
    let gitMarkdownMasterUrl = gitYamlMasterUrl.endsWith("/index.yml")
        ? gitYamlMasterUrl
        : [ ...gitYamlMasterUrl.split("/").slice(0, -1), "includes", gitYamlMasterUrl.split("/").slice(-1)[0].replace("yml", "md") ].join("/");

    let retrievedMetadata = {
        msAuthorMetaTagValue: msAuthor,
        gitHubAuthorMetaTagValue: author,
        msDateMetaTagValue: msDate,
        gitHubYamlLocationMaster: gitYamlMasterUrl,
        gitHubMarkdownLocationMaster: gitMarkdownMasterUrl,
    };
    // https://github.com/MicrosoftDocs/learn-pr/blob/master/learn-pr/azure/principles-cloud-computing/index.yml

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