'use strict';

const CATCH_PREFIX = 'catch_';
const currentSite = require('dw/system/Site').getCurrent();

/**
 * @description Getting preference value from custom config
 * @param {string} id - name of preference
 * @returns {*} - value of preference
 */
function getCustomConfigValue(id) {
    if (currentSite.getCustomPreferenceValue(CATCH_PREFIX + 'EnableCustomConfig')) {
        try {
            var config = currentSite.getCustomPreferenceValue(CATCH_PREFIX + 'config');
            var configJson = JSON.parse(config);
            var selectedSet = configJson.settings[configJson.activeSettingID];
            var customId = null;

            if (id === 'ProductionSDKURL' || id === 'SandboxSDKURL') {
                customId = 'SDK_URL';
            } else if (id === 'ProductionBaseURL' || id === 'SandboxBaseURL') {
                customId = 'API_URL';
            } else {
                customId = id;
            }

            if (Object.hasOwnProperty.call(selectedSet, CATCH_PREFIX + customId)) {
                return selectedSet[CATCH_PREFIX + customId];
            }
        } catch (error) {
            return null;
        }
    }

    return null;
}

/**
 * @description Validate preference name
 * @param {string} id - name of preference
 * @returns {boolean} - validate result
 */
function isCorrectPropertyName(id) {
    if (id === 'name' || id === 'name' || id === 'catch_SDK_URL' || id === 'catch_API_URL') {
        return true;
    }

    var a = currentSite.getCustomPreferenceValue(id);
    if (a === null) {
        return false;
    }

    return true;
}

module.exports = {
    getCustomConfigValue: getCustomConfigValue,
    isCorrectPropertyName: isCorrectPropertyName
};
