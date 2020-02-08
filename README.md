# Learn metadata query tool

Determine the author of a given Microsoft Learn page. This tool is used by the content team to help triage user-reported feedback to the right maintainer.

## Current state

### v0.2.5: Chrome extension

Extract the critical page metadata fields into a Chrome extension pop-up display, with clickable links to the YAML and Markdown pages for editing directly in GitHub.

This is the information currently being extracted:

* `ms.author`
* `author`
* `ms.date`
* modified version of `original_ref_skeleton_git_url` for YAML and Markdown pages (modified for branch)

    ![Screenshot showing the Microsoft Learn maintenance tool Chrome extension with a page's metadata loaded.](media/extension-screenshot-large-v0.2.5.png)

## Roadmap

Here are the current plans for upcoming releases. These are definitely subject to change as this project develops or evolves.

### v0.3+: Easy copying of field data

* Copy buttons per metadata field

### v0.4+: Customization

* Allow customizing which metadata fields are important to you

### v???: The Future

* Offer interactions with Azure DevOps work items directly
* Offer area path interpretation or intelligent guess for work item categorization
