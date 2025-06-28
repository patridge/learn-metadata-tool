// NOTE: Cannot `@ts-check` typecheck file until we figure out representing `chrome.runtime` in JSDoc. Tried `@type`, `@global`, `@typedef` (more a variable; not a type), `@member/@var`, and `@external`.

interface PageMetadata {
    uid: string;
    msAuthorMetaTagValue: string;
    gitHubAuthorMetaTagValue: string;
    msDateMetaTagValue: string;
    gitHubYamlLocation: string | null;
    gitHubMarkdownLocation: string | null;
    gitHubNotebookLocation: string | null;
}

// NOTE: Had to stuff everything in this immediately executing function to avoid duplicate declaration errors when this script was run every time the pop-up was loaded. Probably a better way to handle this, though.
(async function () {
    // ...existing code...
    const getCurrentPageMetadata = function (rootElement: Document): PageMetadata {
        const metaTags = rootElement.getElementsByTagName("meta");
        const localeTag = [...metaTags].filter(meta => meta.getAttribute("name") === "locale")[0];
        const localeCode = localeTag ? localeTag.getAttribute("content")?.toLowerCase() : "en-us";
        const isEnUsLocale = localeCode === "en-us";
        const uidTag = [...metaTags].filter(meta => meta.getAttribute("name") === "uid")[0];
        const uid = uidTag ? uidTag.getAttribute("content") || "" : "";
        const msAuthorTag = [...metaTags].filter(meta => meta.getAttribute("name") === "ms.author")[0];
        const msAuthor = msAuthorTag ? msAuthorTag.getAttribute("content") || "" : "";
        const authorTag = [...metaTags].filter(meta => meta.getAttribute("name") === "author")[0];
        const author = authorTag ? authorTag.getAttribute("content") || "" : "";
        const msDateTag = [...metaTags].filter(meta => meta.getAttribute("name") === "ms.date")[0];
        const msDate = msDateTag ? msDateTag.getAttribute("content") || "" : "";
        const gitUrlValues = (function (metaTags: HTMLCollectionOf<HTMLMetaElement>) {
            // ...existing code...
            const gitUrlTag = [...metaTags].filter(meta => meta.getAttribute("name") === "original_content_git_url")[0];
            const gitUrl = gitUrlTag ? gitUrlTag.getAttribute("content") || "" : "";
            // ...existing code...
            const gitEditUrl = isEnUsLocale ? gitUrl.replace("/live/", "/master/") : gitUrl;
            let gitYamlEditUrl: string | null = null;
            let gitMarkdownEditUrl: string | null = null;
            // ...existing code...
            if (gitEditUrl.endsWith("/index.yml")) {
                gitYamlEditUrl = gitEditUrl;
                gitMarkdownEditUrl = null;
            }
            else if (gitEditUrl.endsWith(".yml")) {
                gitYamlEditUrl = gitEditUrl;
                gitMarkdownEditUrl = [ ...gitEditUrl.split("/").slice(0, -1), "includes", gitEditUrl.split("/").slice(-1)[0].replace("yml", "md") ].join("/");
            }
            else {
                gitYamlEditUrl = null;
                gitMarkdownEditUrl = gitEditUrl;
            }
            // ...existing code...
            const notebookPublicUrlTag = [...metaTags].filter(meta => meta.getAttribute("name") === "notebook")[0];
            let notebookPublicUrl = notebookPublicUrlTag ? notebookPublicUrlTag.getAttribute("content") || "" : "";
            let gitNotebookEditUrl: string | null = null;
            if (notebookPublicUrl) {
                if (notebookPublicUrl.startsWith("https://raw.githubusercontent.com/")) {
                    // ...existing code...
                    const defaultBranchRegex = new RegExp("/(?<branch>(main)|(master))/", "i");
                    gitNotebookEditUrl = notebookPublicUrl.replace(defaultBranchRegex, "/blob/$<branch>/").replace("https://raw.githubusercontent.com/", "https://github.com/");
                }
                else {
                    // ...existing code...
                    if (notebookPublicUrl.startsWith("/learn/modules")) {
                        notebookPublicUrl = "https://learn.microsoft.com" + notebookPublicUrl;
                    }
                    else if (!notebookPublicUrl.startsWith("https://")) {
                        const currentPageUrlTag = [...metaTags].filter(meta => meta.getAttribute("property") === "og:url")[0];
                        const currentPageUrl = currentPageUrlTag?.getAttribute("content") || "";
                        const learnModuleUrlRegex = new RegExp("https://(review\\.)?learn\\.microsoft\\.com/[a-z]{2}-[a-z]{2}/training/modules/(?<module>[^?#/]*)", "i");
                        const learnModuleUrl = currentPageUrl.match(learnModuleUrlRegex)?.[0] || "";
                        const pageLocaleRegex = new RegExp("https://(?<domainPortion>(review\\.)?learn\\.microsoft\\.com)(?<localePortion>/[a-z]{2}-[a-z]{2})/", "i");
                        const learmModuleUrlWithoutLocale = learnModuleUrl.replace(pageLocaleRegex, "https://$<domainPortion>/");
                        notebookPublicUrl = `${learmModuleUrlWithoutLocale}/${notebookPublicUrl}`;
                    }
                    if (notebookPublicUrl.startsWith("https://learn.microsoft.com/training/")) {
                        if (gitYamlEditUrl) {
                            const currentPageUrlTag = [...metaTags].filter(meta => meta.getAttribute("property") === "og:url")[0];
                            const currentPageUrl = currentPageUrlTag ? currentPageUrlTag.getAttribute("content") || "" : "";
                            const learnModuleUrlRegex = new RegExp("https://(review\\.)?learn\\.microsoft\\.com/[a-z]{2}-[a-z]{2}/training/modules/(?<moduleAndUnit>[^?#]*)", "i");
                            const moduleAndUnitPathSections = currentPageUrl.replace(learnModuleUrlRegex, "$<moduleAndUnit>");
                            const learnNotebookUrlRegex = new RegExp("https://(review\\.)?learn\\.microsoft\\.com/([a-z]{2}-[a-z]{2}/)?training/modules/(?<notebookPath>[^?#]*)", "i");
                            const moduleNotebookPathSections = notebookPublicUrl.replace(learnNotebookUrlRegex, "$<notebookPath>");
                            const gitHubEditBaseRegex = new RegExp(`${moduleAndUnitPathSections}.*`, "i");
                            gitNotebookEditUrl = gitYamlEditUrl.replace(gitHubEditBaseRegex, moduleNotebookPathSections);
                        }
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
    const sendPopUpUpdateRequest = function (pageMetadata: PageMetadata): void {
        chrome.runtime.sendMessage(
            {
                method: "metadataCollected",
                data: pageMetadata
            },
            function (response: any) {
                if (!response || !response.result) {
                    console.log(`DEBUG: 'metadataCollected' sent message result was invalid: ${response}`);
                }
                else {
                    console.log(`Metadata handled: ${response.result}`);
                }
            }
        );
    };

    const pageMetadata = getCurrentPageMetadata(document);
    sendPopUpUpdateRequest(pageMetadata);
})();