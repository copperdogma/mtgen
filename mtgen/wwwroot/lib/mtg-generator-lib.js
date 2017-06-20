/*
MtG Generator script v2.3 - LIB

Shared/base functions.

Author: Cam Marsollier cam.marsollier@gmail.com

20-May-2017: Replaced all underscore references with native es6 calls.
26-Jan-2016: Now uses mtgenId instead of index.
14-Jan-2016: Percents within querySets can now be expressed as fractions ("7/8") in addition to percents (87.5).
4-Jan-2016: Renamed "colourless" (c) mana to "generic" (g) (new in OGW set)
27-Dec-2015: Broke out this file from mtg-generator.js.

*/
/* jshint laxcomma: true */

// --------------------------------------------------------------------------------------------------------------------------------
// Main module: main structure, query parser, base renderer
// --------------------------------------------------------------------------------------------------------------------------------
var mtgGen = (function (my) {
    'use strict';
    // globals
    my.version = "2.3";
    my.setData = undefined;
    my.packData = undefined;
    my.cardsData = undefined;
    my.hasGuilds = false;
    my.hasClans = false;
    my.hasFactions = false;

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
        let clean = (title+'').trim().toLowerCase();
        clean = clean.replace(/\u00E6/g, 'ae'); // \u00E6 = æ = LATIN LOWER CASE LETTER AE
        clean = clean.trim().replace(/\u00E3\u2020/g, 'ae'); // \u00E3\u2020 = ã† = LATIN LOWER CASE LETTER AE when wotc screws up the encoding;)
        clean = clean.replace(/[^a-z0-9 ]+/g, '');
        clean = clean.replace(/ +/, ' ');

        if (/\uFFFD/.test(title)) {
            console.error('ERROR: replacement character \uFFFD found in title. Change this json file to UTF-8 encoding: ' + title);
        }
        return clean;
    }

    my.getQuerystringParamByName = function (name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        const regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
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
	*/
    my.run = function (options) {
        // Import options into instance variables
        Object.assign(my, options);

        my.SetCardCount = options.setCardCount;

        my.contentElem = document.querySelector(my.getRequiredOption(options, 'contentElem'));

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
        const drawId = my.getQuerystringParamByName('draw');
        if (drawId) {
            drawDataPromise = this.fetchJson(`/${options.setCode}/LoadDraw/${drawId}`);
        }
        else {
            drawDataPromise = Promise.resolve('');
        }

        // Load all of the data once it all arrives
        Promise.all([setFilePromise, cardFilePromises, packFilePromises, productFilePromise, drawDataPromise])
            .catch(err => my.throwTerminalError(err.message))
            .then(([setData, cardDataArray, packDataArray, productData, drawData]) => {
                // Turn set data into an associative array
                my.sets = {};
                setData.forEach(set => my.sets[set.code] = set);
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
                my.products = productData.products;

                // The card definitions and packs - from the array of individual defs/packs within packDataArray
                my.defs = packDataArray.reduce((cardDefs, packData) => cardDefs.concat(packData.defs), []);
                my.packs = packDataArray.reduce((cardPacks, packData) => cardPacks.concat(packData.packs), []);

                // The saved draw to be loaded (optional)
                //TODO: why isn't the json being parsed by fetchJson()? all the others work fine -- am I not returning it properly?
                my.draw = drawData === "" ? undefined : JSON.parse(drawData);
                my.hasDraw = () => my.draw !== undefined;
                my.hasDrawForCurrentProduct = () => {
                    const options = my.mainView.currentView.options;
                    return my.draw && my.draw.sets && my.draw.sets.length > 0
                        && options !== undefined
                        && options.originalProductName !== undefined
                        && options.originalProductName === my.draw.productName;
                };
                if (my.hasDraw()) {
                    my.draw.code = my.getQuerystringParamByName('draw');
                    window.dispatchEvent(new CustomEvent('draw', { detail: { setCode: my.setCode, code: my.draw.code } }));
                }

                // Add card indicies and sort orders for internal use
                let setCardsLoadedCount = 0;
                let goodCards = {};
                let finalCards = {};
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

                    card.ccost = calculateConvertedCost(card.cost);

                    // Ensure defaults on some fields are set; makes querying WAY easier
                    if (card.token === undefined) {
                        card.token = false;
                    }
                    if (card.usableForDeckBuilding === undefined) {
                        card.usableForDeckBuilding = true; // i.e., it IS usable unless specified
                    }
                    if (card.set == my.setCode && (card.usableForDeckBuilding === undefined || card.usableForDeckBuilding === true)) {
                        setCardsLoadedCount++;
                        window.dispatchEvent(new CustomEvent('playableCardLoaded', { detail: { setCardsLoadedCount } }));
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

                my.SetCardsLoadedCount = setCardsLoadedCount;

                // Render the Main view
                my.mainView = new my.MainView({ el: my.contentElem });
                my.mainView.render();

                window.dispatchEvent(new Event('ready'));
            });
    };

    // Private MtG Generator functions --------------------------------------------------------------------------------------------------------------------------------

    function calculateConvertedCost(cost) {
        if (cost === undefined || cost.length < 1) { return 0; }

        const fixedCost = cost.trim().toLowerCase();

        let costParts = [];
        // Three possible formats:
        // ONE (older): {8}{G}{BG}
        const regEx1 = /{([^}]+)}/g;
        let match;
        do {
            match = regEx1.exec(fixedCost);
            if (match) {
                costParts.push(match[1]);
            }
        } while (match);

        // TWO (newer): (R///) (R///)
        const regEx2 = /\(([^\)]+)\)/g;
        do {
            match = regEx2.exec(fixedCost);
            if (match) {
                costParts.push(match[1]);
            }
        } while (match);

        // THREE (newer): 8GB
        if (costParts.length < 1) {
            costParts = fixedCost.split("");
        }

        let ccost = 0;
        costParts.forEach(mana => {
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
        //console.log('executeSimpleQuery:' + query);
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

        // Execute the query on the set
        if (!query2) {
            result = sourceSet.map(card => card.mtgenId);
        }
        else {
            let matchingCards, clause, queryTitles, queryMatchTitles;
            if (query2[2].includes('contains(')) {
                // 'contains' clause, like colour=contains({W}|{G}), i.e.: we're basically letting the user specify a regex within the contains()
                clause = query2[2].replace(/contains\(/g, '').replace(/\)/g, '');
                matchingCards = sourceSet.filter(card => card[query2[1]] && card[query2[1]].match(clause));
                result = matchingCards.map(matchingCard => matchingCard.mtgenId);
            }
            else if (query2[2].includes('(')) {
                // 'in' clause
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
                    matchingCards = sourceSet.filter(card => card.hasOwnProperty(query2[1]) && card[query2[1]].toString().toLowerCase().match(clause));
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
            else {
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
                const totalWeight = cardDef.querySet.reduce((total, query) => total + query.percent, 0);

                // Choose the card query percent; we want decimal numbers because the cards can be specified as such (e.g.: 1/8 chance = 12.5%)
                let percent = Math.random() * totalWeight;
                if (percent > totalWeight) { percent = totalWeight; }

                // Choose the card query that matches that weighted percentage
                let currentWeight = 0;
                const chosenCardDefItem = cardDef.querySet.find(cardDefItem => {
                    currentWeight += cardDefItem.percent;
                    if (currentWeight >= percent) { return true; }
                });
                cardQueries.push(chosenCardDefItem);
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
                cardIndices.push(card.mtgenId);
                cardSet.push(card);
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
        return min + Math.floor(Math.random() * (max - min + 1));
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

    return my;
}(mtgGen || {}));