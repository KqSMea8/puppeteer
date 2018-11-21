const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
    })

    const page = await browser.newPage();

    await page.setViewport({width: 1920, height:600});

    const viewport = page.viewport();

    console.log(viewport)
    await page.goto('https://nodejs.org/dist/latest-v10.x/docs/api/');
    
    // await page.waitFor(1000);
    // 建议使用waitForNavigation, 1000不太靠谱（网速慢的时候会崩）

    console.log('before')

    await page.waitFor(1000);

    // await page.waitForNavigation({
    //     // 20秒超时时间
    //     timeout: 20000,
    //     // 不再有网络连接时判定页面跳转完成
    //     waitUntil: [
    //       'domcontentloaded',
    //       'networkidle0',
    //     ],
    // });
  
    console.log('open')
    // 确定内滚动的父元素选择器
    const containerEle = '#column2';
    // 确定目标元素选择器
    const targetEle = '#column2 ul:nth-of-type(2) li:nth-of-type(40)';

    //获取目标元素在当前视窗内的坐标
    let pos = await getElementBounding(page, targetEle);

    console.log(pos);

    // 使用内置的DOM选择器
    const ret = await page.evaluate(async (viewport, pos, element) => {
        // 判断目标元素是否在当前可视范围内
        const sumX = pos.width + pos.left; //目标元素最右边距离当前视窗最左的距离
        const sumY = pos.height + pos.top; //目标元素最底边距离当前视窗最顶的距离

        // X轴和Y轴各需要移动的距离
        const x = sumX <= viewport.width ? 0 : sumX - viewport.width;
        const y = sumY <= viewport.height ? 0 : sumY - viewport.height;

        const el = document.querySelector(element);

        // 将元素滚动进视窗可视范围内

        // 此处需要判断目标元素的x、y是否可滚动，如果元素不能滚动则滚动window

        // 如果scrollWidth值大于clientWidth值，则可以说明其出现了横向滚动条
        if (el.scrollWidth > el.clientWidth) {
            el.scrollLeft += x;
        } else {
            window.scrollBy(x, 0);
        }
  
        // 如果scrollHeight值大于clientHeight值，则可以说明其出现了竖向滚动条
        if (el.scrollHeight > el.clientHeight) {
            el.scrollTop += y;
        } else {
            window.scrollBy(0, y);
        }

        return [el.scrollHeight, el.clientHeight];
    }, viewport, pos, containerEle);

    pos = await getElementBounding(page, targetEle);

    await page.waitFor(1000);
    // await page.waitForNavigation({
    //     timeout: 20000,
    //     waitUntil: [
    //         'domcontentloaded',
    //         'networkidle0'
    //     ]
    // });

    await page.screenshot({
        path: 'scroll_and_bounding.png',
        type: 'png',
        clip: {
            x: pos.left,
            y: pos.top,
            width: pos.width,
            height: pos.height
        }
    });

    await browser.close();
})()

async function getElementBounding(page, element) {
    console.log('[GetElementBounding]:',element);

    //$eval此方法在页面内执行 document.querySelector，然后把匹配到的元素作为第一个参数传给 pageFunction
    //相当于在evaluate的pageFunction内执行document.querySelector(element).getBoundingClientRect()

    // const pos = await page.$eval(element, e=>{
    //     const {left, top, width, height} = e.getBoundingClientRect();
    //     return {left, top, width, height};
    // })
    
    const pos = await page.evaluate(async (element) => {
        const {left, top, width, height} = document.querySelector(element).getBoundingClientRect();
        return {left, top, width, height};
    }, element)
    /**
     * JSON.stringify(value[, replacer [, space]])
     * space:指定缩进用的空白字符串
     */
    console.log('[Element position]: ', JSON.stringify(pos, undefined, 2));
    return pos;
}