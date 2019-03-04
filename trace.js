const puppeteer = require('puppeteer');
const chalk = require('chalk');

const config = require('./config.js');

puppeteer.launch({ 
    headless: false 
}).then(async browser => {
    let page = await browser.newPage();

    page.setViewport({ width: 961, height: 526 });

    // 等待指定的选择器img匹配的元素出现在页面中
    page
        .waitForSelector('img')
        .then(async() => {
            console.log(chalk.green('✔ Oh，The img has already appeared on the page'));
        });

    setPageWatcher(page);

    // await page._client.send('Network.emulateNetworkConditions', { // 3G Slow
    //     offline: false,
    //     latency: 200, // ms
    //     downloadThroughput: 780 * 1024 / 8, // 780 kb/s
    //     uploadThroughput: 330 * 1024 / 8, // 330 kb/s
    // });

    // await page._client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    await page.tracing.start({path: config.saveTracePath + 'trace.json', screenshots: true});
    console.log('tracing');

    await page.goto(config.targetWebsite);
    console.log('goto end');

    // 测量网页加载速度,和控制台打印出来一样
    // const { extractDataFromPerformanceTiming, extractDataFromPerformanceMetrics } = require('./helpers');

    /**
     * window.performance.timing在网页上下文中执行
     * Performance.getMetrics在浏览器级别上执行（特别是Chrome）
     * await page.waitFor(1000);
     * 这是由于首次有意义绘图不是准时的任意时间点，这个测量是基于一些启发式的，并且是在所有页面渲染完毕后计算的。
     */

    // const performanceTiming = JSON.parse(
    //     await page.evaluate(() => JSON.stringify(window.performance.timing))
    // );
    // console.log(extractDataFromPerformanceTiming(
    //     performanceTiming,
    //     'responseEnd',
    //     'domInteractive',
    //     'domContentLoadedEventEnd',
    //     'loadEventEnd'
    // ));

    // await page.waitFor(1000);

    // const performanceMetrics = await page._client.send('Performance.getMetrics');
    // console.log(extractDataFromPerformanceMetrics(
    //     performanceMetrics,
    //     'FirstMeaningfulPaint'
    // ))

    await waitForReadyStateComplete(page).then(async (result) => {
        if (result) {
            console.log(chalk.green('✔ Okay，The page has been loaded, and saved trace.json'))
            await page.tracing.stop()
            await page.waitFor(1000)
            let pageTitle = await page.title()
            await page.screenshot({ path: `${config.saveTracePath}${pageTitle}.png`, type: 'png' })
            await browser.close()
        }
    })
})

const setPageWatcher = (page) => {
    console.log('setPageWatcher');
    page.on('requestfailed', error => {
        console.log(chalk.red(`💢 whoops! request failed： ${error}`))
    })
  
    page.on('error', (error) => {
        console.log(chalk.red('💢 whoops! there was an error'))
        console.log(error)
    })
  
    page.on('pageerror', (error) => {
        console.log(chalk.red('💢 whoops! there was an pageerror'))
        console.log(error)
    })
}

/**
 * @param    {[type]}   page        [Browser 实例 Page]
 * @param    {Number}   timesLimit  [等待页面加载完的成轮询次数，默认 600]
 * @param    {Number}   cycleFactor [每次轮询的间隔时间(ms)，默认 10]
 * @return   {Boolean}              [等待(timesLimit*cycleFactor)ms后，页面是否加载完毕]
 */
const waitForReadyStateComplete = (page, timesLimit = 600, cycleFactor = 10) => {
    console.log('waitForReadyStateComplete');
    return new Promise(async (resolve, reject) => {
        let i = 0
        while (i < timesLimit) {
            console.log(chalk.white(`♻️  Wait for page load completion，Now the number of polling is: ${i}`, ''))
            if (await isLoadingFinished(page)) {
                console.log(chalk.green(`😊  Okay, The time to wait for the page to load to complete is: ${i * cycleFactor} ms`))
                return resolve(true)
            }
            i++
            await page.waitFor(cycleFactor)
        }
        console.log(chalk.keyword('orange')('✘ Error: Timeout Exceeded: 30000ms exceeded', 'warning'))
        return resolve(false)
    })
}

/**
 * @param    {Object}   page [browser实例Page]
 * @return   {Boolean}       [页面是否加载完毕]
 */
const isLoadingFinished = (page) => {
    return page.evaluate(() => {
        // document.readyState: loading / 加载；interactive / 互动；complete / 完成
        return document.readyState === 'complete' 
    })
}
