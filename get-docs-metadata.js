// NOTE: Cannot `@ts-check` typecheck file until we figure out representing `chrome.runtime` in JSDoc. Tried `@type`, `@global`, `@typedef` (more a variable; not a type), `@member/@var`, and `@external`.
/**
 * @typedef {Object} PageMetadata
 * @property {string} uid - Module's UID
 * @property {string} msAuthorMetaTagValue - Module's ms.author
 * @property {string} gitHubAuthorMetaTagValue - Module's author GitHub username
 * @property {string} msDateMetaTagValue - Module's ms.date
 * @property {string} gitHubYamlLocation - Module's YAML location on GitHub, if any (else null)
 * @property {string} gitHubMarkdownLocation - Module's YAML location on GitHub, if any (else null)
 * @property {string} gitHubNotebookLocation - Module's Notebook location on GitHub, if any (else null)
 */

// NOTE: Had to stuff everything in this immediately executing function to avoid duplicate declaration errors when this script was run every time the pop-up was loaded. Probably a better way to handle this, though.
(async function () {
    // storageLocalRemoveAsync([ location ]);
    /**
     * @param {Document} rootElement - Root element of page to search for metadata
     * @returns {PageMetadata}
     */
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
            /** @type string */
            let gitYamlEditUrl = null;
            /** @type string */
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

            // NOTE: Currently limited to Learn in the URL manipulation below, but if notebooks start showing up elsewhere in Docs we'll have to adjust.
            let notebookPublicUrlTag = [...metaTags].filter(meta => meta.getAttribute("name") === "notebook")[0];
            let notebookPublicUrl = notebookPublicUrlTag ? notebookPublicUrlTag.getAttribute("content") : "";
            if (notebookPublicUrl && notebookPublicUrl.startsWith("/learn/modules")) {
                // TODO: Make any new relative notebook URLs absolute to match prior expectations.
                notebookPublicUrl = "https://docs.microsoft.com" + notebookPublicUrl;
            }
            // NOTE: Currently, the `notebook` YAML parameter could either be a GitHub-hosted URL or a Learn-hosted URL.
            //       GitHub-hosted example: https://raw.githubusercontent.com/MicrosoftDocs/pytorchfundamentals/main/audio-pytorch/3-visualizations-transforms.ipynb
            //       Learn-hosted example: https://docs.microsoft.com/learn/modules/count-moon-rocks-python-nasa/notebooks/2-set-up-program.ipynb
            /** @type string */
            let gitNotebookEditUrl = null;
            if (notebookPublicUrl) {
                if (notebookPublicUrl.startsWith("https://raw.githubusercontent.com/")) {
                    // e.g., "https://raw.githubusercontent.com/MicrosoftDocs/pytorchfundamentals/main/audio-pytorch/2-understand-audio-data.ipynb" => "https://github.com/MicrosoftDocs/pytorchfundamentals/blob/main/audio-pytorch/2-understand-audio-data.ipynb"
                    let defaultBranchRegex = new RegExp("/(?<branch>(main)|(master))/", "i");
                    gitNotebookEditUrl = notebookPublicUrl.replace(defaultBranchRegex, "/blob/$<branch>/").replace("https://raw.githubusercontent.com/", "https://github.com/");
                }
                else if (notebookPublicUrl.startsWith("https://docs.microsoft.com/learn/")) {
                    // Fairly certain all Learn modules have a YAML file, so starting from that previously dissected URL.
                    // Assume notebook is in the same content repo as the current Learn module.
                    if (gitYamlEditUrl) {
                        // e.g., "https://docs.microsoft.com/en-us/learn/modules/count-moon-rocks-python-nasa/2-set-up-program" => "https://docs.microsoft.com/learn/modules/count-moon-rocks-python-nasa/notebooks/2-set-up-program.ipynb"

                        const currentPageUrlTag = [...metaTags].filter(meta => meta.getAttribute("property") === "og:url")[0];
                        const currentPageUrl = currentPageUrlTag ? currentPageUrlTag.getAttribute("content") : "";

                        const learnModuleUrlRegex = new RegExp("https://(review\.)?docs\.microsoft\.com/[a-z]{2}-[a-z]{2}/learn/modules/(?<moduleAndUnit>[^?#]*)", "i");
                        const moduleAndUnitPathSections = currentPageUrl.replace(learnModuleUrlRegex, "$<moduleAndUnit>");
                        // e.g., "https://docs.microsoft.com/en-us/learn/modules/count-moon-rocks-python-nasa/2-set-up-program" => "count-moon-rocks-python-nasa/2-set-up-program"

                        const learnNotebookUrlRegex = new RegExp("https://(review\.)?docs\.microsoft\.com/([a-z]{2}-[a-z]{2}/)?learn/modules/(?<notebookPath>[^?#]*)", "i");
                        const moduleNotebookPathSections = notebookPublicUrl.replace(learnNotebookUrlRegex, "$<notebookPath>");
                        // e.g., "https://docs.microsoft.com/learn/modules/count-moon-rocks-python-nasa/notebooks/2-set-up-program.ipynb" => "count-moon-rocks-python-nasa/notebooks/2-set-up-program.ipynb"

                        const gitHubEditBaseRegex = new RegExp(`${moduleAndUnitPathSections}.*`, "i");
                        gitNotebookEditUrl = gitYamlEditUrl.replace(gitHubEditBaseRegex, moduleNotebookPathSections);
                        // e.g., "https://github.com/MicrosoftDocs/learn-pr/blob/master/learn-pr/student-evangelism/count-moon-rocks-python-nasa/2-set-up-program.yml" => "https://docs.microsoft.com/learn/modules/count-moon-rocks-python-nasa/notebooks/2-set-up-program.ipynb"
                    }
                }
            }

            return {
                gitYamlEditUrl,
                gitMarkdownEditUrl,
                gitNotebookEditUrl,
            };
        })(metaTags);

        return {
            uid,
            msAuthorMetaTagValue: msAuthor,
            gitHubAuthorMetaTagValue: author,
            msDateMetaTagValue: msDate,
            gitHubYamlLocation: gitUrlValues.gitYamlEditUrl,
            gitHubMarkdownLocation: gitUrlValues.gitMarkdownEditUrl,
            gitHubNotebookLocation: gitUrlValues.gitNotebookEditUrl,
        };
    };
    /**
     * @param {PageMetadata} pageMetadata - Page's gathered metadata
     */
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