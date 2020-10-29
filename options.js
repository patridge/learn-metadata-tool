let newCustomLinkLabelInput = document.getElementById("newCustomLinkLabel");
let setCustomLinkLabelButton = document.getElementById("setNewCustomLinkLabel");
let newCustomLinkUrlInput = document.getElementById("newCustomLinkUrl");
let setCustomLinkUrlButton = document.getElementById("setNewCustomLinkUrl");
let statusLabel = document.getElementById("status");
const defaultTriageAnchorLabel = "Triage query (Azure DevOps)";
const defaultTriageAnchorUrl = "https://aka.ms/learn-azure-triage";

let delay = function (timeInMilliseconds) {
    return new Promise(resolve => setTimeout(resolve, timeInMilliseconds));
}

// TODO: Get this using the flag for first-set.
let getHasSetCustomAnchor = async function () {
    return (await storageHelper.storageSyncGetAsync({ hasSetAnchor: false })).hasSetAnchor;
}
let setHasSetCustomAnchor = async function () {
    await storageHelper.storageSyncSetAsync({ hasSetAnchor: true });
}
let getTriageAnchor = async function () {
    let currentSavedTriageAnchor = await storageHelper.storageSyncGetAsync(
        {
            triageAnchorLabel: null,
            triageAnchorUrl: null
        }
    );
    console.log(currentSavedTriageAnchor);
    return currentSavedTriageAnchor;
};
let setTriageAnchorToDefault = async function () {

    let currentTriageAnchor = await getTriageAnchor();
    if (currentTriageAnchor.triageAnchorLabel !== defaultTriageAnchorLabel
        || currentTriageAnchor.triageAnchorUrl !== defaultTriageAnchorUrl) {
        await setTriageAnchor(defaultTriageAnchorLabel, defaultTriageAnchorUrl);
        displayCurrentTriageAnchorValues();
    }
};
let setTriageAnchor = async function (customTriageAnchorLabel, customTriageAnchorUrl) {
    console.log(`Setting triage anchor: [${customTriageAnchorLabel}](${customTriageAnchorUrl})`);
    await storageHelper.storageSyncSetAsync({
        triageAnchorLabel: customTriageAnchorLabel,
        triageAnchorUrl: customTriageAnchorUrl
    });
};
let displayCurrentTriageAnchorValues = async function () {
    let currentTriageAnchor = await getTriageAnchor();
    // TODO: Get this using the flag for first-set.
    // BROKEN!!!
    if (currentTriageAnchor.triageAnchorLabel === null
        || currentTriageAnchor.triageAnchorUrl === null) {
        await setTriageAnchorToDefault();
    }
    customLinkLabel.textContent = currentTriageAnchor.triageAnchorLabel;
    newCustomLinkLabelInput.value = currentTriageAnchor.triageAnchorLabel;
    customLinkUrl.textContent = currentTriageAnchor.triageAnchorUrl;
    newCustomLinkUrlInput.value = currentTriageAnchor.triageAnchorUrl;
}

let setCustomLinkClick = async function (event) {
    let newLabel = newCustomLinkLabelInput.value;
    let newUrl = newCustomLinkUrlInput.value;
    setTriageAnchor(newLabel, newUrl);
};

setCustomLinkLabelButton.addEventListener("click", setCustomLinkClick);
document.addEventListener('DOMContentLoaded', displayCurrentTriageAnchorValues);
