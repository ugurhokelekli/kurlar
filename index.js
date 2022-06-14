import fs from "fs";
import readline from "readline";
import xml2json from "xml2json";
import fetch from "node-fetch";
import clear from "./clear.js";

const COUNT_OF_YEARS_WILL_FETCH = 11;
const ONE_DAY_IN_MILLISECONDS = 86400000;

const today = new Date();

const fetchedSuccesfullyDates = [];

const start = async function (date) {
  let TWO_DIGITS_DAY =
    date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
  let TWO_DIGITS_MONTH =
    date.getMonth() + 1 < 10
      ? "0" + (date.getMonth() + 1)
      : date.getMonth() + 1;
  let TMP_YEAR_AND_TWO_DIGITS_MONTH =
    date.getFullYear().toString() + TWO_DIGITS_MONTH.toString();
  let TMP_YEAR_AND_TWO_DIGITS_MONTH_AND_TWO_DIGITS_DAY =
    TWO_DIGITS_DAY.toString() +
    TWO_DIGITS_MONTH.toString() +
    date.getFullYear().toString();
  let url =
    "https://www.tcmb.gov.tr/kurlar/" +
    TMP_YEAR_AND_TWO_DIGITS_MONTH +
    "/" +
    TMP_YEAR_AND_TWO_DIGITS_MONTH_AND_TWO_DIGITS_DAY +
    ".xml?_=1654922934456";

  const result = await fetch(url, {
    credentials: "include",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:100.0) Gecko/20100101 Firefox/100.0",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.5",
      "X-Requested-With": "XMLHttpRequest",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "Sec-GPC": "1",
    },
    referrer: "https://www.tcmb.gov.tr/kurlar/kurlar_tr.html",
    method: "GET",
    mode: "cors",
  }).then((res) =>
    res.text().then((text) => {
      if (res.status == 200) {
        const currencies = JSON.parse(xml2json.toJson(text))["Tarih_Date"][
          "Currency"
        ];
        fetchedSuccesfullyDates.push({
          fileName: TMP_YEAR_AND_TWO_DIGITS_MONTH_AND_TWO_DIGITS_DAY.toString(),
          millisecondsOfDate: date.getTime(),
        });
        fs.writeFile(
          "output_" +
            TMP_YEAR_AND_TWO_DIGITS_MONTH_AND_TWO_DIGITS_DAY +
            ".json",
          JSON.stringify(currencies),
          (err) => {
            if (err) throw err;
          }
        );
      } else {
        let dateOfBackOfOneDayFromCurrentDate = new Date(
          date.getTime() - ONE_DAY_IN_MILLISECONDS
        );
        start(dateOfBackOfOneDayFromCurrentDate);
      }
    })
  );
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Ayı giriniz(1-12): ", (monthInput) => {
  rl.question("Günü giriniz(1-31): ", (dayInput) => {
    if (
      monthInput > 12 ||
      monthInput < 1 ||
      dayInput > 31 ||
      dayInput < 1 ||
      isNaN(monthInput) ||
      isNaN(dayInput)
    ) {
      console.log("Hatalı giriş yaptınız.");
      process.exit(1);
    } else {
      console.log("Lütfen bekleyiniz...");
      if (monthInput <= today.getMonth() + 1) {
        for (let i = 0; i < COUNT_OF_YEARS_WILL_FETCH; i++) {
          let tmpDate = new Date(
            today.getFullYear() - i,
            monthInput - 1,
            dayInput
          );
          start(tmpDate);
        }
      } else {
        for (let i = 0; i < COUNT_OF_YEARS_WILL_FETCH; i++) {
          let tmpDate = new Date(
            today.getFullYear() - 1 - i,
            monthInput - 1,
            dayInput
          );
          start(tmpDate);
        }
      }
    }
  });
});

const mostIncreasingCurrencies = [];

setTimeout(() => {
  fetchedSuccesfullyDates.sort((a, b) =>
    a.millisecondsOfDate > b.millisecondsOfDate ? 1 : -1
  );

  for (let i = 1; i < fetchedSuccesfullyDates.length; i++) {
    let lastCurrencies = JSON.parse(
      fs.readFileSync(`output_${fetchedSuccesfullyDates[i - 1].fileName}.json`)
    );
    let currentCurrencies = JSON.parse(
      fs.readFileSync(`output_${fetchedSuccesfullyDates[i].fileName}.json`)
    );
    for (let j = 0; j < lastCurrencies.length; j++) {
      if (
        currentCurrencies[j].ForexBuying - lastCurrencies[j].ForexBuying >
        0
      ) {
        let ratio =
          ((currentCurrencies[j].ForexBuying - lastCurrencies[j].ForexBuying) /
            lastCurrencies[j].ForexBuying) *
          100;

        mostIncreasingCurrencies.push({
          year: new Date(
            fetchedSuccesfullyDates[i].millisecondsOfDate
          ).getFullYear(),
          currencyCode: lastCurrencies[j].CurrencyCode,
          ratio: ratio,
        });
      } else if (
        currentCurrencies[j].ForexBuying - lastCurrencies[j].ForexBuying <=
        0
      ) {
        let ratio =
          ((lastCurrencies[j].ForexBuying - currentCurrencies[j].ForexBuying) /
            lastCurrencies[j].ForexBuying) *
          100;

        mostIncreasingCurrencies.push({
          year: new Date(
            fetchedSuccesfullyDates[i].millisecondsOfDate
          ).getFullYear(),
          currencyCode: lastCurrencies[j].CurrencyCode,
          ratio: -ratio,
        });
      }
    }
  }

  fs.writeFile(
    "result.json",
    JSON.stringify(mostIncreasingCurrencies),
    (err) => {
      if (err) throw err;
    }
  );
}, 13000);

setTimeout(() => {
  fs.writeFile(
    "result.json",
    JSON.stringify(
      JSON.parse(fs.readFileSync("result.json")).sort((a, b) =>
        a.year == b.year && a.ratio > b.ratio ? -1 : 1
      )
    ),
    (err) => {
      if (err) throw err;
    }
  );
}, 14000);

setTimeout(() => {
  let finalCurrencies = [];
  let tmpJson = JSON.parse(fs.readFileSync("result.json"));

  finalCurrencies.push(tmpJson[0]);

  for (let i = 1; i < tmpJson.length; i++) {
    if (tmpJson[i].year !== tmpJson[i - 1].year) {
      finalCurrencies.push(tmpJson[i]);
    }
  }
  fs.writeFile("final.json", JSON.stringify(finalCurrencies), (err) => {
    if (err) throw err;
  });
}, 16000);

setTimeout(() => {
  let tmpJson = JSON.parse(fs.readFileSync("final.json"));
  let finalResult = "";
  tmpJson.forEach((e) => {
    finalResult += `${e.year} ${e.currencyCode} %${e.ratio.toFixed(2)}\n`;
  });
  fs.writeFileSync("final.md", finalResult);
  console.log(
    `Girmiş olduğunuz gün ve ay bilgilerine göre, geçtiğimiz 10 yılda, bir yıl içinde TL cinsinden en fazla artış/en az azalış gösteren para birimleri, yüzdeleri ile birlikte aşağıda listelenmiştir:`
  );
  console.table(finalResult);
  clear();
  process.exit(0);
}, 17000);
