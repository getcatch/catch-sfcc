'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Variation', function (req, res, next) {
    var viewData = res.getViewData();

    if (viewData.error) {
        res.setViewData(viewData);
        return next();
    }

    var ProductMgr = require('dw/catalog/ProductMgr');
    var variationProduct = ProductMgr.getProduct(viewData.product.id);

    viewData.isVisibleCallout = !variationProduct.custom.catch_ineligible;
    res.setViewData(viewData);
    return next();
});

module.exports = server.exports();
