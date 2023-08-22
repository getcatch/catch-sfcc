var Product = require('./Product');

var ProductMgr = function () {};

ProductMgr.prototype.getProduct = function (productId) {
    return new Product(productId);
};

module.exports = ProductMgr;