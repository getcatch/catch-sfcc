'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var SiteMock = require('../../../../../mocks/dw/system/Site');
var SystemMock = require('../../../../../mocks/dw/system/System');
var LoggerMock = require('../../../../../mocks/dw/system/Logger');
var OrderMgrMock = require('../../../../../mocks/dw/order/OrderMgr');
var BasketMgrMock = require('../../../../../mocks/dw/order/BasketMgr');
var ResourceMock = require('../../../../../mocks/dw/web/Resource');
var ProductMgrMock = require('../../../../../mocks/dw/catalog/ProductMgr');
var constants = require('../../../../../../cartridges/int_catch/cartridge/scripts/catch/constants');
var SiteMockObj = new SiteMock();
var SystemMockObj = new SystemMock();
var OrderMgrMockObj = new OrderMgrMock();
var ProductMgrMockObj = new ProductMgrMock();
var catchserviceHelper = proxyquire('../../../../../../cartridges/int_catch/cartridge/scripts/catch/services/serviceHelper', {
    'dw/system/Logger': LoggerMock,
    'dw/web/Resource': ResourceMock,
    'dw/util/StringUtils': {}
});
var catchHelper = proxyquire('../../../../../../cartridges/int_catch/cartridge/scripts/catch/helper/catchHelper', {
    'dw/system/Logger': LoggerMock,
    'dw/system/Site': SiteMockObj,
    'dw/system/System': SystemMockObj,
    'dw/order/OrderMgr': OrderMgrMockObj,
    'dw/order/BasketMgr': BasketMgrMock,
    'dw/web/Resource': ResourceMock,
    'dw/catalog/ProductMgr': ProductMgrMockObj,
    '*/cartridge/scripts/catch/constants': constants,
    '*/cartridge/scripts/catch/services/serviceHelper': catchserviceHelper,
    '*/cartridge/scripts/catch/helper/configHelper': {
        getCustomConfigValue: function () { return null; }
    }
});

describe('catchHelper module - Test Catch helper functions', function () {
    describe('getPreference(): function gets Catch custom preference value', function () {
        beforeEach(function () {
            SiteMockObj.preferences.custom.catch_enable = true;
            SiteMockObj.preferences.custom.catch_publicKey = 'mUeULKfQSUrANkei8a7RdKPK';
            SiteMockObj.preferences.custom.catch_apiKey = '***********';
            SiteMockObj.preferences.custom.catch_borderStyle = 'pill';
            SiteMockObj.preferences.custom.catch_theme = 'light-color';
            SiteMockObj.preferences.custom.catch_SandboxSDKURL = 'https://js-sandbox.getcatch.com/catchjs/v1/catch.js';
        });

        it('Should return Custom Site preference catch_enable value', function () {
            SiteMockObj.preferences.custom.catch_enable = true;
            assert.isTrue(catchHelper.getPreference('enable'), 'Should be true preference');
            SiteMockObj.preferences.custom.catch_enable = false;
            assert.isNotTrue(catchHelper.getPreference('enable'), 'Should be false preference');
        });
        it('Should return Check Custom Site preference catch_publicKey value', function () {
            assert.equal(catchHelper.getPreference('publicKey'), 'mUeULKfQSUrANkei8a7RdKPK', 'Should be \'mUeULKfQSUrANkei8a7RdKPK\' string');
        });
        it('Should return Custom Site preference catch_apiKey value', function () {
            assert.equal(catchHelper.getPreference('apiKey'), '***********', 'Should be \'***********\' string');
        });
        it('Should return Custom Site preference catch_borderStyle value', function () {
            assert.equal(catchHelper.getPreference('borderStyle'), 'pill', 'Should be \'pill\' string');
        });
        it('Should return Custom Site preference catch_theme value', function () {
            assert.equal(catchHelper.getPreference('theme'), 'light-color', 'Should be \'light-color\' string');
        });
    })

    describe('checkIneligibleProduct(): function checks if product is ineligible', function () {
        var testProducts = {
            'masterProduct': {
                id: '008884303989M',
                type: 'master'
            },
            'bundleProduct': {
                id: 'microsoft-xbox360-bundle',
                type: 'bundle'
            },
            'setProduct': {
                id: 'fall-look',
                type: 'set'
            }
        };

        it('Should return true if master product is ineligible', function () {
            assert.equal(catchHelper.checkIneligibleProduct(testProducts.masterProduct.id, testProducts.masterProduct.type), true, 'Should return true value')
        });
        it('Should return true if bundle product is ineligible', function () {

            assert.equal(catchHelper.checkIneligibleProduct(testProducts.bundleProduct.id, testProducts.bundleProduct.type), true, 'Should return true value')
        });
        it('Should return true if product set is ineligible', function () {
            assert.equal(catchHelper.checkIneligibleProduct(testProducts.setProduct.id, testProducts.setProduct.type), true, 'Should return true value')
        });
    })

    describe('getCatchSDKUrl(): function gets url for Catch SDK depending on current instance mode', function () {
        it('Should return url address value for development instance mode', function () {
            assert.equal(catchHelper.getCatchSDKUrl(), 'https://js-sandbox.getcatch.com/catchjs/v1/catch.js', 'Should be \'https://js-sandbox.getcatch.com/catchjs/v1/catch.js\' string');
        });
    });

    describe('getEarnedRewards(): function gets earned rewards', function () {
        it('Should return earned rewards value', function () {
            var orderNo = 'zzkr00009';
            var orderToken = 'testToken_12345';
            assert.equal(catchHelper.getEarnedRewards(orderNo, orderToken), '100', 'Should be \'100\' string');
        });
        it('Should return null if order number is not passed', function () {
            assert.equal(catchHelper.getEarnedRewards(), null , 'Should be null');
        });
    });

    describe('getNonGiftCertificatePriceTotal(): function gets basket price total subtracted gift certificate amount', function () {
        var testBasket = BasketMgrMock.getCurrentBasket();
        it('Should return basket price total', function () {
            assert.equal(catchHelper.getNonGiftCertificatePriceTotal(testBasket), 250, 'Should be \'250\' number')
        })
    })

    describe('getPriceTotalInCents(): function gets total price of current order in cents', function () {
        var testBasket = BasketMgrMock.getCurrentBasket();
        it('Should return total order value in cents', function () {
            assert.equal(catchHelper.getPriceTotalInCents(testBasket), 25000, 'Should be \'25000\' number');
        });
    });
});
