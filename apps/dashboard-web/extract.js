const fs = require('fs');
const pdf = require('pdf-parse');

const PDF_PATH = 'c:/Users/zion0/Desktop/내 사업/자기 MVP 홍보/상세페이지 만들기 레퍼런스.pdf';
const TXT_PATH = 'c:/Users/zion0/Desktop/내 사업/자기 MVP 홍보/mvp_test/pdf-text.txt';

let dataBuffer = fs.readFileSync(PDF_PATH);
pdf(dataBuffer).then(function (data) {
    fs.writeFileSync(TXT_PATH, data.text);
    console.log("SUCCESS");
}).catch(function (err) {
    console.error("ERROR", err);
});
