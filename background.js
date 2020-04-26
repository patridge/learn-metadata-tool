chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: {
                        // We are hoping to allow this extension whenever we can. That includes the following URL examples.
                        // * Microsoft Docs: https://docs.microsoft.com/en-us/xamarin/essentials/platform-feature-support?context=xamarin/android
                        // * Microsoft Learn (modules, units): https://docs.microsoft.com/en-us/learn/modules/welcome-to-azure/2-what-is-azure
                        // * Microsoft Learn Docs: https://review.docs.microsoft.com/learn-docs/docs/support-triage-issues
                        // Not super specific here, but may be good enough (other options: https://developer.chrome.com/extensions/declarativeContent#type-PageStateMatcher).
                        // We could make a bunch of nearly identical rules for these or catch more than intended and handle edge cases elsewhere in code. So far, we are choosing the later.
                        hostSuffix: "docs.microsoft.com",
                    },
                })
            ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});