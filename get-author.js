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
        let msAuthor = [...metaTags].filter(meta => meta.getAttribute("name") === "ms.author")[0].getAttribute("content");
        let author = [...metaTags].filter(meta => meta.getAttribute("name") === "author")[0].getAttribute("content");
        let msDate = [...metaTags].filter(meta => meta.getAttribute("name") === "ms.date")[0].getAttribute("content");
        let gitUrl = [...metaTags].filter(meta => meta.getAttribute("name") === "original_ref_skeleton_git_url")[0].getAttribute("content");
        let gitYamlMasterUrl = gitUrl.replace("/live/", "/master/");
        let gitMarkdownMasterUrl = gitYamlMasterUrl.endsWith("/index.yml")
            ? gitYamlMasterUrl
            : [ ...gitYamlMasterUrl.split("/").slice(0, -1), "includes", gitYamlMasterUrl.split("/").slice(-1)[0].replace("yml", "md") ].join("/");
    
        return {
            msAuthorMetaTagValue: msAuthor,
            gitHubAuthorMetaTagValue: author,
            msDateMetaTagValue: msDate,
            gitHubYamlLocationMaster: gitYamlMasterUrl,
            gitHubMarkdownLocationMaster: gitMarkdownMasterUrl,
        };
    };
    let cachePageMetadata = async function (location, pageMetadata) {
        pageMetadata = getCurrentPageMetadata();
        let cacheAddition = {};
        cacheAddition[location] = pageMetadata;
        await storageLocalSetAsync(cacheAddition);
    };
    let sendUpdateRequest = function (pageMetadata) {
        chrome.runtime.sendMessage(
            {
                method: 'metadataCollected',
                data: pageMetadata
            },
            function (response) {
                console.log(`Metadata handled: ${response.result}`);
            }
        );
    };

    let location = document.location.href;

    var pageMetadata = await (async function () {
        var cachedMetadata = await storageLocalGetAsync([ location ]);
        return cachedMetadata[location];
    })();
    var wasPageMetadataCached = false;

    if (!pageMetadata) {
        pageMetadata = getCurrentPageMetadata();
        cachePageMetadata(location, pageMetadata);
    }
    else {
        wasPageMetadataCached = true;
    }

    sendUpdateRequest(pageMetadata);

    if (wasPageMetadataCached) {
        // Get the latest from the page and re-cache it.
        await delay(5000);
        pageMetadata = getCurrentPageMetadata();
        cachePageMetadata(location, pageMetadata);
        sendUpdateRequest(pageMetadata);
    }
})();