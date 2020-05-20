// NOTE: Had to stuff everything in this immediately executing function to avoid duplicate declaration errors when this script was run every time the pop-up was loaded. Probably a better way to handle this, though.
(async function () {
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

    // Check page for work item
    //     Work item page: https://{organization}.visualstudio.com/{project}/_workitems/edit/{work-item-number}
    //     List page: {organization}.visualstudio.com/{project}/_queries/query/{query-guid}/
    let getWorkItemData = function () {
        let workItemId = document.querySelectorAll("span[aria-label='ID Field']")[0].textContent;
        let workItemUrl = document.querySelectorAll(".work-item-form a.caption")[0].href;

        // let workItemForm = document.getElementsByClassName("work-item-form")[0];
        // let workItemControls = workItemForm?.getElementsByClassName("control");
        let workItemControls = document.querySelectorAll(".work-item-form .control");
        let fieldsAndValues = [...workItemControls].map((control) => {
            let labelControl = control.getElementsByClassName("workitemcontrol-label")[0];
            let inputControl = control.getElementsByTagName("input")[0];
            if (labelControl && inputControl) {
                let entry = {
                    label: labelControl.textContent,
                    value: inputControl.value,
                };
                // console.log(entry);
                return entry;
            }
            else {
                console.log({ "msg": "No label or input", control });
            }
        });
        let fieldsAndValuesAsObject = fieldsAndValues.reduce(
            (result, item, index) => {
                if (item) {
                    result[item.label] = item.value;
                }
                return result;
            },
            {}
        );
        return {
            "workItemId": workItemId,
            "workItemUrl": workItemUrl,
            ...fieldsAndValuesAsObject
        };
    };

    let sendPopUpUpdateRequest = function (workItemData) {
        chrome.runtime.sendMessage(
            {
                method: "workItemCollected",
                data: workItemData
            },
            function (response) {
                if (!response || !response.result) {
                    console.log(`DEBUG: 'workItemCollected' sent message result was invalid: ${response}`);
                }
                else {
                    console.log(`Work item data handled: ${response.result}`);
                }
            }
        );
    };

    let workItemData = getWorkItemData();
    console.log(workItemData);

    sendPopUpUpdateRequest(workItemData);
})();