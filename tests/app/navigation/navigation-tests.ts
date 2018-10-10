﻿import * as TKUnit from "../TKUnit";
import { EventData, Page, NavigatedData } from "tns-core-modules/ui/page";
import { topmost as topmostFrame, NavigationTransition } from "tns-core-modules/ui/frame";
import { Color } from "tns-core-modules/color";
import * as helper from "../ui/helper";

// Creates a random colorful page full of meaningless stuff.
let id = 0;
let pageFactory = function (): Page {
    const page = new Page();
    page.actionBarHidden = true;
    page.id = `NavTestPage${id++}`;
    page.style.backgroundColor = new Color(255, Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255));
    return page;
};

function attachEventListeners(page: Page, events: Array<string>) {
    let argsToString = (args: NavigatedData) => {
        return `${(<Page>args.object).id} ${args.eventName} ${(args.isBackNavigation ? "back" : "forward")}`;
    };

    page.on(Page.navigatingFromEvent, (args: NavigatedData) => { events.push(argsToString(args)); });
    page.on(Page.navigatedFromEvent, (args: NavigatedData) => { events.push(argsToString(args)); });
    page.on(Page.navigatingToEvent, (args: NavigatedData) => { events.push(argsToString(args)); });
    page.on(Page.navigatedToEvent, (args: NavigatedData) => { events.push(argsToString(args)); });
}

function _test_backstackVisible(transition?: NavigationTransition) {
    let topmost = topmostFrame();
    let mainTestPage = topmost.currentPage;
    topmost.navigate({ create: pageFactory, transition: transition, animated: !!transition });
    TKUnit.waitUntilReady(() => topmost.navigationQueueIsEmpty());
    // page1 should not be added to the backstack
    let page0 = topmost.currentPage;
    topmost.navigate({ create: pageFactory, backstackVisible: false, transition: transition, animated: !!transition });
    topmost.navigate({ create: pageFactory, transition: transition, animated: !!transition });
    topmost.goBack();
    TKUnit.waitUntilReady(() => topmost.navigationQueueIsEmpty());
    // From page2 we have to go directly to page0, skipping page1.
    TKUnit.assertEqual(topmost.currentPage, page0, "Page 1 should be skipped when going back.");

    helper.goBack();
    TKUnit.assertEqual(topmost.currentPage, mainTestPage, "We should be on the main test page at the end of the test.");
}

export function test_backstackVisible() {
    _test_backstackVisible();
}

export function test_backstackVisible_WithTransition() {
    _test_backstackVisible({ name: "fade", duration: 10 });
}

function _test_backToEntry(transition?: NavigationTransition) {
    const topmost = topmostFrame();
    const page = (tag) => () => {
        const p = new Page();
        p.actionBarHidden = true;
        p.id = `NavTestPage${id++}`;
        p["tag"] = tag;
        return p;
    };

    const mainTestPage = topmost.currentPage;

    const navigate = tag => topmost.navigate({ create: page(tag), transition: transition, animated: !!transition });
    const back = pages => topmost.goBack(topmost.backStack[topmost.backStack.length - pages]);
    const currentPageMustBe = tag => TKUnit.assertEqual(topmost.currentPage["tag"], tag, "Expected current page to be " + tag + " it was " + topmost.currentPage["tag"] + " instead.");

    navigate("page1");
    navigate("page2");
    navigate("page3");
    navigate("page4");
    TKUnit.waitUntilReady(() => topmost.navigationQueueIsEmpty());

    currentPageMustBe("page4");

    back(2);
    TKUnit.waitUntilReady(() => topmost.navigationQueueIsEmpty());

    currentPageMustBe("page2");

    back(1);
    TKUnit.waitUntilReady(() => topmost.navigationQueueIsEmpty());

    currentPageMustBe("page1");

    navigate("page1.1");
    navigate("page1.2");
    TKUnit.waitUntilReady(() => topmost.navigationQueueIsEmpty());

    currentPageMustBe("page1.2");

    back(1);
    TKUnit.waitUntilReady(() => topmost.navigationQueueIsEmpty());

    currentPageMustBe("page1.1");

    back(1);
    TKUnit.waitUntilReady(() => topmost.navigationQueueIsEmpty());

    currentPageMustBe("page1");

    back(1);
    TKUnit.waitUntilReady(() => topmost.navigationQueueIsEmpty());

    TKUnit.assertEqual(topmost.currentPage, mainTestPage, "We should be on the main test page at the end of the test.");
}

