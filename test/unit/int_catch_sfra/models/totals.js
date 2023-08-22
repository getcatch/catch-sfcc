'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../mocks/mockModuleSuperModule');
var StringUtils = require('../../../mocks/dw/util/StringUtils');
var Money = require('../../../mocks/dw/value/Money');
var constants = require('../../../../cartridges/int_catch/cartridge/scripts/catch/constants');
var Collection = require('../../../mocks/dw/util/Collection');
var LoggerMock = require('../../../mocks/dw/system/Logger');
var ResourceMock = require('../../../mocks/dw/web/Resource');
var CatalogMgrMock = require('../../../mocks/dw/catalog/CatalogMgr');
var SiteMock = require('../../../mocks/dw/system/Site');
var ProductMgrMock = require('../../../mocks/dw/catalog/ProductMgr');
var SiteMockObj = new SiteMock();
var ProductMgrMockObj = new ProductMgrMock();

var catchserviceHelper = proxyquire('../../../../cartridges/int_catch/cartridge/scripts/catch/services/serviceHelper', {
    'dw/system/Logger': LoggerMock,
    'dw/web/Resource': ResourceMock,
    'dw/util/StringUtils': StringUtils,
    'dw/catalog/CatalogMgr': CatalogMgrMock,
    'dw/catalog/ProductMgr': ProductMgrMockObj
});

var catchHelper = proxyquire('../../../../cartridges/int_catch/cartridge/scripts/catch/helper/catchHelper', {
    'dw/system/Site': SiteMockObj,
    '*/cartridge/scripts/catch/services/serviceHelper': catchserviceHelper,
    '*/cartridge/scripts/catch/helper/configHelper': {
        getCustomConfigValue: function () { return null; }
    }
});

require('../../../mocks/dw/globals');

var BaseTotalsModelMock = function (lineItemContainer) {
    var parentOutputMock = lineItemContainer.parentOutputMock || {};
    for (var key in parentOutputMock) { // eslint-disable-line
        this[key] = JSON.parse(JSON.stringify(parentOutputMock[key]));
    }
};

var createTestBasket = function (priceAdjustmentsArray, productLineItemsArray) {
    var basePrice = new Money(100, 'USD');
    var priceWithAdjustments = priceAdjustmentsArray.reduce(
        function (currentPrice, adjustment) {
            return currentPrice.add(adjustment.getPrice());
        },
        basePrice);

    return {
        basePrice: basePrice,
        priceWithAdjustments: priceWithAdjustments,
        priceAdjustments: priceAdjustmentsArray,
        getAdjustedMerchandizeTotalPrice: function (considerAdjustments) {
            return considerAdjustments ? priceWithAdjustments : basePrice;
        },
        getPriceAdjustmentByPromotionID: function (id) {
            return priceAdjustmentsArray.find(function (item) { return item.promotionID === id; });
        },
        parentOutputMock: {
            orderLevelDiscountTotal: {
                value: 999,
                formatted: '$999'
            }
        },
        allProductLineItems: Collection.createFromArray(productLineItemsArray || [])
    };
};

function getPriceAdjustments(adjustmentToAdd) {
    var priceAdjustments = [{
        UUID: 10987654321,
        calloutMsg: 'some call out message',
        basedOnCoupon: false,
        price: new Money(-10, 'USD'),
        lineItemText: 'someString',
        promotion: { calloutMsg: 'some call out message' },
        getPrice: function () {
            return this.price;
        }
    }];

    if (adjustmentToAdd) {
        priceAdjustments.push(adjustmentToAdd);
    }

    return priceAdjustments;
}

var rewardsPriceAdjustment = {
    UUID: 10987654324,
    calloutMsg: 'price adjustment without promotion msg',
    basedOnCoupon: false,
    price: new Money(-5, 'USD'),
    lineItemText: 'Rewards adjustment value',
    promotionID: 'catch_rewardsAdjustment',
    getPrice: function () {
        return this.price;
    }
};

