//set constant variables
const puppeteer = require('puppeteer');
const vo = require('vo');
const fs = require('fs');
const parse = require('csv-parse');
    
//get csv data first
var csvData=[];
fs.createReadStream('asins.csv')
    .pipe(parse({delimiter: ':'}))
    .on('data', function(csvrow) {
        csvData.push(csvrow);        
    })
    .on('end',function() {
    });
//-----------------------
//-export file result
var exportToCSV = fs.createWriteStream('result.txt');
var header ='ASIN'  + '\t' +
            'Status'    + '\n';
console.log(header);
exportToCSV.write(header);
function objToString (obj) {
    var str = '';
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
           str += obj[p] + '\t';
        }
    }
    return str;
}
//-------------------------


//Main async function
(async function main() {
    try{
        //---------------
        //const browser = await puppeteer.launch({headless: true});
        const browser = await puppeteer.launch({executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',headless: false});
        //
        const page = await browser.newPage();
        page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36');
        /*block images and css
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
                    req.abort();
                }
                else {
                    req.continue();
                }
            });
            */
        //-----------------

        //code starts here
        var today = new Date();
        for(var i = 0; i < csvData.length; i++){
            var startT = new Date();
            await page.goto("https://www.amazon.com/dp/"+csvData[i], {waitUntil: 'load', timeout: 0}); //bypass timeout
            //
            await page.waitForSelector('body', {waitUntil: 'load', timeout: 0});
            var forbiddenWord = "velcro";
            var velcrofound = 0;
            var status = "";
            //
            if (await page.$('#productTitle') !== null){
                var title = await page.evaluate(() => document.querySelector('#productTitle').innerText);
                var description = "";
                var bullets = "";
                //handle bullets
                if (await page.$('#featurebullets_feature_div') !== null){
                    bullets = await page.evaluate(() => document.querySelector('#featurebullets_feature_div').innerText);
                }
                else{
                    bullets = "";
                }
                
                //handle desc
                if (await page.$('#productDescription > p') !== null){
                    description = await page.evaluate(() => document.querySelector('#productDescription > p').innerText);
                }
                else{
                    if (await page.$('#dpx-aplus-3p-product-description_feature_div') !== null){
                        description = await page.evaluate(() => document.querySelector('#dpx-aplus-3p-product-description_feature_div').innerText);   
                    }
                    else{
                        description = "";
                    }
                }
                //check velcro
                if(title.toLowerCase().indexOf(forbiddenWord) != -1 || bullets.toLowerCase().indexOf(forbiddenWord) != -1 || description.toLowerCase().indexOf(forbiddenWord) != -1){
                    status = "Velcro found!";
                    //await page.screenshot({path: 'screenshots/Velcro_found_'+ csvData[i] +'-'+today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()+'.png', fullPage: true});
                } 
                else{
                    status = "Good";
                    //await page.screenshot({path: 'screenshots/Good_'+ csvData[i] +'-'+today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()+'.png', fullPage: true});
                }
            }
            else{
                status = "Missing Detail page";
            }

            let row = {
                    'ASIN':csvData[i],
                    'Status':status
                }
            exportToCSV.write(objToString(row) + '\n','utf-8');
            
            console.log(objToString(row)); 
            var endT = new Date() - startT;
            ETC(endT, csvData.length-i-1);
        }
        //end
        console.log("All done!");
        browser.close();
    }
    catch(err){
        console.log("!!!! >>>>>  my error",err);
    }

    function ETC(durationPerLoop, loopsRemaining){
        var etc = durationPerLoop * loopsRemaining;
        var secs = (etc / 1000).toFixed(2);
        var mins = (secs / 60).toFixed(2);
        var hours = (mins / 60).toFixed(2);
        var final_etc = "";
        if (hours >= 1) {
            final_etc = hours + " hour(s)";
        }
        if (hours < 1) {
            final_etc = mins + " min(s)";
        }
        if (mins < 1) {
            final_etc = secs + " sec(s)";
        }
        return console.log("ETC: "+final_etc+'\n');
    }

})();





    

