const path = require('path');
const puppeteer = require('puppeteer');

puppeteer.launch({
    //若是手动下载的chromium需要指定chromium地址, 默认引用地址为 /项目目录/node_modules/puppeteer/.local-chromium/
    //executablePath:''
    //设置超时时间
    // timeout: 15000,
    //如果是访问https页面 此属性会忽略https错误
    // ignoreHTTPSErrors: true,
    //打开开发者工具, 当此值为true时, headless总为false
    // devtools: false,
    //关闭headless模式，不会打开浏览器，默认为true
    headless: false,

    //浏览器的配置参数
    //第一个为禁用沙坑
    //第二个属性没有找到
    // args: ['--no-sandbox', '--disable-dev-shm-usage']
}).then(async browser=>{
    const page = await browser.newPage();
    //进入指定网页
    await page.goto('https://www.jianshu.com/u/44f4741df63a');

    /**
     * 截图1
     */
    await page.screenshot({
        path: 'jianshu.png',
        type: 'png',
        // quality: 100,只对 jpg有效
        fullPage: true,
        // 指定区域截图，clip和fullPage两者只能设置一个
        // clip:{
        //     x:0,
        //     y:0,
        //     width:1000,
        //     height:40
        // }
    })

    /**
     * 截图2
     * 针对懒加载采用滚动到底的方式来破解
     */
    await autoScroll(page);
    
    await page.screenshot({
        path: 'auto_scroll.png',
        type: 'png',
        // quality: 100,只对 jpg有效
        fullPage: true,
        // 指定区域截图，clip和fullPage两者只能设置一个
        // clip:{
        //     x:0,
        //     y:0,
        //     width:1000,
        //     height:40
        // }
    })

    /**
     * 截图3
     * 元素精确截图
     */
    //获取元素在视窗内的相对位置
    const pos = await getElementBounding(page, '.main-top');

    await page.screenshot({
        path: 'element_bounding.png',
        type: 'png',
        clip:{
            x: pos.left,
            y: pos.top,
            width: pos.width,
            height: pos.height
        }
    })

    await browser.close();
});

async function autoScroll(page) {
    console.log('[AutoScroll begin]');
    await page.evaluate(async ()=>{
        await new Promise((resolve, reject)=>{
            //页面的当前高度（所有滚动距离相加）
            let totalHeight = 0;
            //每次向下滚动的距离
            let distance = 100;
            //通过setInterval循环执行
            let timer = setInterval(()=>{
                let scrollHeight = document.body.scrollHeight;

                //执行滚动操作
                window.scrollBy(0, distance);

                //如果滚动距离大于当前页面的高度（包括滚动部分）则停止执行
                totalHeight +=distance;

                if (totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            },100);
        });
    });

    console.log('[AutoScroll done]');
}

//获取到元素在视窗内的相对位置
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