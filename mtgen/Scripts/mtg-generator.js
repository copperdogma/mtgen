/*
MtG Generator script v2

Author: Cam Marsollier cam.marsollier@gmail.com

Normally 15 cards per booster:

 1: Land
 2: Common
 3: Common
 4: Common
 5: Common
 6: Common
 7: Common
 8: Common
 9: Common
10: Common
11: Uncommon
12: Uncommon
13: Uncommon
14: Rare (7/8 chance) or Mythic Rare (1/8 chance)		
15: Marketing Card or Token --- not sure of the chance on this

- 1 in 4 boosters contains a foil which may be any card of any rarity (incl Basic Land), which replaces a Common

3-Jan-2014: Added Other Colourless category to handle new FRF {8} Ugin, the Spirit Dragon.
18-Sep-2014: Added Back to Top buttons.
2-Sep-2014: Now includes clan support for ktk.
1-Sep-2014: Now allows product.isVisible so you can leave templates in place while publishing out only products that are ready.
30-Aug-2014: Now includes guild support.
29-Aug-2014: matchTitle now removes ALL occurances of bad chars. 
27-Aug-2014: Now tosses cards without titles (probably comments) before they can do damage. 
27-Aug-2014: Now uses createMatchTitle() to sanitize all title comparisons. 
27-Aug-2014: Now returns the single card title not found in an IN query instead of every card in the list.
27-Aug-2014: Does much better dynamic choosing of the card type.
26-Aug-2014: Added Conspiracy type.
23-Aug-2014: No longer errantly matches substrings using "in" clause, e.g.: =(x|y|z)
21-Aug-2014: Added default and autoGenerate support to product.options.buttons. Basically finished off button support.
21-Aug-2014: Added additional card type overrides: enchantment creature, legendary enchantment creature, legendary enchantment artifact
12-Aug-2014: Now allows - in card names.
10-Aug-2014: Added inOrder param on query. And now allows querySets with blank percents (will assume each has an equal chance).
8-Aug-2014: Removed linq.js altogether -- replaced with Underscore.
8-Aug-2014: packs.json:canBeDuplicate=true now allows multiple of the same card even when that count exceeds the number of cards available
7-Aug-2014: packs.json format changed: got rid of redundant cards.CARD, compacted percents.percent format, compacted setValues
6-Aug-2014: Okay major rewrite. Added menu system, Sort All and Sort Set by name/colour/rarity/cost/type/order, all/set export, refactored a lot with Underscore...
17-Jul-2014: Moved everything into modules: core, main view, all cards, card packs, export
14-Jul-2014: Interface now uses Bootstrap views.
13-Jul-2014: Replaced jlinq.js with linq.js.
13-Jul-2014: Got rid of generateExtraBooster, extraBoosterName, singleBoosterName, and numBoostersElem options -- the new method covers everything and remains pretty simple
10-Jul-2014: Now sorts colours and land so usableForDeckBuilding=false cards (Basic Land, Other) end up at the bottom away from normal cards.
10-Jul-2014: Now fires layoutChanging and layoutChanged.
10-Jul-2014: Now shows title and includedReason below every card.
6-Jul-2014: Changed rarity sort order from c-u-r-mr to mr-r-u-c for reddit:ziggynix.
6-Jul-2014: Replaced use of jquery.base64.min.js with mdn.base64.min.js in setLinkToDownloadFile(). I think jquery.base64.min.js broke due to jquery 2.10+ uprgrade.
26-Jun-2014: Added txt (Magic Online) export format.
26-Jun-2014: Added sort by rarity.
26-Jun-2014: Added colours and rarities, killed cindex
9-Apr-2014: Added mtgGen.createInputs() to generate inputs programatically and add count boxes.
27-Jan-2014: Added new pack property "includeWithUserCards", used to filter out non-user cards (promos) when sorting all by colour.
25-Jan-2014: New query operator added: contains().
16-Sep-2013: Can now override card width with "width" propery in json.
5-Sep-2013: Added totalCardsInSet parameter, exposed on main obj, plus SetCardsLoadedCount on main obj, available after load. Now fires playableCardLoaded.		
7-May-2013: Rewritten using js module pattern.
30-Apr-2013: Added master set.json to root dir and fixed output formats to put everything in sideboard and properly output set codes/names.
25-Apr-2013: Now exports to .dec, .coll, .cod, .mwDeck formats.
23-Apr-2013: No longer keeps a card foil once it's randomly assigned as foil.
23-Apr-2013: Fixed bug where in(one|two|three) was matching "threesome" (|Smite| was matching "Loxodon Smiter").. greedy regex!
23-Apr-2013: Now takes cardFiles as an option which is an array of card packs to load in instead of fixed cardFile, tokenFile, otherFile.
21-Jan-2013: Now supports packs.txt file for custom pack definitions per set.
4-Jan-2013: Global sorting by colour/pack now works.
4-Jan-2013: Foil card can no longer be a duplicate of card already in pack.
3-Jan-2013: Now works even if missing card subsets (like lands) or you don't have enough non-duplicate cards to choose the correct number (just allows duplicates in that case). This lets you generate sets from limited spoiler sets.
29-Dec-2012: Modified foil output for styling.
7-Jul-2012: Changed to json-based data with a cards.json file.
3-Jul-2012: Modified for 2013 Core Set
- Added ' - Foil' to the title if the card was a foil card.
23-Apr-2012: Modified for Avacyn Restored
- There are no Double Faced or Checklist cards.
27-Sep-2011: Bugs from Mike Whittington.
- Now replaces a common with a Double-Face card instead of using Double-Faced cards as their actual rarity.
- No longer allows duplicates.
- Now works in Firefox (oops).

	TODO: 
		- hacky semi-global variables: my.mainView.currentView, my.menuSortOrder
*/
/* jshint laxcomma: true */

