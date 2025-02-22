const puppeteer = require('puppeteer');
const fs = require('fs');

function workWithReadyData(json) {
    let jsonParse = JSON.parse(json);
    for (let key of jsonParse.props.pageProps.initialStore.catalogPage.products) {
        let finalPrice = '';
        let siteSizeRegExp = /<SIZE>/g;
        key.oldPrice == 0 ? finalPrice = 'Цена: ' + key.price : finalPrice = 'Акционная цена: ' + key.price;
        let response = 'Название товара: '+ key.name + '\n' 
        + 'Ссылка на изображение: ' + (key.images[0].url).replace(siteSizeRegExp,'x300') + '\n' 
        + 'Рейтинг: ' + key.rating + '\n'
        + 'Количество отзывов: '+ key.reviews + '\n'
        + finalPrice + '\n' 
        + 'Цена до акции: ' + key.oldPrice + '\n'
        + 'Размер скидки: ' + key.discount + '\n\n';
        fs.appendFileSync('products-api.txt', response);
    }
}

function getJSON(html) {
    const regex = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/gm;
    const json = html.match(regex);
    if (json) {
        let jsonFinished = json[0].replace(`<script id="__NEXT_DATA__" type="application/json">`, '');
        jsonFinished = jsonFinished.replace('</script>', '');
        workWithReadyData(jsonFinished);
    } else {
        console.log('Совпадений не найдено');
    }
}

const resultPromise = (async () => {
    try {
        const args = process.argv.slice(2);
        if (args.length < 1) {
            console.error('Необходимо указать ссылку на страницу.');
            process.exit(1);
        }
        const productUrl = args[0];
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(productUrl, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 10000));
        await page.goto(productUrl, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 10000));
        const htmlContent = await page.content();
        await browser.close();
        return htmlContent;
    } catch (error) {
        console.error('Произошла ошибка:', error);
    }
})();
resultPromise.then(result => {
    getJSON(result);
});