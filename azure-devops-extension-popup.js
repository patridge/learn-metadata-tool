// NOTE: This script executes in the context of the pop-up itself (vs. below, where we execute a script in the target tab).
const defaultTriageAnchorLabel = "Triage query (Azure DevOps)";
const defaultTriageAnchorUrl = "https://aka.ms/learn-azure-triage";
let uidSpan = document.getElementById("uid");
let contentUrl = document.getElementById("contentUrl");
let relatedFeedbackWorkItemsQueryUrl = document.getElementById("relatedWorkItemsQueryUrl");
let relatedVerbatimsWorkItemsQueryUrl = document.getElementById("relatedVerbatimsQueryUrl");
let msAuthorSpan = document.getElementById("msAuthor");
let msDateSpan = document.getElementById("msDate");
let contentYamlSourceSpan = document.getElementById("yamlSourceSpan");
let contentYamlGitUrlAnchor = document.getElementById("repoUrlYaml");
let contentMarkdownSourceSpan = document.getElementById("markdownSourceSpan");
let contentMarkdownGitUrlAnchor = document.getElementById("repoUrlMarkdown");
let contentNotebookSourceSpan = document.getElementById("notebookSourceSpan");
let contentNotebookGitUrlAnchor = document.getElementById("repoUrlNotebook");
let customLink = document.getElementById("customLink");
const customLinkSection = document.getElementById("customLinkSection");

// TODO: Refactor: duplicated in docs-extension-popup.html.
let copyButtons = [...document.getElementsByClassName("copy-field-btn")];
copyButtons.forEach(function (btn) {
    btn.addEventListener("click", async function(element) {
        // Find nearest sibling `.copy-field-target` and copying its text to clipboard.
        let siblingCopyTargets = [...btn.parentElement.parentElement.getElementsByClassName("copy-field-target")];
        let copyTarget = siblingCopyTargets && siblingCopyTargets[0];
        let copyValue = copyTarget?.innerText ?? "";
        // NOTE: Catching error because it will throw a DOMException ("Document is not focused.") whenever the window isn't focused and we try to copy to clipboard (e.g., debugging in dev tools).
        await navigator.clipboard.writeText(copyValue).catch(error => console.log("Error while trying to copy to clipboard", error));
    });
});

let displayWorkItemData = async function (workItemData) {
    // NOTE: Semi-brittle here, since AzDO fields can have custom labels. Fields show the raw field name in a hover on the label, but I can't seem to find where that data is hiding in the rendered HTML yet. For module work items, the UID field is aliased as "Module UID", so we have to look there as a fallback.
    /**
     * @type {string}
     */
    let uid = workItemData.UID || workItemData["Module UID"] || workItemData["Learning Path UID"];
    if (uid) {
        uidSpan.textContent = uid;
        uidSpan.title = uid;

        // For related items, search for immediate UID and next level up
        // e.g., learn.area.module.1-unit -> [ learn.area.module.1-unit, learn.area.module ]
        //let uidPeriodCount = uid.length - uid.replace(".", "").length;
        let uidWithoutLastSection = uid.slice(0, uid.lastIndexOf("."));
        let uidSubstrings = [uid, uidWithoutLastSection];
        let uidQuery = `'${uidSubstrings.join("','")}'`;
        let issueQuery = `SELECT [System.Id],[Title],[Severity],[Created Date],[Work Item Type],[Assigned To],[Triage Status],[Feedback Type],[UID],[URL],[Repo MSFT Learn] FROM workitems WHERE [Team Project] = @project AND [Work Item Type] = 'Customer Feedback' AND [State] = 'New'
        AND [UID] IN (${uidQuery}) AND [Feedback Source]<>'Star rating verbatim' ORDER BY [UID], [Severity]`;
        let uidMatchIssuesQuery = `https://ceapex.visualstudio.com/Microsoft%20Learn/_queries/query/?wiql=${encodeURIComponent(issueQuery)}`;
        relatedFeedbackWorkItemsQueryUrl.setAttribute("href", uidMatchIssuesQuery);
        let verbatimQuery = `SELECT [System.Id],[Title],[Severity],[Created Date],[Work Item Type],[Assigned To],[Triage Status],[Feedback Type],[UID],[URL],[Repo MSFT Learn] FROM workitems WHERE [Team Project] = @project AND [Work Item Type] = 'Customer Feedback' AND [State] = 'New'
        AND [UID] IN (${uidQuery}) AND [Feedback Source]='Star rating verbatim' ORDER BY [UID], [Severity]`;
        let uidMatchVerbatimQuery = `https://ceapex.visualstudio.com/Microsoft%20Learn/_queries/query/?wiql=${encodeURIComponent(verbatimQuery)}`;
        relatedFeedbackWorkItemsQueryUrl.setAttribute("href", uidMatchIssuesQuery);
        relatedVerbatimsWorkItemsQueryUrl.setAttribute("href", uidMatchVerbatimQuery);
    }
    else {
        uidSpan.textContent = "<no work item found>";
        relatedFeedbackWorkItemsQueryUrl.removeAttribute("href");
        relatedVerbatimsWorkItemsQueryUrl.removeAttribute("href");
    }

    // NOTE: Module work items won't have a URL field, so we don't get a link for those work items.
    // NOTE: For Technical Review items, the content URL is labeled "Published URL".
    let learnUrl = workItemData.URL || workItemData["Published URL"];
    if (learnUrl) {
        contentUrl.setAttribute("href", learnUrl);
    }
    else {
        contentUrl.removeAttribute("href");
    }
};
let displayContentPageMetadata = function (metadata) {
    msAuthorSpan.textContent = metadata.msAuthorMetaTagValue;
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
};

// TODO: Refactor, extremely similar to method from get-docs-metadata.js (except with different root from `document`).
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

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(`Message received (azure-devops-extension-popup.js): ${request.method}`, request);
    switch (request.method) {
        case "workItemCollected":
            displayWorkItemData(request.data);

            sendResponse(
                {
                    result: "success"
                }
            );
            break;
        case "requestLearnContentPage":
            let contentUrl = request?.data?.url;
            if (!contentUrl) {
                sendResponse(
                    {
                        result: "error",
                        message: "Content URL not provided.",
                    }
                );
                break;
            }

            fetch(contentUrl).then(async response => {
                if (!response.ok) {
                    console.warn(`Content author response not ok: ${response.status} ${response.statusText}`);
                    return;
                }

                console.log(`Content page response: ${response.status}`, response);

                // TODO: Restrict to reading HTML stream only up through </head> close tag.
                let fullBody = await response.text();
                let parser = new DOMParser();
                let doc = parser.parseFromString(fullBody, "text/html");
                let metaTags = getCurrentPageMetadata(doc);

                displayContentPageMetadata(metaTags);

                // Sending response asynchronously.
                sendResponse(
                    {
                        result: "success"
                    }
                );
            });

            // Return true to tell Chrome we are returning this response asynchronously.
            return true;
            break;
    }
});

// Have pop-up execute a script in the current tab.
chrome.tabs.query({ active: true, currentWindow: true },
    function(tabs) {
        // NOTE: This system duplicates a lot of the background.js PageStateMatcher system manually. There is probably a better way.
        const azureDevOpsPageScript = "azdo-helpers.js";
        let activeTab = tabs[0];
        let tempAnchor = document.createElement("a");
        tempAnchor.href = activeTab.url;
        let tabId = activeTab.id;
        let host = tempAnchor.hostname;
        if (host.endsWith("visualstudio.com") || host === "dev.azure.com") {
            chrome.tabs.executeScript(
                tabId,
                {
                    file: azureDevOpsPageScript
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
