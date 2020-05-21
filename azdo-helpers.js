// NOTE: Had to stuff everything in this immediately executing function to avoid duplicate declaration errors when this script was run every time the pop-up was loaded. Probably a better way to handle this, though.
(async function () {
    // Check page for work item
    //     Work item page: https://{organization}.visualstudio.com/{project}/_workitems/edit/{work-item-number}
    //     List page: {organization}.visualstudio.com/{project}/_queries/query/{query-guid}/
    let getWorkItemData = function () {
        let workItemId = document.querySelectorAll("span[aria-label='ID Field']")[0]?.textContent;
        let workItemUrl = document.querySelectorAll(".work-item-form a.caption")[0]?.href;

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
