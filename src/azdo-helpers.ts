// NOTE: Had to stuff everything in this immediately executing function to avoid duplicate declaration errors when this script was run every time the pop-up was loaded. Probably a better way to handle this, though.
(async function () {
    // Check page for work item
    //     Work item page: https://{organization}.visualstudio.com/{project}/_workitems/edit/{work-item-number}
    //     List page: {organization}.visualstudio.com/{project}/_queries/query/{query-guid}/

    interface WorkItemFieldEntry {
        label: string | null;
        value: string;
    }
    interface WorkItemData {
        workItemId?: string | null;
        workItemUrl?: string | null;
        [key: string]: any;
    }

    const sendRequestContentPageMessage = function (contentUrl: string | undefined) {
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
    const isVisible = function (elem: Element): boolean {
        return !!((elem as HTMLElement).offsetWidth || (elem as HTMLElement).offsetHeight || elem.getClientRects().length);
    };

    const getWorkItemData = function (): WorkItemData {
        // NOTE: We were seeing multiple elements under certain circumstances on Azure DevOps with only one visible. All these queries are now filtering based on `isVisible` (borrowed from jQuery, via [Stack Overflow](https://stackoverflow.com/a/33456469/48700)).
        const workItemId = [...document.querySelectorAll("span[aria-label='ID Field']")].filter(el => isVisible(el))[0]?.textContent;
        const workItemUrlElem = [...document.querySelectorAll(".work-item-form a.caption")].filter(el => isVisible(el))[0] as HTMLAnchorElement | undefined;
        const workItemUrl = workItemUrlElem?.href;

        const workItemControls = [...document.querySelectorAll(".work-item-form .control")].filter(el => isVisible(el));
        const fieldsAndValues = workItemControls.map((control): WorkItemFieldEntry | undefined => {
            const labelControl = control.getElementsByClassName("workitemcontrol-label")[0];
            const inputControl = control.getElementsByTagName("input")[0] as HTMLInputElement | undefined;
            if (labelControl && inputControl) {
                const entry: WorkItemFieldEntry = {
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
        const fieldsAndValuesAsObject = fieldsAndValues.reduce(
            (result: { [key: string]: any }, item, index) => {
                if (item && item.label) {
                    result[item.label] = item.value;
                }
                return result;
            },
            {}
        );

        return {
            workItemId: workItemId,
            workItemUrl: workItemUrl,
            ...fieldsAndValuesAsObject
        };
    };

    const sendPopUpUpdateRequest = function (workItemData: WorkItemData) {
        chrome.runtime.sendMessage(
            {
                method: "workItemCollected",
                data: workItemData
            },
            function (response: any) {
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

    const workItemData = getWorkItemData();

    sendPopUpUpdateRequest(workItemData);
    sendRequestContentPageMessage((workItemData as any)?.URL);
})();
