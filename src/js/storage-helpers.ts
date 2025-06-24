let storageHelper = (() => {
    let storageSyncGetAsync = function (keysAndDefaults) {
        let getValue = new Promise((resolve, reject) => {
            chrome.storage.sync.get(
                keysAndDefaults, // NOTE: `null` will get entire contents of storage
                function (result) {
                    // Keys could be a string or an array of strings (or any object to get back an empty result, or null to get all of cache).
                    // Unify to an array regardless.
                    let keyList = Array.isArray(keysAndDefaults) ? [...keysAndDefaults] : [keysAndDefaults];
                    for (var keyIndex in keyList) {
                        var key = keyList[keyIndex];
                        if (result[key]) {
                            console.log({status: `Cache found: [${key}]`, keys: keysAndDefaults, result });
                        }
                        else {
                            console.log({status: `Cache miss: [${key}]`, keys: keysAndDefaults });
                        }
                    }
                    resolve(result);
                }
            );
        });
        return getValue;
    };
    let storageSyncSetAsync = function (items) {
        let setValue = new Promise((resolve, reject) => {
            chrome.storage.sync.set(
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

    return {
        storageSyncGetAsync,
        storageSyncSetAsync
    };
})();
