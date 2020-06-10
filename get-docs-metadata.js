// NOTE: Had to stuff everything in this immediately executing function to avoid duplicate declaration errors when this script was run every time the pop-up was loaded. Probably a better way to handle this, though.
(async function () {
    // storageLocalRemoveAsync([ location ]);
    let getCurrentPageMetadata = function () {
        let metaTags = document.getElementsByTagName("meta");
        let uidTag = [...metaTags].filter(meta => meta.getAttribute("name") === "uid")[0];
        let uid = uidTag ? uidTag.getAttribute("content") : "";
        let msAuthorTag = [...metaTags].filter(meta => meta.getAttribute("name") === "ms.author")[0];
        let msAuthor = msAuthorTag ? msAuthorTag.getAttribute("content") : "";
        let authorTag = [...metaTags].filter(meta => meta.getAttribute("name") === "author")[0];
        let author = authorTag ? authorTag.getAttribute("content") : "";
        let msDateTag = [...metaTags].filter(meta => meta.getAttribute("name") === "ms.date")[0];
        let msDate = msDateTag ? msDateTag.getAttribute("content") : "";
        let gitUrlValues = (function (metaTags) {
            // Learn uses `original_ref_skeleton_git_url` while Docs pages use `original_content_git_url`.
            let gitUrlTag = [...metaTags].filter(meta => meta.getAttribute("name") === "original_ref_skeleton_git_url")[0];
            // e.g., <meta name="original_ref_skeleton_git_url" content="https://github.com/MicrosoftDocs/learn-pr/blob/live/learn-pr/azure/welcome-to-azure/2-what-is-azure.yml" />
            // Edit location is for a .yml (YAML) file on the live branch. We switch to master branch manually (where edits are made), and swap for .md for Markdown content.

            if (gitUrlTag !== undefined) {
                let gitUrl = gitUrlTag ? gitUrlTag.getAttribute("content") : "";
                let gitYamlMasterUrl = gitUrl.replace("/live/", "/master/");
                let gitMarkdownMasterUrl = gitYamlMasterUrl.endsWith("/index.yml")
                    ? gitYamlMasterUrl
                    : [ ...gitYamlMasterUrl.split("/").slice(0, -1), "includes", gitYamlMasterUrl.split("/").slice(-1)[0].replace("yml", "md") ].join("/");
                return {
                    gitYamlEditUrl: gitYamlMasterUrl,
                    gitMarkdownEditUrl: gitMarkdownMasterUrl
                };
            }
            else {
                let gitUrlTag = [...metaTags].filter(meta => meta.getAttribute("name") === "original_content_git_url")[0];
                // e.g., <meta name="original_content_git_url" content="https://github.com/MicrosoftDocs/learn-docs/blob/master/learn-docs/docs/support-triage-issues.md" />
                // Use the raw URL for Markdown edit location. (YAML edit location doesn't exist.)
                
                let gitMarkdownEditUrl = gitUrlTag ? gitUrlTag.getAttribute("content") : "";
                let gitMarkdownMasterEditUrl = gitMarkdownEditUrl.replace("/live/", "/master/");
                let gitYamlEditUrl = null; // ?not applicable outside Learn?
                return {
                    gitYamlEditUrl,
                    gitMarkdownEditUrl: gitMarkdownMasterEditUrl
                };
            }
        })(metaTags);

        return {
            uid,
            msAuthorMetaTagValue: msAuthor,
            gitHubAuthorMetaTagValue: author,
            msDateMetaTagValue: msDate,
            gitHubYamlLocation: gitUrlValues.gitYamlEditUrl,
            gitHubMarkdownLocation: gitUrlValues.gitMarkdownEditUrl,
        };
    };
    let sendPopUpUpdateRequest = function (pageMetadata) {
        chrome.runtime.sendMessage(
            {
                method: 'metadataCollected',
                data: pageMetadata
            },
            function (response) {
                if (!response || !response.result) {
                    console.log(`DEBUG: 'metadataCollected' sent message result was invalid: ${response}`);
                }
                else {
                    console.log(`Metadata handled: ${response.result}`);
                }
            }
        );
    };

    var pageMetadata = getCurrentPageMetadata();
    sendPopUpUpdateRequest(pageMetadata);
})();