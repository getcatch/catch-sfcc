'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../mocks/mockModuleSuperModule');

var BaseOrderModelMock = function () {
    this.resources = {};
    this.custom = {};
};

function createApiBasket() {
    return {
        custom: {
            catch_checkoutId: 'ch-4561-4568',
            catch_purchaseId: 'pch-45687891',
            catch_earned: '2500'
        },
        totalGrossPrice: {
            value: 456
        }
    };
}

var config = {
    numberOfLineItems: '*'
};

describe('Order', function () {
    var Order = null;

    before(function () {
        mockSuperModule.create(BaseOrderModelMock);
        Order = proxyquire('../../../../cartridges/int_catch_sfra/cartridge/models/order',
            {
                'dw/web/Resource': require('../../../mocks/dw/web/Resource'),
                '*/cartridge/models/address': {},
                '*/cartridge/models/billing': {},
                '*/cartridge/models/payment': {},
                '*/cartridge/models/productLineItems': {},
                '*/cartridge/models/totals': {},
                '*/cartridge/scripts/checkout/checkoutHelpers': {},
                '*/cartridge/scripts/checkout/shippingHelpers': {},
                '*/cartridge/scripts/catch/helper/configHelper': {}
            }
        );
    });

    after(function () {
        mockSuperModule.remove();
    });

    it('should handle null parameters', function () {
        var result = new Order(null, null);
        assert.equal(result.resources.catch.paymentMethod, 'Catch');
        assert.isFalse(Object.hasOwnProperty.call(result.custom, 'catch'));
    });

    it('should handle Catch attributes', function () {
        var result = new Order(createApiBasket(), config);
        assert.equal(result.resources.catch.paymentMethod, 'Catch');
        assert.deepEqual(result.catch, {
            catch_checkoutId: 'ch-4561-4568',
            catch_purchaseId: 'pch-45687891',
            catch_earned: '2500',
            priceTotalInCents: '45600'
        });
    });
});
