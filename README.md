# Learn metadata maintenance tool

Determine the author of a given Microsoft Learn or Microsoft Docs page. And quickly navigate to the content in GitHub to propose edits. This tool was created for the Microsoft Learn content team to help triage user-reported feedback to the right maintainer, but anyone is welcome to use it if it helps them.

![Screenshot of the Microsoft Learn maintenance tool Chrome extension showing a page's author, date, and edit link metadata loaded.](media/extension-screenshot-large-v0.2.5.png)

## Features

Extract the critical page metadata fields into a Chrome extension pop-up display, with clickable links to the YAML and Markdown pages for editing directly in GitHub.

This is the information currently being extracted:

* `ms.author`
* `author`
* `ms.date`
* Edit URL(s), either `original_content_git_url` or a modified version of `original_ref_skeleton_git_url` for YAML and/or Markdown pages

## Installation

If you are using Google Chrome or the Chromium-based Microsoft Edge, you can install the [Microsoft Learn maintenance tool extension](https://chrome.google.com/webstore/detail/microsoft-learn-maintenan/kagphmnlicelfcbbhhmgjcpgnbponlda) to allow retrieving Learn page metadata from the browser toolbar.

### Google Chrome

Installation on Google Chrome works as you would install any other Chrome extension found on the Chrome Web Store.

1. Visit the [Microsoft Learn maintenance tool extension page on the Chrome Web Store](https://chrome.google.com/webstore/detail/microsoft-learn-maintenan/kagphmnlicelfcbbhhmgjcpgnbponlda).
1. Click the **Add to Chrome** button on the extension page.
    ![Screenshot of Microsoft Learn maintenance tool Chrome extension page](media/chrome-extension-page-add-to-chrome.png)
1. Confirm the extension install by clicking the **Add extension** button from the resulting pop-up.
    ![Screenshot of pop-up prompt confirming Chrome extension install](media/chrome-confirm-extension-install.png)

### Microsoft Edge

For Microsoft Edge, you'll first need to allow installing extensions from other stores. You can do this from the extension page on the Chrome Web Store above. Edge will put a header in place to guide you to allow Chrome Web Store extensions.

1. Click the **Allow extensions from other stores** button from the header in Edge.
    ![Screenshot of the top bar added to the Chrome Web Store by Microsoft Edge stating, "You can now add extensions from the Chrome Web Store to Microsoft Edge"](media/edge-install-chrome-extension-bar.png)
1. Confirm enabling other stores by clicking the **Allow** button from the resulting pop-up.
    ![Screenshot of the pop-up alert shown when asking Edge to allow extensions from other stores](media/edge-confirm-allow-other-stores.png)

> [!NOTE]
> You can also toggle this setting from the **Extensions** page. Expand the left-hand menu, if needed, and toggle the **Allow extensions from other stores** option.

1. Visit the [Microsoft Learn maintenance tool extension page on the Chrome Web Store](https://chrome.google.com/webstore/detail/microsoft-learn-maintenan/kagphmnlicelfcbbhhmgjcpgnbponlda).
1. Click the **Add to Chrome** button on the extension page.
1. Confirm the extension install by clicking the **Add extension** button from the resulting pop-up.
    ![Screenshot of pop-up prompt confirming Chrome extension install](media/edge-confirm-extension-install.png)

## Roadmap

Here are the current plans for upcoming releases. These are definitely subject to change as this project develops or evolves.

### v0.5+: Customization

* Allow customizing which metadata fields are important to you

### v???: The Future

* Offer interactions with Azure DevOps work items directly
* Offer area path interpretation or intelligent guess for work item categorization
