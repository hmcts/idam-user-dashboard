#Functional test notes

##Things to avoid

Any of the “wait…” codecept commands seem to struggle when validating that dashboard pages have loaded. Alternatives have been created in the steps file which are explained in the Navigation section.

Default retry of steps is turned off because it can cause confusion about where failures actually happen. Retries might sometimes be needed, but so far they’re mainly limited to generic steps in the steps_file.

There are no BeforeSuite methods in any of the tests, and the Before method is only used for calling setupDao and autologin. This is because the BeforeSuite methods are called outside of the context of a browser, so making “I.” Calls in that method can cause problems for the tests, particularly the allure reporting, which expects to be in the browser context. Before methods are called before every test, so test data setup has to include flags to prevent data being created every time (which is handled within setupDao).

##Setup

setupDao is used to create the basic configuration you need for the tests, so the admin user, the admin role and the worker role. All other test data should be created by factories as part of the test.

When running in cross browser tests we override the name of the admin user for each browser type, so there’s no clash of admin users between the different workers running the tests.

The Autologin plugin is used to login the majority of the tests as the main admin user. This means the test suites don’t have to set up the main admin user every time. It also means that there is a standard admin and worker role that the tests can expect to be in place.


##Navigation

There are several types of navigation helper methods in the steps file:

navigateToXXX()
clickToNavigate()
seeAfterClick()

The navigateToXXX methods are helpers for the tests so they can jump directly to the screen they want to test. They also handle checking that the page is actually loaded and showing the headers that are expected.

clickToNavigate() is used to confirm that once you click a button the page actually changes, and that you have ended up on the next page successfully. It does this by checking that the page header has changed, and has the right value. clickToExpectProblem and clickToExpectSuccess are convenience methods that check for govuk style error/info boxes.

seeAfterClick() shouldn’t need to be used directly in tests very often (since you can use the previously mentioned navigation helpers), but seeAfterClick should be used if you need to click a button in a test and you want to check that a value on the page is visible. It retries several times to make sure that the test isn’t stuck waiting for the page to load, and is an alternative to using any of the “wait…” codecept methods which don’t work well with our code.


##Locators

Several “locate” methods have been added to step_file to make it easier to locate specific elements. For example, on the user dashboard mange user screen the info about a user is displayed in a data table, but the value we are interested in is in an unnamed “dd” element, but the name of the data value is in a corresponding “dt” element. Rather than have ever test handle the complexity of this UI setup a helper method has been created.


##Factories and Test users

Factories can be used to create test users that are only needed within a single test. They can also create roles and services. (This is separate to the admin user and roles that are needed to be shared across all tests - those are created in the setupDao).