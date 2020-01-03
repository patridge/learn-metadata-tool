// To turn this code into a bookmarklet, it is run through minifier.org and placed in an code block in the README (JS anchor elements don't work on GitHub).
javascript: (async function () {
    let msAuthorMetaTagValue = document.querySelectorAll("meta[name='ms.author']")[0].attributes["content"].value;
    let gitHubLocationLive = document.querySelectorAll("meta[name='original_ref_skeleton_git_url']")[0].attributes["content"].value;
    let gitHubLocationMaster = gitHubLocationLive.replace("/live/", "/master/");

    await navigator.clipboard.writeText(msAuthorMetaTagValue);
    window.alert(`Copied '${msAuthorMetaTagValue}' to clipboard.`);
    window.open(gitHubLocationMaster, "_blank");
})();
