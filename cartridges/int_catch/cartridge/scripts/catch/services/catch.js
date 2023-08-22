'use strict';

/**
 * Initialize services for the Catch cartridge
 */

/**
 * @description initialize services for the BluSnap cartridge
 * @param {string} relativePath url path to Catch endpoint
 * @returns {dw.svc.HTTPService} initiated service
 */
function init(relativePath) {
    var System = require('dw/system/System');
    var localServiceRegistry = require('dw/svc/LocalServiceRegistry');
    var catchHelper = require('*/cartridge/scripts/catch/helper/catchHelper');

    var path = '';
    var endpointPath = relativePath || ''; // default value
    if (endpointPath && endpointPath.charAt(0) !== '/') {
        endpointPath = '/' + endpointPath;
    }

    var serviceConfig = {
        createRequest: function (svc, args) {
            svc.setAuthentication('NONE');
            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('public-key', catchHelper.getPreference('publicKey'));
            svc.addHeader('x-api-key', catchHelper.getPreference('apiKey'));
            if (!path) {
                path = catchHelper.getCatchBaseUrl();
                path = path.charAt(path.length - 1) === '/' ? path.slice(0, path.length - 1) + endpointPath : path + endpointPath;
            }
            svc.setURL(path);
            return args;
        },
        parseResponse: function (svc, client) {
            return {
                response: client.text,
                statusCode: client.statusCode
            };
        },
        filterLogMessage: function (data) {
            return data;
        },
        // @TODO Remove mockCall after testing
        mockCall: function () {
            var mockResponse = {
                statusCode: 500,
                statusMessage: 'Error message',
                getErrorText: function () {
                    return 'Error';
                }
            };

            return mockResponse;
        }
    };

    return System.getInstanceType() === System.PRODUCTION_SYSTEM
        ? localServiceRegistry.createService('catch.http.production', serviceConfig)
        : localServiceRegistry.createService('catch.http.develop.staging', serviceConfig);
}

module.exports.init = init;