var productLineItemsArray = [{
    productName: 'name',
    productID: 'ID',
    quantityValue: 1,
    adjustedPrice: new Money(100, 'USD'),
    product: {
        getImages: function () {
            return [{ absURL: 'url' }];
        }
    }
}];

describe('totals model', function () {
    var TotalsModel;

    before(function () {
        mockSuperModule.create(BaseTotalsModelMock);
        TotalsModel = proxyquire('../../../../cartridges/int_catch_sfra/cartridge/models/totals',
            {
                'dw/util/StringUtils': StringUtils,
                'dw/value/Money': Money,
                '*/cartridge/scripts/catch/constants': constants,
                '*/cartridge/scripts/catch/helper/catchHelper': catchHelper,
                '*/cartridge/scripts/catch/services/serviceHelper': catchserviceHelper
            }
        );
    });

    after(function () {
        mockSuperModule.remove();
    });

    describe('appliedRewards', function () {
        it('should add \'appliedRewards\' property to totals with appliedRewards price adjustment amount', function () {
            var basketPriceAdjustmentsWithRewards = getPriceAdjustments(rewardsPriceAdjustment);
            var lineItemContainer = createTestBasket(basketPriceAdjustmentsWithRewards);
            var result = new TotalsModel(lineItemContainer);
            assert.equal(result.appliedRewards, '$-5');
        });

        it('should not add \'appliedRewards\' property to totals if there is no appliedRewards price adjustment', function () {
            var lineItemContainer = createTestBasket([]);
            var result = new TotalsModel(lineItemContainer);
            assert.isFalse(Object.hasOwnProperty.call(result, 'appliedRewards'));
        });

        it('should exclude \'appliedRewards\' price adjustment during orderLevelDiscountTotal calculation', function () {
            var basketPriceAdjustmentsWithRewards = getPriceAdjustments(rewardsPriceAdjustment);
            var lineItemContainer = createTestBasket(basketPriceAdjustmentsWithRewards);
            var result = new TotalsModel(lineItemContainer);
            assert.equal(result.orderLevelDiscountTotal.value, 10);
            assert.equal(result.orderLevelDiscountTotal.formatted, '$10');
        });

        it('should not overwrite \'orderLevelDiscountTotal\' property if there is no appliedRewards price adjustment', function () {
            var lineItemContainer = createTestBasket([]);
            var result = new TotalsModel(lineItemContainer);
            assert.equal(result.orderLevelDiscountTotal.value, 999);
            assert.equal(result.orderLevelDiscountTotal.formatted, '$999');
        });
    });

    describe('catchItems', function () {
        it('should not add \'catchItems\' property to totals if Catch is not enabled', function () {
            SiteMockObj.preferences.custom.catch_enable = false;
            var lineItemContainer = createTestBasket([]);
            var result = new TotalsModel(lineItemContainer);
            assert.isFalse(Object.hasOwnProperty.call(result, 'catchItems'));
        });

        it('should add \'catchItems\' property with items data to totals if Catch is enabled', function () {
            SiteMockObj.preferences.custom.catch_enable = true;
            var lineItemContainer = createTestBasket([], productLineItemsArray);
            var result = new TotalsModel(lineItemContainer);
            assert.isTrue(Object.hasOwnProperty.call(result, 'catchItems'));
            var catchItems = JSON.parse(result.catchItems);
            assert.isString(result.catchItems);
            assert.equal(catchItems[0].name, 'name');
            assert.equal(catchItems[0].sku, 'ID');
            assert.equal(catchItems[0].quantity, 1);
            assert.equal(catchItems[0].price.amount, 10000);
            assert.equal(catchItems[0].price.currency, 'USD');
            assert.equal(catchItems[0].image_url, 'url');
            assert.deepEqual(catchItems[0].category, [['parentCategoryName', 'childCategoryName']]);
        });
    });
});
