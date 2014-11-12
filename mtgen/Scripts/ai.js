var AppInsights;
(function (AppInsights) {
    (function (Internal) {
        "use strict";

        (function (dataTypes) {
            dataTypes[dataTypes["string"] = 0] = "string";
            dataTypes[dataTypes["number"] = 1] = "number";
            dataTypes[dataTypes["object"] = 2] = "object";
        })(Internal.dataTypes || (Internal.dataTypes = {}));
        var dataTypes = Internal.dataTypes;

        (function (payloadTypes) {
            payloadTypes[payloadTypes["page"] = 0] = "page";
            payloadTypes[payloadTypes["link"] = 1] = "link";
            payloadTypes[payloadTypes["event"] = 2] = "event";
            payloadTypes[payloadTypes["timed"] = 3] = "timed";
            payloadTypes[payloadTypes["action"] = 4] = "action";
            payloadTypes[payloadTypes["perf"] = 5] = "perf";
            payloadTypes[payloadTypes["error"] = 6] = "error";
            payloadTypes[payloadTypes["ierror"] = 7] = "ierror";
        })(Internal.payloadTypes || (Internal.payloadTypes = {}));
        var payloadTypes = Internal.payloadTypes;

        (function (parameterNames) {
            parameterNames[parameterNames["ProfileId"] = 0] = "ProfileId";
            parameterNames[parameterNames["UserIdentity"] = 1] = "UserIdentity";
            parameterNames[parameterNames["Referrer"] = 2] = "Referrer";
            parameterNames[parameterNames["Language"] = 3] = "Language";
            parameterNames[parameterNames["TimeZone"] = 4] = "TimeZone";
            parameterNames[parameterNames["Screen"] = 5] = "Screen";
            parameterNames[parameterNames["TargetPage"] = 6] = "TargetPage";
            parameterNames[parameterNames["Events"] = 7] = "Events";
            parameterNames[parameterNames["CustomUserId"] = 8] = "CustomUserId";
            parameterNames[parameterNames["AccountId"] = 9] = "AccountId";
            parameterNames[parameterNames["CustomDimensions"] = 10] = "CustomDimensions";
            parameterNames[parameterNames["CustomMetrics"] = 11] = "CustomMetrics";
            parameterNames[parameterNames["CookieCreationDate"] = 12] = "CookieCreationDate";
            parameterNames[parameterNames["PagePerformance"] = 13] = "PagePerformance";
            parameterNames[parameterNames["Error"] = 14] = "Error";
            parameterNames[parameterNames["InternalError"] = 15] = "InternalError";
            parameterNames[parameterNames["IsDeveloperData"] = 16] = "IsDeveloperData";
            parameterNames[parameterNames["ScriptAction"] = 17] = "ScriptAction";
            parameterNames[parameterNames["ScriptVersion"] = 18] = "ScriptVersion";
            parameterNames[parameterNames["SourceType"] = 19] = "SourceType";
        })(Internal.parameterNames || (Internal.parameterNames = {}));
        var parameterNames = Internal.parameterNames;
    })(AppInsights.Internal || (AppInsights.Internal = {}));
    var Internal = AppInsights.Internal;
})(AppInsights || (AppInsights = {}));