export function test_backToEntry() {
    _test_backToEntry();
}

export function test_backToEntry_WithTransition() {
    _test_backToEntry({ name: "fade", duration: 10 });
}

function _test_ClearHistory(transition?: NavigationTransition) {
    let topmost = topmostFrame();
    let x = 0;
    helper.navigateWithEntry({ create: pageFactory, clearHistory: true, transition: transition, animated: !!transition });
    TKUnit.assertEqual(topmost.backStack.length, 0, "1.topmost.backStack.length");
    TKUnit.assertEqual(topmost.canGoBack(), false, "1.topmost.canGoBack().");

    helper.navigateWithEntry({ create: pageFactory, transition: transition, animated: !!transition });
    TKUnit.assertEqual(topmost.backStack.length, 1, "2.topmost.backStack.length");
    TKUnit.assertEqual(topmost.canGoBack(), true, "2.topmost.canGoBack().");

    helper.navigateWithEntry({ create: pageFactory, transition: transition, animated: !!transition });
    TKUnit.assertEqual(topmost.backStack.length, 2, "3.topmost.backStack.length");
    TKUnit.assertEqual(topmost.canGoBack(), true, "3.topmost.canGoBack().");

    helper.navigateWithEntry({ create: pageFactory, clearHistory: true, transition: transition, animated: !!transition });
    TKUnit.assertEqual(topmost.backStack.length, 0, "4.topmost.backStack.length");
    TKUnit.assertEqual(topmost.canGoBack(), false, "4.topmost.canGoBack().");
}

export function test_ClearHistory() {
    _test_ClearHistory();
}

export function test_ClearHistory_WithTransition() {
    _test_ClearHistory({ name: "fade", duration: 10 });
}

// Test case for https://github.com/NativeScript/NativeScript/issues/1948
export function test_ClearHistoryWithTransitionDoesNotBreakNavigation() {
    let topmost = topmostFrame();
    let mainTestPage = new Page();
    let mainPageFactory = function (): Page {
        return mainTestPage;
    };

    // Go to details-page
    helper.navigateWithEntry({ create: pageFactory, clearHistory: false, animated: true });

    // Go back to main-page with clearHistory
    topmost.transition = { name: "fade", duration: 10 };
    helper.navigateWithEntry({ create: mainPageFactory, clearHistory: true, animated: true });

    // Go to details-page AGAIN
    helper.navigateWithEntry({ create: pageFactory, clearHistory: false, animated: true });

    // Go back to main-page with clearHistory
    topmost.transition = { name: "fade", duration: 10 };
    helper.navigateWithEntry({ create: mainPageFactory, clearHistory: true, animated: true });

    // Clean up
    topmost.transition = undefined;

    TKUnit.assertEqual(topmost.currentPage, mainTestPage, "We should be on the main test page at the end of the test.");
    TKUnit.assertEqual(topmost.backStack.length, 0, "Back stack should be empty at the end of the test.");
}

export function test_ClearHistoryWithTransitionDoesNotBreakNavigation_WithLocalTransition() {
    const topmost = topmostFrame();

    let originalCachePagesOnNavigate: boolean;
    if (topmost.android) {
        originalCachePagesOnNavigate = topmost.android.cachePagesOnNavigate;
        topmostFrame().android.cachePagesOnNavigate = true;
    }

    let mainTestPage = topmost.currentPage;
    let mainPageFactory = function (): Page {
        return mainTestPage;
    };

    // Go to 1st page
    helper.navigateWithEntry({ create: pageFactory, clearHistory: false, transition: { name: "fade", duration: 10 }, animated: true });

    // Go to 2nd page
    helper.navigateWithEntry({ create: pageFactory, clearHistory: false, transition: { name: "fade", duration: 10 }, animated: true });

    // Go to 3rd page with clearHistory
    helper.navigateWithEntry({ create: pageFactory, clearHistory: true, transition: { name: "fade", duration: 10 }, animated: true });

    // Go back to main
    helper.navigateWithEntry({ create: mainPageFactory, clearHistory: true, transition: { name: "fade", duration: 10 }, animated: true });

    if (topmost.android) {
        topmostFrame().android.cachePagesOnNavigate = originalCachePagesOnNavigate;
    }

    TKUnit.assertEqual(topmost.currentPage, mainTestPage, "We should be on the main test page at the end of the test.");
    TKUnit.assertEqual(topmost.backStack.length, 0, "Back stack should be empty at the end of the test.");
}

