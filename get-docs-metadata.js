// NOTE: Had to stuff everything in this immediately executing function to avoid duplicate declaration errors when this script was run every time the pop-up was loaded. Probably a better way to handle this, though.
(async function () {
    // storageLocalRemoveAsync([ location ]);
    let getCurrentPageMetadata = function (rootElement) {
        let metaTags = rootElement.getElementsByTagName("meta");
        let localeTag = [...metaTags].filter(meta => meta.getAttribute("name") === "locale")[0];
        let localeCode = localeTag ? localeTag.getAttribute("content").toLowerCase() : "en-us";
        let isEnUsLocale = localeCode === "en-us";
        let uidTag = [...metaTags].filter(meta => meta.getAttribute("name") === "uid")[0];
        let uid = uidTag ? uidTag.getAttribute("content") : "";
        let msAuthorTag = [...metaTags].filter(meta => meta.getAttribute("name") === "ms.author")[0];
        let msAuthor = msAuthorTag ? msAuthorTag.getAttribute("content") : "";
        let authorTag = [...metaTags].filter(meta => meta.getAttribute("name") === "author")[0];
        let author = authorTag ? authorTag.getAttribute("content") : "";
        let msDateTag = [...metaTags].filter(meta => meta.getAttribute("name") === "ms.date")[0];
        let msDate = msDateTag ? msDateTag.getAttribute("content") : "";
        let gitUrlValues = (function (metaTags) {
            // Learn stopped using `original_ref_skeleton_git_url`, likely to align with greater-Docs, so everywhere seems to be using `original_content_git_url` now.
            let gitUrlTag = [...metaTags].filter(meta => meta.getAttribute("name") === "original_content_git_url")[0];
            // e.g., <meta name="original_content_git_url" content="https://github.com/MicrosoftDocs/learn-docs/blob/master/learn-docs/docs/support-triage-issues.md" />
            let gitUrl = gitUrlTag ? gitUrlTag.getAttribute("content") : "";
            // Switch from the publish branch to the primary branch. This may require updating as we switch to a branch named main in the future.
            // NOTE: Localized Learn content appears to be only maintained directly in the "live" branch rather than the default. Rewrite to use default branch for en-us content, but keeping "live" for localized content.
            let gitEditUrl = isEnUsLocale ? gitUrl.replace("/live/", "/master/") : gitUrl;
            let gitYamlEditUrl = null;
            let gitMarkdownEditUrl = null;
            if (gitEditUrl.endsWith("/index.yml")) {
                // Learn has index pages that are generated entirely from a YAML page.
                gitYamlEditUrl = gitEditUrl;
                gitMarkdownEditUrl = null;
            }
            else if (gitEditUrl.endsWith(".yml")) {
                // Learn has other pages with both YAML and MD content contributing to the final HTML output.
                gitYamlEditUrl = gitEditUrl;
                gitMarkdownEditUrl = [ ...gitEditUrl.split("/").slice(0, -1), "includes", gitEditUrl.split("/").slice(-1)[0].replace("yml", "md") ].join("/");
            }
            else {
                // Most of Docs has content and metadata entirely in a Markdown file.
                gitYamlEditUrl = null;
                gitMarkdownEditUrl = gitEditUrl;
            }
            return {
                gitYamlEditUrl,
                gitMarkdownEditUrl
            };
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
                method: "metadataCollected",
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

    var pageMetadata = getCurrentPageMetadata(document);
    sendPopUpUpdateRequest(pageMetadata);
})();