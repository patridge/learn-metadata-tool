let newCustomLinkLabelInput = document.getElementById("newCustomLinkLabel");
let setCustomLinkLabelButton = document.getElementById("setNewCustomLinkLabel");
let newCustomLinkUrlInput = document.getElementById("newCustomLinkUrl");
let setCustomLinkUrlButton = document.getElementById("setNewCustomLinkUrl");
let statusLabel = document.getElementById("status");

let delay = function (timeInMilliseconds) {
    return new Promise(resolve => setTimeout(resolve, timeInMilliseconds));
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
let setTriageAnchorToDefault = async function () { await setTriageAnchor(defaultTriageAnchorLabel, defaultTriageAnchorUrl); };
let setTriageAnchor = async function (customTriageAnchorLabel, customTriageAnchorUrl) {
    console.log(`Setting triage anchor: [${customTriageAnchorLabel}](${customTriageAnchorUrl})`);
    await storageHelper.storageSyncSetAsync({
        triageAnchorLabel: customTriageAnchorLabel,
        triageAnchorUrl: customTriageAnchorUrl
    });
};

let saveNewNamePrefix = async function (namePrefix) {
    let currentSavedPrefixes = await getPrefixes();
    // Append new prefix to list
    let newPrefixesToSave = [...currentSavedPrefixes, namePrefix];
    // Save new prefix list to storage
    await storageSyncSetAsync({ namePrefixes: newPrefixesToSave });
    setHasSetCustomPrefixes();
};
let addNewPrefixButtonClick = async function(event) {
    statusLabel.textContent = "Adding prefix...";

    let newNamePrefix = newCustomLinkLabelInput.value;
    await saveNewNamePrefix(newNamePrefix);
    newCustomLinkLabelInput.value = "";

    statusLabel.textContent = "Prefix added. Updating list...";

    // Refresh prefix list display
    await displaySavedNamePrefixes();

    statusLabel.textContent = "List refreshed.";

    await delay(1500);
    statusLabel.textContent = "";
};

let getSiblings = function (el, filter) {
    var siblings = [];
    el = el.parentNode.firstChild;
    do { if (!filter || filter(el)) siblings.push(el); } while (el = el.nextSibling);
    return siblings;
};
let removePrefixClick = async function (event) {
    statusLabel.textContent = "Removing prefix...";

    let removeButtonSender = event.target;
    // Find adjacent text node with prefix value
    let prefixSpan = getSiblings(removeButtonSender, (sibling) => sibling.tagName.toLowerCase() === "span")[0];
    let prefixToRemove = prefixSpan.textContent;

    // Confirm removal
    let confirmed = window.confirm(`Delete '${prefixToRemove}'?`);
    if (!confirmed) {
        statusLabel.textContent = "Remove cancelled.";
        await delay(1500);
        statusLabel.textContent = "";
        event.preventDefault();
        return;
    }

    // Remove event
    removeButtonSender.removeEventListener("click", removePrefixClick);
    // Get saved prefixes
    let savedNamePrefixes = (await getPrefixes());
    // Trim out removed prefix (if found)
    let newNamePrefixes = savedNamePrefixes.filter(prefix => prefix !== prefixToRemove);
    // Save latest prefix list (assumes it was changed)
    await storageSyncSetAsync({ namePrefixes: newNamePrefixes });
    setHasSetCustomPrefixes();

    statusLabel.textContent = "Prefix removed.";

    // Refresh prefix list display
    await displaySavedNamePrefixes();
    await delay(1500);
    statusLabel.textContent = "";
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
let displaySavedNamePrefixes = async function () {
    // Clear list display
    [...prefixList.childNodes].forEach(child => prefixList.removeChild(child));
    // Get latest list and create items from them, with event handlers
    let savedNamePrefixes = (await getPrefixes())
        .map(prefix => {
            let li = document.createElement("li");
            let prefixSpan = document.createElement("span");
            prefixSpan.appendChild(document.createTextNode(`${prefix}`));
            let removeButton = document.createElement("button");
            removeButton.appendChild(document.createTextNode("Remove"));
            removeButton.addEventListener("click", removePrefixClick);
            li.appendChild(prefixSpan);
            li.appendChild(removeButton);
            return li;
        });
    // Display new list of items
    savedNamePrefixes.forEach(li => prefixList.appendChild(li));
}

setCustomLinkLabelButton.addEventListener("click", addNewPrefixButtonClick);
document.addEventListener('DOMContentLoaded', displaySavedNamePrefixes);
document.addEventListener('DOMContentLoaded', setMicrosoftDocsAndLearnDefaultPrefixes);