var appInsights = appInsights || {};
var AppInsights;
(function (AppInsights) {
    (function (Internal) {
        "use strict";

        var imageHost = "dc.services.visualstudio.com";
        var developerModeImageHost = "f5.services.visualstudio.com";
        var imageFile = "_da.gif";
        var postHandler = "stats";
        var version = 18;
        var sourceType = "js";
        var maxUrlLength = 2000;

        var Settings = (function () {
            function Settings() {
                this.cookieName = "aiInfo";
                this.maxVisitorCookieLifeMS = 63072000000;
                this.maxSessionLiftMS = 1800000;
            }
            Settings.prototype.getImageHost = function () {
                return imageHost;
            };

            Settings.prototype.getImageFile = function () {
                return imageFile;
            };

            Settings.prototype.getDeveloperImageHost = function () {
                return developerModeImageHost;
            };

            Settings.prototype.getPostHandler = function () {
                return postHandler;
            };

            Settings.prototype.getVersion = function () {
                return version;
            };

            Settings.prototype.getSourceType = function () {
                return sourceType;
            };

            Settings.prototype.getMaxUrlLength = function () {
                return maxUrlLength;
            };
            return Settings;
        })();
        Internal.Settings = Settings;
    })(AppInsights.Internal || (AppInsights.Internal = {}));
    var Internal = AppInsights.Internal;
})(AppInsights || (AppInsights = {}));
var AppInsights;
(function (AppInsights) {
    (function (Internal) {
        "use strict";

        function assertValue(data) {
            return !Extensions.isNullOrUndefined(data);
        }
        Internal.assertValue = assertValue;

        function assertType(data, dataType) {
            return assertValue(data) && typeof (data) === Internal.dataTypes[dataType];
        }
        Internal.assertType = assertType;

        function isNumeric(data) {
            if (!assertType(data, 1 /* number */)) {
                data = parseFloat(data);
            }

            return !isNaN(data) && isFinite(data);
        }
        Internal.isNumeric = isNumeric;

        function getActiveProfile(configuration) {
            if (assertValue(configuration)) {
                var profile = configuration.profiles ? configuration.profiles[configuration.activeProfile] : null;
                var defaults = configuration.profiles ? configuration.profiles.defaults : null;

                if (assertValue(profile)) {
                    if (!assertValue(profile.componentId) && assertValue(defaults)) {
                        profile.componentId = defaults.componentId;
                    }

                    if (!assertValue(profile.sendToRawStream) && assertValue(defaults)) {
                        profile.sendToRawStream = defaults.sendToRawStream;
                    }
                }

                return profile;
            }

            return null;
        }
        Internal.getActiveProfile = getActiveProfile;

        (function (Strings) {
            function substring(str, startString, endString, includeStartString) {
                var result = "";
                if (!Extensions.isNullOrUndefined(str) && str.length > 0) {
                    var start = str.indexOf(startString);
                    if (start !== -1) {
                        if (!includeStartString) {
                            start = start + startString.length;
                        }
                        var end = str.indexOf(endString, start);
                        if (end === -1) {
                            end = str.length;
                        }

                        result = str.substring(start, end);
                    }
                }

                return result;
            }
            Strings.substring = substring;

            function remove(str, from, to) {
                if ((assertType(str, 0 /* string */) && str.length > 0) && (assertType(to, 1 /* number */)) && (assertType(from, 1 /* number */))) {
                    var result = str.substring(0, from);
                    if (to > -1) {
                        result += str.substring(to);
                    }

                    return result;
                }

                return "";
            }
            Strings.remove = remove;
        })(Internal.Strings || (Internal.Strings = {}));
        var Strings = Internal.Strings;

        (function (Extensions) {
            function isNullOrUndefined(obj) {
                return typeof (obj) === "undefined" || obj === null;
            }
            Extensions.isNullOrUndefined = isNullOrUndefined;

            function getWindowLocalStorage() {
                var result = null;
                try  {
                    result = window.localStorage;
                } catch (ex) {
                }

                return result;
            }
            Extensions.getWindowLocalStorage = getWindowLocalStorage;

            function getWindowSessionStorage() {
                var result = null;
                try  {
                    result = window.sessionStorage;
                } catch (ex) {
                }

                return result;
            }
            Extensions.getWindowSessionStorage = getWindowSessionStorage;
        })(Internal.Extensions || (Internal.Extensions = {}));
        var Extensions = Internal.Extensions;

        (function (DateTime) {
            function utcNow() {
                var date = new Date();
                var result = date.getTime();
                var offsetMilliseconds = date.getTimezoneOffset() * 60 * 1000;
                result = result + offsetMilliseconds;
                return result;
            }
            DateTime.utcNow = utcNow;

            function now() {
                return new Date().getTime();
            }
            DateTime.now = now;

            function getDuration(start, end) {
                if (!assertType(start, 1 /* number */) || !assertType(end, 1 /* number */) || start === 0 || end === 0) {
                    return 0;
                }

                var duration = end - start;
                return Math.max(duration, 0);
            }
            DateTime.getDuration = getDuration;
        })(Internal.DateTime || (Internal.DateTime = {}));
        var DateTime = Internal.DateTime;

        (function (Browser) {
            function supportsPerformanceTimingApi() {
                return !Extensions.isNullOrUndefined(window.performance) && !Extensions.isNullOrUndefined(window.performance.timing) && !Extensions.isNullOrUndefined(window.performance.timing.responseStart);
            }
            Browser.supportsPerformanceTimingApi = supportsPerformanceTimingApi;
        })(Internal.Browser || (Internal.Browser = {}));
        var Browser = Internal.Browser;

        var PageMetrics = (function () {
            function PageMetrics() {
                this.netCon = DateTime.getDuration(window.performance.timing.navigationStart, window.performance.timing.connectEnd);
                this.sendReq = DateTime.getDuration(window.performance.timing.requestStart, window.performance.timing.responseStart);
                this.recResp = DateTime.getDuration(window.performance.timing.responseStart, window.performance.timing.responseEnd);
                this.clientProc = DateTime.getDuration(window.performance.timing.domLoading, window.performance.timing.loadEventEnd);
                this.ptotal = DateTime.getDuration(window.performance.timing.domainLookupStart, window.performance.timing.loadEventEnd);
            }
            return PageMetrics;
        })();
        Internal.PageMetrics = PageMetrics;

        (function (UniqueId) {
            function create() {
                var chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
                var uuid = [];
                var randIndex;

                uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
                uuid[14] = '4';

                for (var i = 0; i < 36; i++) {
                    if (!uuid[i]) {
                        randIndex = Math.floor(Math.random() * chars.length);
                        uuid[i] = chars[randIndex];
                    }
                }

                return uuid.join('');
            }
            UniqueId.create = create;
        })(Internal.UniqueId || (Internal.UniqueId = {}));
        var UniqueId = Internal.UniqueId;

        function getDaysSince1980(timestamp) {
            var jan1980 = 315532800;

            timestamp = timestamp / 1000;
            return parseFloat(((timestamp - jan1980) / 86400).toFixed(0));
        }
        Internal.getDaysSince1980 = getDaysSince1980;

        function calculateTimezone(date) {
            if (typeof date === "undefined") { date = null; }
            date = date || new Date();
            return -Math.round(date.getTimezoneOffset() / 60);
        }
        Internal.calculateTimezone = calculateTimezone;
    })(AppInsights.Internal || (AppInsights.Internal = {}));
    var Internal = AppInsights.Internal;
})(AppInsights || (AppInsights = {}));
var AppInsights;
(function (AppInsights) {
    (function (Internal) {
        "use strict";

        var User = (function () {
            function User(visitor, visit, createdDate) {
                this.visitor = visitor;
                this.visit = visit;
                this.createdDate = createdDate;
            }
            return User;
        })();
        Internal.User = User;

        

        Internal.valueDelimiter = "|";
        Internal.applicationsDelimiter = "||";
    })(AppInsights.Internal || (AppInsights.Internal = {}));
    var Internal = AppInsights.Internal;
})(AppInsights || (AppInsights = {}));
var AppInsights;
(function (AppInsights) {
    (function (Internal) {
        "use strict";

        var maxCookieSize = 4000;
        var maxApplicationCount = 10;

        function deserialize(str) {
            var result = null;
            var applicationData = str.split(Internal.valueDelimiter);

            if (!Internal.Extensions.isNullOrUndefined(applicationData) && applicationData.length === 5) {
                var creationTime = parseInt(applicationData[3], 10);
                var lastUpdateTime = parseInt(applicationData[4], 10);
                if (!isNaN(lastUpdateTime)) {
                    result = new StorageApplication(applicationData[0], applicationData[1], applicationData[2], creationTime, lastUpdateTime);
                }
            }

            return result;
        }

        var StorageApplication = (function () {
            function StorageApplication(instrumentKey, visitorId, visitId, creationTime, lastUpdateTime) {
                this.instrumentKey = instrumentKey;
                this.visitorId = visitorId;
                this.visitId = visitId;
                this.creationtime = creationTime;
                this.lastUpdateTime = lastUpdateTime;
            }
            StorageApplication.prototype.serialize = function () {
                return this.instrumentKey + Internal.valueDelimiter + this.visitorId + Internal.valueDelimiter + this.visitId + Internal.valueDelimiter + this.creationtime + Internal.valueDelimiter + this.lastUpdateTime;
            };
            return StorageApplication;
        })();
        Internal.StorageApplication = StorageApplication;

        var Cookies = (function () {
            function Cookies(settings, cookieStorage) {
                this.settings = settings;
                this.cookieStorage = cookieStorage || document;
            }
            Cookies.prototype.enabled = function (testCookieName) {
                var _this = this;
                var result = false;

                if (!Internal.Extensions.isNullOrUndefined(this.cookieStorage.cookie)) {
                    var cookieExists = function () {
                        return _this.cookieStorage.cookie.indexOf(testCookieName) !== -1;
                    };

                    if (cookieExists()) {
                        result = true;
                    } else {
                        this.cookieStorage.cookie = testCookieName;
                        result = cookieExists();
                    }
                }

                return result;
            };

            Cookies.prototype.setValue = function (name, value) {
                var result = false;
                try  {
                    var expiresDate = new Date(new Date().getTime() + this.settings.maxVisitorCookieLifeMS);

                    this.cookieStorage.cookie = name + "=" + encodeURIComponent(value) + ";expires=" + expiresDate.toUTCString() + ";path=/";

                    var newValue = this.getValue(name);
                    result = newValue === value;
                } catch (ex) {
                }

                return result;
            };

            Cookies.prototype.getValue = function (name) {
                return decodeURIComponent(Internal.Strings.substring(this.cookieStorage.cookie, name + "=", ";", false));
            };
            return Cookies;
        })();
        Internal.Cookies = Cookies;

        var StorageApplicationManager = (function () {
            function StorageApplicationManager(cookies, settings) {
                this.cookies = cookies;
                this.settings = settings;
            }
            StorageApplicationManager.prototype.enabled = function () {
                return this.cookies.enabled(this.settings.cookieName);
            };

            StorageApplicationManager.prototype.updateApplication = function (app) {
                var cookie = this.cookies.getValue(this.settings.cookieName);
                if (cookie.length > maxCookieSize) {
                    cookie = this.getShrinkCookie(cookie);
                }

                cookie = this.getRemoveApplicationCookie(app, cookie);
                cookie = this.getAddApplicationCookie(app, cookie);
                return this.cookies.setValue(this.settings.cookieName, cookie);
            };

            StorageApplicationManager.prototype.getApplication = function (instrumentKey) {
                var result = null;
                var cookieValue = this.cookies.getValue(this.settings.cookieName);
                if (cookieValue !== "") {
                    var applicationString = Internal.Strings.substring(cookieValue, instrumentKey, Internal.applicationsDelimiter, true);
                    if (applicationString !== "") {
                        result = deserialize(applicationString);
                    }
                }

                return result;
            };

            StorageApplicationManager.prototype.getRemoveApplicationCookie = function (app, cookieValue) {
                var result = cookieValue;
                if (cookieValue !== "") {
                    var from = cookieValue.indexOf(app.instrumentKey);
                    if (from !== -1) {
                        var to = cookieValue.indexOf(Internal.applicationsDelimiter, from);
                        if (to >= 0) {
                            to += Internal.applicationsDelimiter.length - 1;
                        }

                        result = Internal.Strings.remove(cookieValue, from, to);
                    }
                }

                return result;
            };

            StorageApplicationManager.prototype.getAddApplicationCookie = function (app, cookieValue) {
                var result = app.serialize();
                if (cookieValue !== "") {
                    result += Internal.applicationsDelimiter;
                }

                result += cookieValue;
                return result;
            };

            StorageApplicationManager.prototype.getShrinkCookie = function (cookie) {
                var result = "";
                var start = cookie.length - 1;
                for (var i = 0; i < maxApplicationCount; i++) {
                    start = cookie.lastIndexOf(Internal.applicationsDelimiter, start) - 1;
                    if (start < 0) {
                        break;
                    }
                }

                if (start > 0) {
                    result = cookie.substring(0, start);
                }

                return result;
            };
            return StorageApplicationManager;
        })();
        Internal.StorageApplicationManager = StorageApplicationManager;

        var CookieStorage = (function () {
            function CookieStorage(settings, cookies, localAppInsights) {
                this.settings = settings;
                this.cookies = cookies || new Cookies(this.settings, document);
                this.appInsights = localAppInsights || appInsights;

                this.visitor = null;
                this.visit = null;
                this.createdOn = null;

                this.applicationManager = new StorageApplicationManager(this.cookies, this.settings);
            }
            CookieStorage.prototype.getUser = function (requestTimeOffset) {
                var result = null;
                if (this.initialize(requestTimeOffset)) {
                    result = new Internal.User(this.visitor, this.visit, this.createdOn);
                }

                return result;
            };

            CookieStorage.prototype.initialize = function (requestTimeOffset) {
                var result = false;

                if (this.applicationManager.enabled()) {
                    var currentApplication = this.applicationManager.getApplication(this.appInsights.applicationInsightsId);
                    var utcNow = Internal.DateTime.utcNow();
                    var requestTimestamp = utcNow - requestTimeOffset;
                    if (Internal.Extensions.isNullOrUndefined(currentApplication)) {
                        currentApplication = new StorageApplication(this.appInsights.applicationInsightsId, Internal.UniqueId.create(), Internal.UniqueId.create(), Internal.DateTime.now(), requestTimestamp);
                    } else {
                        currentApplication.lastUpdateTime = utcNow;
                    }

                    if (this.applicationManager.updateApplication(currentApplication)) {
                        this.visitor = currentApplication.visitorId;
                        this.visit = currentApplication.visitId;
                        this.createdOn = Internal.getDaysSince1980(currentApplication.creationtime).toString();
                    } else {
                        var updatedApplication = this.applicationManager.getApplication(this.appInsights.applicationInsightsId);
                        if (Internal.Extensions.isNullOrUndefined(updatedApplication)) {
                            if (updatedApplication.visitorId === currentApplication.visitorId) {
                                this.visitor = currentApplication.visitorId;
                            }

                            if (updatedApplication.visitId === currentApplication.visitId) {
                                this.visit = currentApplication.visitId;
                            }

                            if (updatedApplication.creationtime === currentApplication.creationtime) {
                                this.createdOn = currentApplication.creationtime.toString();
                            }
                        }
                    }

                    result = true;
                }

                return result;
            };
            return CookieStorage;
        })();
        Internal.CookieStorage = CookieStorage;
    })(AppInsights.Internal || (AppInsights.Internal = {}));
    var Internal = AppInsights.Internal;
})(AppInsights || (AppInsights = {}));
var AppInsights;
(function (AppInsights) {
    (function (Internal) {
        "use strict";

        var DomStorage = (function () {
            function DomStorage(cookieStorage, settings, localAppInsights) {
                this.settings = settings;
                this.cookieStorage = cookieStorage;
                this.appInsights = localAppInsights || appInsights;
            }
            DomStorage.prototype.getUser = function (requestTimeOffset) {
                var cookieUser = null;
                var cookieStorage = this.cookieStorage;

                function updateCookieUser(timeOffset) {
                    if (cookieUser === null) {
                        cookieUser = cookieStorage.getUser(timeOffset);
                    }
                }

                var visitor = this.getStorageInfo(Internal.Extensions.getWindowLocalStorage(), "uid", this.settings.maxVisitorCookieLifeMS, requestTimeOffset, function () {
                    return Internal.UniqueId.create();
                });
                if (visitor === null) {
                    updateCookieUser(requestTimeOffset);
                    if (!Internal.Extensions.isNullOrUndefined(cookieUser)) {
                        visitor = cookieUser.Visitor;
                    }
                }

                var creationDate = this.getStorageInfo(Internal.Extensions.getWindowLocalStorage(), "ica", this.settings.maxVisitorCookieLifeMS, requestTimeOffset, function () {
                    return "" + Internal.getDaysSince1980(Internal.DateTime.now());
                });
                if (creationDate === null) {
                    updateCookieUser(requestTimeOffset);
                    if (!Internal.Extensions.isNullOrUndefined(cookieUser)) {
                        creationDate = cookieUser.CreatedDate;
                    }
                }

                var visit = this.getStorageInfo(Internal.Extensions.getWindowSessionStorage(), "sid", this.settings.maxSessionLiftMS, requestTimeOffset, function () {
                    return Internal.UniqueId.create();
                });
                if (visit === null) {
                    updateCookieUser(requestTimeOffset);
                    if (!Internal.Extensions.isNullOrUndefined(cookieUser)) {
                        visit = cookieUser.Visit;
                    }
                }

                var result = null;
                if (visitor !== null || visit !== null || creationDate !== null) {
                    result = new Internal.User(visitor, visit, creationDate);
                }

                return result;
            };

            DomStorage.prototype.getStorageInfo = function (storageObject, indexKey, lifetime, itemOffset, creationFunc) {
                var key = this.appInsights.applicationInsightsId + indexKey;
                var result = null;

                if (!Internal.Extensions.isNullOrUndefined(storageObject)) {
                    var dateTimeUtcNow = Internal.DateTime.utcNow();
                    var itemValue = null;
                    try  {
                        itemValue = storageObject.getItem(key);
                    } catch (ex) {
                    }

                    var id = null;

                    if (Internal.assertType(itemValue, 0 /* string */)) {
                        var array = itemValue.split(Internal.valueDelimiter);

                        if (array.length === 2) {
                            var timeStamp = parseInt(array[0], 10);
                            if (!isNaN(timeStamp)) {
                                var timeDiff = Internal.DateTime.getDuration(timeStamp, dateTimeUtcNow);
                                timeDiff = timeDiff - itemOffset;
                                if (timeDiff < lifetime) {
                                    id = array[1];
                                }
                            }
                        }
                    }

                    if (Internal.Extensions.isNullOrUndefined(id)) {
                        try  {
                            id = creationFunc();
                            var newItemValue = (dateTimeUtcNow - itemOffset) + Internal.valueDelimiter + id;
                            storageObject.setItem(key, newItemValue);
                            if (storageObject.getItem(key) === newItemValue) {
                                result = id;
                            }
                        } catch (quotaExceededException) {
                        }
                    } else {
                        result = id;
                    }
                }

                return result;
            };
            return DomStorage;
        })();
        Internal.DomStorage = DomStorage;
    })(AppInsights.Internal || (AppInsights.Internal = {}));
    var Internal = AppInsights.Internal;
})(AppInsights || (AppInsights = {}));
var AppInsights;
(function (AppInsights) {
    (function (Internal) {
        

        var PayloadParameter = (function () {
            function PayloadParameter(name, value, alias, isLooseData) {
                this.name = name;
                this.value = value;
                this.alias = alias;
                this.isLooseData = isLooseData;
                if (!Internal.assertValue(isLooseData)) {
                    this.isLooseData = false;
                }
            }
            return PayloadParameter;
        })();
        Internal.PayloadParameter = PayloadParameter;

        var AnalyticsPayloadFactory = (function () {
            function AnalyticsPayloadFactory(settings) {
                this.settings = settings;
                this.localAppInsights = appInsights;
                this.profile = Internal.getActiveProfile(appInsights.configuration) || null;
                this.userIdentityProvider = new Internal.UserIdentityProviderImpl(this.settings);
                this.basePayload = this.createDefaultPayload();
            }
            AnalyticsPayloadFactory.prototype.setDefaultTargetPage = function (targetPage) {
                this.basePayload.setTargetPage(targetPage);
            };

            AnalyticsPayloadFactory.prototype.createDefaultPayload = function () {
                var defaultPayload = new AnalyticsPayload();

                defaultPayload.setIsDeveloperData(this.profile ? this.profile.sendToRawStream : false);

                defaultPayload.setProfileId(this.localAppInsights.applicationInsightsId);
                defaultPayload.setScriptVersion(this.settings.getVersion());
                defaultPayload.setSourceType(this.settings.getSourceType());
                defaultPayload.setTargetPage(location.href);

                var userInfo = this.userIdentityProvider.getUserIdentity();

                if (Internal.assertValue(userInfo)) {
                    defaultPayload.setUserIdentity(userInfo.visitor);
                    defaultPayload.setCookieCreationDate(userInfo.createdDate);
                }

                defaultPayload.setScreen(screen.width + "x" + screen.height + "x" + screen.colorDepth);
                defaultPayload.setLanguage((!document.all || navigator.userAgent.match('Opera')) ? navigator.language : navigator.userLanguage);

                var matches = document.referrer.match(/^(?:f|ht)tp(?:s)?\:\/\/([^/|:]+)/im);
                var referrerHost = (matches !== null && matches.length >= 2) ? matches[1] : null;

                if (referrerHost !== null && referrerHost !== window.location.hostname) {
                    defaultPayload.setReferrer(document.referrer);
                }

                defaultPayload.setTimeZone(Internal.calculateTimezone());
                return defaultPayload;
            };

            AnalyticsPayloadFactory.prototype.createNewPayload = function () {
                var payload = new AnalyticsPayload(this.basePayload);

                if (Internal.assertType(this.localAppInsights.appUserId, 0 /* string */)) {
                    payload.setCustomUserId(this.localAppInsights.appUserId);
                }

                if (Internal.assertType(this.localAppInsights.accountId, 0 /* string */)) {
                    payload.setAccountId(this.localAppInsights.accountId);
                }

                return payload;
            };
            return AnalyticsPayloadFactory;
        })();
        Internal.AnalyticsPayloadFactory = AnalyticsPayloadFactory;

        var AnalyticsPayload = (function () {
            function AnalyticsPayload(defaultValues) {
                this.payload = {};
                this.location = document.location;

                if (!Internal.Extensions.isNullOrUndefined(defaultValues)) {
                    var defaultParameters = defaultValues.getParameters();
                    for (var i = 0; i < defaultParameters.length; i++) {
                        var parameterName = defaultParameters[i];
                        this.setParameter(defaultValues.getParameter(parameterName));
                    }
                }
            }
            AnalyticsPayload.prototype.getParameter = function (name) {
                var value = this.payload[Internal.parameterNames[name]];
                return (value === undefined) ? undefined : new PayloadParameter(name, value.value, value.alias, value.isLooseData);
            };

            AnalyticsPayload.prototype.setParameter = function (payloadParameter) {
                this.payload[Internal.parameterNames[payloadParameter.name]] = {
                    value: payloadParameter.value,
                    alias: payloadParameter.alias,
                    isLooseData: payloadParameter.isLooseData
                };
            };

            AnalyticsPayload.prototype.removeParameter = function (name) {
                delete this.payload[Internal.parameterNames[name]];
            };

            AnalyticsPayload.prototype.hasParameter = function (name) {
                return Internal.assertValue(this.payload[Internal.parameterNames[name]]);
            };

            AnalyticsPayload.prototype.getParameters = function () {
                var allParameters = [];
                for (var prop in this.payload) {
                    if (this.payload.hasOwnProperty(prop)) {
                        allParameters.push(Internal.parameterNames[prop]);
                    }
                }
                return allParameters;
            };

            AnalyticsPayload.prototype.setProfileId = function (profileId) {
                this.setParameter(new PayloadParameter(0 /* ProfileId */, profileId, "pid", true));
            };

            AnalyticsPayload.prototype.setUserIdentity = function (userId) {
                this.setParameter(new PayloadParameter(1 /* UserIdentity */, userId, "uid", true));
            };

            AnalyticsPayload.prototype.setReferrer = function (referrer) {
                this.setParameter(new PayloadParameter(2 /* Referrer */, referrer, "rf"));
            };

            AnalyticsPayload.prototype.setLanguage = function (language) {
                this.setParameter(new PayloadParameter(3 /* Language */, language, "lng", true));
            };

            AnalyticsPayload.prototype.setTimeZone = function (timeZone) {
                this.setParameter(new PayloadParameter(4 /* TimeZone */, timeZone, "tz", true));
            };

            AnalyticsPayload.prototype.setScreen = function (screenDimensions) {
                this.setParameter(new PayloadParameter(5 /* Screen */, screenDimensions, "scr", true));
            };

            AnalyticsPayload.prototype.setTargetPage = function (targetPage) {
                this.setParameter(new PayloadParameter(6 /* TargetPage */, targetPage, "tp", true));
            };

            AnalyticsPayload.prototype.setEvents = function (events) {
                this.setParameter(new PayloadParameter(7 /* Events */, events, "evt"));
            };

            AnalyticsPayload.prototype.setCustomUserId = function (customId) {
                this.setParameter(new PayloadParameter(8 /* CustomUserId */, customId, "cuid"));
            };

            AnalyticsPayload.prototype.setAccountId = function (accountId) {
                this.setParameter(new PayloadParameter(9 /* AccountId */, accountId, "aid"));
            };

            AnalyticsPayload.prototype.setCustomDimensions = function (customDimensions) {
                this.setParameter(new PayloadParameter(10 /* CustomDimensions */, customDimensions, "prp"));
            };

            AnalyticsPayload.prototype.setCustomMetrics = function (customMetrics) {
                this.setParameter(new PayloadParameter(11 /* CustomMetrics */, customMetrics, "met"));
            };

            AnalyticsPayload.prototype.setCookieCreationDate = function (creationDate) {
                this.setParameter(new PayloadParameter(12 /* CookieCreationDate */, creationDate, "ica"));
            };

            AnalyticsPayload.prototype.setPagePerformance = function (pageMetrics) {
                this.setParameter(new PayloadParameter(13 /* PagePerformance */, pageMetrics, "perf"));
            };

            AnalyticsPayload.prototype.setError = function (error) {
                this.setParameter(new PayloadParameter(14 /* Error */, error, "error"));
            };

            AnalyticsPayload.prototype.setInternalError = function (error) {
                this.setParameter(new PayloadParameter(15 /* InternalError */, error, "interror"));
            };

            AnalyticsPayload.prototype.setIsDeveloperData = function (isDeveloperData) {
                this.setParameter(new PayloadParameter(16 /* IsDeveloperData */, isDeveloperData, "idd", true));
            };

            AnalyticsPayload.prototype.setScriptAction = function (payloadType) {
                this.setParameter(new PayloadParameter(17 /* ScriptAction */, Internal.payloadTypes[payloadType], "jsa", true));
            };

            AnalyticsPayload.prototype.setScriptVersion = function (scriptVersion) {
                this.setParameter(new PayloadParameter(18 /* ScriptVersion */, scriptVersion, "jsv", true));
            };

            AnalyticsPayload.prototype.setSourceType = function (sourceType) {
                this.setParameter(new PayloadParameter(19 /* SourceType */, sourceType, "st", true));
            };

            AnalyticsPayload.prototype.send = function (settings) {
                try  {
                    var protocol = this.location.protocol;
                    if (protocol.indexOf("http") !== 0) {
                        protocol = "http:";
                    }

                    var requestData = this.toString();

                    var devModeParameter = this.getParameter(16 /* IsDeveloperData */);
                    var inDevMode = (devModeParameter !== undefined && devModeParameter.value === true);
                    var baseUrl = protocol + "//" + (inDevMode ? settings.getDeveloperImageHost() : settings.getImageHost()) + "/";

                    var xhr = new XMLHttpRequest();
                    if ("withCredentials" in xhr) {
                        xhr.onload = function () {
                            return;
                        };
                        xhr.onerror = function () {
                            return;
                        };

                        if (requestData.length >= settings.getMaxUrlLength()) {
                            xhr.open("POST", baseUrl + settings.getPostHandler(), true);
                            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                        } else {
                            xhr.open("GET", baseUrl + settings.getImageFile() + "?" + requestData, true);
                            requestData = null;
                        }
                        xhr.send(requestData);
                    } else {
                        var url = baseUrl + settings.getImageFile() + "?" + requestData;
                        var script = document.createElement('script');
                        script.async = true;
                        script.src = url;
                        document.getElementsByTagName('head')[0].appendChild(script);
                    }

                    return true;
                } catch (e) {
                    return false;
                }
            };

            AnalyticsPayload.prototype.toString = function () {
                var nameValuePairs = [];
                var dataObject = {};

                var allParameters = this.getParameters();
                for (var i = 0; i < allParameters.length; i++) {
                    var parameter = this.getParameter(allParameters[i]);
                    var parameterValue = parameter.value;
                    var aliasValue = parameter.alias;

                    if (parameter.isLooseData) {
                        nameValuePairs.push(aliasValue + "=" + encodeURIComponent(parameterValue.toString()));
                    } else {
                        dataObject[aliasValue] = parameterValue;
                    }
                }

                nameValuePairs.push("data=" + encodeURIComponent(JSON.stringify(dataObject)));

                nameValuePairs.push("rnd=" + Internal.DateTime.now().toString());

                return nameValuePairs.join("&");
            };
            return AnalyticsPayload;
        })();
        Internal.AnalyticsPayload = AnalyticsPayload;
    })(AppInsights.Internal || (AppInsights.Internal = {}));
    var Internal = AppInsights.Internal;
})(AppInsights || (AppInsights = {}));
var AppInsights;
(function (AppInsights) {
    (function (Internal) {
        "use strict";

        var UserIdentityProviderImpl = (function () {
            function UserIdentityProviderImpl(settings) {
                this.cookieStorage = null;
                this.domStorage = null;
                this.settings = settings;
            }
            UserIdentityProviderImpl.prototype.getUserIdentity = function () {
                return this.getBrowserStorage().getUser(0);
            };

            UserIdentityProviderImpl.prototype.getCookieStorage = function () {
                if (this.cookieStorage === null) {
                    this.cookieStorage = new Internal.CookieStorage(this.settings);
                }
                return this.cookieStorage;
            };

            UserIdentityProviderImpl.prototype.getBrowserStorage = function () {
                if (this.domStorage === null) {
                    var sessionStorage = Internal.Extensions.getWindowSessionStorage();
                    var localStorage = Internal.Extensions.getWindowLocalStorage();

                    if (!Internal.Extensions.isNullOrUndefined(sessionStorage) && !Internal.Extensions.isNullOrUndefined(localStorage)) {
                        this.domStorage = new Internal.DomStorage(this.getCookieStorage(), this.settings);
                    } else {
                        this.domStorage = this.getCookieStorage();
                    }
                }

                return this.domStorage;
            };
            return UserIdentityProviderImpl;
        })();
        Internal.UserIdentityProviderImpl = UserIdentityProviderImpl;
    })(AppInsights.Internal || (AppInsights.Internal = {}));
    var Internal = AppInsights.Internal;
})(AppInsights || (AppInsights = {}));
var AppInsights;
(function (AppInsights) {
    (function (Internal) {
        "use strict";

        var SimpleEvent = (function () {
            function SimpleEvent(eventPath) {
                var indexOfEventName = eventPath.lastIndexOf("/");
                this.eN = eventPath.substr(indexOfEventName + 1);
                this.eP = indexOfEventName > -1 ? eventPath.substring(0, indexOfEventName) : "";
                this.eV = "";
            }
            return SimpleEvent;
        })();
        Internal.SimpleEvent = SimpleEvent;

        var SimpleProperty = (function () {
            function SimpleProperty(pN, pV) {
                this.pN = pN;
                this.pV = pV;
            }
            return SimpleProperty;
        })();
        Internal.SimpleProperty = SimpleProperty;

        var ErrorData = (function () {
            function ErrorData(message, url, lineNumber) {
                this.message = message;
                this.url = url;
                this.lineNumber = lineNumber;
                this.message = message;
                this.url = url;
                this.lineNumber = lineNumber;
            }
            return ErrorData;
        })();
        Internal.ErrorData = ErrorData;

        var InternalErrorData = (function () {
            function InternalErrorData(Id, Stack, Type, Message, Params) {
                this.Id = Id;
                this.Stack = Stack;
                this.Type = Type;
                this.Message = Message;
                this.Params = Params;
            }
            return InternalErrorData;
        })();
        Internal.InternalErrorData = InternalErrorData;
    })(AppInsights.Internal || (AppInsights.Internal = {}));
    var Internal = AppInsights.Internal;
})(AppInsights || (AppInsights = {}));
var AppInsights;
(function (AppInsights) {
    (function (Internal) {
        "use strict";

        var AIClient = (function () {
            function AIClient(settings) {
                this.pagePerformanceTrackingEnabled = true;
                this.settings = settings;
                this.payloadFactory = new Internal.AnalyticsPayloadFactory(this.settings);
            }
            AIClient.prototype.logEvent = function (eventPath, properties, metrics) {
                var _this = this;
                return this.tryCatchTraceWrapper("logEvent", function () {
                    var payload = _this.payloadFactory.createNewPayload();
                    payload.setScriptAction(2 /* event */);
                    payload.setEvents([new Internal.SimpleEvent(eventPath)]);

                    _this.addCustomPropertiesAndMetrics(payload, properties, metrics);

                    return payload.send(_this.settings);
                }, arguments);
            };

            AIClient.prototype.logPageView = function (pagePath, properties, metrics) {
                var _this = this;
                return this.tryCatchTraceWrapper("logPageView", function () {
                    var payload = _this.payloadFactory.createNewPayload();
                    payload.setScriptAction(0 /* page */);

                    if (Internal.assertType(pagePath, 0 /* string */)) {
                        payload.setTargetPage(pagePath);
                        _this.payloadFactory.setDefaultTargetPage(pagePath);
                    }

                    _this.addCustomPropertiesAndMetrics(payload, properties, metrics);
                    return payload.send(_this.settings);
                }, arguments);
            };

            AIClient.prototype.trackPagePerformance = function () {
                var _this = this;
                return this.tryCatchTraceWrapper("trackPagePerformance", function () {
                    var payload = _this.payloadFactory.createNewPayload();
                    payload.setPagePerformance(new Internal.PageMetrics());
                    payload.setScriptAction(5 /* perf */);
                    return payload.send(_this.settings);
                }, arguments);
            };

            AIClient.prototype.trackError = function (message, fileName, lineNumber) {
                var _this = this;
                return this.tryCatchTraceWrapper("trackError", function () {
                    var payload = _this.payloadFactory.createNewPayload();
                    payload.setError(new Internal.ErrorData(message, fileName, lineNumber));
                    payload.setScriptAction(6 /* error */);
                    return payload.send(_this.settings);
                }, arguments);
            };

            AIClient.prototype.trackPagePerformanceImpl = function () {
                var _this = this;
                return this.tryCatchTraceWrapper("trackPagePerformance", function () {
                    if (!Internal.Browser.supportsPerformanceTimingApi()) {
                        return false;
                    }

                    var perfPollingFunc = function () {
                        if (_this.pagePerformanceTrackingEnabled) {
                            if (window.performance.timing.loadEventEnd !== 0) {
                                _this.trackPagePerformance();
                            } else {
                                setTimeout(perfPollingFunc, 500);
                            }
                        }
                    };

                    setTimeout(perfPollingFunc, 500);
                    return true;
                }, arguments);
            };

            AIClient.prototype.enablePagePerformanceTracking = function () {
                this.pagePerformanceTrackingEnabled = true;
                this.trackPagePerformanceImpl();
            };

            AIClient.prototype.disablePagePerformanceTracking = function () {
                this.pagePerformanceTrackingEnabled = false;
            };

            AIClient.prototype.tryCatchTraceWrapper = function (functionName, funcPointer, params) {
                try  {
                    return funcPointer();
                } catch (exception) {
                    var traceMessage = new Internal.InternalErrorData(functionName);

                    if (!Internal.Extensions.isNullOrUndefined(exception)) {
                        if (!Internal.Extensions.isNullOrUndefined(exception.stack) && exception.stack.length > 0) {
                            traceMessage.Stack = exception.stack;
                        }

                        traceMessage.Type = exception.name;
                        traceMessage.Message = exception.message;
                    }

                    if (!Internal.Extensions.isNullOrUndefined(params)) {
                        var parameterArray = [];
                        for (var i = 0; i < params.length; i++) {
                            parameterArray.push(params[i]);
                        }

                        traceMessage.Params = parameterArray;
                    }

                    var payload = this.payloadFactory.createNewPayload();
                    payload.setScriptAction(7 /* ierror */);
                    payload.setInternalError(traceMessage);

                    try  {
                        payload.send(this.settings);
                    } catch (exception2) {
                    }

                    return null;
                }
            };

            AIClient.prototype.addCustomPropertiesAndMetrics = function (payload, properties, metrics) {
                if (Internal.assertType(properties, 2 /* object */)) {
                    var customDimensions = [];
                    for (var propertyName in properties) {
                        if (!Internal.Extensions.isNullOrUndefined(properties[propertyName])) {
                            customDimensions.push(new Internal.SimpleProperty(propertyName, properties[propertyName].toString()));
                        }
                    }
                    payload.setCustomDimensions(customDimensions);
                }

                if (Internal.assertType(metrics, 2 /* object */)) {
                    var customMetrics = [];
                    for (var metricName in metrics) {
                        if (!Internal.Extensions.isNullOrUndefined(metrics[metricName])) {
                            var metric = metrics[metricName];
                            if (Internal.isNumeric(metric)) {
                                customMetrics.push(new Internal.SimpleProperty(metricName, metric));
                            }
                        }
                    }
                    payload.setCustomMetrics(customMetrics);
                }

                return payload;
            };
            return AIClient;
        })();
        Internal.AIClient = AIClient;
    })(AppInsights.Internal || (AppInsights.Internal = {}));
    var Internal = AppInsights.Internal;
})(AppInsights || (AppInsights = {}));
var AppInsights;
(function (AppInsights) {
    (function (Internal) {
        "use strict";

        var profile = Internal.getActiveProfile(appInsights.configuration) || null;

        appInsights.applicationInsightsId = appInsights.applicationInsightsId || (profile ? profile.componentId : "");
        appInsights.accountId = appInsights.accountId || null;
        appInsights.appUserId = appInsights.appUserId || null;

        function resetClient(settings) {
            var aiClient = new Internal.AIClient(settings);

            appInsights.logEvent = function (eventPath, properties, metrics) {
                return aiClient.logEvent(eventPath, properties, metrics);
            };
            appInsights.logPageView = function (pagePath, properties, metrics) {
                return aiClient.logPageView(pagePath, properties, metrics);
            };
            appInsights.enablePagePerformanceTracking = function () {
                return aiClient.enablePagePerformanceTracking();
            };
            appInsights.disablePagePerformanceTracking = function () {
                return aiClient.disablePagePerformanceTracking();
            };

            return aiClient;
        }
        Internal.resetClient = resetClient;

        function callFunctions(functions) {
            while (functions.length > 0) {
                var func = functions.shift();
                func();
            }
        }
        Internal.callFunctions = callFunctions;

        try  {
            var client = resetClient(new Internal.Settings());
            client.enablePagePerformanceTracking();

            if (appInsights.queue instanceof Array) {
                callFunctions(appInsights.queue);
            }
        } catch (ex) {
        }
    })(AppInsights.Internal || (AppInsights.Internal = {}));
    var Internal = AppInsights.Internal;
})(AppInsights || (AppInsights = {}));
//# sourceMappingURL=ai.full.js.map
