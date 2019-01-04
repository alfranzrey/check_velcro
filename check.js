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
        page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36');
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

        //-------------gather all the links
        var maxTabCount = 9;
        var curPageCount = 0;
        var iteration = -1;
        var subLinkCount = 0;
        var subLinks = []; //all links
        var tempLinks = [];
        //populate all sublinks
        for(var i = 0; i < csvData.length; i++){
            iteration++;
            if(iteration == maxTabCount){
                subLinks.push(tempLinks);
                subLinkCount++;
                iteration = 0; 
                tempLinks = [];                  
            }
            tempLinks[iteration]="https://www.amazon.com/dp/"+csvData[i]; //display what is added
            if(i+1 == csvData.length){
                subLinks.push(tempLinks);   
            }
        }
        //--------------------
  
        //--------display in mutiple tabs by batch
        for(var x = 0; x <= subLinkCount; x++){
            var startT = new Date();//for ETC
            await Promise.all(subLinks[x].map(async(link) =>{
                var forbiddenWord = "velcro";
                var velcrofound = 0;
                var status = "";
                var asin = link.slice(26,36);
                try{
                    const curPage = await browser.newPage();
                    await curPage.goto(link);
                    curPageCount++;
                    //-code starts here
                    if (await curPage.$('#productTitle') !== null){
                        var title = await curPage.evaluate(() => document.querySelector('#productTitle').innerText);
                        var description = "";
                        var bullets = "";
                        //handle bullets
                        if (await curPage.$('#featurebullets_feature_div') !== null){
                            bullets = await curPage.evaluate(() => document.querySelector('#featurebullets_feature_div').innerText);
                        }
                        else{
                            bullets = "";
                        }
                        
                        //handle desc
                        if (await curPage.$('#productDescription > p') !== null){
                            description = await curPage.evaluate(() => document.querySelector('#productDescription > p').innerText);
                        }
                        else{
                            if (await curPage.$('#dpx-aplus-3p-product-description_feature_div') !== null){
                                description = await curPage.evaluate(() => document.querySelector('#dpx-aplus-3p-product-description_feature_div').innerText);   
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
                    curPage.close();
                    curPageCount--;
                }
                catch(err){
                    curPage.close();
                    curPageCount--;
                }
                //write
                let row = {
                    'ASIN':asin,
                    'Status':status
                }
                exportToCSV.write(objToString(row) + '\n','utf-8');
                console.log(objToString(row)); 
                //end write
            }));//end promise  
            var endT = new Date() - startT; //for ETC
            ETC(endT, subLinkCount-x-1);   
        }//end for
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





    

