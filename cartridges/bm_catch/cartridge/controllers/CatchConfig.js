'use strict';

/**
 * Controller : CatchConfig
 *
 * @module controllers/CatchConfig
 */

/* API includes */
var ISML = require('dw/template/ISML');
var URLUtils = require('dw/web/URLUtils');
var CSRFProtection = require('dw/web/CSRFProtection');

/**
 * Get all preferences from custom config
 * @returns {Object} - set of preferences from custom config
 */
function getConfigPreferences() {
    var currentSite = require('dw/system/Site').getCurrent();
    var configPref = currentSite.getCustomPreferenceValue('catch_config');
    var confJson = {};

    try {
        confJson = JSON.parse(configPref);
    } catch (error) {
        return null;
    }
    return confJson;
}

/**
 * @description Shows Catch BM extension
 */
function show() {
    var currentSite = require('dw/system/Site').getCurrent();
    var prefs = getConfigPreferences();

    if (prefs) {
        var templateData = {
            data: {
                configEnable: currentSite.getCustomPreferenceValue('catch_EnableCustomConfig'),
                activeSettingID: prefs.activeSettingID,
                activeSetting: prefs.settings[prefs.activeSettingID],
                settings: prefs.settings
            },
            configurationContinueUrl: URLUtils.https('CatchConfig-HandleForm'),
            healthCheckUrl: URLUtils.https('CatchConfig-Show')
        };
        ISML.renderTemplate('index', templateData);
    } else {
        ISML.renderTemplate('configError');
    }
}

/**
 * @description Form Handle
 */
function handleForm() {
    if (CSRFProtection.validateRequest()) {
        var Transaction = require('dw/system/Transaction');
        var currentSite = require('dw/system/Site').getCurrent();
        var result = '';
        var params = request.httpParameterMap;

        try {
            var isConfEnabled = ('isConfEnabled' in params) && (params.isConfEnabled.submitted === true);
            var configSelectID = ('configSelector' in params) ? params.configSelector.stringValue : null;
            var configPref = getConfigPreferences();

            Transaction.wrap(function () {
                currentSite.setCustomPreferenceValue('catch_EnableCustomConfig', isConfEnabled);
                if (isConfEnabled && configPref) {
                    configPref.activeSettingID = configSelectID;
                    var configPrefStr = JSON.stringify(configPref, null, 4);
                    currentSite.setCustomPreferenceValue('catch_config', configPrefStr);
                }
            });
        } catch (error) {
            response.redirect(URLUtils.https('CatchConfig-Show', 'error', result || ''));
        }

        response.redirect(URLUtils.https('CatchConfig-Show', 'error', result || ''));
    } else {
        ISML.renderTemplate('errorCSRF');
    }
}

/**
 * @description Gets preferences for selectet configuration
 */
function getSelectedPreferences() {
    var input = request.httpParameterMap;
    var prefSetSelected = input.valueSelected.value;
    var prefs = getConfigPreferences();
    var templateData = {
        data: {
            activeSetting: prefs.settings[prefSetSelected]
        }
    };

    ISML.renderTemplate('properties', templateData);
}

exports.Show = show;
exports.Show.public = true;

exports.HandleForm = handleForm;
exports.HandleForm.public = true;

exports.Preferences = getSelectedPreferences;
exports.Preferences.public = true;
