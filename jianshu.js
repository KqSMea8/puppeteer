const puppeteer = require('puppeteer');
(async ()=>{
    //puppeteer.launch 启动浏览器实例
    const browser = await(puppeteer.launch({
        //若是手动下载的chromium需要指定chromium地址, 默认引用地址为 /项目目录/node_modules/puppeteer/.local-chromium/
        //executablePath:''
        //设置超时时间
        timeout: 15000,
        //如果是访问https页面 此属性会忽略https错误
        ignoreHTTPSErrors: true,
        //打开开发者工具, 当此值为true时, headless总为false
        devtools: false,
        //关闭headless模式，不会打开浏览器
        headless: false
    }));
    //创建一个新页面
    const page = await browser.newPage();
    //进入指定网页
    await page.goto('https://www.jianshu.com/u/44f4741df63a');
    //截图
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
    browser.close();
})();