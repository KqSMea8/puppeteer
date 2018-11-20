const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
    const browser = await (puppeteer.launch({ headless: true}));
    const page = await browser.newPage();
    //进入页面
    await page.goto('http://music.163.com/#');

    //点击搜索框拟人输入
    const musicName = '我梦见你梦见我'
    await page.type('.txt.j-flag', musicName, {delay: 0});

    //模拟键盘按下'Enter'，mac上组合键无效
    await page.keyboard.press('Enter');

    //页面等待
    await page.waitFor(2000);

    //page.frames() 获取当前页面所有的 iframe 然后精确获取到iframe名字为'contentFrame'
    let iframe = await page.frames().find(f=>f.name() === 'contentFrame');
    //获取 iframe 中的某个元素：搜索后歌曲列表
    const SONG_LS_SELECTOR = await iframe.$('.srchsongst');

    //获取歌曲地址
    // iframe.evaluate() 在浏览器中执行函数，相当于在控制台中执行函数，返回一个 Promise
    // page.evaluate(pageFunction, ...args)后者是要传给pageFunction的参数
    const selectedSongHref = await iframe.evaluate(e=>{
        //Array.from 将类数组对象转化为数组
        const songList = Array.from(e.childNodes);
        const idx = songList.findIndex(v => v.childNodes[1].innerText.replace(/\s/g, '') === '我梦见你梦见我');

        return songList[idx].childNodes[1].firstChild.firstChild.firstChild.href;
    }, SONG_LS_SELECTOR);

    //进入歌曲页面
    await page.goto(selectedSongHref);

    // 获取歌曲页面嵌套的iframe
    await page.waitFor(2000);
    iframe = await page.frames().find(f => f.name() === 'contentFrame');

    //点击展开按钮
    const unfoldButton = await iframe.$('#flag_ctrl');
    await unfoldButton.click();

    //获取歌词
    const LYRIC_SELECTOR = await iframe.$('#lyric-content');
    const lyricCtn = await iframe.evaluate(e => {
        return e.innerText;
    }, LYRIC_SELECTOR);

    // 截图
    await page.screenshot({
        path: 'song.png',
        fullPage: true,
    });

    // 写入文件
    let writerStream = fs.createWriteStream('lyric.txt');
    writerStream.write(lyricCtn, 'UTF8');
    writerStream.end();

    // 获取评论数量
    // iframe.$eval() 相当于在 iframe 中运行 document.queryselector 获取指定元素，并将其作为第一个参数传递

    const commentCount = await iframe.$eval('.sub.s-fc3', e => e.innerText);
    console.log(commentCount);

    // 获取评论
    const commentList = await iframe.$$eval('.itm', elements => {
        const ctn = elements.map(v => {
            return v.innerText.replace(/\s/g, '');
        });
        return ctn;
    });
    console.log(commentList);

})();

