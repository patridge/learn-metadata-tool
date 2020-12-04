// NOTE: Had to stuff everything in this immediately executing function to avoid duplicate declaration errors when this script was run every time the pop-up was loaded. Probably a better way to handle this, though.
(async function () {
    // Check page for work item
    //     Work item page: https://{organization}.visualstudio.com/{project}/_workitems/edit/{work-item-number}
    //     List page: {organization}.visualstudio.com/{project}/_queries/query/{query-guid}/

    let sendRequestContentPageMessage = function (contentUrl) {
        const messageMethod = "requestLearnContentPage";
        if (!contentUrl || contentUrl === "") {
            // No content URL to ping for metadata.
            console.log(`No '${messageMethod}' without content URL.`);
            return;
        }

        let messageData = { url: contentUrl };
        console.log(`Sending message: '${messageMethod}'`, messageData);
        // NOTE: We cannot make this request from the page side or we hit a cross-resource security blocker. Instead, we send the info to the pop-up to make the request for us.
        chrome.runtime.sendMessage(
            {
                method: messageMethod,
                data: messageData,
            },
            function (response) {
                console.log(`'${messageMethod}' response`, response);
                if (!response || !response.result) {
                    console.error(`'${messageMethod}' message result was invalid`, response);
                }
                else if (response.result === "error") {
                    console.error(`'${messageMethod}' failed`, response);
                }
                else {
                    console.log(`'${messageMethod}' response: ${response.result}`, response);
                }
            }
        );
    };
    let isVisible = function (elem) {
        return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
    };
    let getWorkItemData = function () {
        // NOTE: We were seeing multiple elements under certain circumstances on Azure DevOps with only one visible. All these queries are now filtering based on `isVisible` (borrowed from jQuery, via [Stack Overflow](https://stackoverflow.com/a/33456469/48700)).
        let workItemId = [...document.querySelectorAll("span[aria-label='ID Field']")].filter(el => isVisible(el))[0]?.textContent;
        let workItemUrl = [...document.querySelectorAll(".work-item-form a.caption")].filter(el => isVisible(el))[0]?.href;

        let workItemControls = [...document.querySelectorAll(".work-item-form .control")].filter(el => isVisible(el));
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
                // Found a work item control without a label.
                // NOTE: It's possible there are values we need to handle differently from these edge cases. We can log them when we find them.
                // console.log({ "msg": "No label or input", control });
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
                    console.log("DEBUG: 'workItemCollected' sent message result was invalid", response);
                }
                else if (response.result === "error") {
                    console.error("'workItemCollected' failed", response);
                }
                else {
                    // console.log("Work item data handled", response);
                }
            }
        );
    };

    let workItemData = getWorkItemData();

    sendPopUpUpdateRequest(workItemData);
    sendRequestContentPageMessage(workItemData?.URL);
})();
