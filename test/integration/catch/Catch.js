'use strict';

var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');

function updateCookies(cookieJar, requestObj) {
    var cookieString = cookieJar.getCookieString(requestObj.url);
    var cookie = request.cookie(cookieString);
    cookieJar.setCookie(cookie, requestObj.url);
}

describe('Handle Catch Refund controller', function () {
    this.timeout(50000);
    it('Should be result of refund message', function () {
        var cookieJar = request.jar();

        var myRequest = {
            url: '',
            method: 'GET',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };
        var urlEndPoint = config.baseUrl + '/Catch-Refund';
        myRequest.url = urlEndPoint + '?order=test001&amount=0&refundid=1234';

        return request(myRequest)
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Expected statusCode to be 200');
                assert.equal(response.body.refund, null);
            });
    });
});

describe('Handle Catch CreateCheckout controller', function () {
    this.timeout(50000);
    it('Should return json with information', function () {
        var cookieJar = request.jar();
        var myRequest = {
            url: '',
            method: 'POST',
            resolveWithFullResponse: true,
            rejectUnauthorized: false,
            form: {},
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };
        var variantPid1 = '701644033675M';
        var qty1 = 2;
        var addProd = '/Cart-AddProduct';

        // Step 1: adding product to Cart
        myRequest.url = config.baseUrl + addProd;
        myRequest.form = {
            pid: variantPid1,
            quantity: qty1
        };

        return request(myRequest)
            .then(function (addToCartResponse) {
                assert.equal(addToCartResponse.statusCode, 200, 'Expected add to Cart request statusCode to be 200.');
                // Step 2: get cookies, Generate CSRF, then set cookies
                updateCookies(cookieJar, myRequest);
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                return request(myRequest);
            })
            .then(function (tokenResponse) {
                assert.equal(tokenResponse.statusCode, 200, 'Unable to generate CSRF token before log in');
                var csrfJsonResponse = JSON.parse(tokenResponse.body);
                // Step 3: Added guest customer
                myRequest.url = config.baseUrl + '/CheckoutServices-SubmitCustomer';
                myRequest.form = {
                    dwfrm_coCustomer_email: 'test.email@mail.com',
                    csrf_token: csrfJsonResponse.csrf.token
                };
                updateCookies(cookieJar, myRequest);
                return request(myRequest);
            })
            .then(function (submitCustomerResponse) {
                assert.equal(submitCustomerResponse.statusCode, 200, 'Expected added guest customer call to return status code 200');
                // Step 4: get cookies, Generate CSRF, then set cookies
                updateCookies(cookieJar, myRequest);
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                assert.equal(csrfResponse.statusCode, 200, 'Unable to generate CSRF token');
                var csrfJsonResponse = JSON.parse(csrfResponse.body);
                // Step 5 : submit shipping request to update basket with necessary custom data
                myRequest.url = config.baseUrl + '/CheckoutShippingServices-SubmitShipping?';
                myRequest.form = {
                    originalShipmentUUID: '7d7d6054d025074b7f9b0ac4a2',
                    shipmentUUID: '7d7d6054d025074b7f9b0ac4a2',
                    shipmentSelector: 'new',
                    dwfrm_shipping_shippingAddress_addressFields_firstName: 'Tyler',
                    dwfrm_shipping_shippingAddress_addressFields_lastName: 'Durden',
                    dwfrm_shipping_shippingAddress_addressFields_address1: '2495 Midway Rd',
                    dwfrm_shipping_shippingAddress_addressFields_address2: '',
                    dwfrm_shipping_shippingAddress_addressFields_country: 'US',
                    dwfrm_shipping_shippingAddress_addressFields_states_stateCode: 'TX',
                    dwfrm_shipping_shippingAddress_addressFields_city: 'Carrollton',
                    dwfrm_shipping_shippingAddress_addressFields_postalCode: '75006-2503',
                    dwfrm_shipping_shippingAddress_addressFields_phone: '8554233729',
                    dwfrm_shipping_shippingAddress_shippingMethodID: 1,
                    dwfrm_shipping_shippingAddress_giftMessage: '',
                    csrf_token: csrfJsonResponse.csrf.token
                };
                updateCookies(cookieJar, myRequest);
                return request(myRequest);
            })
            .then(function (submitShippingResponse) {
                assert.equal(submitShippingResponse.statusCode, 200, 'Expected submit shipping call to return status code 200');
                // Step 6: get cookies, Generate CSRF, then set cookies
                updateCookies(cookieJar, myRequest);
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                assert.equal(csrfResponse.statusCode, 200, 'Unable to generate CSRF token');
                var csrfJsonResponse = JSON.parse(csrfResponse.body);
                // Step 7 : submit billing request to update basket with necessary custom data
                myRequest.url = config.baseUrl + '/CheckoutServices-SubmitPayment';
                myRequest.form = {
                    dwfrm_billing_addressFields_firstName: 'Tyler',
                    dwfrm_billing_addressFields_lastName: 'Durden',
                    dwfrm_billing_addressFields_address1: '2495 Midway Rd',
                    dwfrm_billing_addressFields_address2: '',
                    dwfrm_billing_addressFields_country: 'US',
                    dwfrm_billing_addressFields_states_stateCode: 'TX',
                    dwfrm_billing_addressFields_city: 'Carrollton',
                    dwfrm_billing_addressFields_postalCode: '75006-2503',
                    dwfrm_billing_contactInfoFields_phone: '8554233729',
                    dwfrm_billing_paymentMethod: 'Catch',
                    csrf_token: csrfJsonResponse.csrf.token
                };
                updateCookies(cookieJar, myRequest);
                return request(myRequest);
            })
            .then(function (submitBillingResponse) {
                assert.equal(submitBillingResponse.statusCode, 200, 'Expected submit billing call to return status code 200');
                // Step 8: make request to create new Catch checkout
                updateCookies(cookieJar, myRequest);
                myRequest.url = config.baseUrl + '/Catch-CreateCheckout';
                myRequest.method = 'GET';
                return request(myRequest);
            })
            .then(function (catchCreateCheckoutResponse) {
                assert.equal(catchCreateCheckoutResponse.statusCode, 200, 'Expected create Catch checkout call to return status code 200');
                var bodyAsJson = JSON.parse(catchCreateCheckoutResponse.body);

                assert.isFalse(bodyAsJson.error);
                assert.isObject(bodyAsJson.customer);
                assert.isObject(bodyAsJson.order);
                assert.isString(bodyAsJson.order.catch.catch_checkoutId);
            });
    });
});
