const {TabloBuilder} = require('./typescript/distr/tablo-builder');

let t1 = new TabloBuilder();

let final = t1.setPause('p1').setCenter('c1').finalize();
console.log(final);