const puppeteer = require('puppeteer')
// cheerio是nodejs的抓取页面模块，为服务器特别定制的，快速、灵活、实施的jQuery核心实现。适合各种Web爬虫程序。
const cheerio = require('cheerio')
const axios = require('axios')
const chalk = require('chalk')
const mapLimit = require('async/mapLimit')

const $config = require('./pdfConfig.js')

/*
  headless: true 注意产生PDF格式目前仅支持Chrome无头版。 (update@2017-10-25)
  NOTE Generating a pdf is currently only supported in Chrome headless.
  https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagepdfoptions
 */
puppeteer.launch({ headless: true }).then(async browser => {
    let page = await browser.newPage()
    page.setViewport({ width: 1024, height: 2048 })

    page
        .waitForSelector('img')
        .then(async() => {
            executeCrawlPlan(browser, page)
        })

    page.on('error', (error) => {
        console.log(chalk.red('whoops! there was an error'))
        console.log(error)
    })

    page.on('pageerror', (error) => {
        console.log(chalk.red('whoops! there was an pageerror'))
        console.log(error)
    })

    await page.goto($config.targetWebsite)
})

const executeCrawlPlan = async (browser, page) => {
    console.log(chalk.green(`✔ Start crawling all article links...`))
    let numList = await page.evaluate(async() => {
        let pageNumList = [...document.querySelectorAll('#page-nav .page-number')]
        return pageNumList.map(item => item.text);
    })

    // 获取到分页总数目(从左到右，有小到大，所以可以如下处置)
    let totalNum = +numList[numList.length - 1]
    let pageLinkArr = [$config.targetWebsite]
    for (let i = 2; i <= totalNum; i++) {
        pageLinkArr.push(`${$config.targetWebsite}/page/${i}`)
    }

    let articleLinkArr = []
    let statisticsCount = 0
    await pageLinkArr.forEach((item) => {
        // 不懂为啥要这么写
        !(function (citem) {
            getArticleLink(citem).then(result => {
                statisticsCount++
                articleLinkArr = articleLinkArr.concat(result)
                if (statisticsCount === totalNum) {
                    executePrintPlan(browser, articleLinkArr)
                }
            })
        }(item))
        // getArticleLink(item).then(result => {
        //     statisticsCount++
        //     articleLinkArr = articleLinkArr.concat(result)
        //     if (statisticsCount === totalNum) {
        //         executePrintPlan(browser, articleLinkArr)
        //     }
        // })
    })
}

// 获取文章链接
const getArticleLink = (url) => {
  return new Promise((resolve, reject) => {
    return axios.get(url).then((res) => {
        try {
            // 加载html
            let $ = cheerio.load(res.data)
            let aHrefList = []
            console.log(chalk.cyan(`The article has been crawled as follows：`))
            $('#archive-page .post a').each(function (i, e) {
                let item = {
                    href: $(e).attr('href'),
                    title: $(e).attr('title')
                }
                console.log(chalk.white(` ${item.title}: ${item.href}`))
                aHrefList.push(item)
            })
            return resolve(aHrefList)
        } catch (err) {
            console.log('Opps, Download Error Occurred !' + err)
            resolve({})
        }
        }).catch(err => {
        console.log('Opps, Axios Error Occurred !' + err)
        resolve({})
        })
  })
}

const executePrintPlan = async (browser, source) => {
    console.log(chalk.green(`✔ Okay, Start the print operation.`));
    
    /**
     * mapLimit(coll, limit, iteratee, callback opt)
     * coll -- 要迭代的集合
     * limit -- 一次异步操作的最大数量
     * iteratee -- 对于coll中的每一个item，迭代执行该异步函数
     * callback -- 所有iteratee 函数完成后或发生错误时触发的回调函数
     */
    mapLimit(source, 1, async (item) => {
        await waitForTimeout(2 * 1000)
        printPageToPdf(browser, item)
    })
}

let concurrentCount = 0
const printPageToPdf = async (browser, item) => {
    page = await browser.newPage()
    concurrentCount++
    console.log(chalk.magenta(`Now the number of concurrent is: ${concurrentCount}, What is being printed now is:：${item.href}`))
    page.goto($config.targetOrigin + item.href)
    executePrintToPdf(page)
}

const executePrintToPdf = async(page) => {
    if (await isLoadingFinished(page)) {
        await page.waitFor(1000)
        let pageTitle = await page.title()
        await page.pdf({path: `${$config.savePdfPath}${pageTitle}.pdf`})
        console.log(chalk.magenta(`Pages that have been printed in PDF format is: ${pageTitle}`))
        setTimeout(() => {
            page.close()
        }, 1000)
    } else {
        setTimeout(() => {
            executePrintToPdf(page)
        }, 100)
    }
}


const isLoadingFinished = (page) => {
    return page.evaluate(() => {
        // document.readyState: loading / 加载；interactive / 互动；complete / 完成
        return document.readyState === 'complete'
    })
}

// 延迟执行
const waitForTimeout = (delay) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                resolve(true)
            } catch (e) {
                reject(false)
            }
        }, delay)
    })
}