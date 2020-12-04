const newCustomLinkLabelInput = document.getElementById("newCustomLinkLabel");
const setCustomLinkLabelButton = document.getElementById("setNewCustomLinkLabel");
const newCustomLinkUrlInput = document.getElementById("newCustomLinkUrl");
const setCustomLinkUrlButton = document.getElementById("setNewCustomLinkUrl");
const resetCustomLinkButton = document.getElementById("resetCustomLink");
const statusLabel = document.getElementById("status");
const disableCustomLinkButton = document.getElementById("disableCustomLink");
const defaultLinkLabel = "Triage query (Azure DevOps)";
const defaultLinkUrl = "https://aka.ms/learn-azure-triage";
const defaultLinkIsDisabled = true;

const delay = function (timeInMilliseconds) {
    return new Promise(resolve => setTimeout(resolve, timeInMilliseconds));
}

const getCustomLink = async function () {
    let currentSavedCustomLink = await storageHelper.storageSyncGetAsync(
        {
            customLinkLabel: null,
            customLinkUrl: null,
            hasSetCustomLink: false,
            isLinkDisabled: defaultLinkIsDisabled
        }
    );

    if (!currentSavedCustomLink.hasSetCustomLink) {
        await resetCustomLinkToDefault();
        currentSavedCustomLink = await storageHelper.storageSyncGetAsync(
            {
                customLinkLabel: null,
                customLinkUrl: null,
                hasSetCustomLink: false,
                isLinkDisabled: defaultLinkIsDisabled
            }
        );
    }

    console.log(currentSavedCustomLink);
    return currentSavedCustomLink;
};
const setCustomLink = async function (customLinkLabel, customLinkUrl, isLinkDisabled) {
    console.log(`Setting custom link: [${customLinkLabel}](${customLinkUrl}) (${isLinkDisabled})`);
    let newLink = {
        customLinkLabel: customLinkLabel,
        customLinkUrl: customLinkUrl,
        hasSetCustomLink: false,
        isLinkDisabled: isLinkDisabled
    };
    if (customLinkUrl !== null && customLinkLabel !== null) {
        newLink.hasSetCustomLink = true;
    }
    await storageHelper.storageSyncSetAsync(newLink);
};
const toggleCustomLinkIsDisabled = async function (isDisabled) {
    const currentSavedCustomLink = await getCustomLink();
    setCustomLink(currentSavedCustomLink.customLinkLabel, currentSavedCustomLink.customLinkUrl, isDisabled);
};
const resetCustomLinkToDefault = async function () {
    await setCustomLink(defaultLinkLabel, defaultLinkUrl, defaultLinkIsDisabled);
};

const displayCurrentLinkValues = async function () {
    let currentCustomLink = await getCustomLink();
    customLinkLabel.textContent = currentCustomLink.customLinkLabel;
    newCustomLinkLabelInput.value = currentCustomLink.customLinkLabel;
    customLinkUrl.textContent = currentCustomLink.customLinkUrl;
    newCustomLinkUrlInput.value = currentCustomLink.customLinkUrl;
    const disableLinkToggleText = `${currentCustomLink.isLinkDisabled ? "Show" : "Hide"} link`;
    disableCustomLinkButton.textContent = disableLinkToggleText;
    disableCustomLinkButton.value = currentCustomLink.isLinkDisabled ? "show" : "hide";
}

const setCustomLinkClick = async function (event) {
    const newLabel = newCustomLinkLabelInput.value;
    const newUrl = newCustomLinkUrlInput.value;
    await setCustomLink(newLabel, newUrl);
    await displayStatus("Custom link values saved.");
};
const resetCustomLinkClick = async function (event) {
    await confirm("Reset custom link to default?", resetCustomLinkToDefault, "Custom link settings reset.");
    await displayCurrentLinkValues();
};

const disableCustomLink = async function () {
    const nextIsDisabledState = disableCustomLinkButton.value === "hide" ? true : false;
    await toggleCustomLinkIsDisabled(nextIsDisabledState);
    await displayCurrentLinkValues();
};
const disableCustomLinkClick = async function (event) {
    await confirm("Toggle custom link display?", disableCustomLink, "Custom link preference saved.");
    await displayCurrentLinkValues();
};

const confirm = async function (message, action, successMessage) {
    const didConfirm = window.confirm(message);
    if (didConfirm) {
        await action();
        if (successMessage) {
            await displayStatus(successMessage);
        }
    }
};
const displayStatus = async function (statusMessage) {
    statusLabel.textContent = statusMessage;
    await delay(1500);
    statusLabel.textContent = "";
};

setCustomLinkLabelButton.addEventListener("click", setCustomLinkClick);
resetCustomLinkButton.addEventListener("click", resetCustomLinkClick);
disableCustomLinkButton.addEventListener("click", disableCustomLinkClick);
document.addEventListener("DOMContentLoaded", displayCurrentLinkValues);
