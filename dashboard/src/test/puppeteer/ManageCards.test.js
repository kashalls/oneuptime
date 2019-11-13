const puppeteer = require('puppeteer');
const should = require('should');
const utils = require('./test-utils');
const init = require('./test-init');
const { Cluster } = require('puppeteer-cluster');

// parent user credentials
let email = utils.generateRandomBusinessEmail();
let password = utils.generateRandomString();
let userCredentials;



describe('Stripe cards API', () => {
    const operationTimeOut = 50000;

    beforeAll(async (done) => {
        jest.setTimeout(200000);

        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            puppeteerOptions: utils.puppeteerLaunchConfig,
            puppeteer,
            timeout: 120000
        });

        cluster.on('taskerror', (err) => {
            throw err;
        });

        // Register user 
        await cluster.task(async ({ page, data }) => {
            const user = {
                email: data.email,
                password: data.password
            }
            
            // intercept request and mock response for login
            await page.setRequestInterception(true);
            await page.on('request', async (request) => {
                const signInResponse = userCredentials;

                if((await request.url()).match(/user\/login/)){
                    request.respond({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify(signInResponse)
                    });
                }else{
                    request.continue();
                }
            });
            await page.on('response', async (response)=>{
                try{
                    const res = await response.json();
                    if(res && res.tokens){
                        userCredentials = res;
                    }
                }catch(error){}
            });

            // user
            await init.registerUser(user, page);
            await init.loginUser(user, page);
        });

        await cluster.queue({ email, password });

        await cluster.idle();
        await cluster.close();
        done();
    });
    
    afterAll(async (done) => {
        done();
    });

    test('should add a valid card', async (done) => {
        expect.assertions(1);

        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            puppeteerOptions: utils.puppeteerLaunchConfig,
            puppeteer,
            timeout: 50000
        });

        cluster.on('taskerror', (err) => {
            throw err;
        });

        await cluster.task(async ({ page, data }) => {
            const user = {
                email: data.email,
                password: data.password
            }
            const signInResponse = data.userCredentials;

            // intercept request and mock response for login
            await page.setRequestInterception(true);
            await page.on('request', async (request) => await init.filterRequest(request, signInResponse));

            await init.loginUser(user, page);
            await page.waitForSelector('#projectSettings');
            await page.click('#projectSettings');
            await page.waitForSelector('#billing');
            await page.click('#billing');
            await page.waitForSelector('#addCardButton');
            await page.click('#addCardButton');
            await page.waitFor(3000);
            await page.waitForSelector('iframe[name=__privateStripeFrame5]');
            
            let frame = await page.$('iframe[name=__privateStripeFrame5]');
            
            frame = await frame.contentFrame();
            frame.waitForSelector('input[name=cardnumber]');
            await frame.type('input[name=cardnumber]', '6011111111111117', {
                delay: 50
            });
            frame.waitForSelector('input[name=exp-date]');
            await frame.type('input[name=exp-date]', '1123');
            frame.waitForSelector('input[name=cvc]');
            await frame.type('input[name=cvc]', '100');
            frame.waitForSelector('input[name=postal]');
            await frame.type('input[name=postal]', '11234');
            await page.click('#addCardButtonSubmit');
            await page.waitFor(10000);

            var cardsCount = await page.$eval('#cardsCount', el => el.textContent);
            
            expect(cardsCount).toEqual('2 Cards');
        });

        cluster.queue({ email, password, userCredentials });
        await cluster.idle();
        await cluster.close();
        done();
    }, operationTimeOut);

    test('should delete card', async (done) => {
        expect.assertions(1);
        
        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            puppeteerOptions: utils.puppeteerLaunchConfig,
            puppeteer,
            timeout: 50000
        });

        cluster.on('taskerror', (err) => {
            throw err;
        });

        await cluster.task(async ({ page, data }) => {
            const user = {
                email: data.email,
                password: data.password
            }
            const signInResponse = data.userCredentials;

            // intercept request and mock response for login
            await page.setRequestInterception(true);
            await page.on('request', async (request) => await init.filterRequest(request, signInResponse));

            await init.loginUser(user, page);
            await page.waitForSelector('#projectSettings');
            await page.click('#projectSettings');
            await page.waitForSelector('#billing');
            await page.click('#billing');
            await page.waitForSelector('#deleteCard1');
            await page.click('#deleteCard1');
            await page.waitForSelector('#deleteCardButton');
            await page.click('#deleteCardButton');
            await page.waitFor(4000);

            var cardsCount = await page.$eval('#cardsCount', el => el.textContent);
            
            expect(cardsCount).toEqual('1 Card');
        });

        cluster.queue({ email, password, userCredentials });
        await cluster.idle();
        await cluster.close();
        done();
    }, operationTimeOut);

    test('should not delete card when there is only one card left', async (done) => {
        expect.assertions(1);
        
        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            puppeteerOptions: utils.puppeteerLaunchConfig,
            puppeteer,
            timeout: 50000
        });

        cluster.on('taskerror', (err) => {
            throw err;
        });

        await cluster.task(async ({ page, data }) => {
            const user = {
                email: data.email,
                password: data.password
            }
            const signInResponse = data.userCredentials;

            // intercept request and mock response for login
            await page.setRequestInterception(true);
            await page.on('request', async (request) => await init.filterRequest(request, signInResponse));

            await init.loginUser(user, page);
            await page.waitForSelector('#projectSettings');
            await page.click('#projectSettings');
            await page.waitForSelector('#billing');
            await page.click('#billing');
            await page.waitForSelector('#deleteCard0');
            await page.click('#deleteCard0');
            await page.waitForSelector('#deleteCardButton');
            await page.click('#deleteCardButton');
            await page.waitFor(4000);
            await page.click('#deleteCardCancel');
            
            var cardsCount = await page.$eval('#cardsCount', el => el.textContent);
            
            expect(cardsCount).toEqual('1 Card');
        });

        cluster.queue({ email, password, userCredentials });
        await cluster.idle();
        await cluster.close();
        done();
    }, operationTimeOut);

    test('should not add an invalid card', async (done) => {
        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            puppeteerOptions: utils.puppeteerLaunchConfig,
            puppeteer,
            timeout: 50000
        });

        cluster.on('taskerror', (err) => {
            throw err;
        });

        await cluster.task(async ({ page, data }) => {
            const user = {
                email: data.email,
                password: data.password
            }
            const signInResponse = data.userCredentials;

            // intercept request and mock response for login
            await page.setRequestInterception(true);
            await page.on('request', async (request) => await init.filterRequest(request, signInResponse));

            await init.loginUser(user, page);
            await page.waitForSelector('#projectSettings');
            await page.click('#projectSettings');
            await page.waitForSelector('#billing');
            await page.click('#billing');
            await page.waitForSelector('#addCardButton');
            await page.click('#addCardButton');
            await page.waitFor(2000);
            await page.waitForSelector('iframe[name=__privateStripeFrame5]');
            
            let frame = await page.$('iframe[name=__privateStripeFrame5]');
            
            frame = await frame.contentFrame();
            frame.waitForSelector('input[name=cardnumber]');
            await frame.type('input[name=cardnumber]', '4242424242424241', {
                delay: 20
            });
            frame.waitForSelector('input[name=exp-date]');
            await frame.type('input[name=exp-date]', '1123');
            frame.waitForSelector('input[name=cvc]');
            await frame.type('input[name=cvc]', '100');
            frame.waitForSelector('input[name=postal]');
            await frame.type('input[name=postal]', '11234');
            await page.click('#addCardButtonSubmit');
        });

        cluster.queue({ email, password, userCredentials });
        await cluster.idle();
        await cluster.close();
        done();
    }, operationTimeOut);
});

