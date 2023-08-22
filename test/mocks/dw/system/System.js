var System = function () {};

System.getPreferences = function () {};

System.prototype.getInstanceType = function () {
    return System.DEVELOPMENT_SYSTEM;
};

System.prototype.getInstanceTimeZone = function () {};
System.prototype.getInstanceHostname = function () {};
System.prototype.getCalendar = function () {};
System.prototype.preferences = null;
System.prototype.instanceType = null;
System.prototype.instanceTimeZone = null;
System.prototype.instanceHostname = null;
System.prototype.calendar = null;

System.PRODUCTION_SYSTEM = 0;
System.DEVELOPMENT_SYSTEM = 1;

module.exports = System;