import { storageHelper } from "./js/storage-helpers";

const newCustomLinkLabelInput = document.getElementById("newCustomLinkLabel") as HTMLInputElement;
const setCustomLinkLabelButton = document.getElementById("setNewCustomLinkLabel") as HTMLButtonElement;
const newCustomLinkUrlInput = document.getElementById("newCustomLinkUrl") as HTMLInputElement;
const setCustomLinkUrlButton = document.getElementById("setNewCustomLinkUrl") as HTMLButtonElement;
const resetCustomLinkButton = document.getElementById("resetCustomLink") as HTMLButtonElement;
const statusLabel = document.getElementById("status") as HTMLElement;
const disableCustomLinkButton = document.getElementById("disableCustomLink") as HTMLButtonElement;
const defaultLinkLabel = "Triage query (Azure DevOps)";
const defaultLinkUrl = "https://aka.ms/learn-azure-triage";
const defaultLinkIsDisabled = true;

const delay = (timeInMilliseconds: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, timeInMilliseconds));
};

interface CustomLink {
    customLinkLabel: string | null;
    customLinkUrl: string | null;
    hasSetCustomLink: boolean;
    isLinkDisabled: boolean;
}

const getCustomLink = async (): Promise<CustomLink> => {
    let currentSavedCustomLink: CustomLink = await storageHelper.storageSyncGetAsync(
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

const setCustomLink = async (customLinkLabel: string | null, customLinkUrl: string | null, isLinkDisabled: boolean): Promise<void> => {
    console.log(`Setting custom link: [${customLinkLabel}](${customLinkUrl}) (${isLinkDisabled})`);
    let newLink: CustomLink = {
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

const toggleCustomLinkIsDisabled = async (isDisabled: boolean): Promise<void> => {
    const currentSavedCustomLink = await getCustomLink();
    await setCustomLink(currentSavedCustomLink.customLinkLabel, currentSavedCustomLink.customLinkUrl, isDisabled);
};

const resetCustomLinkToDefault = async (): Promise<void> => {
    await setCustomLink(defaultLinkLabel, defaultLinkUrl, defaultLinkIsDisabled);
};

const displayCurrentLinkValues = async (): Promise<void> => {
    let currentCustomLink = await getCustomLink();
    const customLinkLabel = document.getElementById("customLinkLabel") as HTMLElement;
    const customLinkUrl = document.getElementById("customLinkUrl") as HTMLElement;

    if (customLinkLabel && customLinkUrl) {
        customLinkLabel.textContent = currentCustomLink.customLinkLabel || '';
        newCustomLinkLabelInput.value = currentCustomLink.customLinkLabel || '';
        customLinkUrl.textContent = currentCustomLink.customLinkUrl || '';
        newCustomLinkUrlInput.value = currentCustomLink.customLinkUrl || '';
        const disableLinkToggleText = `${currentCustomLink.isLinkDisabled ? "Show" : "Hide"} link`;
        disableCustomLinkButton.textContent = disableLinkToggleText;
        disableCustomLinkButton.value = currentCustomLink.isLinkDisabled ? "show" : "hide";
    }
};

const setCustomLinkClick = async (event: Event): Promise<void> => {
    const newLabel = newCustomLinkLabelInput.value;
    const newUrl = newCustomLinkUrlInput.value;
    await setCustomLink(newLabel, newUrl, false);
};

const resetCustomLinkClick = async (event: Event): Promise<void> => {
    await confirm("Reset custom link to default?", resetCustomLinkToDefault);
    await displayCurrentLinkValues();
};

const disableCustomLink = async (): Promise<void> => {
    const nextIsDisabledState = disableCustomLinkButton.value === "hide";
    await toggleCustomLinkIsDisabled(nextIsDisabledState);
    await displayCurrentLinkValues();
};

const disableCustomLinkClick = async (event: Event): Promise<void> => {
    await confirm("Toggle custom link display?", disableCustomLink);
    await displayCurrentLinkValues();
};

const confirm = async (message: string, action: () => Promise<void>): Promise<void> => {
    const didConfirm = window.confirm(message);
    if (didConfirm) {
        await action();
    }
};

setCustomLinkLabelButton.addEventListener("click", setCustomLinkClick);
resetCustomLinkButton.addEventListener("click", resetCustomLinkClick);
disableCustomLinkButton.addEventListener("click", disableCustomLinkClick);
document.addEventListener("DOMContentLoaded", displayCurrentLinkValues);
