// NOTE: Had to stuff everything in this immediately executing function to avoid duplicate declaration errors when this script was run every time the pop-up was loaded. Probably a better way to handle this, though.
(async function () {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    let storageLocalGetAsync = function (keys) {
        // TODO: Add some sort of expiration logic to set/get.
        let gotValue = new Promise((resolve, reject) => {
            chrome.storage.local.get(
                keys, // NOTE: `null` will get entire contents of storage
                function (result) {
                    // Keys could be a string or an array of strings (or any object to get back an empty result, or null to get all of cache).
                    // Unify to an array regardless.
                    let keyList = Array.isArray(keys) ? [...keys] : [keys];
                    for (var keyIndex in keyList) {
                        var key = keyList[keyIndex];
                        if (result[key]) {
                            console.log({status: `Cache found: [${key}]`, keys, result });
                        }
                        else {
                            console.log({status: `Cache miss: [${key}]`, keys });
                        }
                    }
                    resolve(result);
                }
            );
        });
        return gotValue;
    };
    let storageLocalSetAsync = function (items) {
        // TODO: Add some sort of expiration logic to set/get.
        let setValue = new Promise((resolve, reject) => {
            chrome.storage.local.set(
                items,
                function () {
                    // If this cache call fails, Chrome will have set `runtime.lastError`.
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message || `Cache set error: ${chrome.runtime.lastError}`));
                    }
                    else {
                        resolve();
                    }
                }
            );
        });
        return setValue;
    };
    let storageLocalRemoveAsync = async function (keys) {
        let removeValue = new Promise((resolve, reject) => {
            chrome.storage.local.remove(
                keys,
                function () {
                    // If this cache call fails, Chrome will have set `runtime.lastError`.
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message || `Error retrieving cache: ${chrome.runtime.lastError}`));
                    }
                    else {
                        resolve();
                    }
                }
            );
        });
    };
    
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
                let gitYamlEditUrl = null; // ?not applicable outside Learn?
                return {
                    gitYamlEditUrl: null,
                    gitMarkdownEditUrl
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
    let cachePageMetadata = async function (location, pageMetadata) {
        // ???pageMetadata = getCurrentPageMetadata();
        let cacheAddition = {};
        cacheAddition[location] = pageMetadata;
        await storageLocalSetAsync(cacheAddition);
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

    let location = document.location.href;

    // Try to get cached metadata as a placeholder.
    var pageMetadata = await (async function () {
        var cachedMetadata = await storageLocalGetAsync([ location ]);
        return cachedMetadata[location];
    })();
    var wasPageMetadataCached = false;

    // If no cached data, get current.
    if (!pageMetadata) {
        pageMetadata = getCurrentPageMetadata();
        cachePageMetadata(location, pageMetadata);
    }
    else {
        wasPageMetadataCached = true;
    }

    sendPopUpUpdateRequest(pageMetadata);

    // If we used cached metadata, get the latest and update the cache.
    if (wasPageMetadataCached) {
        await delay(5000);
        pageMetadata = getCurrentPageMetadata();
        cachePageMetadata(location, pageMetadata);
        sendPopUpUpdateRequest(pageMetadata);
    }
})();