function _test_NavigationEvents(transition?: NavigationTransition) {
    const topmost = topmostFrame();
    const mainTestPage = topmost.currentPage;
    const originalMainPageId = mainTestPage.id;

    mainTestPage.id = "main-page";
    let actualMainPageEvents = new Array<string>();
    attachEventListeners(mainTestPage, actualMainPageEvents);

    let actualSecondPageEvents = new Array<string>();
    let secondPageFactory = function (): Page {
        const secondPage = new Page();
        secondPage.actionBarHidden = true;
        secondPage.id = "second-page";
        attachEventListeners(secondPage, actualSecondPageEvents);
        secondPage.style.backgroundColor = new Color(255, Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255));
        return secondPage;
    };

    // Go to other page
    helper.navigateWithEntry({ create: secondPageFactory, transition: transition, animated: !!transition });

    // Go back to main
    helper.goBack();

    mainTestPage.id = originalMainPageId;

    let expectedMainPageEvents = [
        "main-page navigatingFrom forward",
        "main-page navigatedFrom forward",
        "main-page navigatingTo back",
        "main-page navigatedTo back"
    ];
    TKUnit.arrayAssert(actualMainPageEvents, expectedMainPageEvents, "Actual main-page events are different from expected.");

    let expectedSecondPageEvents = [
        "second-page navigatingTo forward",
        "second-page navigatedTo forward",
        "second-page navigatingFrom back",
        "second-page navigatedFrom back"
    ];
    TKUnit.arrayAssert(actualSecondPageEvents, expectedSecondPageEvents, "Actual second-page events are different from expected.");

    TKUnit.assertEqual(topmost.currentPage, mainTestPage, "We should be on the main test page at the end of the test.");
}

export function test_NavigationEvents() {
    _test_NavigationEvents();
}

export function test_NavigationEvents_WithTransition() {
    _test_NavigationEvents({ name: "fade", duration: 10 });
}

function _test_NavigationEvents_WithBackstackVisibile_False_Forward_Back(transition?: NavigationTransition) {
    const topmost = topmostFrame();
    const mainTestPage = topmost.currentPage;

    let actualSecondPageEvents = new Array<string>();
    let secondPageFactory = function (): Page {
        const secondPage = new Page();
        secondPage.actionBarHidden = true;
        secondPage.id = "second-page";
        attachEventListeners(secondPage, actualSecondPageEvents);
        secondPage.style.backgroundColor = new Color(255, Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255));
        return secondPage;
    };

    // Go to other page
    helper.navigateWithEntry({ create: secondPageFactory, transition: transition, animated: !!transition, backstackVisible: false });

    // Go back to main
    helper.goBack();

    let expectedSecondPageEvents = [
        "second-page navigatingTo forward",
        "second-page navigatedTo forward",
        "second-page navigatingFrom back",
        "second-page navigatedFrom back"
    ];
    TKUnit.arrayAssert(actualSecondPageEvents, expectedSecondPageEvents, "Actual second-page events are different from expected.");

    TKUnit.assertEqual(topmost.currentPage, mainTestPage, "We should be on the main test page at the end of the test.");
}

export function test_NavigationEvents_WithBackstackVisibile_False_Forward_Back() {
    _test_NavigationEvents_WithBackstackVisibile_False_Forward_Back();
}

export function test_NavigationEvents_WithBackstackVisibile_False_Forward_Back_WithTransition() {
    _test_NavigationEvents_WithBackstackVisibile_False_Forward_Back({ name: "fade", duration: 10 });
}

