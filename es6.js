const puppeteer = require('puppeteer');

puppeteer.launch({
        // page.pdf working on headless only
        // headless: false
    }).then(
        async browser => {
            let page = await browser.newPage();
    
            await page.goto('http://es6.ruanyifeng.com/#README');

            await page.waitFor(2000);

            let aTags = await page.evaluate(() => {
                let as = [...document.querySelectorAll('ol li a')];
                return as.map((a) =>{
                    return {
                        href: a.href.trim(),
                        name: a.text
                    }
                });
            });

            console.log('aTags',aTags)

            // 这里也可以使用promise all，但cpu可能吃紧，谨慎操作

            // for (var i = 1; i < aTags.length; i++) {
            //     page = await browser.newPage()

            //     var a = aTags[i];

            //     await page.goto(a.href);

            //     await page.waitFor(2000);

            //     await page.pdf({path: `./es6-pdf/${a.name}.pdf`});

            //     page.close();
            // }

            await page.goto(aTags[3].href);

            // 如果在page go之后马上进行pdf抓取，此时页面还未完成渲染，只能抓到loading图
            await page.waitFor(2000);

            await page.pdf({path: `./es6-pdf/${aTags[3].name}.pdf`});
            console.log(`Pages that have been printed in PDF format is: ${aTags[3].name}`)

            browser.close();
        }
    )