// To turn this code into a bookmarklet, it is run through minifier.org and placed in an code block in the README (JS anchor elements don't work on GitHub).
javascript: (async function () {
    let msAuthorMetaTagValue = document.querySelectorAll("meta[name='ms.author']")[0].attributes["content"].value;

    await navigator.clipboard.writeText(msAuthorMetaTagValue);
    window.alert(`Copied '${msAuthorMetaTagValue}' to clipboard.`);
})();