function _test_NavigationEvents_WithBackstackVisibile_False_Forward_Forward(transition?: NavigationTransition) {
    const topmost = topmostFrame();
    const mainTestPage = topmost.currentPage;

    let actualSecondPageEvents = new Array<string>();
    let secondPageFactory = function (): Page {
        const secondPage = new Page();
        secondPage.actionBarHidden = true;
        secondPage.id = "second-page";
        attachEventListeners(secondPage, actualSecondPageEvents);
        secondPage.style.backgroundColor = new Color(255, Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255));
        return secondPage;
    };

    // Go to other page
    helper.navigateWithEntry({ create: secondPageFactory, transition: transition, animated: !!transition, backstackVisible: false });

    // Go forward to third page
    helper.navigateWithEntry({ create: pageFactory, transition: transition, animated: !!transition });

    // Go back to main
    helper.goBack();

    let expectedSecondPageEvents = [
        "second-page navigatingTo forward",
        "second-page navigatedTo forward",
        "second-page navigatingFrom forward",
        "second-page navigatedFrom forward"
    ];
    TKUnit.arrayAssert(actualSecondPageEvents, expectedSecondPageEvents, "Actual second-page events are different from expected.");

    TKUnit.assertEqual(topmost.currentPage, mainTestPage, "We should be on the main test page at the end of the test.");
}

export function test_NavigationEvents_WithBackstackVisibile_False_Forward_Forward() {
    _test_NavigationEvents_WithBackstackVisibile_False_Forward_Forward();
}

export function test_NavigationEvents_WithBackstackVisibile_False_Forward_Forward_WithTransition() {
    _test_NavigationEvents_WithBackstackVisibile_False_Forward_Forward({ name: "fade", duration: 10 });
}

function _test_NavigationEvents_WithClearHistory(transition?: NavigationTransition) {
    const topmost = topmostFrame();
    const mainTestPage = topmost.currentPage;

    mainTestPage.id = "main-page";
    const actualMainPageEvents = new Array<string>();
    attachEventListeners(mainTestPage, actualMainPageEvents);

    const actualSecondPageEvents = new Array<string>();
    const secondPage = new Page();
    const secondPageFactory = function (): Page {
        secondPage.actionBarHidden = true;
        secondPage.id = "second-page";
        attachEventListeners(secondPage, actualSecondPageEvents);
        secondPage.style.backgroundColor = new Color(255, Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255));
        return secondPage;
    };

    // Go to second page
    helper.navigateWithEntry({ create: secondPageFactory, transition: transition, animated: !!transition, clearHistory: true });

    const expectedMainPageEvents = [ "main-page navigatingFrom forward", "main-page navigatedFrom forward" ];
    TKUnit.arrayAssert(actualMainPageEvents, expectedMainPageEvents, "Actual main-page events are different from expected.");

    const expectedSecondPageEvents = [ "second-page navigatingTo forward", "second-page navigatedTo forward" ];
    TKUnit.arrayAssert(actualSecondPageEvents, expectedSecondPageEvents, "Actual main-page events are different from expected.");

    TKUnit.assertEqual(topmost.currentPage, secondPage, "We should be on the second page at the end of the test.");
}

export function test_NavigationEvents_WithClearHistory() {
    _test_NavigationEvents_WithClearHistory();
}

export function test_NavigationEvents_WithClearHistory_WithTransition() {
    _test_NavigationEvents_WithClearHistory({ name: "fade", duration: 10 });
}

export function test_Navigate_From_Page_Loaded_Handler() {
    _test_Navigate_From_Page_Event_Handler(Page.loadedEvent);
}

export function test_Navigate_From_Page_NavigatedTo_Handler() {
    _test_Navigate_From_Page_Event_Handler(Page.navigatedToEvent);
}

function _test_Navigate_From_Page_Event_Handler(eventName: string) {
    let secondPageNavigatedTo = false;

    const firstPageFactory = function (): Page {
        const firstPage = new Page();
        firstPage.id = "first-page";
        firstPage.on(eventName, (args: EventData) => { 
            const page = <Page>args.object;
            const frame = page.frame;

            const secondPageFactory = function (): Page {
                const secondPage = new Page();
                secondPage.id = "second-page";
                secondPage.on(Page.navigatedToEvent, () => { secondPageNavigatedTo = true });

                return secondPage;
            };

            frame.navigate(secondPageFactory);
        });

        return firstPage;
    };

    helper.navigateWithEntry({ create: firstPageFactory });

    TKUnit.waitUntilReady(() => secondPageNavigatedTo);
}