// --------------------------------------------------------------------------------------------------------------------------------
// Main module: main structure, query parser, base renderer
// --------------------------------------------------------------------------------------------------------------------------------
var mtgGen = (function (my, $) {
    'use strict';
    // globals
    my.setData = undefined;
    my.packData = undefined;
    my.cardsData = undefined;
    my.hasGuilds = false;
    my.hasClans = false;

    my.initViews = []; // for modules to add their views to be run once at the start of the app

    // Event handling via Backbone: http://documentcloud.github.io/backbone/
    _.extend(my, Backbone.Events);

    /* NOTE: these colours and rarities are duplicated in importer-gm-json.js. If you change this here you must change it there. */
    my.colours = {
        white       : { sorder: 1, code: 'w', name: 'White' },
        blue        : { sorder: 2, code: 'u', name: 'Blue' },
        black       : { sorder: 3, code: 'b', name: 'Black' },
        red         : { sorder: 4, code: 'r', name: 'Red' },
        green       : { sorder: 5, code: 'g', name: 'Green' },
        multicolour : { sorder: 6, code: 'm', name: 'Multicolour' },
        artifact    : { sorder: 17, code: 'a', name: 'Artifact', colourless: true },
        land        : { sorder: 27, code: 'l', name: 'Land' , colourless: true },
        colorless   : { sorder: 30, code: 'c', name: 'Colourless', colourless: true },
        other       : { sorder: 37, code: 'o', name: 'Other: Token/Pack-In/Marketing', colourless: true },
        unknown     : { sorder: 97, code: '?', name: 'Unknown Colour' , colourless: true },
    };
    function getColourByCode(code) {
        for (var colour in my.colours) {
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
        mythic: { sorder: 1, code: 'm', name: 'Mythic Rare' },
        rare: { sorder: 2, code: 'r', name: 'Rare' },
        uncommon: { sorder: 3, code: 'u', name: 'Uncommon' },
        common: { sorder: 4, code: 'c', name: 'Common' },
        special: { sorder: 5, code: 's', name: 'Special' },
        unknown: { sorder: 97, code: '?', name: 'Unknown' },
    };
    function getRarityByCode(code) {
        for (var rarity in my.rarities) {
            if (my.rarities[rarity].code == code) {
                return my.rarities[rarity];
            }
        }
        return my.rarities.unknown;
    }

    // from: http://mtgjson.com/#documentation
    my.cardTypes = {
        planeswalker: { sorder: 1, code: 'p', name: 'Planeswalker' },
        conspiracy: { sorder: 2, code: 'y', name: 'Conspiracy' },
        creature: { sorder: 3, code: 'c', name: 'Creature' },
        instant: { sorder: 4, code: 'i', name: 'Instant' },
        sorcery: { sorder: 5, code: 's', name: 'Sorcery' },
        enchantment: { sorder: 6, code: 'e', name: 'Enchantment' },
        artifact: { sorder: 7, code: 'a', name: 'Artifact' },
        land: { sorder: 8, code: 'l', name: 'Land' },
        unknown: { sorder: 97, code: '?', name: 'Unknown' },
    };
    function getCardTypeByCode(code) {
        for (var cardType in my.cardTypes) {
            if (my.cardTypes[cardType].code == code) {
                return my.cardTypes[cardType];
            }
        }
        return my.cardTypes.unknown;
    }
    function getCardTypeByName(name) {
        // there may be multiple card types within the name, so we'll choose the first we find in sort order priority
        var regex;
        for (var cardType in my.cardTypes) {
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
        for (var guild in my.guilds) {
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
        unknown: { sorder: 97, code: '?', name: 'Unknown', fullName: 'Unknown' }
    };
    function getClanByCode(code) {
        for (var clan in my.clans) {
            if (my.clans[clan].code == code) {
                return my.clans[clan];
            }
        }
        return my.clans.unknown;
    }

    my.getRequiredOption = function (options, optionName, abortMsg) {
        var option = options[optionName];
        var errorMsg = (abortMsg === undefined) ? '' : abortMsg + '\n';
        if (option === undefined) {
            my.throwTerminalError(errorMsg + 'Missing required parameter: ' + optionName + "\nCannot continue.");
        }
        return option;
    };

    // Create a sanitized title to avoid the punctuation differences
    // Site to lookup chars: http://www.fileformat.info/info/unicode/char/search.htm
    function createMatchTitle(title) {
        var clean = title.trim().replace(/\u00C6/g, 'ae').toLowerCase(); // \u00C6 = Æ = LATIN CAPITAL LETTER AE
        clean = clean.replace(/[^a-z0-9 ]+/g, '');
        clean = clean.replace(/ +/, ' ');

        if (/\uFFFD/.test(title)) {
            console.error('ERROR: replacement character \uFFFD found in title. Change your cardsMain.json file to UTF-8 encoding: ' + title);
        }
        return clean;
    }

    my.throwTerminalError = function (abortMsg) {
        console.error(abortMsg);
        alert(abortMsg);
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
        _.each(options, function (value, key) {
            my[key] = value;
        });

        my.SetCardCount = options.setCardCount;

        my.$contentElem = $(my.getRequiredOption(options, 'contentElem'));

        // if missing any essentials, abort
        my.getRequiredOption(options, 'setFile');
        my.getRequiredOption(options, 'cardFiles');
        my.getRequiredOption(options, 'packFiles');
        my.getRequiredOption(options, 'productFile');

        // load all files
        var promises = [];

        promises.push($.getJSON(my.setFile));

        _.each(my.cardFiles, function (cardFile) {
            promises.push($.getJSON(cardFile).fail(function (xjr, textStatus, error) {
                console.error("ERROR retrieving file '" + this.url + "'. Cannot continue. Error message:" + error);
            })
			);
        });

        _.each(my.packFiles, function (packFile) {
            promises.push($.getJSON(packFile).fail(function (xjr, textStatus, error) {
                console.error("ERROR retrieving file '" + this.url + "'. Cannot continue. Error message:" + error);
            })
			);
        });

        promises.push($.getJSON(my.productFile));

        // Load all of the data once it all arrives
        $.when.apply($, promises).done(function () {
            // first item is the set data; turn them into an associative array
            var setData = arguments[0][0];
            my.sets = {};
            _.each(setData, function (set) {
                my.sets[set.code] = set;
            });
            my.set = my.sets[my.setCode.toUpperCase()];
            if (my.set !== undefined) {
                // create the set slug, useful for url-friendly formats like the download filename
                my.set.slug = my.friendly_url(my.set.name);
            }
            else {
                console.warn("WARNING: Cannot find setCode: " + my.setCode);
            }

            // we have a variable number of defs/packs and cards files, so we need to detect what file type we're reading
            my.defs = [];
            my.packs = [];
            my.cards = [];
            my.products = [];
            _.each(arguments, function (value, index) {
                if (index > 0) {
                    if (value[0].defs) {
                        my.defs = my.defs.concat(value[0].defs);
                    }
                    if (value[0].packs) {
                        my.packs = my.packs.concat(value[0].packs);
                    }
                    if (value[0].products) {
                        my.products = my.products.concat(value[0].products);
                    }
                    if (value[0].defs === undefined && value[0].packs === undefined && value[0]["_comment"] === undefined) {
                        my.cards = my.cards.concat(value[0]);
                    }
                }
            });

            // if missing any essentials, abort
            if (my.defs === undefined || my.defs.length < 1) {
                my.throwTerminalError("Missing definitions, which should be in packs.json\nCannot continue.");
            }
            if (my.packs === undefined || my.packs.length < 1) {
                my.throwTerminalError("Missing packs, which should be in packs.json\nCannot continue.");
            }
            if (my.cards === undefined || my.cards.length < 1) {
                my.throwTerminalError(errorMsg + "Missing cards, which should be in cardsMain.json\nCannot continue.");
            }


            // add card indicies and sort orders for internal use
            var setCardsLoadedCount = 0;
            var goodCards = [];
            var index = 0;
            _.each(my.cards, function (card) {
                if (card.hasOwnProperty("title")) {
                    card.index = index++;

                    // create a sanitized matchTitle stripped of all punctuation, special chars, etc to be used for matching
                    card.matchTitle = createMatchTitle(card.title);
                    //console.log(card.title,card.matchTitle);

                    card.colourOrder = getColourByCode(card.colour).sorder;
                    card.rarityOrder = getRarityByCode(card.rarity).sorder;
                    var cardType = getCardTypeByName(card.type);
                    card.typeCode = cardType.code;
                    card.typeOrder = cardType.sorder;
                    if (card.hasOwnProperty('guild')) {
                        card.guild = createMatchTitle(card.guild);
                        card.guildOrder = getGuildByCode(card.guild).sorder;
                        my.hasGuilds = true;
                    }
                    if (card.hasOwnProperty('clan')) {
                        card.clan = createMatchTitle(card.clan);
                        card.clanOrder = getClanByCode(card.clan).sorder;
                        my.hasClans = true;
                    }
                    card.ccost = calculateConvertedCost(card.cost);

                    // ensure defaults on some fields are set; makes querying WAY easier
                    if (card.token === undefined) {
                        card.token = false;
                    }
                    if (card.usableForDeckBuilding === undefined) {
                        card.usableForDeckBuilding = true; // i.e., it IS usable unless specified
                    }
                    if (card.set == my.setCode && (card.usableForDeckBuilding === undefined || card.usableForDeckBuilding === true)) {
                        setCardsLoadedCount++;
                        my.trigger('playableCardLoaded', setCardsLoadedCount);
                    }
                    goodCards.push(card);
                }
            });
            my.cards = goodCards;

            // make any post-load changes to the packs
            var querySetPercentAvg;
            _.each(my.packs, function (pack) {
                // check the querySets and add percentages if they're missing (missing means they all have an equal chance)
                if (pack.cards) {
                    _.each(pack.cards, function (cardsDef) {
                        if (cardsDef.querySet !== undefined) {
                            if (cardsDef.querySet.length > 0 && cardsDef.querySet[0].query !== undefined) {
                                if (cardsDef.querySet[0].percent === undefined) {
                                    querySetPercentAvg = 100 / cardsDef.querySet.length;
                                    _.each(cardsDef.querySet, function (querySet) {
                                        querySet.percent = querySetPercentAvg;
                                    });
                                }
                            }
                        }
                    });
                }
            });

            // process the pack defs
            my.packDefs = createPackDefs(my.defs);

            my.SetCardsLoadedCount = setCardsLoadedCount;

            // render the Main view
            my.mainView = new my.MainView({ el: my.$contentElem });
            my.mainView.render();

            my.trigger('ready');
        });
    };

    // Private MtG Generator functions --------------------------------------------------------------------------------------------------------------------------------

    function calculateConvertedCost(cost) {
        var ccost = 0;
        if (cost !== undefined && cost.length > 0) {
            var costParts = cost.replace(/\}/g, '').toLowerCase().split('{');
            _.each(costParts, function (mana) {
                var intCost = parseInt(mana, 10);
                if (isNaN(intCost) && mana.length > 0) {
                    // rules for converted cost on {X}: http://www.wizards.com/magic/comprules/MagicCompRules_20121001.txt
                    //	"202.3b When calculating the converted mana cost of an object with {X} in its mana cost, X is treated as 0 while the object is not on the stack, and X is treated as the number chosen for it while the object is on the stack."
                    intCost = (mana == 'x') ? 0 : 1;
                }
                if (isNaN(intCost)) {
                    intCost = 0;
                }
                ccost += intCost;
            });
        }

        return ccost;
    }

    function createPackDefs(defs) {
        var packDefs = [];
        if (defs) {
            _.each(defs, function (def) {
                var defSet = executeQuery(my.cards, packDefs, def.query);
                packDefs[def.defName] = defSet;
                if (defSet.length < 1) {
                    console.warn("WARNING: createPackDefs(): no results from pack definition '" + def.defName + "': " + def.query);
                }
            });
        }
        return packDefs;
    }

    // SHOULD NOT BE CALLED EXCEPT BY executeQuery()
    // Returns only the card indices
    function executeSimpleQuery(fullSet, defs, query, isOrderImportant) {
        var from = query.match(/from\[(.+)\]/i);
        if (!from) {
            console.warn("ERROR: executeSimpleQuery(): missing 'from' in query: " + query);
        }
        else {
            from = from[1];
        }

        var query2 = query.match(/\?(.+)=(.+)/i);

        var result = [];

        // determine base set to select from
        var sourceSet = [];
        if (from == "*") {
            sourceSet = fullSet;
        }
            // select from previously-defined set
        else {
            sourceSet = defs[from];
            if (sourceSet === undefined) {
                console.warn("ERROR: executeSimpleQuery(): def '" + from + "' does not exist within query: " + query);
            }
        }

        // execute the query on the set
        if (!query2) {
            result = _.pluck(sourceSet, 'index');
        }
        else {
            var matchingCards, clause, queryTitles, queryMatchTitles;
            if (query2[2].indexOf('contains(') > -1) {
                // 'contains' clause, like colour=contains({W}|{G}), i.e.: we're basically letting the user specify a regex within the contains()
                clause = query2[2].replace(/contains\(/g, '').replace(/\)/g, '');
                matchingCards = _.filter(sourceSet, function (card) { return card[query2[1]] && card[query2[1]].match(clause); });
                result = _.pluck(matchingCards, 'index');
            }
            else if (query2[2].indexOf('(') > -1) {
                // 'in' clause
                // WAS doing greedy matching.. |Smite| was matching "Loxodon Smiter", so ^(****)$ required (^=start of string, $=end of string)
                clause = '^(' + query2[2].replace(/\(/g, '').replace(/\)/g, '') + ')$';

                if (query2[1] == 'title') {
                    queryTitles = clause.replace('\^(', '').replace(')\$', '').split('|');
                    queryMatchTitles = _.map(queryTitles, function (title) { return createMatchTitle(title); });
                    clause = '^(' + queryMatchTitles.join('|') + ')$';
                    // TODO: wtf? I'm doing a creteMatchTitle() on card['matchTitle']??
                    matchingCards = _.filter(sourceSet, function (card) { return card.hasOwnProperty('matchTitle') && createMatchTitle(card['matchTitle']).match(clause); });
                }
                else {
                    clause = clause.toLowerCase();
                    //matchingCards = _.filter(sourceSet,function(card) { return card[query2[1]]!==undefined && card[query2[1]].toLowerCase().match(clause); });
                    matchingCards = _.filter(sourceSet, function (card) { return card.hasOwnProperty(query2[1]) && card[query2[1]].toLowerCase().match(clause); });
                }

                // if it's a title query and the query specified "inOrder:true" then the order of the cards is important; sort by that
                if (query2[1] == 'title' && isOrderImportant === true) {
                    var sortedCards = [];
                    var foundCard;
                    _.each(queryMatchTitles, function (queryMatchTitle) {
                        foundCard = _.find(matchingCards, function (matchingCard) { return matchingCard.matchTitle == queryMatchTitle; });
                        if (foundCard) {
                            sortedCards.push(foundCard);
                        }
                    });
                    matchingCards = sortedCards;
                }
                result = _.pluck(matchingCards, 'index');

                // if we're dealing with named cards, check if any items in the list are missing -- we'll call this an error and generate an error card
                if (query2[1] == 'title' && result.length < queryMatchTitles.length) {
                    var foundCardTitles = _.map(matchingCards, function (card) { return card.matchTitle; });
                    var missingMatchTitles = _.difference(queryMatchTitles, foundCardTitles);
                    _.each(missingMatchTitles, function (matchTitle) {
                        console.warn('WARNING: missing card: "' + matchTitle + '" from query:', query);
                    });
                }
            }
            else {
                // regular equals
                query2[2] = query2[2].replace(/'/g, '');

                // if we're dealing with named cards, certain characters need to be converted
                matchingCards = [];
                if (query2[1] == 'title') {
                    var matchTitle = createMatchTitle(query2[2]);
                    matchingCards = _.filter(sourceSet, function (card) { return card.hasOwnProperty('matchTitle') && card['matchTitle'] == matchTitle; });
                }
                else {
                    if (query2[2] === undefined || query2[2] == '') {
                        matchingCards = _.filter(sourceSet, function (card) { return !card.hasOwnProperty(query2[1]) || card[query2[1]] == query2[2]; });
                    }
                    else {
                        matchingCards = _.filter(sourceSet, function (card) { return card[query2[1]] && card[query2[1]] == query2[2]; });
                    }
                }
                result = _.pluck(matchingCards, 'index');
            }
        }

        return result;
    }

    // the pattern should be something like: from[*]?rarity=(c,u,r,mr)+from[*]?type='Land'-from[*]?type=('Marketing','Token')
    // i.e.: a base query then a set of set addition and subtractions
    // fullSet = all card objects
    function executeQuery(fullSet, defs, query, isOrderImportant) {
        //OLD:var queries = query.split(/(\+|-)/); // split on + or - (set operators), but keep the operator
        var queries = query.split(/(\+|-)(?=from|take)/); // split on + or - (set operators), but keep the operator

        var operator = '';
        var firstRun = true;
        var resultIndices = [];
        _.each(queries, function (query, index) {
            // on the first run though, the initial query should just be the base
            if (firstRun === true) {
                resultIndices = executeSimpleQuery(fullSet, defs, query, isOrderImportant); // returns only indices
                firstRun = false;
            }
            else {
                // now every even array element should be the operator
                if (index % 2 == 1) {
                    operator = query;
                }
                else {
                    var set = executeSimpleQuery(fullSet, defs, query, isOrderImportant); // returns only indices
                    switch (operator) {
                        case "+": resultIndices = resultIndices.concat(set); break;
                        case "-": resultIndices = _.difference(resultIndices, set); break;
                        default: console.error("ERROR: expected + or - operator in query '" + query + "' but instead found '" + operator + "'");
                    }
                }
            }
        });

        // match these indices back up with the actual objects and return that
        var finalResult = _.reduce(resultIndices, function (memo, index) { return memo.concat(fullSet[index]); }, []);

        if (finalResult.length < 1) {
            console.warn("WARNING: executeQuery(): no results from query: " + query);
        }

        return finalResult;
    }

    my.getPack = function (packName) {
        return _.find(my.packs, function (pack) { return pack.packName == packName; });
    };

    my.generateCardSetsFromPacks = function (packs) {
        var generatedSets = [];

        // generate the requested sets
        var setIndex = 0;
        _.each(packs, function (pack) {
            for (var i = 0; i < pack.count; i++) {
                var cardSet = my.generateCardSetFromPack(pack.packName);
                generatedSets[setIndex++] = cardSet;
            }
        });

        return generatedSets;
    };

    my.generateCardSetFromPack = function (packName) {
        var pack = my.getPack(packName);
        if (pack === undefined) {
            console.warn("ERROR: generateCardSet(): missing packName: " + packName);
            return false;
        }

        var endCards = [];
        var chance = 0;
        var cardQueries = [];

        // go through each card query in the pack and select it according to its query
        _.each(pack.cards, function (cardDef) {
            if (cardDef.querySet) {
                var totalWeight = _.reduce(cardDef.querySet, function (memo, query) { return memo + query.percent; }, 0);

                // choose the card query percent; we want decimal numbers because the cards can be specified as such (e.g.: 1/8 chance = 12.5%)
                var percent = Math.random() * totalWeight + 1;
                if (percent > totalWeight) { percent = totalWeight; }

                // choose the card query that matches that weighted percentage
                var currentWeight = 0;
                // must use $.each vs _.each so we can break out when we have a card, otherwise it'll always check both
                $.each(cardDef.querySet, function (index, cardDefItem) {
                    currentWeight += cardDefItem.percent;
                    if (currentWeight >= percent) {
                        cardQueries.push(cardDefItem);
                        return false; // false required to break out of loop
                    }
                });
            }
            else if (cardDef.query) {
                cardQueries.push(cardDef);
            }
            else {
                console.error("cardDef doesn't have a queryDef or query property:", cardDef);
            }

        });

        // basically if the pack was created with usableForDeckBuilding=false then use that, otherwise default to true
        var usableForDeckBuilding = true;
        if (pack.usableForDeckBuilding !== undefined) {
            usableForDeckBuilding = pack.usableForDeckBuilding;
        }

        // execute each card tempalate's query to choose the actual card
        var cardSet = [];
        var cardIndices = [];
        var isOrderImportant;
        _.each(cardQueries, function (cardDef) {
            isOrderImportant = cardDef.inOrder && cardDef.inOrder === true;
            var possibleCards = executeQuery(my.cards, my.packDefs, cardDef.query, isOrderImportant);

            var takeCount = 1;
            var take = cardDef.query.match(/take\[(.+)\]>/i);
            if (take) {
                takeCount = take[1];
            }

            var chosenCards;
            if (takeCount == "*") {
                chosenCards = _.clone(possibleCards);
            }
            else if (cardDef.canBeDuplicate === true) {
                chosenCards = _.clone(randomCards(possibleCards, takeCount));
            }
            else {
                chosenCards = _.clone(randomCards(possibleCards, takeCount, cardIndices));
            }

            // apply any setValues
            if (cardDef.setValues) {
                for (var setValue in cardDef.setValues) {
                    // this is awkward, but anything else I tried modified the ORIGINAL card
                    for (var i = 0; i < chosenCards.length; i++) {
                        var modifiedCard = _.clone(chosenCards[i]);
                        modifiedCard[setValue] = cardDef.setValues[setValue];
                        chosenCards[i] = modifiedCard;
                    }
                }
            }

            _.each(chosenCards, function (card) {
                // apply usableForDeckBuilding if not already specified
                if (card.usableForDeckBuilding === undefined) {
                    card.usableForDeckBuilding = usableForDeckBuilding;
                }
                cardIndices.push(card.index);
                cardSet.push(card);
            });
        });

        cardSet.setName = pack.packName;
        cardSet.setDesc = pack.packDesc;

        // used to ensure things like promos aren't included when you sort all cards by colour
        // NOTE: this isn't really used right now -- I'm leaving it in in case it's useful when we start actually letting the user build decks
        cardSet.includeWithUserCards = pack.includeWithUserCards;
        if (pack.includeWithUserCards !== false) {
            cardSet.includeWithUserCards = true;
        }

        return cardSet;
    };

    my.CountCardsInSets = function (cardSets) {
        return _.reduce(cardSets, function (memo, opt) { return memo + opt.length; }, 0);
    };

    function randomCards(cards, num, excludeIndices) {
        var result = [];
        if (cards.length < 1) {
            return result;
        }
        /*KILL? this was to protect against choosing the same cards twice, but code below now allows that if you ask for more cards than exist.. which we want in many cases.
                if (cards.length<=num) {
                    if (num>cards.length) {
                        console.warn("ERROR: Trying to choose "+num+" cards but only "+cards.length+" available. Taking all:",cards);
                    }
                    return cards;
                }
        */
        var validCards = _.clone(cards);
        if (excludeIndices) {
            // reject cards whose index is in the excludeIndices
            validCards = _.reject(validCards, function (card) { _.find(excludeIndices, function (index) { return card.index == index; }); });
            if (num > validCards.length) {
                console.warn("ERROR: Trying to choose " + num + " cards but after excluded cards, only " + validCards.length + " available. Taking all:", validCards);
            }
        }

        // keep taking cards until we get the desired number, even if we're grabbing duplicates
        var chosenCards = [];
        while (chosenCards.length < num) {
            var newCards = _.sample(validCards, num);
            var numDiff = (chosenCards.length + newCards.length) - num; // 0: we're good. negative: need more cards. positive: too many now; trim newCards by this number
            if (numDiff > 0) {
                newCards = _.initial(newCards, numDiff); // trims the last numDiff elements from the array
            }
            chosenCards = chosenCards.concat(newCards);
        }

        return chosenCards;
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
		, order: { sort: 'order' } // opened order within the set
    };

    my.sortAllByNothing = function (cardList) {
        cardList.sortOrder = my.sortOrders.none;
        return cardList;
    };

    my.sortAllByTitle = function (cardList) {
        var cards = _.sortBy(cardList, 'matchTitle');
        cards.sortOrder = my.sortOrders.name;
        return cards;
    };

    my.getBasicLandCards = function (cardList) {
        var cards = _.filter(cardList, function (card) { return card.type == 'Basic Land'; });
        if (cards.length > 0) {
            cards = _.sortBy(cards, 'matchTitle');
            cards.setDesc = 'Basic Land';
            cards.sortOrder = my.sortOrders.name;
        }
        return cards;
    };

    my.getOtherCards = function (allCards, selectedCards) {
        var cards = _.difference(allCards, selectedCards);
        if (cards.length > 0) {
            cards = _.sortBy(cards, 'matchTitle');
            cards.setDesc = 'Other';
            cards.sortOrder = my.sortOrders.name;
        }
        return cards;
    };

    my.sortIntoArray = function (groupedCardSets, sortObj) {
        var cardSets = [];
        for (var sortItem in sortObj) {
            var thisSortItem = sortObj[sortItem];
            var set = groupedCardSets[thisSortItem.code];
            if (set) {
                set.sorder = thisSortItem.sorder;
                cardSets.push(set);
            }
        }
        cardSets = _.sortBy(cardSets, "sorder");
        return cardSets;
    };

    my.sortAllByColour = function (cardList) {
        var sortedSets = [];

        // for each colour, create a new card set
        var mainCards = _.filter(cardList, function (card) { return card.usableForDeckBuilding === true && card.type != 'Basic Land' && !card.token; });
        var groupedCardSets = _.groupBy(mainCards, function (card) { return card.colour; });
        var cardSets = this.sortIntoArray(groupedCardSets, my.colours);
        _.each(cardSets, function (cardSet) {
            var set = _.sortBy(cardSet, 'matchTitle');
            var colour = getColourByCode(set[0].colour);
            set.setDesc = colour.name;
            set.sortOrder = my.sortOrders.name;
            sortedSets.push(set);
        });

        var basicLandCards = my.getBasicLandCards(cardList);
        if (basicLandCards.length > 0) {
            sortedSets.push(basicLandCards);
        }

        var selectedCards = _.flatten(sortedSets);
        var otherCards = my.getOtherCards(cardList, selectedCards);
        if (otherCards.length > 0) {
            sortedSets.push(otherCards);
        }

        sortedSets.sortOrder = my.sortOrders.colour;

        return sortedSets;
    };

    my.sortAllByRarity = function (cardList) {
        var sortedSets = [];

        // for each colour, create a new card set
        var mainCards = _.filter(cardList, function (card) { return card.usableForDeckBuilding === true && card.type != 'Basic Land' && !card.token; });
        var groupedCardSets = _.groupBy(mainCards, function (card) { return card.rarity; });
        var cardSets = this.sortIntoArray(groupedCardSets, my.rarities);
        _.each(cardSets, function (cardSet) {
            var set = _.sortBy(cardSet, 'matchTitle');
            var colour = getRarityByCode(set[0].rarity);
            set.setDesc = colour.name;
            set.sortOrder = my.sortOrders.name;
            sortedSets.push(set);
        });

        var basicLandCards = my.getBasicLandCards(cardList);
        if (basicLandCards.length > 0) {
            sortedSets.push(basicLandCards);
        }

        var selectedCards = _.flatten(sortedSets);
        var otherCards = my.getOtherCards(cardList, selectedCards);
        if (otherCards.length > 0) {
            sortedSets.push(otherCards);
        }

        sortedSets.sortOrder = my.sortOrders.rarity;

        return sortedSets;
    };

    my.sortAllByCost = function (cardList) {
        var sortedSets = [];

        // for each converted cost, create a new card set
        var mainCards = _.filter(cardList, function (card) { return card.usableForDeckBuilding === true && card.type != 'Basic Land' && !card.token; });
        var groupedCardSets = _.groupBy(mainCards, function (card) { return card.ccost; });
        var cardSets = _.toArray(groupedCardSets);
        cardSets = cardSets.reverse();
        _.each(cardSets, function (cardSet) {
            var set = _.sortBy(cardSet, 'matchTitle');
            set.setDesc = 'Cost ' + set[0].ccost;
            set.sortOrder = my.sortOrders.name;
            sortedSets.push(set);
        });

        var basicLandCards = my.getBasicLandCards(cardList);
        if (basicLandCards.length > 0) {
            sortedSets.push(basicLandCards);
        }

        var selectedCards = _.flatten(sortedSets);
        var otherCards = my.getOtherCards(cardList, selectedCards);
        if (otherCards.length > 0) {
            sortedSets.push(otherCards);
        }

        sortedSets.sortOrder = my.sortOrders.cost;

        return sortedSets;
    };

    my.sortAllByType = function (cardList) {
        var sortedSets = [];

        // for each card type, create a new card set
        var mainCards = _.filter(cardList, function (card) { return card.usableForDeckBuilding === true && card.type != 'Basic Land' && !card.token; });
        var groupedCardSets = _.groupBy(mainCards, function (card) { return card.typeCode; });
        var cardSets = this.sortIntoArray(groupedCardSets, my.cardTypes);
        _.each(cardSets, function (cardSet) {
            var set = _.sortBy(cardSet, 'matchTitle');
            set.setDesc = getCardTypeByCode(set[0].typeCode).name;
            set.sortOrder = my.sortOrders.name;
            sortedSets.push(set);
        });

        var basicLandCards = my.getBasicLandCards(cardList);
        if (basicLandCards.length > 0) {
            sortedSets.push(basicLandCards);
        }

        var selectedCards = _.flatten(sortedSets);
        var otherCards = my.getOtherCards(cardList, selectedCards);
        if (otherCards.length > 0) {
            sortedSets.push(otherCards);
        }

        sortedSets.sortOrder = my.sortOrders.type;

        return sortedSets;
    };

    my.sortAllByGuild = function (cardList) {
        var sortedSets = [];

        // for each guild, create a new card set
        var mainCards = _.filter(cardList, function (card) { return card.usableForDeckBuilding === true && card.type != 'Basic Land' && !card.token; });
        var groupedCardSets = _.groupBy(mainCards, function (card) { return card.guild; });
        var cardSets = this.sortIntoArray(groupedCardSets, my.guilds);
        _.each(cardSets, function (cardSet) {
            var set = _.sortBy(cardSet, 'matchTitle');
            set.setDesc = getGuildByCode(set[0].guild).name;
            set.sortOrder = my.sortOrders.name;
            sortedSets.push(set);
        });

        var basicLandCards = my.getBasicLandCards(cardList);

        var guildAndBasicLandCards = basicLandCards.concat(_.flatten(sortedSets));

        var nonGuildCards = my.getOtherCards(mainCards, guildAndBasicLandCards);
        if (nonGuildCards.length > 0) {
            nonGuildCards.setDesc = "Non-Guild";
            sortedSets.push(nonGuildCards);
        }

        if (basicLandCards.length > 0) {
            sortedSets.push(basicLandCards);
        }

        var selectedCards = _.flatten(sortedSets);
        var otherCards = my.getOtherCards(cardList, selectedCards);
        if (otherCards.length > 0) {
            sortedSets.push(otherCards);
        }

        sortedSets.sortOrder = my.sortOrders.guild;

        return sortedSets;
    };

    my.sortAllByClan = function (cardList) {
        var sortedSets = [];

        // for each clan, create a new card set
        var mainCards = _.filter(cardList, function (card) { return card.usableForDeckBuilding === true && card.type != 'Basic Land' && !card.token; });
        var groupedCardSets = _.groupBy(mainCards, function (card) { return card.clan; });
        var cardSets = this.sortIntoArray(groupedCardSets, my.clans);
        _.each(cardSets, function (cardSet) {
            var set = _.sortBy(cardSet, 'matchTitle');
            set.setDesc = getClanByCode(set[0].clan).name;
            set.sortOrder = my.sortOrders.name;
            sortedSets.push(set);
        });

        var basicLandCards = my.getBasicLandCards(cardList);

        var clanAndBasicLandCards = basicLandCards.concat(_.flatten(sortedSets));

        var nonClanCards = my.getOtherCards(mainCards, clanAndBasicLandCards);
        if (nonClanCards.length > 0) {
            nonClanCards.setDesc = "Non-Clan";
            sortedSets.push(nonClanCards);
        }

        if (basicLandCards.length > 0) {
            sortedSets.push(basicLandCards);
        }

        var selectedCards = _.flatten(sortedSets);
        var otherCards = my.getOtherCards(cardList, selectedCards);
        if (otherCards.length > 0) {
            sortedSets.push(otherCards);
        }

        sortedSets.sortOrder = my.sortOrders.clan;

        return sortedSets;
    };

    /* --------- Sorting Sets --------------------------------------------------------------------------------------------------------------------- */
    my.sortByTitle = function (cardList) {
        var sortedCards = _.sortBy(cardList, 'matchTitle');
        sortedCards.sortOrder = my.sortOrders.name;
        return sortedCards;
    };

    my.sortByColour = function (cardList) {
        var sortedCards = _.sortBy(cardList, function (card) { return '' + padNum(card.colourOrder, 3) + card.matchTitle; }); // sort by colour then title
        sortedCards.sortOrder = my.sortOrders.colour;
        return sortedCards;
    };

    my.sortByRarity = function (cardList) {
        var sortedCards = _.sortBy(cardList, function (card) { return '' + padNum(card.rarityOrder, 3) + padNum(card.colourOrder, 3) + card.matchTitle; }); // sort by rarityOrder, colourorder, then title
        sortedCards.sortOrder = my.sortOrders.rarity;
        return sortedCards;
    };

    my.sortByCost = function (cardList) {
        var sortedCards = _.sortBy(cardList, function (card) { return '' + padNum((100 - card.ccost), 3) + card.matchTitle; }); // sort by converted cost desc then title
        sortedCards.sortOrder = my.sortOrders.cost;
        return sortedCards;
    };

    my.sortByType = function (cardList) {
        var sortedCards = _.sortBy(cardList, function (card) { return '' + padNum(card.typeOrder, 3) + card.matchTitle; }); // sort by type then title
        sortedCards.sortOrder = my.sortOrders.type;
        return sortedCards;
    };

    my.sortByGuild = function (cardList) {
        var sortedCards = _.sortBy(cardList, function (card) { return '' + padNum(card.guildOrder, 3) + card.matchTitle; }); // sort by guild then title
        sortedCards.sortOrder = my.sortOrders.guild;
        return sortedCards;
    };

    my.sortByClan = function (cardList) {
        var sortedCards = _.sortBy(cardList, function (card) { return '' + padNum(card.clanOrder, 3) + card.matchTitle; }); // sort by clan then title
        sortedCards.sortOrder = my.sortOrders.clan;
        return sortedCards;
    };


    // Support functions --------------------------------------------------------------------------------------------------------------------------------

    function padNum(num, width, padChar) {
        padChar = padChar || '0';
        num = num + '';
        return num.length >= width ? num : new Array(width - num.length + 1).join(padChar) + num;
    }

    function capitaliseFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // from: http://guegue.net/friendlyURL_JS
    my.friendly_url = function (str, max) {
        if (str === undefined) return str;
        if (max === undefined) max = 32;
        var a_chars = new Array(
			new Array("a", /[áàâãªÁÀÂÃ]/g),
			new Array("e", /[éèêÉÈÊ]/g),
			new Array("i", /[íìîÍÌÎ]/g),
			new Array("o", /[òóôõºÓÒÔÕ]/g),
			new Array("u", /[úùûÚÙÛ]/g),
			new Array("c", /[çÇ]/g),
			new Array("n", /[Ññ]/g)
		);
        // Replace vowel with accent without them
        for (var i = 0; i < a_chars.length; i++) {
            str = str.replace(a_chars[i][1], a_chars[i][0]);
        }
        // first replace whitespace by -, second remove repeated - by just one, third turn in low case the chars,
        // fourth delete all chars which are not between a-z or 0-9, fifth trim the string and
        // the last step truncate the string to 32 chars 
        return str.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9\-]/g, '').replace(/\-{2,}/g, '-').replace(/(^\s*)|(\s*$)/g, '').substr(0, max);
    };

    return my;
}(mtgGen || {}, jQuery));


// --------------------------------------------------------------------------------------------------------------------------------
// Main View/Renderers 
// --------------------------------------------------------------------------------------------------------------------------------
var mtgGen = (function (my, $) {
    'use strict';

    my.MainView = Backbone.View.extend({
        ProductViews: {}
		, currentView: { name: "none" }

		, mainMenu: undefined
		, setMenu: undefined

		, initialize: function () {
		    this.mainMenu = new my.AllCardsMenuView({ el: this.el });
		    this.setMenu = new my.SetMenuView({ el: this.el });
		    this.setMenu.parentMenu = this.mainMenu;

		    var topThis = this;
		    _.each(my.products, function (product) {
		        if (!product.hasOwnProperty('isVisible') || product.isVisible === true) {
		            var options = _.clone(product);
		            options.el = topThis.el;
		            options.originalProductName = options.productName;
		            options.productName = 'product-' + options.productName;
		            topThis.ProductViews[options.originalProductName] = new my.ProductView(options);
		        }
		    });
		}

		, render: function () {
		    my.trigger('menusInitialized');

		    this.$el.empty(); // get rid of the Loading message
		    this.$el.html('<section id="products"></section><section id="product-content"></section><div class="back-to-top"><a class="button top" href="#">Back to top</a></a>');

		    // render the initial views
		    _.each(my.initViews, function (view) { view.render(); });

		    // render the Product views
		    _.each(this.ProductViews, function (view) { view.renderType(); });

		    // if there is only one Product view, hide it the tab button (we need to render it so it will auto-execute the main Product)
		    if (_.size(this.ProductViews) < 2) {
		        $("#products>a.button").hide();
		    }

		    // if specified, auto-showTab the startup product
		    if (my.startProductName) {
		        this.ProductViews[my.startProductName].showTab();
		    }
		    return this;
		}

    });

    // all results should be rendered through this function
    my.displayResults = function (productName, html) {
        my.trigger('layoutChanging');
        this.$contentElem.find('#product-content .' + productName + ' .result').html(html);
        setTimeout(function () { my.trigger('layoutChanged'); }, 500); // delay to let it render so target elements exist
    };

    // replaces a set's contents
    my.renderSetUpdate = function (productName, setID, cards, parentSet) {
        my.trigger('layoutChanging');
        var $newSet = my.renderCardSet(setID, cards, parentSet);
        var $set = this.$contentElem.find('#product-content .' + productName + ' .result .set[data-setid=' + setID + ']');
        $set.empty();
        $set.append($newSet);
        setTimeout(function () { my.trigger('layoutChanged'); }, 500); // delay to let it render so target elements exist
    };

    // general rendering functions
    my.renderCardsTitle = function (text) {
        return '<h2>' + text + '<a href="#" class="button top">[ Top ]</a></h2>';
    };

    /*
        NOT USED YET.. but this would be great. Something that translates queries into English so people can both understand what they're getting and 
                    debug my logic if it's wrong
    
        function renderPackDef(packDef) {
            var $result = $('<section class="packdef" data-packName="'+packDef.packName+'">');
            $result.append('<h2>'+packDef.packDesc+'</h2>');
            
            return $result;
        }
    
            // Show content breakdown of each pack
            $(my.packContentsElem).on('click',function () {	
                //var allCardsHtml = renderCards(my.cards);
                
                var $results = $(my.resultsElem);
                $results.empty();
    
                var resultHtml = '';
                _.each(my.packs, function(pack) {
                    //alert(pack.packName);
                    resultHtml = renderPackDef(pack).html();
                    // TODO: need something to translate the queries into english, and to display the possible cards that may be chosen
                    $results.append(resultHtml)
                });
    
                return false;
            });
    */

    my.renderCards = function (cards) {
        //var htmlOut = '';
        var cardTemplate = '<span class="card[[FOIL]]" title="[[TITLE]]">[[A_START]]<img data-usable-for-deck-building="[[UFDB]]" src="[[SRC]]" alt="[[TITLE]]" title="[[TITLE]]" width="[[WIDTH]]" height="370" /><em class="title">[[TITLE]]</em>[[REASON]][[A_END]]</span>';

        var htmlOut = _.reduce(cards, function (memo, card) {
            var foilClass = ''
                , aStart = ''
                , aEnd = '';
            var title = card.title;
            if (card.foil) {
                foilClass = ' foil';
                title += ' - Foil';
            }
            if (card.hasOwnProperty("src_large")) {
                aStart = "<a href='" + card.src_large + "' title='" + title + "'>";
                aEnd = "</a>";
            }
            return memo += cardTemplate.replace('[[FOIL]]', foilClass)
                        .replace(/\[\[TITLE\]\]/g, title)
                        .replace('[[UFDB]]', card.usableForDeckBuilding)
                        .replace('[[SRC]]', card.src)
                        .replace('[[A_START]]', aStart)
                        .replace('[[A_END]]', aEnd)
                        .replace('[[WIDTH]]', (card.width || 265))
                        .replace('[[REASON]]', (card.includedReason !== undefined) ? '<em class="reason">(' + card.includedReason + ')</em>' : '');
        }, '');

        return htmlOut;
    };

    my.renderCardSets = function (sets, preTitle) {
        var htmlOut = "";
        _.each(sets, function (set, index) {
            htmlOut += my.renderCardSet(index, set, sets, preTitle);
        });
        return htmlOut;
    };

    my.renderCardSet = function (setID, cards, parentSet, preTitle) {
        preTitle = preTitle || "";
        my.mainView.setMenu.setID = setID;
        var htmlOut = '<section id="' + my.friendly_url(cards.setDesc) + '-' + setID + '" class="set" data-setid="' + setID + '">'
			+ my.renderCardsTitle(preTitle + cards.setDesc + ' <span class="card-count">(' + cards.length + ')')
			+ my.mainView.setMenu.render(cards, parentSet)
			+ my.renderCards(cards)
			+ "</section>";
        return htmlOut;
    };

    return my;
}(mtgGen || {}, jQuery));


// --------------------------------------------------------------------------------------------------------------------------------
// Menu module 
// --------------------------------------------------------------------------------------------------------------------------------
var mtgGen = (function (my, $) {
    'use strict';

    // these get reset over and over as we render each menu
    my.menuSortOrder = my.sortOrders.none;
    my.menuOriginalProductName = undefined;
    my.menuGeneratedSetId = undefined;

    my.MenuView = Backbone.View.extend({
        currentSort: undefined // should be one of my.sortOrders

        // To these should be added functions to be executed that should return nothing or a menu item depending on context
		, menuItems: undefined
		, sortedMenuItems: undefined
		, addMenuItem: function (name, sortIndex, menuItemFunction) {
		    if (sortIndex === undefined) {
		        var highestSortIndex = _.max(this.menuItems, function (o) { return o.sortIndex; });
		        sortIndex = highestSortIndex + 5;
		    }
		    this.menuItems.push(
				{ name: name, sortIndex: sortIndex, itemFunction: function () { return menuItemFunction.call(); } }
			);
		    this.sortedMenuItems = _.sortBy(this.menuItems, 'sortIndex');
		}

		, menuNamesToSkip: undefined

		, initialize: function () {
		    this.menuItems = [];
		    this.sortedMenuItems = [];
		    this.menuNamesToSkip = [];
		}

		, render: function (cardSet) {
		    my.menuSortOrder = cardSet.sortOrder.sort;
		    my.menuOriginalProductName = undefined;
		    my.menuGeneratedSetId = undefined;

		    // render each menu item in sort order
		    var resultHtml = '<section class="menu"><label>Sort all by</label>';
		    for (var sortedMenuItem in this.sortedMenuItems) { // not using _.each because it isn't changing the submenus based on parent menu.. weird
		        // check if we're to skip this one
		        var menuItem = this.sortedMenuItems[sortedMenuItem];
		        if (!_.contains(this.menuNamesToSkip, menuItem.name)) {
		            resultHtml += menuItem.itemFunction();
		        }
		    }
		    resultHtml += '</section>';

		    // reset the skippable names every time so they don't carry over to others
		    this.menuNamesToSkip = [];
		    return resultHtml;
		}

    });

    my.replaceActiveToken = function (sort, str) {
        var setSort = my.menuSortOrder || '';
        var replacement = (sort == setSort) ? ' active' : '';
        return str.replace('[[ACTIVE]]', replacement);
    };

    my.AllCardsMenuView = my.MenuView.extend({
        initialize: function () {
            my.MenuView.prototype.initialize.call(this);
            this.addMenuItem("name", 4, function () { return my.replaceActiveToken('name', '<a href="#" class="button[[ACTIVE]] sort-all-by-name">Name</a>'); });
            this.addMenuItem("colour", 6, function () { return my.replaceActiveToken('colour', '<a href="#" class="button[[ACTIVE]] sort-all-by-colour">Colour</a>'); });
            this.addMenuItem("rarity", 8, function () { return my.replaceActiveToken('rarity', '<a href="#" class="button[[ACTIVE]] sort-all-by-rarity">Rarity</a>'); });
            this.addMenuItem("cost", 10, function () { return my.replaceActiveToken('cost', '<a href="#" class="button[[ACTIVE]] sort-all-by-cost">Cost</a>'); });
            this.addMenuItem("type", 12, function () { return my.replaceActiveToken('type', '<a href="#" class="button[[ACTIVE]] sort-all-by-type">Type</a>'); });
            this.addMenuItem("guild", 14,
					function () {
					    return (my.hasGuilds) ? my.replaceActiveToken('guild', '<a href="#" class="button[[ACTIVE]] sort-all-by-guild">Guild</a>') : '';
					}
				);
            this.addMenuItem("clan", 16,
					function () {
					    return (my.hasClans) ? my.replaceActiveToken('clan', '<a href="#" class="button[[ACTIVE]] sort-all-by-clan">Clan</a>') : '';
					}
				);
            this.addMenuItem("set", 18,
					function () {
					    return (my.mainView.currentView.isGenerated) ? my.replaceActiveToken('set', '<a href="#" class="button[[ACTIVE]] sort-all-by-sets">Generated sets</a>')
 : '';
					}
				);
        }

    });

    my.SetMenuView = my.MenuView.extend({
        setID: 0

		, parentMenu: undefined

		, initialize: function () {
		    my.MenuView.prototype.initialize.call(this);
		    this.addMenuItem("name", 4, function () { return my.replaceActiveToken('name', '<a href="#" class="button[[ACTIVE]] sort-by-name" data-setid="[[SETID]]">Name</a>'); });
		    this.addMenuItem("colour", 6, function () { return my.replaceActiveToken('colour', '<a href="#" class="button[[ACTIVE]] sort-by-colour" data-setid="[[SETID]]">Colour</a>'); });
		    this.addMenuItem("rarity", 8, function () { return my.replaceActiveToken('rarity', '<a href="#" class="button[[ACTIVE]] sort-by-rarity" data-setid="[[SETID]]">Rarity</a>'); });
		    this.addMenuItem("cost", 10, function () { return my.replaceActiveToken('cost', '<a href="#" class="button[[ACTIVE]] sort-by-cost" data-setid="[[SETID]]">Cost</a>'); });
		    this.addMenuItem("type", 12, function () { return my.replaceActiveToken('type', '<a href="#" class="button[[ACTIVE]] sort-by-type" data-setid="[[SETID]]">Type</a>'); });
		    this.addMenuItem("guild", 14,
					function () {
					    return (my.hasGuilds) ? my.replaceActiveToken('guild', '<a href="#" class="button[[ACTIVE]] sort-by-guild" data-setid="[[SETID]]">Guild</a>') : '';
					}
				);
		    this.addMenuItem("clan", 14,
					function () {
					    return (my.hasClans) ? my.replaceActiveToken('clan', '<a href="#" class="button[[ACTIVE]] sort-by-clan" data-setid="[[SETID]]">Clan</a>') : '';
					}
				);
		    this.addMenuItem("order", 16,
					function () {
					    return (my.mainView.currentView.isGenerated) ? my.replaceActiveToken('order', '<a href="#" class="button[[ACTIVE]] sort-by-opened" data-setid="[[SETID]]">Opened order</a>')
 : '';
					}
				);
		}

		, render: function (cardSet, parentSet) {
		    // don't include the sort options that the parent sort is already doing.
		    // e.g.: if the top level is Sort by Colour, don't give them an option to sort White again by colour.
		    this.menuNamesToSkip.push(parentSet.sortOrder.sort);

		    // also don't include the option to sort by opened order unless the parent search is sort by set
		    if (parentSet.sortOrder != my.sortOrders.set) {
		        this.menuNamesToSkip.push(my.sortOrders.order.sort);
		    }

		    var resultHtml = my.MenuView.prototype.render.call(this, cardSet);
		    resultHtml = resultHtml.replace(/\[\[SETID\]\]/gi, this.setID).replace("Sort all by", "Sort set by");

		    return resultHtml;
		}

    });

    return my;
}(mtgGen || {}, jQuery));



// --------------------------------------------------------------------------------------------------------------------------------
// ProductView module - products are All Cards, Prerelease, Duel Deck, Intro Packs, etc.
// --------------------------------------------------------------------------------------------------------------------------------
var mtgGen = (function (my, $) {
    'use strict';

    my.ProductView = Backbone.View.extend({
        options: {}

		, productName: undefined
		, typeButtonId: undefined
		, $productTab: undefined

		, hasOptions: false
		, hasPackPresets: false
		, hasButtonOptions: false
		, isInitialized: false
		, isGenerated: false

        // used by all subsequent display/sort methods
		, allCards: []
		, generatedSets: [] // stores the last generated sets of cards
		, sortedSets: [] // stores the last sorted version of generatedSets

		, initialize: function (options) {
		    // save all options
		    var context = this;
		    _.each(options, function (value, key) {
		        context.options[key] = value;
		    });

		    this.productName = my.getRequiredOption(options, 'productName');
		    if (this.productName.indexOf('product-') !== 0) { my.throwTerminalError('ProductView requires a productName parameter, prefixed with "product-". Supplied: ' + this.productName); }
		    this.productDesc = my.getRequiredOption(options, 'productDesc');
		    this.typeButtonId = 'show-' + this.productName;
		    this.isGenerated = this.options.isGenerated || false;
		    this.hasOptions = (this.hasOwnProperty("options") && this.options.hasOwnProperty("options"));
		    this.hasPackPresets = (this.hasOptions && this.options.options.hasOwnProperty("presets"));
		    this.hasButtonOptions = (this.hasOptions && this.options.options.hasOwnProperty("buttons"));

		    return this;
		}

		, events: function () {
		    var events = {};
		    events["click #products #" + this.typeButtonId] = "showTab";
		    events["click #product-content ." + this.productName + " .sort-all-by-name"] = "sortAllByTitle";
		    events["click #product-content ." + this.productName + " .sort-all-by-colour"] = "sortAllByColour";
		    events["click #product-content ." + this.productName + " .sort-all-by-rarity"] = "sortAllByRarity";
		    events["click #product-content ." + this.productName + " .sort-all-by-cost"] = "sortAllByCost";
		    events["click #product-content ." + this.productName + " .sort-all-by-type"] = "sortAllByType";
		    events["click #product-content ." + this.productName + " .sort-all-by-guild"] = "sortAllByGuild";
		    events["click #product-content ." + this.productName + " .sort-all-by-clan"] = "sortAllByClan";
		    events["click #product-content ." + this.productName + " .sort-all-by-sets"] = "sortAllBySets";

		    events["click #product-content ." + this.productName + " .set .sort-by-name"] = "sortByTitle";
		    events["click #product-content ." + this.productName + " .set .sort-by-colour"] = "sortByColour";
		    events["click #product-content ." + this.productName + " .set .sort-by-rarity"] = "sortByRarity";
		    events["click #product-content ." + this.productName + " .set .sort-by-cost"] = "sortByCost";
		    events["click #product-content ." + this.productName + " .set .sort-by-type"] = "sortByType";
		    events["click #product-content ." + this.productName + " .set .sort-by-guild"] = "sortByGuild";
		    events["click #product-content ." + this.productName + " .set .sort-by-clan"] = "sortByClan";
		    events["click #product-content ." + this.productName + " .set .sort-by-opened"] = "sortSetByOpenedOrder";

		    if (this.hasPackPresets) {
		        events["click #product-content ." + this.productName + " .presets a.button"] = "switchPreset";

		        events["click #product-content ." + this.productName + " .options #add-booster"] = "addBooster";
		        events["click #product-content ." + this.productName + " .options .remove-input"] = "removeBooster";
		        events["click #product-content ." + this.productName + " .options #generate"] = "renderResultsFromOptions";
		    }

		    if (this.hasButtonOptions) {
		        events["click #product-content ." + this.productName + " .options a.button"] = "renderPack";
		    }

		    return events;
		}

		, renderType: function () {
		    this.$el.find('#product-content').append("<section class='" + this.productName + "'><section class='options'></section><section class='result' class='stickem-container'></section></section>");
		    this.$el.find('#products').append('<a href="#" id="' + this.typeButtonId + '" class="button">' + this.productDesc + '</a>');
		    this.$productTab = $(this.$el.find('#product-content .' + this.productName));
		    return this;
		}

		, showTab: function () {
		    // set active tab's css class
		    this.$el.find('#products .button').removeClass('active');
		    this.$el.find('#' + this.typeButtonId).addClass('active');

		    my.mainView.currentView = this;

		    // render the options if not already done, hide old tab, show new tab
		    if (!this.isInitialized) {
		        this.isInitialized = true;
		        this.renderOptions();
		    }
		    $('#product-content > section').removeClass('active');
		    $('#product-content .' + this.productName).addClass('active');

		    return false;
		}

		, renderOptions: function () {
		    var topThis = this;
		    if (!this.hasOptions) {
		        this.renderResultsFromOptions();
		    }
		    else if (this.hasPackPresets) {
		        // render the preset buttons so the user can toggle between presets
		        var presetsOut = "";
		        var defaultPreset;
		        if (this.options.options.presets.length > 1) {
		            _.each(this.options.options.presets, function (preset) {
		                var defaultActive = '';
		                if (preset.hasOwnProperty("default") && preset.default === true) {
		                    defaultPreset = preset;
		                    defaultActive = ' active';
		                }
		                presetsOut += "<a href='#' class='button" + defaultActive + "' data-preset='" + preset.presetName + "'>" + preset.presetDesc + "</a>";
		            });
		        }

		        presetsOut = "<div class='presets'>" + presetsOut + "</div>";
		        if (defaultPreset === undefined) {
		            defaultPreset = this.options.options.presets[0]; // if not specfied, use the first one
		        }

		        var packsOut = "<div class='packs'>" + this.renderPackPreset(this.options.packs, defaultPreset) + "</div>";

		        this.$productTab.find('.options').html(presetsOut + packsOut);

		        if (this.options.hasOwnProperty("autoGenerate") && this.options.autoGenerate === true) {
		            this.renderResultsFromOptions();
		        }
		    }
		    else if (this.hasButtonOptions) {

		        var htmlOut = "";
		        var defaultPack;
		        _.each(this.options.options.buttons, function (pack) {
		            var defaultActive = '';
		            if (pack.hasOwnProperty("default") && pack.default === true) {
		                defaultPack = pack;
		                defaultActive = ' active';
		            }
		            var mainPack = my.getPack(pack.packName);
		            var packDesc = (mainPack === undefined) ? console.error("ERROR: Missing packName: " + pack.packName) : mainPack.packDesc;
		            htmlOut += "<a href='#' class='button" + defaultActive + "' data-pack='" + pack.packName + "'>" + packDesc + "</a>";
		        });

		        this.$productTab.find('.options').html(htmlOut);

		        if (this.options.hasOwnProperty("autoGenerate") && this.options.autoGenerate === true) {
		            this.renderResultsFromOptions();
		        }
		    }
		    else {
		        console.error("Cannot render options for product: " + this.productName);
		    }

		    return this;
		}

		, renderPackPreset: function (allPacks, preset) {
		    var packsOut = "";
		    var topThis = this;

		    _.each(preset.packs, function (pack, packIndex) {
		        packsOut += topThis.renderInput(allPacks, pack, packIndex);
		    });

		    packsOut += this.renderInput(allPacks); // will render a booster template for dynamic js addition
		    packsOut += "<button id='add-booster'>Add Booster</button>";
		    packsOut = "<section id='boosters'>" + packsOut + "</section>";
		    packsOut += "<input id='generate' type='submit' value='Generate my sets!' />";

		    return packsOut;
		}

		, renderResultsFromOptions: function () {
		    // if there were options rendered (but not buttons), generate the sets based on the filled-in options
		    if (this.hasButtonOptions) {
		        var activeButton = this.$productTab.find('.button.active');
		        if (activeButton.length < 1) {
		            console.error("ERROR: autoGenerate specified but cannot find active button");
		        }
		        else {
		            var packName = activeButton.attr('data-pack');
		            var packs = [{ packName: packName, count: 1 }];
		            this.generatedSets = my.generateCardSetsFromPacks(packs);
		        }
		    }
		    else if (this.hasOptions) {
		        this.generatedSets = this.generateSetsFromInput();
		    }

		        // otherwise directly execute the packs as defined by the product
		    else {
		        var packs = _.reduce(this.options.packs, function (memo, pack) { return memo.concat({ packName: pack.packName, count: 1 }); }, []);
		        this.generatedSets = my.generateCardSetsFromPacks(packs);
		    }

		    this.renderResults(this.generatedSets);

		    my.trigger('cardSetsGenerated', my.setCode); // triggers google analytics booster-generation tracking event on index.html

		    return this;
		}

		, renderPack: function (event) {
		    var $button = $(event.currentTarget);
		    $button.parent().find('a.button').removeClass('active');
		    $button.addClass('active');

		    var packName = $button.attr('data-pack');

		    this.generatedSets = [];
		    this.generatedSets.push(my.generateCardSetFromPack(packName));

		    this.renderResults(this.generatedSets);

		    my.trigger('cardSetsGenerated', my.setCode); // triggers google analytics booster-generation tracking event on index.html

		    return false;
		}

        // should only be called from renderPack and renderResultsFromOptions
		, renderResults: function (sets) {
		    this.allCards = _.reduce(sets, function (memo, set) { return memo.concat(set); }, []);
		    if (sets.length == 1 && sets[0].setDesc) {
		        this.allCards.setDesc = this.generatedSets[0].setDesc;
		    }

		    var sortAllAndRenderFunction = this.getSortAllFunction(this.options.initialSort);
		    if (this.options.initialSort == my.sortOrders.set.sort) {
		        sortAllAndRenderFunction.call(this, this.generatedSets);
		    }
		    else {
		        sortAllAndRenderFunction.call(this, this.allCards);
		    }

		    return this;
		}

		, switchPreset: function (event) {
		    var $button = $(event.currentTarget);
		    $button.parent().find('a.button').removeClass('active');
		    $button.addClass('active');

		    var presetName = $button.attr('data-preset');

		    // get preset
		    var chosenPreset;
		    _.each(this.options.options.presets, function (preset) {
		        if (preset.presetName == presetName) {
		            chosenPreset = preset;
		            return;
		        }
		    });
		    if (chosenPreset === undefined) {
		        console.error("Cannot find requested presetName: " + presetName);
		        return;
		    }

		    var packsOut = this.renderPackPreset(this.options.packs, chosenPreset);

		    this.$productTab.find('.packs').html(packsOut);

		    return false;
		}

        // render all cards in a single list (e.g.: by name)
		, renderAllCards: function (cards) {
		    var title = cards.setDesc || 'All Cards';
		    var allCardsHtml = my.renderCardsTitle(title + ' <span class="card-count">(' + cards.length + ')')
				+ my.mainView.mainMenu.render(cards)
				+ "<div>" + my.renderCards(cards) + "</div>";
		    my.displayResults(this.productName, allCardsHtml);
		}

        // render all cards grouped into sets (e.g.: by colour, rarity, etc)
		, renderAllCardSets: function (cardSets) {
		    // add setID onto each set to uniquely identify it in this screen
		    _.each(cardSets, function (cardSet, setID) { cardSet.setID = setID; });

		    var summaryMenu = "<section class='menu jump'>" + _.reduce(cardSets, function (memo, cardSet) {
		        return memo += "<a class='jump' href='#" + my.friendly_url(cardSet.setDesc) + "-" + cardSet.setID + "'>" + cardSet.setDesc + "<span class='card-count'> (" + cardSet.length + ")</a>";
		    }, '') + "</section>";
		    var cardCount = my.CountCardsInSets(cardSets);
		    var allCardsHtml = my.renderCardsTitle('All Cards <span class="card-count">(' + cardCount + ')')
				+ my.mainView.mainMenu.render(cardSets)
				+ summaryMenu
				+ "<div>" + my.renderCardSets(cardSets) + "</div>";
		    my.displayResults(this.productName, allCardsHtml);
		}

        // render top-level sets (e.g.: a bunch of card packs)
		, renderCardSets: function (cardSets) {
		    var title = cardSets.length + ' Sets Generated';
		    if (cardSets.length == 1) {
		        title = cardSets[0].setDesc;
		    }
		    var cardCount = my.CountCardsInSets(cardSets);
		    var allCardsHtml = my.renderCardsTitle(title + ' - <span class="card-count">' + cardCount + ' cards')
				+ my.mainView.mainMenu.render(cardSets)
				+ "<div>" + my.renderCardSets(cardSets) + "</div>";
		    my.displayResults(this.productName, allCardsHtml);
		}

        // Sorting all cards  ----------------------------------------------------------------------------------------------------
		, getSortAllFunction: function (sortName) {
		    if (sortName === undefined) {
		        return this.sortAllByNothing;
		    }
		    else {
		        switch (sortName.toLowerCase()) {
		            case my.sortOrders.none.sort: return this.sortAllByNothing;
		            case my.sortOrders.name.sort: return this.sortAllByTitle;
		            case my.sortOrders.colour.sort: return this.sortAllByColour;
		            case my.sortOrders.rarity.sort: return this.sortAllByRarity;
		            case my.sortOrders.cost.sort: return this.sortAllByCost;
		            case my.sortOrders.type.sort: return this.sortAllByType;
		            case my.sortOrders.guild.sort: return this.sortAllByGuild;
		            case my.sortOrders.clan.sort: return this.sortAllByClan;
		            case my.sortOrders.set.sort: return this.sortAllBySets;
		        }
		    }
		    return undefined;
		}

        // these all exist (as mostly pass-throughs) becuase we're using this.events which binds to function names on this
		, sortAllByNothing: function () {
		    var cards = my.sortAllByNothing(this.allCards);
		    this.renderAllCards(cards);
		    return false;
		}

		, sortAllByTitle: function () {
		    var cards = my.sortAllByTitle(this.allCards);
		    this.renderAllCards(cards);
		    return false;
		}

		, sortAllByColour: function () {
		    this.sortedSets = my.sortAllByColour(this.allCards);
		    this.renderAllCardSets(this.sortedSets);
		    return false;
		}

		, sortAllByRarity: function () {
		    this.sortedSets = my.sortAllByRarity(this.allCards);
		    this.renderAllCardSets(this.sortedSets);
		    return false;
		}

		, sortAllByCost: function () {
		    this.sortedSets = my.sortAllByCost(this.allCards);
		    this.renderAllCardSets(this.sortedSets);
		    return false;
		}

		, sortAllByType: function () {
		    this.sortedSets = my.sortAllByType(this.allCards);
		    this.renderAllCardSets(this.sortedSets);
		    return false;
		}

		, sortAllByGuild: function () {
		    this.sortedSets = my.sortAllByGuild(this.allCards);
		    this.renderAllCardSets(this.sortedSets);
		    return false;
		}

		, sortAllByClan: function () {
		    this.sortedSets = my.sortAllByClan(this.allCards);
		    this.renderAllCardSets(this.sortedSets);
		    return false;
		}

		, sortAllBySets: function () {
		    // initial generated sets will already be 'by set'
		    this.sortedSets = _.clone(this.generatedSets);
		    for (var i = 0; i < this.sortedSets.length; i++) {
		        this.sortedSets[i].sortOrder = my.sortOrders.order;
		    }
		    this.sortedSets.sortOrder = my.sortOrders.set;
		    if (this.sortedSets.length == 1) {
		        this.renderAllCards(this.sortedSets[0], this.sortedSets[0].setDesc);
		    }
		    else {
		        this.renderCardSets(this.sortedSets);
		    }
		    return false;
		}

        // Sorting individual sets  -----------------------------------------------------------------------------------------------
		, sortByTitle: function (events) {
		    var setID = $(events.currentTarget).attr('data-setid');
		    var sortedCards = my.sortByTitle(this.sortedSets[setID]);
		    sortedCards.setDesc = this.sortedSets[setID].setDesc; // add the desc back
		    sortedCards.sortOrder = my.sortOrders.name;
		    my.renderSetUpdate(this.productName, setID, sortedCards, this.sortedSets);
		    return false;
		}

		, sortByColour: function (events) {
		    var setID = $(events.currentTarget).attr('data-setid');
		    var sortedCards = my.sortByColour(this.sortedSets[setID]);
		    sortedCards.setDesc = this.sortedSets[setID].setDesc; // add the desc back
		    sortedCards.sortOrder = my.sortOrders.colour;
		    my.renderSetUpdate(this.productName, setID, sortedCards, this.sortedSets);
		    return false;
		}

		, sortByRarity: function (events) {
		    var setID = $(events.currentTarget).attr('data-setid');
		    var sortedCards = my.sortByRarity(this.sortedSets[setID]);
		    sortedCards.setDesc = this.sortedSets[setID].setDesc; // add the desc back
		    sortedCards.sortOrder = my.sortOrders.rarity;
		    my.renderSetUpdate(this.productName, setID, sortedCards, this.sortedSets);
		    return false;
		}

		, sortByCost: function (events) {
		    var setID = $(events.currentTarget).attr('data-setid');
		    var sortedCards = my.sortByCost(this.sortedSets[setID]);
		    sortedCards.setDesc = this.sortedSets[setID].setDesc; // add the desc back
		    sortedCards.sortOrder = my.sortOrders.cost;
		    my.renderSetUpdate(this.productName, setID, sortedCards, this.sortedSets);
		    return false;
		}

		, sortByType: function (events) {
		    var setID = $(events.currentTarget).attr('data-setid');
		    var sortedCards = my.sortByType(this.sortedSets[setID]);
		    sortedCards.setDesc = this.sortedSets[setID].setDesc; // add the desc back
		    sortedCards.sortOrder = my.sortOrders.type;
		    my.renderSetUpdate(this.productName, setID, sortedCards, this.sortedSets);
		    return false;
		}

		, sortByGuild: function (events) {
		    var setID = $(events.currentTarget).attr('data-setid');
		    var sortedCards = my.sortByGuild(this.sortedSets[setID]);
		    sortedCards.setDesc = this.sortedSets[setID].setDesc; // add the desc back
		    sortedCards.sortOrder = my.sortOrders.guild;
		    my.renderSetUpdate(this.productName, setID, sortedCards, this.sortedSets);
		    return false;
		}

		, sortByClan: function (events) {
		    var setID = $(events.currentTarget).attr('data-setid');
		    var sortedCards = my.sortByClan(this.sortedSets[setID]);
		    sortedCards.setDesc = this.sortedSets[setID].setDesc; // add the desc back
		    sortedCards.sortOrder = my.sortOrders.clan;
		    my.renderSetUpdate(this.productName, setID, sortedCards, this.sortedSets);
		    return false;
		}

		, sortSetByOpenedOrder: function (events) {
		    var setID = $(events.currentTarget).attr('data-setid');

		    // just revert back to original set sort order
		    this.sortedSets[setID] = _.clone(this.generatedSets[setID]);
		    this.sortedSets[setID].setDesc = this.generatedSets[setID].setDesc; // add the desc back
		    this.sortedSets[setID].sortOrder = my.sortOrders.order;
		    my.renderSetUpdate(this.productName, setID, this.sortedSets[setID], this.sortedSets);
		    return false;
		}

        // OPTIONS - Input templates (dropdowns)  -----------------------------------------------------------------------------------------------

        // Render an input template (text box for count, drop-down for pack).
        // If no booster and boosterIndex provided, renders a template version for use in dynamic js addition.
		, renderInput: function (packsInDropdown, inputSettings, boosterIndex) {
		    // if no inputSettings provided, we're creating an empty template
		    var htmlOut = (inputSettings) ? "<div class='booster-input'>" : "<div class='booster-input-template' style='display:none'>";

		    // each input gets a unique ID so we know which was clicked later
		    var boosterIndex2 = "template";
		    if (boosterIndex) {
		        boosterIndex2 = (boosterIndex + 1);
		    }

		    // each input has a count next to it (defaults to 1 if not supplied by inputSettings)
		    var inputElId = "booster-count-" + boosterIndex2;
		    var boosterCount = 1;
		    if (inputSettings) {
		        boosterCount = inputSettings.count;
		    }
		    htmlOut += "<input id='" + inputElId + "' type='number' min='0' max='99' value='" + boosterCount + "'>";

		    // render the dropdown containing all available packs
		    htmlOut += "<select id='booster-" + boosterIndex2 + "' data-count-el='" + inputElId + "'>";
		    // if randomDefaultPackName is specified, choose one and use that in place of defaultPackName
		    if (inputSettings && inputSettings.hasOwnProperty('randomDefaultPackName') && _.isArray(inputSettings.randomDefaultPackName)) {
		        inputSettings.defaultPackName = inputSettings.randomDefaultPackName[_.random(0, (inputSettings.randomDefaultPackName.length - 1))];
		    }
		    _.each(packsInDropdown, function (packName) {
		        var selected = "";

		        // if we were passed the actual set of packs, dig one level deeper to get the pack name
		        // otherwise we've just been passed a simple packname/packdesc array from the UI
		        var packName2 = packName;
		        if (packName.packName) {
		            packName2 = packName.packName;
		        }

		        // set the default pack showing in the drop-down if provided
		        if (inputSettings && packName2 == inputSettings.defaultPackName) {
		            selected = " selected";
		        }

		        var pack = my.getPack(packName2);
		        var packDesc = (pack === undefined) ? console.error("ERROR: Missing packName: " + packName2) : pack.packDesc;

		        htmlOut += "<option value='" + packName2 + "'" + selected + ">" + packDesc + "</option>";
		    });
		    htmlOut += "</select>";
		    htmlOut += "<button class='remove-input' title='Remove Booster'>-</button>";
		    htmlOut += "</div>";

		    return htmlOut;
		}

		, addBooster: function () {
		    var html = $('#boosters .booster-input-template').html();

		    var boosterCount = $('#boosters .booster-input').length + 1;
		    while ($('#boosters .booster-' + boosterCount).length > 0) {
		        boosterCount++;
		    }

		    html = html.replace(/booster-count-template/g, 'booster-count-' + boosterCount)
						.replace(/booster-template/g, 'booster-' + boosterCount);
		    html = "<div class='booster-input'>" + html + "</div>";

		    $(html).insertBefore(this.$productTab.find('#boosters .booster-input-template'));
		}

		, removeBooster: function (event) {
		    $(event.currentTarget).parent().remove();
		}

		, generateSetsFromInput: function () {
		    var packs = [];

		    // convert the pack option elements into an array of set names to be generated
		    var topThis = this;
		    var packEls = this.$productTab.find(".options .booster-input select");
		    _.each(packEls, function (el) {
		        var boosterCount = 1;
		        var boosterCountEl = topThis.$productTab.find('#' + $(el).attr('data-count-el'));
		        if (boosterCountEl.length < 1) {
		            console.warn("Missing booster count (data-count-el) for " + el.id);
		        }
		        else {
		            boosterCount = $(boosterCountEl[0]).val();
		        }
		        var pack = { count: boosterCount, packName: el.value };
		        packs.push(pack);
		    });

		    var sets = my.generateCardSetsFromPacks(packs);

		    return sets;
		}

    });

    return my;
}(mtgGen || {}, jQuery));


//// --------------------------------------------------------------------------------------------------------------------------------
//// Save Draw module 
//// --------------------------------------------------------------------------------------------------------------------------------
//var mtgGen = (function (my, $) {
//    'use strict';

//    var SaveDrawView = Backbone.View.extend({
//        el: "body"

//		, initialize: function () {
//		    this.$el.on('click', 'a.save-draw', this.saveDraw);

//		    my.on('menusInitialized', function () {
//		        my.mainView.mainMenu.addMenuItem("saveDraw", 99, function () { return '<a href="#saveDraw" class="button save-draw" data-save-draw="all">Save Draw</a>'; });
//		        //my.mainView.setMenu.addMenuItem("export", 99, function () { return '<a href="#exporter" class="button export" data-export="set">Export</a>'; });
//		    });
//		}

//		, saveDraw: function (event) {
//		    //$.post("/Set/SaveDraw", { name: "John", time: "2pm" })
//		    // JSON doesn't support my odd properties-on-an-array format (oops), so let's convert to something that JSON can handle
//            // And for each card, we only need the set|cardNum as a unique composite key
//		    var saveCards = [];
//		    _.each(my.mainView.currentView.generatedSets, function (generatedSet) {
//		        var set = {
//                    cards: [],
//                    includeWithUserCards: generatedSet.includeWithUserCards,
//                    setName: generatedSet.setName,
//                    sortOrder: generatedSet.sortOrder
//		        };
//		        _.each(generatedSet, function (card) {
//		            set.cards.push({ set: card.set, num: card.num });
//		        });
//		        saveCards.push(set);
//		    });

//		    //_.reduce(my.mainView.currentView.generatedSets, function (memo, cardArray) {
//		    //    return memo.concat(
//            //        {
//            //            cards: cardArray,
//            //            cards2: _.reduce(cardArray, function (memo2, card) { return memo.concat({ set: card.set, num: card.num }); }, []),
//            //            includeWithUserCards: cardArray.includeWithUserCards,
//            //            setDesc: cardArray.setDesc,
//            //            setName: cardArray.setName,
//            //            sortOrder: cardArray.sortOrder
//            //        });
//		    //}, []);
//		    //var saveCards = _.reduce(my.mainView.currentView.generatedSets, function (memo, cardArray) {
//		    //    return memo.concat(
//            //        {
//            //            cards: cardArray,
//            //            cards2: _.reduce(cardArray, function (memo2, card) { return memo.concat({ set: card.set, num: card.num }); }, []),
//            //            includeWithUserCards: cardArray.includeWithUserCards,
//            //            setDesc: cardArray.setDesc,
//            //            setName: cardArray.setName,
//            //            sortOrder: cardArray.sortOrder
//            //        });
//		    //}, []);
//		    $.post("/Set/SaveDraw", { data: JSON.stringify(saveCards) })
//              .done(function (data) {
//                  alert("Data Loaded: " + data);
//              });
//		    return false;
//		}

//    });

//    my.initViews.push(new SaveDrawView()); // hook this module into main rendering view

//    return my;
//}(mtgGen || {}, jQuery));

// --------------------------------------------------------------------------------------------------------------------------------
// Card Set Export module 
// --------------------------------------------------------------------------------------------------------------------------------
var mtgGen = (function (my, $) {
    'use strict';

    var ExportView = Backbone.View.extend({
        el: "body"

		, initialize: function () {
		    this.$el.find('a.export').fancybox();
		    this.$el.on('click', 'a.export', this.showExport);

		    //my.on('ready',function() {
		    my.on('menusInitialized', function () {
		        my.mainView.mainMenu.addMenuItem("export", 99, function () { return '<a href="#exporter" class="button export" data-export="all">Export</a>'; });
		        my.mainView.setMenu.addMenuItem("export", 99, function () { return '<a href="#exporter" class="button export" data-export="set">Export</a>'; });
		    });
		}

		, showExport: function (event) {
		    var $el = $(event.currentTarget);
		    var exportType = $el.attr('data-export');
		    if (exportType == 'all') {
		        addExportableTextFormats(my.mainView.currentView.generatedSets);
		    }
		    else {
		        var setID = $el.parents('.set').attr('data-setid');
		        var sets = [];
		        if (my.mainView.currentView.sortedSets[setID]) {
		            sets.push(my.mainView.currentView.sortedSets[setID]);
		        }
		        else {
		            sets.push(my.mainView.currentView.generatedSets[setID]);
		        }
		        addExportableTextFormats(sets);

		    }
		    // no 'return false;' so fancybox can trigger afterward
		}

		, events: {
		    "click .export-set a.button": "changeExportFormat"
		}

		, render: function () {
		    this.$el.append("<div style='display: none'>"
					+ "<aside id='exporter'>"
						+ "<h2>Export Your Boosters</h2>"
						+ "<section class='export-set'>"
							+ "<p>A variety of programs allow you to import cards in a certain format. Choose your format and copy &amp; paste the result or click Download to get a file.</p>"
							+ "<ul>"
								+ "<li><a href='#' class='button export-dec active' data-export-type='dec'><strong>.dec</strong> - Cockatrice, Apprentice</a></li>"
								+ "<li><a href='#' class='button export-txt' data-export-type='txt'><strong>.txt</strong> - Magic Online</a></li>"
								+ "<li><a href='#' class='button export-mwdeck' data-export-type='mwdeck'><strong>.mwdeck</strong> - Magic Workstation</a></li>"
								+ "<li><a href='#' class='button export-cod' data-export-type='cod'><strong>.cod</strong> - Cockatrice</a></li>"
								+ "<li><a href='#' class='button export-coll' data-export-type='coll'><strong>.coll</strong> - Decked Builder</a></li>"
							+ "</ul>"
						+ "</section>"
						+ "<section class='export-detail'>"
							+ "<p class='card-count'></p>"
							+ "<a href='#' class='button export-download'>Download this format as a file</a>"
							+ "<textarea></textarea>"
						+ "</section>"
					+ "</aside>"
				+ "</div>");
		    return this;
		}

        // UI functions

        // toggle between export formats
		, changeExportFormat: function (e) {
		    var exportType = $(e.target).attr('data-export-type').toLowerCase();
		    chooseExportFormat(exportType);
		    return false;
		}

    });

    my.initViews.push(new ExportView()); // hook this module into main rendering view

    var exports = {}; // all exported deck formats are kept within here

    function addExportableTextFormats(generatedSets) {
        // it's the same list for all formats
        var allCards = getAllDeckBuildingGeneratedCards(generatedSets);
        var countedCards = getUniqueCountedSortedCardSet(allCards);

        var attrib = 'Created by MtG Generator: ' + window.location.href.replace('index.html', '').replace('#', '');

        // store the exports so we can do various things with them later
        $('#exporter .card-count').text(allCards.length + " cards total, " + countedCards.length + " unique");

        exports.dec = renderDecFormat(countedCards, attrib);
        exports.txt = renderTxtFormat(countedCards, attrib);
        exports.mwdeck = renderMwDeckFormat(null, countedCards, attrib);
        exports.cod = renderCodFormat(countedCards, attrib);
        exports.coll = renderCollFormat(countedCards, attrib);

        chooseExportFormat("dec");
    }

    function chooseExportFormat(exportType) {
        $('.export-set a.button').removeClass('active');
        $('.export-set a.export-' + exportType).addClass('active');

        $('#exporter textarea').val(exports[exportType]);
        setLinkToDownloadFile(".export-detail a.export-download", exportType);
    }

    function setLinkToDownloadFile(linkSelector, exportType) {
        var utf8encodedContent = strToUTF8Arr(exports[exportType]);
        var encodedContent = base64EncArr(utf8encodedContent);
        $(linkSelector).attr('href', 'data:text/octet-stream;base64,' + encodedContent);
        $(linkSelector).attr('download', 'mtg-generator-' + my.set.slug + '-prerelease.' + exportType); // 'download' attr is Chrome/FF-only to set download filename
    }

    function getAllDeckBuildingGeneratedCards(cardSets) {
        var cards = [];
        _.each(cardSets, function (cardSet) {
            _.each(cardSet, function (card) {
                cards.push(card);
                /*
                    // Not sure if I should be using this or not.. easy enough for people to clip them out, but impossible for people to get them back if they want them.
                                if (card.usableForDeckBuilding) {
                                    cards.push(card);
                                }
                */
            });
        });
        return cards;
    }

    function getUniqueCountedSortedCardSet(cards) {
        var countedCards = {};
        _.each(cards, function (card) {
            var matchTitle = card.matchTitle;
            if (countedCards[matchTitle] === undefined) {
                card.count = 1;
                countedCards[matchTitle] = card;
            } else {
                countedCards[matchTitle].count++;
            }
        });

        // convert associative array to numeric array
        var cardList = _.toArray(countedCards);
        cardList = _.sortBy(cardList, 'matchTitle');

        return cardList;
    }

    // all 'cards' arguments below should be a list of unique, counted, sorted cards

    // .dec: used by Cockatrice, Apprentice
    // sample (under ".dec File Format"): http://www.deckedbuilder.com/faq.html
    function renderDecFormat(cards, attrib) {
        var output = '// ' + attrib + '\n' + _.reduce(cards, function (memo, card) {
            return memo += 'SB: ' + card.count + ' ' + card.title + '\n';
        }, '');
        return output;
    }

    // .coll: used by used by Decked Builder
    // sample (under ".coll File Format"): http://www.deckedbuilder.com/faq.html
    // No sideboard option as they're not decks; they're card collections.
    function renderCollFormat(cards, attrib) {
        var output = '// ' + attrib + '\n' + _.reduce(cards, function (memo, card) {
            return memo += card.count + ' ' + card.title + ' [' + my.sets[card.set.toUpperCase()].name + ']\n';
        }, '');
        return output;
    }

    // .txt: used by used by Magic Online
    // sample: http://archive.wizards.com/Magic/magazine/article.aspx?x=mtgcom/arcana/678
    function renderTxtFormat(cards, attrib) {
        var output = 'Sideboard\n' + _.reduce(cards, function (memo, card) {
            return memo += card.count + ' ' + card.title + '\n';
        }, '');
        return output;
    }

    // .cod: used by Cockatrice
    // sample: http://mtgstudio.uservoice.com/forums/16948-mtg-studio-suggestions/suggestions/2675891-support-cockatrice-deck-format-
    function renderCodFormat(cards, attrib) {
        var output = '<?xml version="1.0" encoding="UTF-8"?>\n'
				   + '\t<cockatrice_deck version="1">\n'
				   + '\t<deckname>' + my.set.name + ' Prerelease</deckname>\n'
				   + '\t<comments>' + attrib + ' Prerelease</comments>\n'
				   + '\t<zone name="main">\n'
				   + '\t</zone>\n'
				   + '\t<zone name="side">\n'
				   + _.reduce(cards, function (memo, card) {
				       return memo += '\t\t<card number="' + card.count + '" name="' + card.title.replace('&', '&amp;') + '"/>\n';
				   }, '')
				   + '\t</zone>\n'
			       + '</cockatrice_deck>';
        return output;
    }

    // .mwDeck: used by Magic Workstation
    // & replaced with / in card title otherwise MWS won't import
    // sample: https://code.google.com/p/deckprinter/source/browse/trunk/downloaded.mwdeck?spec=svn34&r=34
    function renderMwDeckFormat(cards, sbCards, attrib) {
        var output = '// ' + attrib + '\n';
        var prefix = "    ";
        if (cards !== null && cards.length > 0) {
            output += _.reduce(cards, function (memo, card) { return memo += prefix + card.count + ' [' + card.set.toUpperCase() + '] ' + card.title.replace(' & ', '/') + '\n'; }, '');
        }
        if (sbCards !== null && sbCards.length > 0) {
            prefix = "SB: ";
            output += _.reduce(sbCards, function (memo, card) { return memo += prefix + card.count + ' [' + card.set.toUpperCase() + '] ' + card.title.replace(' & ', '/') + '\n'; }, "// Sideboard:\n");
        }
        return output;
    }

    return my;
}(mtgGen || {}, jQuery));
