const puppeteer = require('puppeteer');
const utils = require('./test-utils');
const init = require('./test-init');
const { Cluster } = require('puppeteer-cluster');

require('should');

// user credentials
const user = {
    email: utils.generateRandomBusinessEmail(),
    password: '1234567890',
};
const componentName = utils.generateRandomString();
const newComponentName = utils.generateRandomString();
const monitorName = utils.generateRandomString();
const newMonitorName = utils.generateRandomString();

describe('Components', () => {
    const operationTimeOut = 50000;

    let cluster;

    beforeAll(async () => {
        jest.setTimeout(200000);

        cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            puppeteerOptions: utils.puppeteerLaunchConfig,
            puppeteer,
            timeout: 120000,
        });

        cluster.on('taskerror', err => {
            throw err;
        });

        return await cluster.execute(null, async ({ page }) => {
            await init.registerUser(user, page);
            await init.loginUser(user, page);
        });
    });

    afterAll(async () => {
        await cluster.idle();
        await cluster.close();
    });

    test(
        'Should create new component',
        async () => {
            return await cluster.execute(null, async ({ page }) => {
                // Navigate to Components page
                await page.goto(utils.DASHBOARD_URL, {
                    waitUntil: 'networkidle0',
                });
                await page.waitForSelector('#components');
                await page.click('#components');

                // Fill and submit New Component form
                await page.waitForSelector('#form-new-component');
                await page.click('input[id=name]');
                await page.type('input[id=name]', componentName);
                await page.click('button[type=submit]');
                await page.goto(utils.DASHBOARD_URL);

                let spanElement;
                spanElement = await page.waitForSelector(
                    `span#component-title-${componentName}`
                );
                spanElement = await spanElement.getProperty('innerText');
                spanElement = await spanElement.jsonValue();
                spanElement.should.be.exactly(componentName);
            });
        },
        operationTimeOut
    );

    test(
        'Should not create new component when details are incorrect',
        async () => {
            return await cluster.execute(null, async ({ page }) => {
                // Navigate to Components page
                await page.goto(utils.DASHBOARD_URL, {
                    waitUntil: 'networkidle0',
                });
                await page.waitForSelector('#components');
                await page.click('#components');

                // Fill and submit New Component form with incorrect details
                await page.waitForSelector('#form-new-component');
                await page.waitForSelector('#name');
                await page.click('button[type=submit]');

                let spanElement = await page.$(
                    '#form-new-component span#field-error'
                );
                spanElement = await spanElement.getProperty('innerText');
                spanElement = await spanElement.jsonValue();
                spanElement.should.be.exactly(
                    'This field cannot be left blank'
                );
            });
        },
        operationTimeOut
    );

    test(
        'Should create a new monitor in component',
        async () => {
            return await cluster.execute(null, async ({ page }) => {
                // Navigate to Component details
                await init.navigateToComponentDetails(componentName, page);

                await page.waitForSelector('#form-new-monitor');
                await page.click('input[id=name]');
                await page.type('input[id=name]', monitorName);
                await init.selectByText('#type', 'url', page);
                await page.waitForSelector('#url');
                await page.click('#url');
                await page.type('#url', 'https://google.com');
                await page.click('button[type=submit]');

                let spanElement = await page.waitForSelector(
                    `#monitor-title-${monitorName}`
                );
                spanElement = await spanElement.getProperty('innerText');
                spanElement = await spanElement.jsonValue();
                spanElement.should.be.exactly(monitorName);
            });
        },
        operationTimeOut
    );

    test(
        'Should create a new monitor in a new component and get list of monitors',
        async () => {
            return await cluster.execute(null, async ({ page }) => {
                // Navigate to Components page
                await page.goto(utils.DASHBOARD_URL, {
                    waitUntil: 'networkidle0',
                });
                await page.waitForSelector('#components');
                await page.click('#components');

                // Fill and submit New Component form
                await page.waitForSelector('#form-new-component');
                await page.click('input[id=name]');
                await page.type('input[id=name]', newComponentName);
                await page.click('button[type=submit]');

                await init.navigateToComponentDetails(newComponentName, page);

                await page.waitForSelector('#form-new-monitor');
                await page.click('input[id=name]');
                await page.type('input[id=name]', newMonitorName);
                await init.selectByText('#type', 'url', page);
                await page.waitForSelector('#url');
                await page.click('#url');
                await page.type('#url', 'https://google.com');
                await page.click('button[type=submit]');

                // Navigate to Components page
                await page.goto(utils.DASHBOARD_URL);
                await page.waitForSelector('#components');
                await page.click('#components');

                const newComponentMonitorSelector =
                    '#component0 table > tbody > tr';
                await page.waitForSelector(newComponentMonitorSelector);

                const newMonitorRows = await page.$$(
                    newComponentMonitorSelector
                );
                const countNewMonitors = newMonitorRows.length;

                expect(countNewMonitors).toEqual(1);

                const componentMonitorSelector =
                    '#component1 table > tbody > tr';
                await page.waitForSelector(componentMonitorSelector);

                const monitorRows = await page.$$(componentMonitorSelector);
                const countMonitors = monitorRows.length;

                expect(countMonitors).toEqual(1);
            });
        },
        operationTimeOut
    );

    test(
        'Should create an incident in monitor details and change monitor status in component list',
        async () => {
            return await cluster.execute(null, async ({ page }) => {
                // Navigate to Monitor details
                await init.navigateToMonitorDetails(
                    componentName,
                    monitorName,
                    page
                );

                await page.waitForSelector(`#createIncident_${monitorName}`);
                await page.click(`#createIncident_${monitorName}`);
                await page.waitForSelector('#createIncident');
                await init.selectByText('#incidentType', 'Offline', page);
                await page.click('#createIncident');
                await page.waitFor(2000);

                await page.waitForSelector('#backToDashboard');
                await page.click('#backToDashboard');
                await page.waitFor(5000);

                let spanElement = await page.waitForSelector(
                    '#component1 table > tbody > tr#monitor_0 span#monitor_status_0'
                );
                spanElement = await spanElement.getProperty('innerText');
                spanElement = await spanElement.jsonValue();

                expect(spanElement).toMatch('OFFLINE');
            });
        },
        operationTimeOut
    );

    test(
        'Should edit a component',
        async () => {
            return await cluster.execute(null, async ({ page }) => {
                // Navigate to Components page
                await page.goto(utils.DASHBOARD_URL, {
                    waitUntil: 'networkidle2',
                });

                await page.waitForSelector(`#edit-component-${componentName}`);
                await page.click(`#edit-component-${componentName}`);
                await page.waitFor(2000);

                await page.waitForSelector('#componentName');
                await page.click('input[name=name]');
                await page.type('input[name=name]', '-two', { delay: 100 });
                await page.click('button[type=save]', { delay: 100 });

                let spanElement = await page.waitForSelector(
                    `span#component-title-${componentName}-two`
                );
                spanElement = await spanElement.getProperty('innerText');
                spanElement = await spanElement.jsonValue();
                spanElement.should.be.exactly(`${componentName}-two`);
            });
        },
        operationTimeOut
    );

    test(
        'Should create new project from incident page and redirect to the component page',
        async () => {
            return await cluster.execute(null, async ({ page }) => {
                // Navigate to Monitor details
                await init.navigateToMonitorDetails(
                    newComponentName,
                    newMonitorName,
                    page
                );
                await page.waitForSelector(`#createIncident_${newMonitorName}`);
                await page.click(`#createIncident_${newMonitorName}`);
                await page.waitForSelector('#createIncident');
                await init.selectByText('#incidentType', 'Offline', page);
                await page.click('#createIncident');
                await page.waitFor(2000);
                await page.waitForSelector(
                    `table > tbody > tr#incident_${newMonitorName}_0`
                );
                await page.click(
                    `table > tbody > tr#incident_${newMonitorName}_0`
                );
                await page.waitFor(5000);
                await page.waitForSelector('#AccountSwitcherId');
                await page.click('#AccountSwitcherId');
                await page.waitForSelector('#create-project');
                await page.click('#create-project');
                await page.waitForSelector('#name');
                await page.click('input[id=name]');
                await page.type('input[id=name]', utils.generateRandomString());
                await page.click('input[id=Startup_month]');
                await page.click('button[type=submit]');
                let currentPage = await page.waitForSelector('#cbComponents');
                currentPage = await currentPage.getProperty('innerText');
                currentPage = await currentPage.jsonValue();
                currentPage.should.be.exactly('Components');
            });
        },
        operationTimeOut
    );
});
