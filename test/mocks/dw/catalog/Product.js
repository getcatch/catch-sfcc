var Collection = require('../util/Collection');

var bundledProductsArr = [
    {
        id: 'microsoft-xbox360-console',
        bundle: false,
        custom: {
            catch_ineligible: false
        }
    },
    {
        id: 'easports-fight-night-round-3-xbox360',
        bundle: false,
        custom: {
            catch_ineligible: false
        }
    },
    {
        id: 'rockstar-games-grand-theft-auto-iv-xbox360',
        bundle: false,
        custom: {
            catch_ineligible: true
        }
    }
];

var productSetProductsArr = [
    {
        id: '013742003314 ',
        productSet: false,
        custom: {
            catch_ineligible: false
        }
    },
    {
        id: '25592648 ',
        productSet: false,
        custom: {
            catch_ineligible: true
        }
    },
    {
        id: '25698039',
        productSet: false,
        custom: {
            catch_ineligible: false
        }
    }
];

var categoriesArray = [
    {
        displayName: 'childCategoryName',
        parent: {
            displayName: 'parentCategoryName',
            parent: {
                ID: 'root',
                displayName: 'siteCatalogName'
            }
        }
    }
];

var Product = function (productId) {
    this.id = productId;

    switch (productId) {
        case 'microsoft-xbox360-bundle':
            this.bundle = true;
            this.bundledProducts = Collection.createFromArray(bundledProductsArr);
            break;
        case 'fall-looks':
            this.productSet = true;
            this.productSetProducts = Collection.createFromArray(productSetProductsArr);
            break;
        default:
            this.custom.catch_ineligible = true;
            break;
    }
};

Product.prototype.isBundle = function () {
    return this.bundle;
};

Product.prototype.isProductSet = function () {
    return this.productSet;
};

Product.prototype.getBundledProducts = function () {
    return this.bundledProducts;
};

Product.prototype.getProductSetProducts = function () {
    return this.productSetProducts;
};

Product.prototype.id = null;
Product.prototype.bundle = false;
Product.prototype.productSet = false;
Product.prototype.bundledProducts = null;
Product.prototype.productSetProducts = null;
Product.prototype.custom = {
    catch_ineligible: false
};
Product.prototype.allCategories = Collection.createFromArray(categoriesArray);

module.exports = Product;
