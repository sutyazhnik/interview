const puppeteer = require('puppeteer');
const fs = require('fs');
(async () => {
  try {
    const args = process.argv.slice(2);
    if (args.length < 2) {
      console.error('Необходимо указать ссылку на товар и регион.');
      process.exit(1);
    }
    const productUrl = args[0];
    const locationUser = args[1];

    const browser = await puppeteer.launch({headless: false,});
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(productUrl, { waitUntil: 'networkidle2' });

    await new Promise(resolve => setTimeout(resolve, 10000));
    await page.click('xpath=//div[@class="Region_region__6OUBn"]');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.click(`text=${locationUser}`);

    await new Promise(resolve => setTimeout(resolve, 5000));
    const productData = await page.evaluate(() => {
      const regularPrice = document.querySelector('.Price_price__QzA8L.Price_size_XL__MHvC1.Price_role_regular__X6X4D');
      const priceElement = document.querySelector('.Price_price__QzA8L.Price_size_XL__MHvC1.Price_role_discount__l_tpE');
      const oldPriceElement = document.querySelector('.Price_price__QzA8L.Price_size_XS__ESEhJ.Price_role_old__r1uT1');
      const regular = regularPrice ? (regularPrice.textContent.trim()).replace(/[^0-9.,]/g, '') : '';
      const price = priceElement ? (priceElement.textContent.trim()).replace(/[^0-9.,]/g, '') : '';
      const oldPrice = oldPriceElement ? (oldPriceElement.textContent.trim()).replace(/[^0-9.,]/g, '') : '';
      let parentDiv = document.querySelector('div.Summary_reviewsContainer__qTWIu');
      let ratingElement;
      if (parentDiv) {
        ratingElement = parentDiv.querySelector('.Summary_title__lRoWU');
      }
      const rating = ratingElement ? ratingElement.textContent.trim() : '';

      parentDiv = document.querySelector('div.ActionsRow_reviewsWrapper__D7I6c');
      let reviewsElement;
      if (parentDiv) {
        reviewsElement = parentDiv.querySelector('.ActionsRow_reviews__AfSj_');
      }
      const reviewsCount = reviewsElement ? parseInt(reviewsElement.textContent.trim()) : '';
      console.log(reviewsCount)
      return {
        regular,
        price,
        oldPrice,
        rating,
        reviewsCount
      };
    });

    await page.screenshot({ path: 'screenshot.jpg', fullPage: true });
    
    const outputText = `price=${productData.regular ? productData.regular : productData.price}\n` 
    + 'priceOld='+productData.oldPrice + '\n'
    + 'rating='+ productData.rating + '\n'
    + 'reviewCount=' + productData.reviewsCount;
    fs.writeFileSync('product.txt', outputText);

    await browser.close();
    console.log('Скрипт успешно завершен. Скриншот сохранен как screenshot.jpg, данные записаны в product.txt.');
  } catch (error) {
    console.error('Произошла ошибка:', error.message);
  }
})();
