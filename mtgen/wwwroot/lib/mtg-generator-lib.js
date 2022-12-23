/*
MtG Generator script v2.7.3 - LIB

Shared/base functions.

Query examples:
    from[stx]?promo=true  = Take all from pre-defined query def 'stx' where the 'promo' property of cards is 'true'
    from[stx-token]?marketing!=true  = Take all from stx-token except where marketing = true. Will also include those that don't have a 'marketing' property.
    take[3]>from[stx-booster]?rarity='u'  = Take 3 random cards from stx-booster where rarity='u'
    from[stx-borderless]+from[stx-extended-art]"  = Take all cards from both stx-borderless and stx-extended-art query defs
    from[stx-token]-from[stx-token]?marketing=true  = Take all tokens, then remove all tokens where marketing=true (set math!)
    from[stx-booster]?cost~='R'  = Take all cards where cost includes R
    from[stx-booster]?cost~=(R|W)  = Take all cards where cost includes R or W. Note you can also use from[stx-booster]?cost=contains(R|W)
    from[stx-booster]?rarity=rarityByWeight(curm) = Select the rarity by weight (c:80/u:24/r:8/m:1/7.4)

    overrideSlot can override more than one slot via a comma-separated list

Author: Cam Marsollier cam.marsollier@gmail.com

20221214: Added Levenshien Distance functions to String.prototype. Originally added for deck-importer.js.
20221003: Debug packs no longer defaults to all packs, just the first pack with the rest available in the dropdown.
20220414: Added family support for SNC.
2-Jul-2021: Added support for ?getMarketingCardsForSet(set) to include new /ads/cardsAds.json cards in the boosters.
14-Jun-2021: Added support for rarity=rarityByWeight(curm).
7-Jun-2021: Removed product debug support, replacing with superior ?debug=true querystring support.
4-May-2021: Added support for ~=(X|Y|Z) (contains) operator and != operator.
4-May-2021: Added debug mode that shows a Debug Product and Live Debug Product tabs. To enable, add this to top level of products.json: "debug": true
11-Apr-2021: Now includes college support for stx.
14-Aug-2019: Added duplicate sets with fixed set codes, e.g.: con_ and con
14-Jan-2019: Card cost calculator rewritten to simplify and handle a missing case.
24-Apr-2018: Added support for slot overrides in pack defs.
20-May-2017: Replaced all underscore references with native es6 calls.
26-Jan-2016: Now uses mtgenId instead of index.
14-Jan-2016: Percents within querySets can now be expressed as fractions ("7/8") in addition to percents (87.5).
4-Jan-2016: Renamed "colourless" (c) mana to "generic" (g) (new in OGW set)
27-Dec-2015: Broke out this file from mtg-generator.js.
    
*/
/* jshint laxcomma: true */

// seedrandom 3.0.5 taken from https://cdnjs.cloudflare.com/ajax/libs/seedrandom/3.0.5/seedrandom.min.js
!function(f,a,c){var s,l=256,p="random",d=c.pow(l,6),g=c.pow(2,52),y=2*g,h=l-1;function n(n,t,r){function e(){for(var n=u.g(6),t=d,r=0;n<g;)n=(n+r)*l,t*=l,r=u.g(1);for(;y<=n;)n/=2,t/=2,r>>>=1;return(n+r)/t}var o=[],i=j(function n(t,r){var e,o=[],i=typeof t;if(r&&"object"==i)for(e in t)try{o.push(n(t[e],r-1))}catch(n){}return o.length?o:"string"==i?t:t+"\0"}((t=1==t?{entropy:!0}:t||{}).entropy?[n,S(a)]:null==n?function(){try{var n;return s&&(n=s.randomBytes)?n=n(l):(n=new Uint8Array(l),(f.crypto||f.msCrypto).getRandomValues(n)),S(n)}catch(n){var t=f.navigator,r=t&&t.plugins;return[+new Date,f,r,f.screen,S(a)]}}():n,3),o),u=new m(o);return e.int32=function(){return 0|u.g(4)},e.quick=function(){return u.g(4)/4294967296},e.double=e,j(S(u.S),a),(t.pass||r||function(n,t,r,e){return e&&(e.S&&v(e,u),n.state=function(){return v(u,{})}),r?(c[p]=n,t):n})(e,i,"global"in t?t.global:this==c,t.state)}function m(n){var t,r=n.length,u=this,e=0,o=u.i=u.j=0,i=u.S=[];for(r||(n=[r++]);e<l;)i[e]=e++;for(e=0;e<l;e++)i[e]=i[o=h&o+n[e%r]+(t=i[e])],i[o]=t;(u.g=function(n){for(var t,r=0,e=u.i,o=u.j,i=u.S;n--;)t=i[e=h&e+1],r=r*l+i[h&(i[e]=i[o=h&o+t])+(i[o]=t)];return u.i=e,u.j=o,r})(l)}function v(n,t){return t.i=n.i,t.j=n.j,t.S=n.S.slice(),t}function j(n,t){for(var r,e=n+"",o=0;o<e.length;)t[h&o]=h&(r^=19*t[h&o])+e.charCodeAt(o++);return S(t)}function S(n){return String.fromCharCode.apply(0,n)}if(j(c.random(),a),"object"==typeof module&&module.exports){module.exports=n;try{s=require("crypto")}catch(n){}}else"function"==typeof define&&define.amd?define(function(){return n}):c["seed"+p]=n}("undefined"!=typeof self?self:this,[],Math);

