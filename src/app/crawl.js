const puppeteer = require("puppeteer-extra");
const UserAgent = require("user-agents");

//stealth plugin to be undetectable
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

//Random user agent for browser for stealth
const userAgent = new UserAgent();

const crawl =  async (Keywords , location) => {
    try {
        const browser = await puppeteer.launch({
            headless: false,
            args: [
                "p.webshare.io:9999",
                "--user-agent=" + userAgent + "",
            ],
        });

        const page = await browser.newPage();

        await page.goto("https://cse.google.com/cse?cx=647e649a514ea4d50");

        //typing in google search bar
        await page.type("#gsc-i-id1", `${Keywords} ${location}`);
        
        //clicking search button 
        await page.click(".gsc-search-button .gsc-search-button-v2");

        //array that contains extracted emails
        let x = [];

        await page.waitForSelector(".gsc-webResult .gsc-result");

        //checking if page exsit
        const divs = await page.$$(".gsc-cursor div");
        if(divs.length === 0){
            browser.close();
            return [];
        }

        //getting pages count
        const pageCount = await page.$$eval(
            ".gsc-cursor div",
            (allDivs) => allDivs[allDivs.length - 1].innerText
        );


        //  clicking browser bottom navigation buttons
        for(let pageToClick = 2; pageToClick <= pageCount ; pageToClick++){
            console.log("scraping page : " + pageToClick);
            //extracting inner text from result search result element
            const searchResultElement = await page.$$eval(
                ".gsc-webResult .gsc-result .gsc-table-result .gsc-table-cell-snippet-close gs-bidi-start-align .gs-snippet",
                (allAs) => allAs.map((a) => innerText)
            );
                
            const searchResultElementRef = await page.$$eval(
                ".gsc-webResult .gsc-result .gsc-thumbnail-inside div a",
                (allAs) => allAs.map((a) => a.href)
            );

            //email regex
            const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

            // Extracting emails and adding href 
            const extractedEmails = searchResultElement.flatMap((text, index) => {
                const matches = text.match(emailRegex);
                if(matches) {
                    return matches.map((match) => ({
                        source: searchResultElementRef[index],
                        email: match,  
                    }));
                }
                return [];
            });

            console.log(extractedEmails);

            //waiting for the "next" button to appear
            await page.waitForSelector(".gsc-cursor");
            const pageSelector = `.gsc-cursor-page:nth-child(${pageToClick})`;

            //adding email to emails array
            x = x.concat(extractedEmails);
            await page.waitForTimeout(3000);

            // checking if the page is empty we close browser
            // const elements = await page.$$(".gsc-cursor, " + pageSelector);
            
            // if(elements.length === 0) {
            //console.log("Element not found. Closing the bprwser.");
            // await browser.close();
            // }

            //clicking on navigation button
            await page.click(pageSelector);
        }

            // console.log(extractedData);
            const extractedData = x.reduce((result, item) => {
                const matches = item.email(/@([^\.]*)\./);
                console.log(matches);
                if(matches) {
                    const companyName = matches[1];
                    result.push({
                        email: item.email,
                        companyName: companyName,
                        source: item.source,
                    });
                }
                return result;
            }, []);

            //console.log(extractedData);

            //closing browser 
            browser.close();

            //Filtering Unique emails
            const unique = extractedData.filter((obj, index) => {
                return index === extractedData.findIndex((o) => obj.email === o.email);
            });

            console.log(unique);
            return unique;

    } catch (error) {
        return [];
    }
};

crawl("mail on recrute développeur web", "Tunisie") ;

module.exports = crawl; 