// --------------------------------------------------------------------------------------------------------------------------------
// Main module: main structure, query parser, base renderer
// --------------------------------------------------------------------------------------------------------------------------------
var mtgGen = (function (my) {
    'use strict';
    // globals
    my.version = "2.7.1";
    my.setData = undefined;
    my.packData = undefined;
    my.cardsData = undefined;
    my.hasGuilds = false;
    my.hasClans = false;
    my.hasFactions = false;
    my.hasColleges = false;
    my.hasFamilies = false;
    my.masterPRNG = new Math.seedrandom(); // used for creating seeds for actual generation
    my.currentPRNG = (new Math.seedrandom()).double;

    my.initViews = []; // for modules to add their views to be run once at the start of the app

    /* NOTE: these colours and rarities are duplicated in importer-gm-json.js. If you change this here you must change it there. */
    my.colours = {
        white: { sorder: 1, code: 'w', name: 'White' },
        blue: { sorder: 2, code: 'u', name: 'Blue' },
        black: { sorder: 3, code: 'b', name: 'Black' },
        red: { sorder: 4, code: 'r', name: 'Red' },
        green: { sorder: 5, code: 'g', name: 'Green' },
        multicolour: { sorder: 6, code: 'm', name: 'Multicolour' },
        colorless: { sorder: 10, code: 'c', name: 'Colourless', colourless: true },
        generic: { sorder: 15, code: 'x', name: 'Generic', colourless: true },
        artifact: { sorder: 17, code: 'a', name: 'Artifact', colourless: true },
        land: { sorder: 27, code: 'l', name: 'Land', colourless: true },
        other: { sorder: 37, code: 'o', name: 'Other: Token/Pack-In/Marketing', colourless: true },
        unknown: { sorder: 97, code: '?', name: 'Unknown Colour', colourless: true },
    };
    my.getColourByCode = function (code) {
        for (let colour in my.colours) {
            if (my.colours[colour].code == code) {
                return my.colours[colour];
            }
        }
        return my.colours.unknown;
    }

    /*
    - all cards have a distinct colour: w,u,b,r,g,m,c,?
        - when sorting by colour we want non-deckbuilding cards in their own category at the bottom
        - we need a sortColour, with w,u,b,r,g,m,c-artifacts,c-other,c-land,non-deckbuilding,?
    */

    my.rarities = {
        special: { sorder: 1, code: 's', name: 'Special' },
        mythic: { sorder: 2, code: 'm', name: 'Mythic Rare' },
        rare: { sorder: 3, code: 'r', name: 'Rare' },
        uncommon: { sorder: 4, code: 'u', name: 'Uncommon' },
        common: { sorder: 5, code: 'c', name: 'Common' },
        unknown: { sorder: 97, code: '?', name: 'Unknown' },
    };
    my.getRarityByCode = function (code) {
        for (let rarity in my.rarities) {
            if (my.rarities[rarity].code == code) {
                return my.rarities[rarity];
            }
        }
        return my.rarities.unknown;
    }

    // from: https://mtgjson.com/documentation.html
    my.cardTypes = {
        planeswalker: { sorder: 1, code: 'p', name: 'Planeswalker' },
        plane: { sorder: 2, code: 'n', name: 'Plane' },
        conspiracy: { sorder: 3, code: 'y', name: 'Conspiracy' },
        creature: { sorder: 4, code: 'c', name: 'Creature' },
        instant: { sorder: 5, code: 'i', name: 'Instant' },
        sorcery: { sorder: 6, code: 's', name: 'Sorcery' },
        enchantment: { sorder: 7, code: 'e', name: 'Enchantment' },
        artifact: { sorder: 8, code: 'a', name: 'Artifact' },
        land: { sorder: 9, code: 'l', name: 'Land' },
        unknown: { sorder: 97, code: '?', name: 'Unknown' },
    };
    function getCardTypeByCode(code) {
        for (let cardType in my.cardTypes) {
            if (my.cardTypes[cardType].code == code) {
                return my.cardTypes[cardType];
            }
        }
        return my.cardTypes.unknown;
    }
    function getCardTypeByName(name) {
        // there may be multiple card types within the name, so we'll choose the first we find in sort order priority
        let regex;
        for (let cardType in my.cardTypes) {
            regex = new RegExp("\\b" + my.cardTypes[cardType].name + "\\b", "i");
            if (regex.test(name)) {
                return my.cardTypes[cardType];
            }
        }
        return my.cardTypes.unknown;
    }

    my.guilds = {
        azorius: { sorder: 1, code: 'azorius', name: 'Azorius', fullName: 'Azorius Senate' },
        izzet: { sorder: 2, code: 'izzet', name: 'Izzet', fullName: 'Izzet League' },
        rakdos: { sorder: 3, code: 'rakdos', name: 'Rakdos', fullName: 'Cult of Rakdos' },
        golgari: { sorder: 4, code: 'golgari', name: 'Golgari', fullName: 'Golgari Swarm' },
        selesnya: { sorder: 5, code: 'selesnya', name: 'Selesnya', fullName: 'Selesnya Conclaveir' },

        orzhov: { sorder: 6, code: 'orzhov', name: 'Orzhov', fullName: 'Orzhov Syndicate' },
        dimir: { sorder: 7, code: 'dimir', name: 'Dimir', fullName: 'House Dimir' },
        gruul: { sorder: 8, code: 'gruul', name: 'Gruul', fullName: 'Gruul Clans' },
        boros: { sorder: 9, code: 'boros', name: 'Boros', fullName: 'Boros Legion' },
        simic: { sorder: 10, code: 'simic', name: 'Simic', fullName: 'Simic Combine' },

        unknown: { sorder: 97, code: '?', name: 'Unknown', fullName: 'Unknown' }
    };
    function getGuildByCode(code) {
        for (let guild in my.guilds) {
            if (my.guilds[guild].code == code) {
                return my.guilds[guild];
            }
        }
        return my.guilds.unknown;
    }

    my.clans = {
        abzan: { sorder: 1, code: 'abzan', name: 'Abzan', fullName: 'Abzan Houses' },
        jeskai: { sorder: 2, code: 'jeskai', name: 'Jeskai', fullName: 'Jeskai Way' },
        sultai: { sorder: 3, code: 'sultai', name: 'Sultai', fullName: 'Sultai Brood' },
        mardu: { sorder: 4, code: 'mardu', name: 'Mardu', fullName: 'Mardu Horde' },
        temur: { sorder: 5, code: 'temur', name: 'Temur', fullName: 'Temur Frontier' },

        dromoka: { sorder: 6, code: 'dromoka', name: 'Dromoka', fullName: 'Dromoka' },
        ojutai: { sorder: 7, code: 'ojutai', name: 'Ojutai', fullName: 'Ojutai' },
        silumgar: { sorder: 8, code: 'silumgar', name: 'Silumgar', fullName: 'Silumgar' },
        kolaghan: { sorder: 9, code: 'kolaghan', name: 'Kolaghan', fullName: 'Kolaghan' },
        atarka: { sorder: 10, code: 'atarka', name: 'Atarka', fullName: 'Atarka' },

        unknown: { sorder: 97, code: '?', name: 'Unknown', fullName: 'Unknown' }
    };
    function getClanByCode(code) {
        for (let clan in my.clans) {
            if (my.clans[clan].code == code) {
                return my.clans[clan];
            }
        }
        return my.clans.unknown;
    }

    my.factions = {
        azorius: { sorder: 1, code: 'mirran', name: 'Mirran', fullName: 'Mirran' },
        izzet: { sorder: 2, code: 'phyrexian', name: 'Phyrexian', fullName: 'Phyrexian' },

        unknown: { sorder: 97, code: '?', name: 'Unknown', fullName: 'Unknown' }
    };
    function getFactionByCode(code) {
        for (let faction in my.factions) {
            if (my.factions[faction].code == code) {
                return my.factions[faction];
            }
        }
        return my.factions.unknown;
    }

    my.colleges = {
        lorehold: { sorder: 1, code: 'lorehold', name: 'Lorehold', fullName: 'Lorehold' },
        prismari: { sorder: 2, code: 'prismari', name: 'Prismari', fullName: 'Prismari' },
        quandrix: { sorder: 3, code: 'quandrix', name: 'Quandrix', fullName: 'Quandrix' },
        silverquill: { sorder: 4, code: 'silverquill', name: 'Silverquill', fullName: 'Silverquill' },
        witherbloom: { sorder: 5, code: 'witherbloom', name: 'Witherbloom', fullName: 'Witherbloom' },

        unknown: { sorder: 97, code: '?', name: 'Unknown', fullName: 'Unknown' }
    };
    function getCollegeByCode(code) {
        for (let college in my.colleges) {
            if (my.colleges[college].code == code) {
                return my.colleges[college];
            }
        }
        return my.colleges.unknown;
    }

    my.families = {
        brokers: { sorder: 1, code: 'brokers', name: 'Brokers', fullName: 'Brokers' },
        cabaretti: { sorder: 2, code: 'cabaretti', name: 'Cabaretti', fullName: 'Cabaretti' },
        maestros: { sorder: 3, code: 'maestros', name: 'Maestros', fullName: 'Maestros' },
        obscura: { sorder: 4, code: 'obscura', name: 'Obscura', fullName: 'Obscura' },
        riveteers: { sorder: 5, code: 'riveteers', name: 'Riveteers', fullName: 'Riveteers' },

        unknown: { sorder: 97, code: '?', name: 'Unknown', fullName: 'Unknown' }
    };
    function getFamilyByCode(code) {
        for (let family in my.families) {
            if (my.families[family].code == code) {
                return my.families[family];
            }
        }
        return my.families.unknown;
    }

    my.getRequiredOption = function (options, optionName, abortMsg) {
        const option = options[optionName];
        const errorMsg = (abortMsg === undefined) ? '' : abortMsg + '\n';
        if (option === undefined) {
            my.throwTerminalError(errorMsg + 'Missing required parameter: ' + optionName + "\nCannot continue.");
        }
        return option;
    };

    // Create a sanitized title to avoid the punctuation differences
    // Site to lookup chars: http://www.fileformat.info/info/unicode/char/search.htm
    my.createMatchTitle = function (title) {
        // the \uXXXX codes are javascript escaped codes
        let clean = (title + '').trim().toLowerCase();
        clean = clean.replace(/\u00E6/g, 'ae'); // \u00E6 = æ = LATIN LOWER CASE LETTER AE
        clean = clean.trim().replace(/\u00E3\u2020/g, 'ae'); // \u00E3\u2020 = ã† = LATIN LOWER CASE LETTER AE when wotc screws up the encoding;)
        clean = clean.replace(/[^a-z0-9 ]+/g, '');
        clean = clean.replace(/ +/, ' ');

        if (/\uFFFD/.test(title)) {
            console.error('ERROR: replacement character \uFFFD found in title. Change this json file to UTF-8 encoding: ' + title);
        }
        return clean;
    }

    my.addUrlSource = function (card, urlSource) {
        if (card.urlSources) {
            card.urlSources.push(urlSource);
        }
        else {
            card.urlSources = [urlSource];
        }
        return card;
    }

    // Gets a decoded parameter value from the querystring.
    my.getQuerystringParamByName = function (name) {
        const value = Object.fromEntries(new URLSearchParams(location.search))[name];
        return value ? value.replace(/\+/g, ' ') : '';
    };

    my.throwTerminalError = function (abortMsg) {
        console.error(abortMsg);
        alert(abortMsg);
    };

    // Get html via a proxy, erroring if it fails or if no HTML is retrieved.
    my.fetchJson = (url) => {
        return fetch(url)
            .catch(error => console.log(`${error}  url: ${url}`))
            .then(response => {
                if (!response.ok) { throw Error(response.statusText); }
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.startsWith("application/json")) {
                    return response;
                }
                throw Error(`ERROR file '${url}' is not valid JSON. Cannot continue.`);
            })
            .then(response => response.json())
            .then(json => {
                if (json) { return Promise.resolve(json); }
                throw Error(`ERROR retrieving file '${url}'. Cannot continue.`);
            });
    };

    // Public functions --------------------------------------------------------------------------------------------------------------------------------
    /*
    Do the actual initialization. Doesn't reference the document or window.
    Can be used in stand-alone libs.
    Arguments:
        options: a dict containing the same options as for run()
        drawId: the draw querystring or ''
        drawCallback: function to call when draw is loaded
        playableCardLoadedCallback: function to call when a playable card is loaded
    Returns:
        A promise that resolves when MtG Generator is ready.
    };
    */

    my.runWithoutBrowser = function (options, drawId, drawCallback, playableCardLoadedCallback) {
        // Import options into instance variables
        Object.assign(my, options);

        my.SetCardCount = options.setCardCount;

        // if missing any essentials, abort
        my.getRequiredOption(options, 'setFile');
        my.getRequiredOption(options, 'cardFiles');
        my.getRequiredOption(options, 'packFiles');
        my.getRequiredOption(options, 'productFile');

        // Load all files
        const setFilePromise = this.fetchJson(my.setFile);

        const cardFilePromiseSet = my.cardFiles.map(cardFile => this.fetchJson(cardFile));
        const cardFilePromises = new Promise(resolve => resolve(Promise.all(cardFilePromiseSet)));

        const packFilePromiseSet = my.packFiles.map(packFile => this.fetchJson(packFile));
        const packFilePromises = new Promise(resolve => resolve(Promise.all(packFilePromiseSet)));

        const productFilePromise = this.fetchJson(my.productFile);

        // TODO: draw data should be optional it fails, not required/terminal
        // If a draw was specified, try to load that
        let drawDataPromise;
        if (drawId) {
            //CANKILL:drawDataPromise = this.fetchJson(`/${options.setCode}/LoadDraw/${drawId}`);
            drawDataPromise = this.fetchJson(`/api/${options.setCode}/draws/${drawId}`);
        }
        else {
            drawDataPromise = Promise.resolve('');
        }

        // Load all of the data once it all arrives
        return Promise.all([setFilePromise, cardFilePromises, packFilePromises, productFilePromise, drawDataPromise])
            .catch(err => my.throwTerminalError(err.message))
            .then(([setData, cardDataArray, packDataArray, productData, drawData]) => {
                // Turn set data into an associative array
                my.sets = {};
                setData.forEach(set => {
                    my.sets[set.code] = set;
                    // Add the set again so we can find it by the proper code if it has a _ suffix, e.g.: con_
                    if (set.code[set.code.length - 1] === '_') {
                        my.sets[set.code.substr(0, set.code.length - 1)] = set;
                    }
                });
                // Add set aliases for any sets we had to suffix with _, like con_.
                my.set = my.sets[my.setCode.toUpperCase()];
                if (my.set) {
                    // create the set slug, useful for url-friendly formats like the download filename
                    my.set.slug = my.friendly_url(my.set.name);
                }
                else {
                    console.warn(`WARNING: Cannot find setCode: ${my.setCode}`);
                }

                // All the actual cards - from the array of individual card sets within cardDataArray
                my.cards = cardDataArray.reduce((cardSets, cardSet) => cardSets.concat(cardSet), []);

                // The products, e.g.: all cards, booster, prerelease - from productData
                const replacedProductData = replaceSetCodeAndNameTokens(productData, my.set);
                my.products = replacedProductData.products;

                // The card definitions and packs - from the array of individual defs/packs within packDataArray
                const replacedpackDataArray = replaceSetCodeAndNameTokens(packDataArray, my.set);
                my.defs = replacedpackDataArray.reduce((cardDefs, packData) => cardDefs.concat(packData.defs), []);
                my.packs = replacedpackDataArray.reduce((cardPacks, packData) => cardPacks.concat(packData.packs), []);

                // The saved draw to be loaded (optional)
                my.draw = drawData;
                my.hasDraw = () => my.draw ? true : false;
                my.hasDrawForCurrentProduct = () => {
                    const options = my.mainView.currentView.options;
                    return my.draw && my.draw.sets && my.draw.sets.length > 0
                        && options !== undefined
                        && options.originalProductName !== undefined
                        && options.originalProductName === my.draw.productName;
                };
                if (my.hasDraw()) {
                    my.draw.code = drawId;
                    drawCallback({ setCode: my.setCode, code: my.draw.code });
                }

                // Add card indicies and sort orders for internal use
                let setCardsLoadedCount = 0;
                let goodCards = {};
                my.cards.forEach(card => {
                    if (!card.title) { return; }

                    card.num = card.num || card.multiverseid || card.id; // num is required, so ensure we have one
                    if (card.mtgenId === undefined) {
                        card.mtgenId = `${card.set}|${card.num}`;
                    }

                    // Create a sanitized matchTitle stripped of all punctuation, special chars, etc to be used for matching
                    card.matchTitle = my.createMatchTitle(card.title);

                    card.colourOrder = my.getColourByCode(card.colour).sorder;
                    card.rarityOrder = my.getRarityByCode(card.rarity).sorder;

                    const cardType = getCardTypeByName(card.type);
                    card.typeCode = cardType.code;
                    card.typeOrder = cardType.sorder;

                    if (card.guild) {
                        card.guild = my.createMatchTitle(card.guild);
                        card.guildOrder = getGuildByCode(card.guild).sorder;
                        my.hasGuilds = true;
                    }

                    if (card.clan) {
                        card.clan = my.createMatchTitle(card.clan);
                        card.clanOrder = getClanByCode(card.clan).sorder;
                        my.hasClans = true;
                    }

                    if (card.faction) {
                        card.faction = my.createMatchTitle(card.faction);
                        card.factionOrder = getFactionByCode(card.faction).sorder;
                        my.hasFactions = true;
                    }

                    if (card.college) {
                        card.college = my.createMatchTitle(card.college);
                        card.collegeOrder = getCollegeByCode(card.college).sorder;
                        my.hasColleges = true;
                    }

                    if (card.family) {
                        card.family = my.createMatchTitle(card.family);
                        card.familyOrder = getCollegeByCode(card.family).sorder;
                        my.hasFamilies = true;
                    }

                    card.ccost = card.ccost ?? calculateConvertedCost(card.cost);

                    // Ensure defaults on some fields are set; makes querying WAY easier
                    if (card.token === undefined) {
                        card.token = false;
                    }
                    if (card.usableForDeckBuilding === undefined) {
                        card.usableForDeckBuilding = true; // i.e., it IS usable unless specified
                    }
                    if (card.set == my.setCode && (card.usableForDeckBuilding === undefined || card.usableForDeckBuilding === true)) {
                        setCardsLoadedCount++;
                        playableCardLoadedCallback({ setCardsLoadedCount });
                    }
                    if (goodCards[card.mtgenId] !== undefined) {
                        console.warn(`WARNING: duplicate mtgenId: ${card.mtgenId} : ${card.title}`);
                    }
                    goodCards[card.mtgenId] = card;
                });
                my.cards = goodCards;

                // Go through all the cards again now that they're all guaranteed to have Ids.
                for (let cardKey in my.cards) {
                    let card = my.cards[cardKey];

                    // Load up the alternate side card on double-faced cards
                    if (card.mtgenIdBack !== undefined) {
                        const cardBack = my.cards[card.mtgenIdBack];
                        if (cardBack !== undefined) {
                            card.cardBack = cardBack;
                        }
                    }
                    if (card.mtgenIdFront !== undefined) {
                        const cardFront = my.cards[card.mtgenIdFront];
                        if (cardFront !== undefined) {
                            card.cardFront = cardFront;
                        }
                    }
                }

                // Make any post-load changes to the packs
                let querySetPercentAvg;
                for (let packKey in my.packs) {
                    let pack = my.packs[packKey];

                    // Check the querySets and add percentages if they're missing (missing means they all have an equal chance)
                    if (!pack.cards) { return; }

                    pack.cards.forEach(cardsDef => {
                        if (cardsDef.querySet === undefined) { return; }

                        if (cardsDef.querySet.length > 0 && cardsDef.querySet[0].query !== undefined) {
                            if (cardsDef.querySet[0].percent === undefined) {
                                querySetPercentAvg = 100 / cardsDef.querySet.length;
                                cardsDef.querySet.forEach(querySet => {
                                    querySet.percent = querySetPercentAvg;
                                });
                            }
                            else {
                                cardsDef.querySet.forEach(querySet => {
                                    const percentValue = Number(querySet.percent);
                                    // If it's not a number, assume it's a fraction and attempt to convert to percent
                                    if (Number.isNaN(percentValue)) {
                                        const parts = querySet.percent.split("/");
                                        if (parts.length !== 2) {
                                            console.log(`ERROR: bad percent (only decimals or fractions allowed): ${querySet.percent}`);
                                        }
                                        else {
                                            querySet.percent = (parts[0] / parts[1]) * 100;
                                        }
                                    }
                                    // Otherwise it's a number -- just keep it like that
                                    else {
                                        querySet.percent = percentValue;
                                    }
                                });
                            }
                        }
                    });
                }

                // Process the pack defs
                my.packDefs = createPackDefs(my.defs);

                // Add ?debug=true to the querystring. This will show all pack defs for debugging.
                if (options.flags.debug) {

                    // TODO: make this a higher-level debug and put spacers/outputs for each statement in a pack?
                    //      This is partially done! See "NOT USED YET" in mtg-generator.js

                    // Add "Debug Product" product that lists every pack so you can run them and see if they're outputting what you expect.

                    // Create a pack out of every pack def.
                    const debugPacks = Object.keys(my.packDefs).map(packDefName => ({
                        "packName": `debug-${packDefName}`,
                        "packDesc": `Debug: ${packDefName}`,
                        "isGenerated": true,
                        "cards": [{ "query": `take[*]>from[${packDefName}]` }]
                    }));
                    my.packs = my.packs.concat(debugPacks);

                    const debugProduct = {
                        "productName": "debug",
                        "productDesc": "Debug Product",
                        "isGenerated": true,
                        "initialSort": "set"
                    };

                    const debugProductOptions = {
                        "presets": [
                            {
                                "presetName": "debug-product",
                                "presetDesc": "All Debug Packs",
                                "default": true,
                                "packs": [{ "count": 1, "defaultPackName": debugPacks[0].packName } ]
                            }
                        ]
                    };
                    //"packs": debugPacks.map(debugPack => ({ "count": 1, "defaultPackName": debugPack.packName }))
                    debugProduct.packs = debugPacks.map(debugPack => ({ "packName": debugPack.packName }));
                    debugProduct.options = debugProductOptions;
                    my.products.push(debugProduct);

                    // Add "Live Debug" product where you can type any query, run it, and see the live results.
                    const liveDebugProduct = {
                        "productName": "live-debug",
                        "productDesc": "Live Debug Product",
                        "isGenerated": false,
                        "initialSort": "set"
                    };
                    const liveDebugProductOptions = {
                        "presets": [
                            {
                                "presetName": "live-debug-product",
                                "presetDesc": "Live Debug Dummy Pack",
                                "default": true,
                                "packs": [{ "count": 1, "defaultPackName": "live-debug-dummy-pack" }]
                            }
                        ]
                    };
                    liveDebugProduct.packs = [{ "packName": "live-debug-dummy-pack" }];
                    liveDebugProduct.options = liveDebugProductOptions;
                    my.products.push(liveDebugProduct);
                }

                my.SetCardsLoadedCount = setCardsLoadedCount;

            });
    };

    /*
    Init MtG Generator. Will trigger 'ready' event when all files loaded and .generateCardSets() can be called.
    Will trigger 'playableCardLoaded' every every time a new playable card is loaded.
    Options:
        setCode				: WotC code for set, e.g.: dgm
        setFile				: Contains set codes and names for all sets
        cardFiles			: Array of JSON files containing main cards, token cards, other cards (like marketing cards), and you can load card sets from other releases if need be.
        packFiles			: JSON file containg pack definitions.
        productFile			: JSON file controlling the product tabs and what's inside them
        startProductName	: if specified, auto-showTab this product
        setCardCount		: Number of cards that should be in the total set. Used to say "X/Y cards available" for when all cards aren't yet released.
        contentElem			: Selector for the spot the products, options, results, etc will be shown, e.g.: All Cards, Prerelease, Duel Decks, etc.
        flags			    : Flags that change execution. Currently supports only 'debug'
    */
    my.run = function (options) {
        const drawId = my.getQuerystringParamByName('draw');

        var runPromise = my.runWithoutBrowser(options, drawId,
            (data) => {
                window.dispatchEvent(new CustomEvent('draw', { detail: data }));
            },
            (data) => {
                window.dispatchEvent(new CustomEvent('playableCardLoaded', { detail: data }));
            });

        my.contentElem = document.querySelector(my.getRequiredOption(options, 'contentElem'));

        runPromise.then(
            () => {
                // Render the Main view
                my.mainView = new my.MainView({ el: my.contentElem });
                my.mainView.render();

                window.dispatchEvent(new Event('ready'));
            });
    };

    my.getRandomSeed = function () {
        return '' + my.masterPRNG.int32();
    };

    my.seedRNG = function (seed) {
        my.currentPRNG = (new Math.seedrandom(seed)).double;
    };

    my.generateCardSetsFromPacks = function (packs) {
        // Generate the requested sets
        let generatedSets = [];
        packs.forEach(pack => {
            // Create X of the desired packs.
            for (let i = 0; i < pack.count; i++) {
                const cardSet = my.generateCardSetFromPack(pack.packName);
                generatedSets.push(cardSet);
            }
        });

        return generatedSets;
    };

    my.generateCardSetFromPack = function (packName) {
        const pack = my.getPack(packName);
        if (pack === undefined) {
            console.warn(`ERROR: generateCardSet(): missing packName: ${packName}`);
            return false;
        }

        let cardQueries = [];

        // Go through each card query in the pack and select it according to its query
        pack.cards.forEach(cardDef => {
            if (cardDef.querySet) {
                const totalWeight = cardDef.querySet[0].overrideSlot !== undefined ? 100 : cardDef.querySet.reduce((total, query) => total + query.percent, 0);

                // Choose the card query percent; we want decimal numbers because the cards can be specified as such (e.g.: 1/8 chance = 12.5%)
                let percent = my.currentPRNG() * totalWeight;
                if (percent > totalWeight) { percent = totalWeight; }

                // Choose the card query that matches that weighted percentage
                let currentWeight = 0;
                const chosenCardDefItem = cardDef.querySet.find(cardDefItem => {
                    currentWeight += cardDefItem.percent;
                    if (currentWeight >= percent) { return true; }
                });

                // Return the query result matching the random percent.
                // IF there is one. If overrideSlot was defined it may not have triggered so we'd return nothing.
                if (chosenCardDefItem) {
                    cardQueries.push(chosenCardDefItem);
                }
            }
            else if (cardDef.query) {
                cardQueries.push(cardDef);
            }
            else {
                console.error(`cardDef doesn't have a queryDef or query property: ${cardDef}`);
            }
        });

        // Basically if the pack was created with usableForDeckBuilding=false then use that, otherwise default to true
        let usableForDeckBuilding = pack.usableForDeckBuilding || true;

        // Execute each card template's query to choose the actual card
        let cardSet = [];
        let cardIndices = [];
        cardQueries.forEach(cardDef => {
            const isOrderImportant = cardDef.inOrder && cardDef.inOrder === true;
            const possibleCards = my.executeQuery(my.cards, my.packDefs, cardDef.query, isOrderImportant);

            let takeCount = 1;
            const take = cardDef.query.match(/take\[(.+)\]>/i);
            if (take) {
                takeCount = take[1];
            }

            // Shallow clone the cards via .slice().
            let chosenCards;
            if (takeCount == "*") {
                chosenCards = possibleCards.slice();
            }
            else if (cardDef.canBeDuplicate === true) {
                chosenCards = randomCards(cardDef.query, possibleCards, takeCount).slice();
            }
            else {
                chosenCards = randomCards(cardDef.query, possibleCards, takeCount, cardIndices).slice();
            }

            // Apply any setValues
            if (cardDef.setValues) {
                // clone via Object.assign() so we don't modify the original cards
                chosenCards = chosenCards.map(chosenCard => Object.assign({}, chosenCard, cardDef.setValues));
            }

            chosenCards.forEach(card => {
                // Apply usableForDeckBuilding if not already specified
                if (card.usableForDeckBuilding === undefined) {
                    card.usableForDeckBuilding = usableForDeckBuilding;
                }
                // If overrideSlot is set, don't just push the cards to the end; override that particular slot.
                // You can override multiple slots by supplying a comma-separated list.
                if (cardDef.overrideSlot) {
                    const overrideSlots = cardDef.overrideSlot.split(',');
                    const overrideCount = Math.min(chosenCards.length, overrideSlots.length);
                    const chosenCardSet = chosenCards.slice(0, overrideCount);
                    const chosenCardSetMtgenIds = chosenCardSet.map(c => c.mtgenId);
                    for (let i = 0; i < overrideCount; i++) {
                        cardIndices.splice(overrideSlots[i] - 1, 1, chosenCardSetMtgenIds[i]);
                        cardSet.splice(overrideSlots[i] - 1, 1, chosenCardSet[i]);
                    }
                }
                else {
                    cardIndices.push(card.mtgenId);
                    cardSet.push(card);
                }
            });
        });

        cardSet.setName = pack.packName;
        cardSet.setDesc = pack.packDesc;
        cardSet.packVersion = pack.packVersion;

        // Used to ensure things like promos aren't included when you sort all cards by colour
        // NOTE: this isn't really used right now -- I'm leaving it in in case it's useful when we start actually letting the user build decks
        cardSet.includeWithUserCards = pack.includeWithUserCards;
        if (pack.includeWithUserCards !== false) {
            cardSet.includeWithUserCards = true;
        }

        return cardSet;
    };


    // Private MtG Generator functions --------------------------------------------------------------------------------------------------------------------------------

    function replaceSetCodeAndNameTokens(jsonData, set) {
        const replacedJsonString = JSON.stringify(jsonData).replace(/\{\{setCode\}\}/gi, set.code.toLowerCase()).replace(/\{\{setName\}\}/gi, set.name);
        return JSON.parse(replacedJsonString);
    }

    function calculateConvertedCost(cost) {
        if (cost === undefined || cost.length < 1) { return 0; }

        const fixedCost = cost.trim().toLowerCase();

        // Trim // and everything right of it -- that's a split card and we calculate card cost off the first card.
        const firstCardCost = fixedCost.split('//')[0];

        // Replace anything of format X/Y or {XY} with a single placeholder (M) -- they're split mana costs as only count as one mana
        const fixedCost2 = firstCardCost.replace(/{[^}]+}/g, 'm');
        const fixedCost3 = fixedCost2.replace(/.\/./g, 'm');

        // Get rid of all extraneous characters
        const fixedCost4 = fixedCost3.replace(/[ (){}]/g, '');

        let ccost = 0;
        [...fixedCost4].forEach(mana => {
            let intCost = parseInt(mana, 10);
            if (isNaN(intCost) && mana.length > 0) {
                // Rules for converted cost on {X}: http://www.wizards.com/magic/comprules/MagicCompRules_20121001.txt
                //	"202.3b When calculating the converted mana cost of an object with {X} in its mana cost, X is treated as 0 while the object is not on the stack, and X is treated as the number chosen for it while the object is on the stack."
                intCost = (mana == 'x') ? 0 : 1;
            }
            if (isNaN(intCost)) {
                intCost = 0;
            }
            ccost += intCost;
        });
        return ccost;
    }

    function createPackDefs(defs) {
        let packDefs = [];
        if (defs === undefined) { return packDefs; }

        defs.forEach(def => {
            const defSet = my.executeQuery(my.cards, packDefs, def.query);
            packDefs[def.defName] = defSet;
            if (defSet.length < 1) {
                console.warn(`WARNING: createPackDefs(): no results from pack definition '${def.defName}': ${def.query}`);
            }
        });
        return packDefs;
    }

    // SHOULD NOT BE CALLED EXCEPT BY executeQuery()
    // Returns only the card indices
    function executeSimpleQuery(fullSet, defs, query, isOrderImportant) {
        let from = query.match(/from\[(.+)\]/i);
        if (!from) {
            console.warn(`ERROR: executeSimpleQuery(): missing 'from' in query: ${query}`);
        }
        else {
            from = from[1];
        }

        let query2 = query.match(/\?(.+)=(.+)/i);

        let result = [];

        // Determine base set to select from
        let sourceSetCards = [];
        if (from == "*") {
            sourceSetCards = fullSet;
        }
        // Select from previously-defined set
        else {
            sourceSetCards = defs[from];
            if (sourceSetCards === undefined) {
                console.warn(`ERROR: executeSimpleQuery(): def '${from}' does not exist within query: ${query}`);
            }
        }
        const sourceSet = Object.values(sourceSetCards)

        // Get the marketing cards that would be appropriate for the given set.
        // This is the equivalent to from[*]?marketing=true&set=(set1|set2|set3|...)
        // 20210702: For now, just gets ALL marketing cards. In the future this will only get appropriate ones.
        // Usage: from[*]?getMarketingCardsForSet({{setCode}})
        // NOTE: This is currently hacky enough that because it doesn't match the "?prop=val" pattern it's not even detected so we'll cut out early and process it.
        // TODO: Refactor to detect single-operator expressions as we may want to use more in the future. Also this would ignore any "and" statements when we implement those.
        if (query.includes('getMarketingCardsForSet(')) {
            const matchingCards = sourceSet.filter(card => card['ad'] && (card['ad'] == true || card['ad'] == 'true'));
            result = matchingCards.map(matchingCard => matchingCard.mtgenId);
        }

        // Execute the query on the whole set
        else if (!query2) {
            result = sourceSet.map(card => card.mtgenId);
        }
        else {
            let matchingCards, clause, queryTitles, queryMatchTitles;
            if (query2[2].includes('contains(') || query2[0].includes('~=(')) {
                // 'contains(X)' or '~=(X)' clause, like colour=contains({W}|{G}), i.e.: we're basically letting the user specify a regex within the contains().
                const prop = query2[1].replace(/~/g, '');
                clause = query2[2].replace(/contains\(/g, '').replace(/\(/g, '').replace(/\)/g, '');
                matchingCards = sourceSet.filter(card => card[prop] && card[prop].match(clause));
                result = matchingCards.map(matchingCard => matchingCard.mtgenId);
            } else if (query2[2].includes('rarityByWeight2020(') || query2[2].includes('rarityByWeight2008(')) {
                // 'rarityByWeight(curm)' is valid when the property is 'rarity'
                // This will choose cards from the source according to rarity chances.
                // The first mythic rares appeared in Shards of Alara (ALA, 2008), assuming a card set of 14, with 10c, 3u, 1r, and 1/8 chance of m instead of r.
                // As of ZNR (2020) mythic rare odds changed, assuming a card set of 14, with 10c, 3u, 1r, and 1/7.4 chance of m instead of r.
                // Note that if, for instance, mythic is chosen it will return ALL mythic cards, so
                //   if you had done a take[5] on this you'll end up with 5 mythic cards. This is really intended
                //   for choosing a single card with a proper chance per rarity.
                const prop = query2[1].replace(/~/g, '');
                if (prop != 'rarity') {
                    console.warn(`WARNING: executeSimpleQuery(): 'rarityByWeight() can only be used with property 'rarity' so that's what will happen: ${query}`);
                }

                const chosenRarities = new Set(query2[2].replace(/rarityByWeight2008\(/g, '').replace(/rarityByWeight2020\(/g, '').replace(/\)/g, '').replace(/ /g, '').replace(/,/g, '').trim().toLowerCase().split(''));

                let weightedRaritySet = [];
                // Mythic odds = 1/8 starting with Shards of Alara (ALA 2008). Changed to 1/7.4 for Zendiar Rising (ZNR 2020).
                const mythicOdds = query2[2].includes('rarityByWeight2008(') ? 8 : 7.4;
                chosenRarities.forEach(rarity => {
                    switch (rarity) {
                        case 'c': weightedRaritySet.push({ 'rarity': rarity, 'percent': 10 / 14 }); break;
                        case 'u': weightedRaritySet.push({ 'rarity': rarity, 'percent': 3 / 14 }); break;
                        case 'r': weightedRaritySet.push({ 'rarity': rarity, 'percent': 1 / 14 }); break;
                        case 'm': weightedRaritySet.push({ 'rarity': rarity, 'percent': (1 / mythicOdds) / 14 }); break;
                        default:
                            console.warn(`WARNING: executeSimpleQuery(): 'rarityByWeight() contains unknown rarity '${rarity}' which will be ignored: ${query}`);
                            return output;
                    }
                });

                //TODO: this logic is taken directly from generateCardSetFromPack() in this file. Abstract them?

                // Randomly pick a percentage within our whole.
                const totalWeight = weightedRaritySet.reduce((total, rarity) => total + rarity.percent, 0);
                let percent = my.currentPRNG() * totalWeight;
                if (percent > totalWeight) { percent = totalWeight; }

                // Find the rarity associated with that percentage.
                let currentWeight = 0;
                const chosenRarity = weightedRaritySet.find(rarity => {
                    currentWeight += rarity.percent;
                    if (currentWeight >= percent) { return true; }
                });

                // 'Common' includes basic lands.
                if (chosenRarity.rarity == 'c') {
                    matchingCards = sourceSet.filter(card => card['rarity'] && (card['rarity'] == chosenRarity.rarity || card['rarity'] == 'b'));
                }
                else {
                    matchingCards = sourceSet.filter(card => card['rarity'] && card['rarity'] == chosenRarity.rarity);
                }
                result = matchingCards.map(matchingCard => matchingCard.mtgenId);
            }
            else if (query2[2].includes('(')) {
                // 'in' clause
                // Special case: ### - ### will translate to a numeric range
                const numericRangeMatch = query2[2].match(/\(\s*([0-9]*?)\s*-\s*([0-9]*?)\s*\)/);
                if (numericRangeMatch) {
                    const startNum = Math.min(numericRangeMatch[1], numericRangeMatch[2]);
                    const endNum = Math.max(numericRangeMatch[1], numericRangeMatch[2]);
                    const expandedNumberArray = Array.from({ length: (endNum - startNum) }, (v, k) => k + startNum);
                    const generatedInClause = '(' + expandedNumberArray.join('|') + ')';
                    query2[2] = generatedInClause;
                }

                // WAS doing greedy matching.. |Smite| was matching "Loxodon Smiter", so ^(****)$ required (^=start of string, $=end of string)
                clause = '^(' + query2[2].replace(/\(/g, '').replace(/\)/g, '') + ')$';

                if (query2[1] == 'title') {
                    queryTitles = clause.replace('\^(', '').replace(')\$', '').split('|');
                    queryMatchTitles = queryTitles.map(queryTitle => my.createMatchTitle(queryTitle));
                    clause = '^(' + queryMatchTitles.join('|') + ')$';
                    // TODO: wtf? I'm doing a creteMatchTitle() on card['matchTitle']??
                    matchingCards = sourceSet.filter(card => card.hasOwnProperty('matchTitle') && my.createMatchTitle(card['matchTitle']).match(clause));
                }
                else {
                    clause = clause.toLowerCase();
                    matchingCards = sourceSet.filter(card => card.hasOwnProperty(query2[1]) && card[query2[1]] != null && card[query2[1]].toString().toLowerCase().match(clause));
                }

                // if it's a title query and the query specified "inOrder:true" then the order of the cards is important; sort by that
                if (query2[1] == 'title' && isOrderImportant === true) {
                    let sortedCards = [];
                    queryMatchTitles.forEach(queryMatchTitle => {
                        const foundCard = matchingCards.find(matchingCard => matchingCard.matchTitle == queryMatchTitle);
                        if (foundCard) {
                            sortedCards.push(foundCard);
                        }
                    });
                    matchingCards = sortedCards;
                }
                result = matchingCards.map(matchingCard => matchingCard.mtgenId);

                // if we're dealing with named cards, check if any items in the list are missing -- we'll call this an error and generate an error card
                if (query2[1] == 'title' && result.length < queryMatchTitles.length) {
                    const foundCardTitles = matchingCards.map(matchingCard => matchingCard.matchTitle);
                    const missingMatchTitles = queryMatchTitles.filter(x => !foundCardTitles.includes(x));
                    missingMatchTitles.forEach(matchTitle =>
                        console.warn(`WARNING: missing card: '${matchTitle}' from query: ${query}`)
                    );
                }
            }
            else if (query2[0].includes('~=')) {
                // Value contains
                query2[1] = query2[1].replace(/~/g, '');
                query2[2] = query2[2].replace(/'/g, '');

                // If we're dealing with named cards, certain characters need to be converted
                matchingCards = [];
                if (query2[1] == 'title') {
                    const matchTitle = my.createMatchTitle(query2[2]);
                    matchingCards = sourceSet.filter(card => card.hasOwnProperty('matchTitle') && card['matchTitle'].includes(matchTitle));
                }
                else {
                    if (query2[2] === undefined || query2[2] === '') {
                        matchingCards = sourceSet.filter(card => !card.hasOwnProperty(query2[1]) || card[query2[1]].includes(query2[2]));
                    }
                    // If it's a boolean query, convert both sides to boolean and test
                    else if (query2[2] === true || query2[2] === 'true' || query2[2] === false || query2[2] === 'false') {
                        const boolQueryValue = JSON.parse(query2[2]);
                        matchingCards = sourceSet.filter(card => {
                            if (card[query2[1]] !== undefined) {
                                if (boolQueryValue === true) {
                                    return (card[query2[1]] === true || card[query2[1]] === 'true');
                                }
                                else {
                                    return (card[query2[1]] === false || card[query2[1]] === 'false');
                                }
                            }
                        });
                    }
                    else {
                        matchingCards = sourceSet.filter(card => card[query2[1]] !== undefined && card[query2[1]].includes(query2[2]));
                    }
                }
                result = matchingCards.map(matchingCard => matchingCard.mtgenId);
            }
            else if (query2[0].includes('!=')) {
                // NOT equals
                query2[2] = query2[2].replace(/'/g, '');
                query2[1] = query2[1].replace(/!/g, '');

                // If we're dealing with named cards, certain characters need to be converted
                matchingCards = [];
                if (query2[1] == 'title') {
                    const matchTitle = my.createMatchTitle(query2[2]);
                    matchingCards = sourceSet.filter(card => !card.hasOwnProperty('matchTitle') || card['matchTitle'] != matchTitle);
                }
                else {
                    if (query2[2] === undefined || query2[2] === '') {
                        matchingCards = sourceSet.filter(card => !card.hasOwnProperty(query2[1]) || card[query2[1]] != query2[2]);
                    }
                    // If it's a boolean query, convert both sides to boolean and test
                    else if (query2[2] === true || query2[2] === 'true' || query2[2] === false || query2[2] === 'false') {
                        const boolQueryValue = JSON.parse(query2[2]);
                        matchingCards = sourceSet.filter(card => {
                            if (card[query2[1]] === undefined) return true; // If it doesn't have the property we'll say it passes the test.
                            if (boolQueryValue === true) {
                                return (card[query2[1]] === false || card[query2[1]] === 'false');
                            }
                            else {
                                return (card[query2[1]] === true || card[query2[1]] === 'true');
                            }
                        });
                    }
                    else {
                        matchingCards = sourceSet.filter(card => card[query2[1]] === undefined || card[query2[1]] != query2[2]);
                    }
                }
                result = matchingCards.map(matchingCard => matchingCard.mtgenId);
            }
            else {
                //TODO: we should actually PARSE the symbol and throw an error if it's wrong
                // Regular equals
                query2[2] = query2[2].replace(/'/g, '');

                // If we're dealing with named cards, certain characters need to be converted
                matchingCards = [];
                if (query2[1] == 'title') {
                    const matchTitle = my.createMatchTitle(query2[2]);
                    matchingCards = sourceSet.filter(card => card.hasOwnProperty('matchTitle') && card['matchTitle'] == matchTitle);
                }
                else {
                    if (query2[2] === undefined || query2[2] === '') {
                        matchingCards = sourceSet.filter(card => !card.hasOwnProperty(query2[1]) || card[query2[1]] == query2[2]);
                    }
                    // If it's a boolean query, convert both sides to boolean and test
                    else if (query2[2] === true || query2[2] === 'true' || query2[2] === false || query2[2] === 'false') {
                        const boolQueryValue = JSON.parse(query2[2]);
                        matchingCards = sourceSet.filter(card => {
                            if (card[query2[1]] !== undefined) {
                                if (boolQueryValue === true) {
                                    return (card[query2[1]] === true || card[query2[1]] === 'true');
                                }
                                else {
                                    return (card[query2[1]] === false || card[query2[1]] === 'false');
                                }
                            }
                        });
                    }
                    else {
                        matchingCards = sourceSet.filter(card => card[query2[1]] !== undefined && card[query2[1]] == query2[2]);
                    }
                }
                result = matchingCards.map(matchingCard => matchingCard.mtgenId);
            }
        }

        return result;
    }

    // The pattern should be something like: from[*]?rarity=(c,u,r,mr)+from[*]?type='Land'-from[*]?type=('Marketing','Token')
    // i.e.: a base query then a set of set addition and subtractions
    // fullSet = all card objects
    my.executeQuery = function (fullSet, defs, query, isOrderImportant) {
        const queries = query.split(/(\+|-)(?=from|take)/); // split on + or - (set operators), but keep the operator

        let operator = '';
        let firstRun = true;
        let resultIndices = [];
        queries.forEach((query, index) => {
            // On the first run though, the initial query should just be the base
            if (firstRun === true) {
                resultIndices = executeSimpleQuery(fullSet, defs, query, isOrderImportant); // returns only indices
                //console.log('executeSimpleQuery count/query:' + resultIndices.length + '/' + query);
                firstRun = false;
            }
            else {
                // Now every even array element should be the operator
                if (index % 2 == 1) {
                    operator = query;
                }
                else {
                    const set = executeSimpleQuery(fullSet, defs, query, isOrderImportant); // returns only indices
                    //console.log('executeSimpleQuery count/query:' + set.length + '/' + query);
                    switch (operator) {
                        case "+": resultIndices = resultIndices.concat(set); break;
                        case "-": resultIndices = resultIndices.filter(x => !set.includes(x)); break;
                        default: console.error(`ERROR: expected + or - operator in query '${query}' but instead found '${operator}'`);
                    }
                }
            }
        });

        // Match these indices back up with the actual objects and return that
        const finalResult = resultIndices.map(resultIndex => fullSet[resultIndex]);

        if (finalResult.length < 1) {
            console.warn(`WARNING: executeQuery(): no results from query: ${query}`);
        }

        return finalResult;
    }

    my.getPack = function (packName) {
        return my.packs.find(pack => pack.packName == packName);
    };

    my.CountCardsInSets = function (cardSets) {
        return cardSets.reduce((total, cardSet) => total + cardSet.length, 0);
    };

    function randomCards(queryDefForDebug, cards, num, excludeIndices) {
        if (cards.length < 1) { return []; }

        let validCards = cards.slice(); // shallow clone
        if (excludeIndices && excludeIndices.length > 0) {
            validCards = validCards.filter(card => !excludeIndices.includes(card.mtgenId));
            if (num > validCards.length) {
                console.warn("ERROR: Trying to choose " + num + " cards but after excluded cards, only " + validCards.length + " available. Source query: " + queryDefForDebug + " Taking all:", validCards);
            }
        }

        // Keep taking cards until we get the desired number, even if we're grabbing duplicates
        let chosenCards = [];
        if (validCards.length > 0) {
            while (chosenCards.length < num) {
                let newCards = my.sample(validCards, num);
                const numDiff = (chosenCards.length + newCards.length) - num; // 0: we're good. negative: need more cards. positive: too many now; trim newCards by this number
                if (numDiff > 0) {
                    newCards = newCards.slice(numDiff); // trims the last numDiff elements from the array
                }
                chosenCards = chosenCards.concat(newCards);
            }
        }

        return chosenCards;
    }

    // Sample **n** random values from an array.
    // If **n** is not specified, returns a single random element.
    // The internal `guard` argument allows it to work with `map`.
    // Taken from Underscore.
    my.sample = function (arr, n, guard) {
        if (n == null || guard) {
            return arr[my.random(arr.length - 1)];
        }
        return my.shuffle(arr).slice(0, Math.max(0, n));
    }

    // Shuffle an array. Taken from Underscore.
    my.shuffle = function (arr) {
        const length = arr.length;
        let shuffled = Array(length);
        for (let index = 0, rand; index < length; index++) {
            rand = my.random(0, index);
            if (rand !== index) shuffled[index] = shuffled[rand];
            shuffled[rand] = arr[index];
        }
        return shuffled;
    }

    // Return a random integer between min and max (inclusive). Taken from Underscore.
    my.random = function (min, max) {
        if (max == null) {
            max = min;
            min = 0;
        }
        return min + Math.floor(my.currentPRNG() * (max - min + 1));
    }

    /* --------- Sorting All Cards --------------------------------------------------------------------------------------------------------------------- */

    my.sortOrders = {
        none: { sort: 'none' }
        , name: { sort: 'name' }
        , colour: { sort: 'colour' }
        , rarity: { sort: 'rarity' }
        , cost: { sort: 'cost' }
        , type: { sort: 'type' }
        , set: { sort: 'set' }
        , guild: { sort: 'guild' }
        , clan: { sort: 'clan' }
        , faction: { sort: 'faction' }
        , college: { sort: 'college' }
        , family: { sort: 'family' }
        , order: { sort: 'order' } // opened order within the set
    };

    my.sortBy = function (prop, a, b) {
        const aProp = a[prop];
        const bProp = b[prop]
        return ((aProp < bProp) ? -1 : ((aProp > bProp) ? 1 : 0));
    }

    my.sortAllByNothing = function (cardList) {
        cardList.sortOrder = my.sortOrders.none;
        return cardList;
    };

    my.sortAllByTitle = function (cardList) {
        const cards = cardList.sort((a, b) => my.sortBy('matchTitle', a, b));
        cards.sortOrder = my.sortOrders.name;
        return cards;
    };

    my.getBasicLandCards = function (cardList) {
        let cards = cardList.filter(card => card.type == 'Basic Land');
        if (cards.length > 0) {
            cards = cards.sort((a, b) => my.sortBy('matchTitle', a, b));
            cards.setDesc = 'Basic Land';
            cards.sortOrder = my.sortOrders.name;
        }
        return cards;
    };

    my.getOtherCards = function (allCards, selectedCards) {
        let cards = allCards.filter(x => !selectedCards.includes(x));
        if (cards.length > 0) {
            cards = cards.sort((a, b) => my.sortBy('matchTitle', a, b));
            cards.setDesc = 'Other';
            cards.sortOrder = my.sortOrders.name;
        }
        return cards;
    };

    my.sortIntoArray = function (groupedCardSets, sortObj) {
        let cardSets = [];
        for (let sortItem in sortObj) {
            const thisSortItem = sortObj[sortItem];
            let set = groupedCardSets[thisSortItem.code];
            if (set) {
                set.sorder = thisSortItem.sorder;
                cardSets.push(set);
            }
        }
        cardSets = cardSets.sort((a, b) => my.sortBy('sorder', a, b));
        return cardSets;
    };

    // Returns an object containing one array for each unique propName found.
    my.groupByProperty = function (arr, propName) {
        const out = arr.reduce((final, elem) => {
            const propValue = elem[propName];
            if (!final.hasOwnProperty(propValue)) {
                final[propValue] = [];
            }
            final[propValue].push(elem);
            return final;
        }, {});
        return out;
    }

    my.sortAllByColour = function (cardList) {
        let sortedSets = [];

        // For each colour, create a new card set
        let mainCards = cardList.filter(card => card.usableForDeckBuilding === true && card.type != 'Basic Land' && !card.token);
        let groupedCardSets = my.groupByProperty(mainCards, 'colour');
        const cardSets = this.sortIntoArray(groupedCardSets, my.colours);
        cardSets.forEach(cardSet => {
            let set = cardSet.sort((a, b) => my.sortBy('matchTitle', a, b));
            const colour = my.getColourByCode(set[0].colour);
            set.setDesc = colour.name;
            set.sortOrder = my.sortOrders.name;
            sortedSets.push(set);
        });

        const basicLandCards = my.getBasicLandCards(cardList);
        if (basicLandCards.length > 0) {
            sortedSets.push(basicLandCards);
        }

        // Flatten the grouped sets into a flat array of single cards.
        const selectedCards = sortedSets.reduce((allCards, sortedSet) => allCards.concat(sortedSet), []);
        const otherCards = my.getOtherCards(cardList, selectedCards);
        if (otherCards.length > 0) {
            sortedSets.push(otherCards);
        }

        sortedSets.sortOrder = my.sortOrders.colour;

        return sortedSets;
    };

    my.sortAllByRarity = function (cardList) {
        let sortedSets = [];

        // For each rarity, create a new card set
        let mainCards = cardList.filter(card => card.usableForDeckBuilding === true && card.type != 'Basic Land' && !card.token);
        let groupedCardSets = my.groupByProperty(mainCards, 'rarity');
        const cardSets = this.sortIntoArray(groupedCardSets, my.rarities);
        cardSets.forEach(cardSet => {
            let set = cardSet.sort((a, b) => my.sortBy('matchTitle', a, b));
            const rarity = my.getRarityByCode(set[0].rarity);
            set.setDesc = rarity.name;
            set.sortOrder = my.sortOrders.name;
            sortedSets.push(set);
        });

        const basicLandCards = my.getBasicLandCards(cardList);
        if (basicLandCards.length > 0) {
            sortedSets.push(basicLandCards);
        }

        // Flatten the grouped sets into a flat array of single cards.
        const selectedCards = sortedSets.reduce((allCards, sortedSet) => allCards.concat(sortedSet), []);
        const otherCards = my.getOtherCards(cardList, selectedCards);
        if (otherCards.length > 0) {
            sortedSets.push(otherCards);
        }

        sortedSets.sortOrder = my.sortOrders.rarity;

        return sortedSets;
    };

    my.sortAllByCost = function (cardList) {
        let sortedSets = [];

        // For each converted cost, create a new card set
        let mainCards = cardList.filter(card => card.usableForDeckBuilding === true && card.type != 'Basic Land' && !card.token);
        let groupedCardSets = my.groupByProperty(mainCards, 'ccost');
        const cardSets = Object.keys(groupedCardSets).map(key => groupedCardSets[key]);
        cardSets.forEach(cardSet => {
            let set = cardSet.sort((a, b) => my.sortBy('matchTitle', a, b));
            set.setDesc = 'Cost ' + set[0].ccost;
            set.sortOrder = my.sortOrders.name;
            sortedSets.push(set);
        });

        const basicLandCards = my.getBasicLandCards(cardList);
        if (basicLandCards.length > 0) {
            sortedSets.push(basicLandCards);
        }

        // Flatten the grouped sets into a flat array of single cards.
        const selectedCards = sortedSets.reduce((allCards, sortedSet) => allCards.concat(sortedSet), []);
        const otherCards = my.getOtherCards(cardList, selectedCards);
        if (otherCards.length > 0) {
            sortedSets.push(otherCards);
        }

        sortedSets.sortOrder = my.sortOrders.cost;

        return sortedSets;
    };

    my.sortAllByType = function (cardList) {
        let sortedSets = [];

        // For each card type, create a new card set
        let mainCards = cardList.filter(card => card.usableForDeckBuilding === true && card.type != 'Basic Land' && !card.token);
        let groupedCardSets = my.groupByProperty(mainCards, 'typeCode');
        const cardSets = this.sortIntoArray(groupedCardSets, my.cardTypes);
        cardSets.forEach(cardSet => {
            let set = cardSet.sort((a, b) => my.sortBy('matchTitle', a, b));
            set.setDesc = getCardTypeByCode(set[0].typeCode).name;
            set.sortOrder = my.sortOrders.name;
            sortedSets.push(set);
        });

        const basicLandCards = my.getBasicLandCards(cardList);
        if (basicLandCards.length > 0) {
            sortedSets.push(basicLandCards);
        }

        // Flatten the grouped sets into a flat array of single cards.
        const selectedCards = sortedSets.reduce((allCards, sortedSet) => allCards.concat(sortedSet), []);
        const otherCards = my.getOtherCards(cardList, selectedCards);
        if (otherCards.length > 0) {
            sortedSets.push(otherCards);
        }

        sortedSets.sortOrder = my.sortOrders.type;

        return sortedSets;
    };

    my.sortAllByGuild = function (cardList) {
        let sortedSets = [];

        // For each guild, create a new card set
        let mainCards = cardList.filter(card => card.usableForDeckBuilding === true && card.type != 'Basic Land' && !card.token);
        let groupedCardSets = my.groupByProperty(mainCards, 'guild');
        const cardSets = this.sortIntoArray(groupedCardSets, my.guilds);
        cardSets.forEach(cardSet => {
            let set = cardSet.sort((a, b) => my.sortBy('matchTitle', a, b));
            set.setDesc = getGuildByCode(set[0].guild).name;
            set.sortOrder = my.sortOrders.name;
            sortedSets.push(set);
        });

        let basicLandCards = my.getBasicLandCards(cardList);

        // Flatten the grouped sets into a flat array of single cards.
        const sortedSetCards = sortedSets.reduce((allCards, sortedSet) => allCards.concat(sortedSet), []);
        const guildAndBasicLandCards = basicLandCards.concat(sortedSetCards);

        let nonGuildCards = my.getOtherCards(mainCards, guildAndBasicLandCards);
        if (nonGuildCards.length > 0) {
            nonGuildCards.setDesc = 'Non-Guild';
            sortedSets.push(nonGuildCards);
        }

        if (basicLandCards.length > 0) {
            sortedSets.push(basicLandCards);
        }

        // Flatten the grouped sets into a flat array of single cards.
        const selectedCards = sortedSets.reduce((allCards, sortedSet) => allCards.concat(sortedSet), []);
        const otherCards = my.getOtherCards(cardList, selectedCards);
        if (otherCards.length > 0) {
            sortedSets.push(otherCards);
        }

        sortedSets.sortOrder = my.sortOrders.guild;

        return sortedSets;
    };

    my.sortAllByClan = function (cardList) {
        let sortedSets = [];

        // For each clan, create a new card set
        let mainCards = cardList.filter(card => card.usableForDeckBuilding === true && card.type != 'Basic Land' && !card.token);
        let groupedCardSets = my.groupByProperty(mainCards, 'clan');
        const cardSets = this.sortIntoArray(groupedCardSets, my.clans);
        cardSets.forEach(cardSet => {
            let set = cardSet.sort((a, b) => my.sortBy('matchTitle', a, b));
            set.setDesc = getClanByCode(set[0].clan).name;
            set.sortOrder = my.sortOrders.name;
            sortedSets.push(set);
        });

        let basicLandCards = my.getBasicLandCards(cardList);

        // Flatten the grouped sets into a flat array of single cards.
        const sortedSetCards = sortedSets.reduce((allCards, sortedSet) => allCards.concat(sortedSet), []);
        const clanAndBasicLandCards = basicLandCards.concat(sortedSetCards);

        let nonClanCards = my.getOtherCards(mainCards, clanAndBasicLandCards);
        if (nonClanCards.length > 0) {
            nonClanCards.setDesc = 'Non-Clan';
            sortedSets.push(nonClanCards);
        }

        if (basicLandCards.length > 0) {
            sortedSets.push(basicLandCards);
        }

        // Flatten the grouped sets into a flat array of single cards.
        const selectedCards = sortedSets.reduce((allCards, sortedSet) => allCards.concat(sortedSet), []);
        const otherCards = my.getOtherCards(cardList, selectedCards);
        if (otherCards.length > 0) {
            sortedSets.push(otherCards);
        }

        sortedSets.sortOrder = my.sortOrders.clan;

        return sortedSets;
    };

    my.sortAllByFaction = function (cardList) {
        let sortedSets = [];

        // For each faction, create a new card set
        let mainCards = cardList.filter(card => card.usableForDeckBuilding === true && card.type != 'Basic Land' && !card.token);
        let groupedCardSets = my.groupByProperty(mainCards, 'faction');
        const cardSets = this.sortIntoArray(groupedCardSets, my.factions);
        cardSets.forEach(cardSet => {
            let set = cardSet.sort((a, b) => my.sortBy('matchTitle', a, b));
            set.setDesc = getFactionByCode(set[0].faction).name;
            set.sortOrder = my.sortOrders.name;
            sortedSets.push(set);
        });

        let basicLandCards = my.getBasicLandCards(cardList);

        // Flatten the grouped sets into a flat array of single cards.
        const sortedSetCards = sortedSets.reduce((allCards, sortedSet) => allCards.concat(sortedSet), []);
        const factionAndBasicLandCards = basicLandCards.concat(sortedSetCards);

        let nonFactionCards = my.getOtherCards(mainCards, factionAndBasicLandCards);
        if (nonFactionCards.length > 0) {
            nonFactionCards.setDesc = 'Non-Faction';
            sortedSets.push(nonFactionCards);
        }

        if (basicLandCards.length > 0) {
            sortedSets.push(basicLandCards);
        }

        // Flatten the grouped sets into a flat array of single cards.
        const selectedCards = sortedSets.reduce((allCards, sortedSet) => allCards.concat(sortedSet), []);
        const otherCards = my.getOtherCards(cardList, selectedCards);
        if (otherCards.length > 0) {
            sortedSets.push(otherCards);
        }

        sortedSets.sortOrder = my.sortOrders.faction;

        return sortedSets;
    };

    my.sortAllByCollege = function (cardList) {
        let sortedSets = [];

        // For each college, create a new card set
        let mainCards = cardList.filter(card => card.usableForDeckBuilding === true && card.type != 'Basic Land' && !card.token);
        let groupedCardSets = my.groupByProperty(mainCards, 'college');
        const cardSets = this.sortIntoArray(groupedCardSets, my.colleges);
        cardSets.forEach(cardSet => {
            let set = cardSet.sort((a, b) => my.sortBy('matchTitle', a, b));
            set.setDesc = getCollegeByCode(set[0].college).name;
            set.sortOrder = my.sortOrders.name;
            sortedSets.push(set);
        });

        let basicLandCards = my.getBasicLandCards(cardList);

        // Flatten the grouped sets into a flat array of single cards.
        const sortedSetCards = sortedSets.reduce((allCards, sortedSet) => allCards.concat(sortedSet), []);
        const collegeAndBasicLandCards = basicLandCards.concat(sortedSetCards);

        let nonCollegeCards = my.getOtherCards(mainCards, collegeAndBasicLandCards);
        if (nonCollegeCards.length > 0) {
            nonCollegeCards.setDesc = 'Non-College';
            sortedSets.push(nonCollegeCards);
        }

        if (basicLandCards.length > 0) {
            sortedSets.push(basicLandCards);
        }

        // Flatten the grouped sets into a flat array of single cards.
        const selectedCards = sortedSets.reduce((allCards, sortedSet) => allCards.concat(sortedSet), []);
        const otherCards = my.getOtherCards(cardList, selectedCards);
        if (otherCards.length > 0) {
            sortedSets.push(otherCards);
        }

        sortedSets.sortOrder = my.sortOrders.college;

        return sortedSets;
    };

    my.sortAllByFamily = function (cardList) {
        let sortedSets = [];

        // For each family, create a new card set
        let mainCards = cardList.filter(card => card.usableForDeckBuilding === true && card.type != 'Basic Land' && !card.token);
        let groupedCardSets = my.groupByProperty(mainCards, 'family');
        const cardSets = this.sortIntoArray(groupedCardSets, my.families);
        cardSets.forEach(cardSet => {
            let set = cardSet.sort((a, b) => my.sortBy('matchTitle', a, b));
            set.setDesc = getFamilyByCode(set[0].family).name;
            set.sortOrder = my.sortOrders.name;
            sortedSets.push(set);
        });

        let basicLandCards = my.getBasicLandCards(cardList);

        // Flatten the grouped sets into a flat array of single cards.
        const sortedSetCards = sortedSets.reduce((allCards, sortedSet) => allCards.concat(sortedSet), []);
        const familyAndBasicLandCards = basicLandCards.concat(sortedSetCards);

        let nonFamilyCards = my.getOtherCards(mainCards, familyAndBasicLandCards);
        if (nonFamilyCards.length > 0) {
            nonFamilyCards.setDesc = 'Non-Family';
            sortedSets.push(nonFamilyCards);
        }

        if (basicLandCards.length > 0) {
            sortedSets.push(basicLandCards);
        }

        // Flatten the grouped sets into a flat array of single cards.
        const selectedCards = sortedSets.reduce((allCards, sortedSet) => allCards.concat(sortedSet), []);
        const otherCards = my.getOtherCards(cardList, selectedCards);
        if (otherCards.length > 0) {
            sortedSets.push(otherCards);
        }

        sortedSets.sortOrder = my.sortOrders.family;

        return sortedSets;
    };

    /* --------- Sorting Sets --------------------------------------------------------------------------------------------------------------------- */
    my.sortByTitle = function (cardList) {
        let sortedCards = cardList.sort((a, b) => my.sortBy('matchTitle', a, b));
        sortedCards.sortOrder = my.sortOrders.name;
        return sortedCards;
    };

    my.sortByColour = function (cardList) {
        // Sort by colour then title
        let sortedCards = cardList.sort((a, b) => {
            const aProp = padNum(a.colourOrder, 3) + a.matchTitle;
            const bProp = padNum(b.colourOrder, 3) + b.matchTitle;
            return ((aProp < bProp) ? -1 : ((aProp > bProp) ? 1 : 0));
        });
        sortedCards.sortOrder = my.sortOrders.colour;
        return sortedCards;
    };

    my.sortByRarity = function (cardList) {
        // Sort by rarityOrder, colourorder, then title
        let sortedCards = cardList.sort((a, b) => {
            const aProp = padNum(a.rarityOrder, 3) + padNum(a.colourOrder, 3) + a.matchTitle;
            const bProp = padNum(b.rarityOrder, 3) + padNum(b.colourOrder, 3) + b.matchTitle;
            return ((aProp < bProp) ? -1 : ((aProp > bProp) ? 1 : 0));
        });
        sortedCards.sortOrder = my.sortOrders.rarity;
        return sortedCards;
    };

    my.sortByCost = function (cardList) {
        // Sort by converted cost desc then title
        let sortedCards = cardList.sort((a, b) => {
            const aProp = padNum(100 - a.ccost, 3) + a.matchTitle;
            const bProp = padNum(100 - b.ccost, 3) + b.matchTitle;
            return ((aProp < bProp) ? -1 : ((aProp > bProp) ? 1 : 0));
        });
        sortedCards.sortOrder = my.sortOrders.cost;
        return sortedCards;
    };

    my.sortByType = function (cardList) {
        // Sort by type then title
        let sortedCards = cardList.sort((a, b) => {
            const aProp = padNum(a.typeOrder, 3) + a.matchTitle;
            const bProp = padNum(b.typeOrder, 3) + b.matchTitle;
            return ((aProp < bProp) ? -1 : ((aProp > bProp) ? 1 : 0));
        });
        sortedCards.sortOrder = my.sortOrders.type;
        return sortedCards;
    };

    my.sortByGuild = function (cardList) {
        // Sort by guild then title
        let sortedCards = cardList.sort((a, b) => {
            const aProp = padNum(a.guildOrder, 3) + a.matchTitle;
            const bProp = padNum(b.guildOrder, 3) + b.matchTitle;
            return ((aProp < bProp) ? -1 : ((aProp > bProp) ? 1 : 0));
        });
        sortedCards.sortOrder = my.sortOrders.guild;
        return sortedCards;
    };

    my.sortByClan = function (cardList) {
        // Sort by clan then title
        let sortedCards = cardList.sort((a, b) => {
            const aProp = padNum(a.clanOrder, 3) + a.matchTitle;
            const bProp = padNum(b.clanOrder, 3) + b.matchTitle;
            return ((aProp < bProp) ? -1 : ((aProp > bProp) ? 1 : 0));
        });
        sortedCards.sortOrder = my.sortOrders.clan;
        return sortedCards;
    };

    my.sortByFaction = function (cardList) {
        // Sort by faction then title
        let sortedCards = cardList.sort((a, b) => {
            const aProp = padNum(a.factionOrder, 3) + a.matchTitle;
            const bProp = padNum(b.factionOrder, 3) + b.matchTitle;
            return ((aProp < bProp) ? -1 : ((aProp > bProp) ? 1 : 0));
        });
        sortedCards.sortOrder = my.sortOrders.faction;
        return sortedCards;
    };

    my.sortByCollege = function (cardList) {
        // Sort by college then title
        let sortedCards = cardList.sort((a, b) => {
            const aProp = padNum(a.collegeOrder, 3) + a.matchTitle;
            const bProp = padNum(b.collegeOrder, 3) + b.matchTitle;
            return ((aProp < bProp) ? -1 : ((aProp > bProp) ? 1 : 0));
        });
        sortedCards.sortOrder = my.sortOrders.college;
        return sortedCards;
    };

    my.sortByFamily = function (cardList) {
        // Sort by family then title
        let sortedCards = cardList.sort((a, b) => {
            const aProp = padNum(a.familyOrder, 3) + a.matchTitle;
            const bProp = padNum(b.familyOrder, 3) + b.matchTitle;
            return ((aProp < bProp) ? -1 : ((aProp > bProp) ? 1 : 0));
        });
        sortedCards.sortOrder = my.sortOrders.family;
        return sortedCards;
    };


    // Support functions --------------------------------------------------------------------------------------------------------------------------------

    function padNum(num, width, padChar) {
        padChar = padChar || '0';
        num = num + '';
        return num.padStart(width, padChar);
    }

    function capitaliseFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // from: http://guegue.net/friendlyURL_JS
    my.friendly_url = function (str, max) {
        if (str === undefined) return str;
        if (max === undefined) max = 32;
        let a_chars = new Array(
            new Array("a", /[áàâãªÁÀÂÃ]/g),
            new Array("e", /[éèêÉÈÊ]/g),
            new Array("i", /[íìîÍÌÎ]/g),
            new Array("o", /[òóôõºÓÒÔÕ]/g),
            new Array("u", /[úùûÚÙÛ]/g),
            new Array("c", /[çÇ]/g),
            new Array("n", /[Ññ]/g)
        );
        // Replace vowel with accent without them
        for (let i = 0; i < a_chars.length; i++) {
            str = str.replace(a_chars[i][1], a_chars[i][0]);
        }
        // first replace whitespace by -, second remove repeated - by just one, third turn in low case the chars,
        // fourth delete all chars which are not between a-z or 0-9, fifth trim the string and
        // the last step truncate the string to 32 chars 
        return str.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9\-]/g, '').replace(/\-{2,}/g, '-').replace(/(^\s*)|(\s*$)/g, '').substr(0, max);
    };

    String.prototype.levenshtein =
        function (t) {
            // ith character of s
            var si;
            // cost
            var c;
            // Step 1
            var n = this.length;
            var m = t.length;
            if (!n)
                return m;
            if (!m)
                return n;
            // Matrix
            var mx = [];
            // Step 2 - Init matrix
            for (var i = 0; i <= n; i++) {
                mx[i] = [];
                mx[i][0] = i;
            }
            for (var j = 0; j <= m; j++)
                mx[0][j] = j;
            // Step 3 - For each character in this
            for (var i = 1; i <= n; i++) {
                si = this.charAt(i - 1);
                // Step 4 - For each character in t do step 5 (si == t.charAt(j - 1) ? 0 : 1) and 6
                for (var j = 1; j <= m; j++)
                    mx[i][j] = Math.min(mx[i - 1][j] + 1, mx[i][j - 1] + 1, mx[i - 1][j - 1] + (si == t.charAt(j - 1) ? 0 : 1));
            }
            // Step 7
            return mx[n][m];
        };

    // Find a closely matching string from the given array.
    //
    // levenshteinDistance: Measure of how closely the string must match. The minimum number of single-character edits required to change one word into the other.
    //                      i.e.: The lower the number, the more closely they must match. A good happy medium is around 10.
    // possibleMatchArray: Array of strings we'll try to match against.
    String.prototype.related =
        function (levenshteinDistance, possibleMatchArray) {
            var ld;
            // Return this array
            var a = [];
            // Length of dictionary
            var l = possibleMatchArray.length;
            // for each entry in the dictionary
            for (var i = 0; i < l; i++) {
                // If LD of calling string and string at a[i]
                // is less than t then include a[i] in result
                ld = this.levenshtein(possibleMatchArray[i]);
                if (ld <= levenshteinDistance) {
                    // Save LD and string as we need LD to sort later
                    a.push({ ld: ld, s: possibleMatchArray[i] });
                }
            }
            // Sort by LD ascending
            a.sort(function (a, b) { return a.ld - b.ld });
            return a;
        };

    return my;
}(mtgGen || {}));

// export self when in Node.js
if (typeof(module) == 'object') {
    module.exports = mtgGen;
}