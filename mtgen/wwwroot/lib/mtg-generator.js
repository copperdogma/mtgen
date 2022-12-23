/*
MtG Generator script v2.7.3

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

Quick How Tos:
- to add a caveat (yellow note banner above), add an array of 'caveats' to the products.json product. See set MID.

20221216: Can now randomly choose from all packs if products.json/products/options/presets/packs/randomDefaultPackName specified with no array of packs to choose from.
20221113: No longer crashes on export if a set code doesn't exist in sets.json. Now defaults to using that set code in place of set name.
20220421: Includes card num on rendered HTML.
20220414: Added family support for SNC.
20220222: Exporter: Added Magic the Gathering: Arena format.
11-Jun-2021: Added ability to render an array of card modifiers which appear after the card title in brackets.
4-May-2021: Added debug mode that shows a Debug Product and Live Debug Product tabs. To enable, add this to top level of products.json: "debug": true   OR add ?debug=true to the url.
11-Apr-2021: Now includes college support for stx.
3-Apr-2020: Exporter: Added Deckstats format.
3-Apr-2018: Exporter: now combined two-sided cards into FrontTitle // BackTitle, and added Frogtown export format
14-Jun-2017: Exporter: now replaces split card " // " with "/" for txt, and strips out card not usable for deckbuilding
26-Jan-2016: Now uses mtgenId instead of index.
3-Jan-2016: Moved the core logic into mtg-generator-lib.js.
22-Sep-2015: Now exports text formats with \r\n instead of just \n (for Windows/Notepad).
8-Jul-2015: Export now replaces ’ with ' (the former messed up Cockatrice).
8-Jul-2015: Fixed bug where it was allowing duplicates.
13-Jun-2015: Added Faction support (for SOM block).
3-Jan-2015: Added Other Colourless category to handle new FRF {8} Ugin, the Spirit Dragon.
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
// Main View/Renderers 
// --------------------------------------------------------------------------------------------------------------------------------
var mtgGen = (function (my) {
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

            my.products.forEach(product => {
                if (!product.hasOwnProperty('isVisible') || product.isVisible === true) {
                    let options = Object.assign({}, product); // shallow clone
                    options.el = this.el;
                    options.originalProductName = options.productName;
                    options.productName = 'product-' + options.productName;
                    this.ProductViews[options.originalProductName] = new my.ProductView(options);
                }
            });
        }

        , render: function () {
            window.dispatchEvent(new Event('menusInitialized'));

            this.el.innerHTML = ''; // Get rid of the Loading message
            this.el.innerHTML = '<section id="products"></section><section id="product-content"></section><div class="back-to-top"><a class="button top" href="#">Back to top</a></a>';

            // Render the initial views
            my.initViews.forEach(view => view.render());

            // Render the Product views
            Object.values(this.ProductViews).forEach(view => view.renderType());

            // If there is only one Product view, hide the tab button (we need to render it so it will auto-execute the main Product)
            if (Object.keys(this.ProductViews).length < 2) {
                document.querySelector('#products>a.button').style.display = 'none';
            }

            // If specified, auto-showTab the startup product from the Draw (if there is one),
            // if not check if one is specified in the normal startup data.
            if (my.hasDraw() && my.draw.productName && this.ProductViews[my.draw.productName] !== undefined) {
                this.ProductViews[my.draw.productName].showTab();
            }
            else if (my.startProductName) {
                let startProduct = this.ProductViews[my.startProductName];
                if (startProduct === undefined) {
                    console.warn(`startProduct '${my.startProductName}' does not exist.`);
                    startProduct = Object.values(this.ProductViews)[0];
                }        
                startProduct.showTab();
            }
            return this;
        }

    });

    // All results should be rendered through this function
    my.displayResults = function (productName, html) {
        window.dispatchEvent(new Event('menusInitialized'));
        this.contentElem.querySelector('#product-content .' + productName + ' .result').innerHTML = html;
        setTimeout(() => window.dispatchEvent(new Event('layoutChanged')), 500);
    };

    // Replaces a set's contents
    my.renderSetUpdate = function (productName, setID, cards, parentSet) {
        window.dispatchEvent(new Event('menusInitialized'));
        const newSet = my.renderCardSet(setID, cards, parentSet);
        this.contentElem.querySelector('#product-content .' + productName + ' .result .set[data-setid="' + setID + '"]')
            .innerHTML = newSet;
        setTimeout(() => window.dispatchEvent(new Event('layoutChanged')), 500);
    };

    // General rendering functions
    my.renderCardsTitle = function (text) {
        return '<h2>' + text + '<a href="#" class="button top">[ Top ]</a></h2>';
    };

    /*
        NOT USED YET.. but this would be great. Something that translates queries into English so people can both understand what they're getting and 
                    debug my logic if it's wrong

        NOTE: This would be difficult to do. When it renders cards it basically discards the pack queries they were generated from
              and you just end up with an array of cards. The whole generator would have to be re-done to keep the generated cards
              associated with their packs. It would also be useful to see what it was supposed to be and what it was overriden by.
    
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

    my.renderCardImage = function (card) {
        const foilClass = card.foil ? ' foil' : '';
        const title = card.title + (card.foil ? ' - Foil' : '');

        const htmlOut = `<img data-usable-for-deck-building="${card.usableForDeckBuilding}" src="${card.src}" alt="${title}" title="${title}" width="${(card.width || 265)}" height="${(card.height || 370)}" />`;

        return htmlOut;
    };

    my.renderCards = function (cards) {
        const htmlOut = cards.map(card => {
            let foilClass = '', doubleFaceClass = '', aStart = '', aEnd = '';
            let title = card.title;

            let cardImageHtml = my.renderCardImage(card);

            // Older DFC
            if (card.cardBack !== undefined) {
                cardImageHtml += my.renderCardImage(card.cardBack);
                title += '/' + card.cardBack.title;
                doubleFaceClass = ' doubleface';
            }
            else if (card.cardFront !== undefined) {
                cardImageHtml += my.renderCardImage(card.cardFront);
                title += '/' + card.cardFront.title;
                doubleFaceClass = ' doubleface';
            }

            // Newest DFC. Although some are DFCs, some of those only have a single face and aren't flippable. We'll just treat those like regular cards.
            let cardFlipHtml = ''
            const isDoubleFaceCard = card.doubleFaceCard == true && card.cardFaces && card.cardFaces.length == 2 && (card.cardFaces[0].src || card.cardFaces[1].src);
            if (isDoubleFaceCard) {
                const cardImageFrontHtml = my.renderCardImage(card.cardFaces[0]);
                const cardImageBackHtml = my.renderCardImage(card.cardFaces[1]);
                cardImageHtml = `<span class='card-front'>${cardImageFrontHtml}</span><span class='card-back'>${cardImageBackHtml}</span>`;

                cardFlipHtml = '<button type="button" title="Transform" tabindex="-1" class="transform-button"><svg focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path d="M884.3,357.6c116.8,117.7,151.7,277-362.2,320V496.4L243.2,763.8L522,1031.3V860.8C828.8,839.4,1244.9,604.5,884.3,357.6z"></path><path d="M557.8,288.2v138.4l230.8-213.4L557.8,0v142.8c-309.2,15.6-792.1,253.6-426.5,503.8C13.6,527.9,30,330.1,557.8,288.2z"></path></svg></button>';
            }

            if (card.foil) {
                foilClass = ' foil';
                title += ' - Foil';
            }
            if (card.modifiers) {
                title += ' (' + card.modifiers.join('; ') + ')';
            }
            if (card.hasOwnProperty("src_large")) {
                aStart = "<a href='" + card.src_large + "' title='" + title + "'>";
                aEnd = "</a>";
            }

            const includedReason = (card.includedReason !== undefined) ? '<em class="reason">(' + card.includedReason + ')</em>' : '';
            return `<span class="card${foilClass}${doubleFaceClass}" data-card-num="${card.num}" title="${title}">${aStart}${cardImageHtml}${cardFlipHtml}<em class="title">${title}</em>${includedReason}${aEnd}</span>`;
        });
        return htmlOut;
    };

    my.renderCardSets = function (sets, preTitle) {
        return sets.map((set, index) => my.renderCardSet(index, set, sets, preTitle));
    };

    my.renderCardSet = function (setID, cards, parentSet, preTitle) {
        preTitle = preTitle || '';
        my.mainView.setMenu.setID = setID;
        const htmlOut = '<section id="' + my.friendly_url(cards.setDesc) + '-' + setID + '" class="set" data-setid="' + setID + '">'
            + my.renderCardsTitle(preTitle + cards.setDesc + ' <span class="card-count">(' + cards.length + ')')
            + my.mainView.setMenu.render(cards, parentSet)
            + my.renderCards(cards)
            + "</section>";
        return htmlOut;
    };

    return my;
}(mtgGen || {}));


// --------------------------------------------------------------------------------------------------------------------------------
// Menu module 
// --------------------------------------------------------------------------------------------------------------------------------
var mtgGen = (function (my) {
    'use strict';

    // These get reset over and over as we render each menu
    my.menuSortOrder = my.sortOrders.none;
    my.menuOriginalProductName = undefined;
    my.menuGeneratedSetId = undefined;

    my.MenuView = Backbone.View.extend({
        currentSort: undefined // Should be one of my.sortOrders

        // To these should be added functions to be executed that should return nothing or a menu item depending on context
        , menuItems: undefined
        , sortedMenuItems: undefined
        , addMenuItem: function (name, sortIndex, menuItemFunction) {
            if (sortIndex === undefined) {
                const highestSortIndex = this.menuItems.reduce((maxValue, menuItem) => Math.max(maxValue, menuItem.sortIndex));
                sortIndex = highestSortIndex + 5;
            }
            this.menuItems.push(
                { name: name, sortIndex: sortIndex, itemFunction: function () { return menuItemFunction.call(); } }
            );
            this.sortedMenuItems = this.menuItems.sort((a, b) => my.sortBy('sortIndex', a, b));
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

            // Render each menu item in sort order
            let resultHtml = '<section class="menu"><label>Sort all by</label>';
            this.sortedMenuItems.forEach(menuItem => {
                // Check if we're to skip this one
                if (!this.menuNamesToSkip.includes(menuItem.name)) {
                    resultHtml += menuItem.itemFunction();
                }
            });
            resultHtml += '</section>';

            // Reset the skippable names every time so they don't carry over to others
            this.menuNamesToSkip = [];
            return resultHtml;
        }

    });

    my.replaceActiveToken = function (sort, str) {
        const setSort = my.menuSortOrder || '';
        const replacement = (sort == setSort) ? ' active' : '';
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
            this.addMenuItem("faction", 18,
                function () {
                    return (my.hasFactions) ? my.replaceActiveToken('faction', '<a href="#" class="button[[ACTIVE]] sort-all-by-faction">Faction</a>') : '';
                }
            );
            this.addMenuItem("college", 20,
                function () {
                    return (my.hasColleges) ? my.replaceActiveToken('college', '<a href="#" class="button[[ACTIVE]] sort-all-by-college">College</a>') : '';
                }
            );
            this.addMenuItem("family", 21,
                function () {
                    return (my.hasFamilies) ? my.replaceActiveToken('family', '<a href="#" class="button[[ACTIVE]] sort-all-by-family">Family</a>') : '';
                }
            );
            this.addMenuItem("set", 22,
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
            this.addMenuItem("faction", 14,
                function () {
                    return (my.hasFactions) ? my.replaceActiveToken('faction', '<a href="#" class="button[[ACTIVE]] sort-by-faction" data-setid="[[SETID]]">Faction</a>') : '';
                }
            );
            this.addMenuItem("college", 16,
                function () {
                    return (my.hasColleges) ? my.replaceActiveToken('college', '<a href="#" class="button[[ACTIVE]] sort-by-college" data-setid="[[SETID]]">College</a>') : '';
                }
            );
            this.addMenuItem("family", 17,
                function () {
                    return (my.hasFamilies) ? my.replaceActiveToken('family', '<a href="#" class="button[[ACTIVE]] sort-by-family" data-setid="[[SETID]]">Family</a>') : '';
                }
            );
            this.addMenuItem("order", 18,
                function () {
                    return (my.mainView.currentView.isGenerated) ? my.replaceActiveToken('order', '<a href="#" class="button[[ACTIVE]] sort-by-opened" data-setid="[[SETID]]">Opened order</a>')
                        : '';
                }
            );
        }

        , render: function (cardSet, parentSet) {
            // Don't include the sort options that the parent sort is already doing.
            // e.g.: if the top level is Sort by Colour, don't give them an option to sort White again by colour.
            this.menuNamesToSkip.push(parentSet.sortOrder.sort);

            // Also don't include the option to sort by opened order unless the parent search is sort by set
            if (parentSet.sortOrder != my.sortOrders.set) {
                this.menuNamesToSkip.push(my.sortOrders.order.sort);
            }

            let resultHtml = my.MenuView.prototype.render.call(this, cardSet);
            resultHtml = resultHtml.replace(/\[\[SETID\]\]/gi, this.setID).replace('Sort all by', 'Sort set by');

            return resultHtml;
        }

    });

    return my;
}(mtgGen || {}));



// --------------------------------------------------------------------------------------------------------------------------------
// ProductView module - products are All Cards, Prerelease, Duel Deck, Intro Packs, etc.
// --------------------------------------------------------------------------------------------------------------------------------
var mtgGen = (function (my) {
    'use strict';

    my.ProductView = Backbone.View.extend({
        options: {}

        , productName: undefined
        , typeButtonId: undefined

        , hasOptions: false
        , hasPackPresets: false
        , hasButtonOptions: false
        , isInitialized: false
        , isGenerated: false

        // Used by all subsequent display/sort methods
        , allCards: []
        , generatedSets: [] // Stores the last generated sets of cards
        , sortedSets: [] // Stores the last sorted version of generatedSets

        , initialize: function (options) {
            // Save all options
            let context = this;
            this.options = options;
            Object.assign(context.options, options);

            this.productName = my.getRequiredOption(options, 'productName');
            if (!this.productName.startsWith('product-')) { my.throwTerminalError(`ProductView requires a productName parameter, prefixed with "product-". Supplied: ${this.productName}`); }
            this.productDesc = my.getRequiredOption(options, 'productDesc');
            this.typeButtonId = 'show-' + this.productName;
            this.isGenerated = this.options.isGenerated || false;
            this.hasOptions = (this.hasOwnProperty('options') && this.options.hasOwnProperty('options'));
            this.hasPackPresets = (this.hasOptions && this.options.options.hasOwnProperty('presets'));

            return this;
        }

        // TODO: Incompatible with Backbone >=v1.2.0: Views now always delegate their events in setElement.
        //      You can no longer modify the events hash or your view's el property in initialize.
        , events: function () {
            let events = {};
            events["click #products #" + this.typeButtonId] = "showTab";
            events["click #product-content ." + this.productName + " .sort-all-by-name"] = "sortAllByTitle";
            events["click #product-content ." + this.productName + " .sort-all-by-colour"] = "sortAllByColour";
            events["click #product-content ." + this.productName + " .sort-all-by-rarity"] = "sortAllByRarity";
            events["click #product-content ." + this.productName + " .sort-all-by-cost"] = "sortAllByCost";
            events["click #product-content ." + this.productName + " .sort-all-by-type"] = "sortAllByType";
            events["click #product-content ." + this.productName + " .sort-all-by-guild"] = "sortAllByGuild";
            events["click #product-content ." + this.productName + " .sort-all-by-clan"] = "sortAllByClan";
            events["click #product-content ." + this.productName + " .sort-all-by-faction"] = "sortAllByFaction";
            events["click #product-content ." + this.productName + " .sort-all-by-college"] = "sortAllByCollege";
            events["click #product-content ." + this.productName + " .sort-all-by-family"] = "sortAllByFamily";
            events["click #product-content ." + this.productName + " .sort-all-by-sets"] = "sortAllBySets";

            events["click #product-content ." + this.productName + " .set .sort-by-name"] = "sortByTitle";
            events["click #product-content ." + this.productName + " .set .sort-by-colour"] = "sortByColour";
            events["click #product-content ." + this.productName + " .set .sort-by-rarity"] = "sortByRarity";
            events["click #product-content ." + this.productName + " .set .sort-by-cost"] = "sortByCost";
            events["click #product-content ." + this.productName + " .set .sort-by-type"] = "sortByType";
            events["click #product-content ." + this.productName + " .set .sort-by-guild"] = "sortByGuild";
            events["click #product-content ." + this.productName + " .set .sort-by-clan"] = "sortByClan";
            events["click #product-content ." + this.productName + " .set .sort-by-faction"] = "sortByFaction";
            events["click #product-content ." + this.productName + " .set .sort-by-college"] = "sortByCollege";
            events["click #product-content ." + this.productName + " .set .sort-by-family"] = "sortByFamily";
            events["click #product-content ." + this.productName + " .set .sort-by-opened"] = "sortSetByOpenedOrder";

            if (this.hasPackPresets) {
                events["click #product-content ." + this.productName + " .presets a.button"] = "switchPreset";

                events["click #product-content ." + this.productName + " .options #add-booster"] = "addBooster";
                events["click #product-content ." + this.productName + " .options .remove-input"] = "removeBooster";
                events["click #product-content ." + this.productName + " .options #generate"] = "renderResultsFromOptions";
                events["click #product-content ." + this.productName + " .options #use-custom-seed"] = "toggleCustomSeed";
            }

            events["click #product-content ." + this.productName + " .card .transform-button"] = "transformCard";

            return events;
        }

        , getCurrentTab: function () {
            return document.querySelector('#product-content section.active');
        }

        , renderType: function () {
            this.el.querySelector('#product-content').insertAdjacentHTML('beforeend', "<section class='" + this.productName + "'><section class='options'></section><section class='result' class='stickem-container'></section></section>");
            this.el.querySelector('#products').insertAdjacentHTML('beforeend', '<a href="#" id="' + this.typeButtonId + '" class="button">' + this.productDesc + '</a>');
            return this;
        }

        , showTab: function () {
            // Set active tab's css class
            Array.from(this.el.querySelectorAll('#products .button')).forEach(n => n.classList.remove('active'));
            this.el.querySelector('#' + this.typeButtonId).classList.add('active');

            my.mainView.currentView = this;

            Array.from(this.el.querySelectorAll('#product-content > section')).forEach(n => n.classList.remove('active'));
            this.el.querySelector('#product-content .' + this.productName).classList.add('active');

            // Render the options if not already done, hide old tab, show new tab
            if (!this.isInitialized) {
                this.isInitialized = true;
                this.renderOptions();
            }

            return false;
        }

        , renderOptions: function () {
            // Short-circuit if there's a saved deck for this tab.
            if (my.hasDrawForCurrentProduct()) {
                // Determine the sets that are to be displayed and how many of each.
                const setCounts = my.draw.sets.reduce((counts, set) => {
                    counts[set.setName] = (counts[set.setName] || 0) + 1;
                    return counts;
                }, {});

                const packs = Object.entries(setCounts).map(([setName, setCount]) => { return { 'count': setCount, 'defaultPackName': setName }; });
                const defaultPreset = { 'packs': packs };

                // Render the preset buttons so the user can toggle between presets
                const presetsOut = "<div class='presets'></div>";

                const packsOut = "<div class='packs'>" + this.renderPackPreset(this.options.packs, defaultPreset) + "</div>";

                this.getCurrentTab().querySelector('.options').innerHTML = presetsOut + packsOut;

                // Render the "results" from the saved draw data
                const savedDrawSets = my.draw.sets.map(drawSet => {
                    const packDef = my.getPack(drawSet.setName);

                    let set = [];
                    set.setName = drawSet.setName;
                    set.setDesc = packDef.packDesc;
                    if (packDef.includeWithUserCards !== undefined) {
                        set.includeWithUserCards = packDef.includeWithUserCards;
                    }

                    // Look up the cards.
                    drawSet.mtgenIds.forEach(mtgenId => {
                        const foundCard = my.cards[mtgenId];
                        if (foundCard) {
                            set.push(foundCard);
                        }
                        else {
                            console.warn(`Cannot find card saved in draw: ${mtgenId}`);
                        }
                    });
                    return set;
                });
                this.generatedSets = savedDrawSets;
                this.renderResults(savedDrawSets);

                return;
            }

            if (!this.hasOptions) {
                this.renderResultsFromOptions();
            }
            else if (this.hasPackPresets) {
                // Render the preset buttons so the user can toggle between presets
                let presetsOut = '';
                let defaultPreset;
                if (this.options.options.presets.length > 1) {
                    this.options.options.presets.forEach(preset => {
                        let defaultActive = '';
                        if (preset.hasOwnProperty('default') && preset.default === true) {
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

                const packsOut = "<div class='packs'>" + this.renderPackPreset(this.options.packs, defaultPreset) + "</div>";

                this.getCurrentTab().querySelector('.options').innerHTML = presetsOut + packsOut;

                if (this.options.hasOwnProperty('autoGenerate') && this.options.autoGenerate === true) {
                    this.renderResultsFromOptions();
                }
            }
            else if (this.hasButtonOptions) {
                let htmlOut = '';
                let defaultPack;
                this.options.options.buttons.forEach(pack => {
                    let defaultActive = '';
                    if (pack.hasOwnProperty('default') && pack.default === true) {
                        defaultPack = pack;
                        defaultActive = ' active';
                    }
                    const mainPack = my.getPack(pack.packName);
                    const packDesc = (mainPack === undefined) ? console.error(`ERROR: Missing packName: ${pack.packName}`) : mainPack.packDesc;
                    htmlOut += "<a href='#' class='button" + defaultActive + "' data-pack='" + pack.packName + "'>" + packDesc + "</a>";
                });

                this.getCurrentTab().querySelector('.options').innerHTML = htmlOut;

                if (this.options.hasOwnProperty('autoGenerate') && this.options.autoGenerate === true) {
                    this.renderResultsFromOptions();
                }
            }
            else {
                console.error(`Cannot render options for product: ${this.productName}`);
            }

            return this;
        }

        , renderPackPreset: function (allPacks, preset) {
            // "Live Debug" product where user can type in any query and run it.
            if (allPacks.length == 1 && allPacks[0].packName == 'live-debug-dummy-pack') {
                let packsOut = "<p>Enter your query:</p>";
                packsOut += "<textarea id='product-query' cols='60' rows='5'></textarea><br/>";
                packsOut += "<input id='generate' type='submit' value='Run my query!' />";
                return packsOut;
            }
            else {
                // Regular product packs.
                let packsOut = preset.packs.reduce((packString, pack, packIndex) => { return packString += this.renderInput(allPacks, pack, packIndex); }, '');

                packsOut += this.renderInput(allPacks); // Will render a booster template for dynamic js addition
                // FIXME: IDs should *never* be duplicated in the DOM, even in invisible tabs.
                packsOut += "<button id='add-booster'>Add Booster</button>";
                packsOut = "<section id='boosters'>" + packsOut + "</section>";
                packsOut += "<input id='generate' type='submit' value='Generate my sets!' />";
                packsOut += "<input id='use-custom-seed' type='checkbox' />";
                // FIXME: when we get proper IDs, the label for should work
                packsOut += "<label for='use-custom-seed'>Seed:</label>";
                packsOut += "<input id='custom-seed' type='text' disabled='true' />";
                packsOut += "<span id='custom-seed-warning' style='display:none'><b>WARNING!</b> Experimental feature!</span>";
                return packsOut;
            }
        }

        , toggleCustomSeed: function () {
            var curTab = this.getCurrentTab();
            var newState = curTab.querySelector('#use-custom-seed').checked;

            curTab.querySelector('#custom-seed').disabled = !newState;
            var disp;
            if (newState) {
                disp = 'inline';
            } else {
                disp = 'none';
            }
            curTab.querySelector('#custom-seed-warning').style = 'display: ' + disp;
        }

        , seedRNGFromInput: function () {
            var curTab = this.getCurrentTab();
            var useCustom = curTab.querySelector('#use-custom-seed').checked;

            var seed;
            if (useCustom) {
                seed = curTab.querySelector('#custom-seed').value;
            } else {
                seed = my.getRandomSeed();
                curTab.querySelector('#custom-seed').value = seed;
            }

            my.seedRNG(seed);
        }

        , renderResultsFromOptions: function () {
            let packs = [];

            // If there WAS a draw for this product, clear it.
            if (my.hasDrawForCurrentProduct()) {
                my.draw = undefined;
            }

            // If there were options rendered (but not buttons), generate the sets based on the filled-in options
            if (this.hasButtonOptions) {
                let activeButton = this.getCurrentTab().querySelector('.button.active');

                if (activeButton === null) {
                    console.error('ERROR: autoGenerate specified but cannot find active button');
                }
                else {
                    const packName = activeButton.getAttribute('data-pack');
                    packs = [{ packName: packName, count: 1 }];
                }
            }
            // Live Debug tab with a text box that lets the user enter a query to run live
            else if (this.options.productName == 'product-live-debug') {
                const debugQuery = this.getCurrentTab().querySelector('#product-query').value;
                // Create a dummy pack from this query to let it run through the standard generateCardSetFromPack(packName) function
                const tempPackName = 'product-live-debug-pack';
                const tempPack = {
                    packName: tempPackName,
                    count: 1,
                    isGenerated: true,
                    cards: [{ query: debugQuery } ]
                };
                packs.push(tempPack);
                my.packs = my.packs.filter(pack => pack.packName !== tempPackName); // Remove existing pack from previous runs if there is one.
                my.packs.push(tempPack);
            }
            // Normal tab, like Prerelease, that shows a few drop downs and a Generate button.
            else if (this.hasOptions) {
                packs = this.getPacksFromInput();
            }
            // Otherwise directly execute the packs as defined by the product (like All Cards).
            else {
                packs = this.options.packs.map(pack => { return { packName: pack.packName, count: 1 }; });
            }

            // Generate the cards, one set per pack, and render them to the UI.
            this.seedRNGFromInput();
            this.generatedSets = my.generateCardSetsFromPacks(packs);
            this.renderResults(this.generatedSets);

            // Triggers google analytics booster-generation tracking event on index.html
            window.dispatchEvent(new CustomEvent('cardSetsGenerated', { detail: { setCode: my.setCode } }));

            return this;
        }

        // Should only be called from renderResultsFromOptions
        , renderResults: function (sets) {
            this.allCards = sets.reduce((sets, set) => sets.concat(set), []);
            if (sets.length === 1 && sets[0].setDesc) {
                this.allCards.setDesc = this.generatedSets[0].setDesc;
            }

            const sortAllAndRenderFunction = this.getSortAllFunction(this.options.initialSort);
            if (this.options.initialSort == my.sortOrders.set.sort) {
                sortAllAndRenderFunction.call(this, this.generatedSets);
            }
            else {
                sortAllAndRenderFunction.call(this, this.allCards);
            }

            // Tells the UI a set of cards was rendered. Currently used to trigger Holder.run().
            window.dispatchEvent(new CustomEvent('resultsRendered', { detail: { getCurrentTab: my.getCurrentTab } }));

            return this;
        }

        , switchPreset: function (event) {
            // Get preset
            Array.from(event.target.parentNode.querySelectorAll('a.button')).forEach(n => n.classList.remove('active'));
            event.target.classList.add('active');

            // Get preset
            const presetName = event.target.getAttribute('data-preset');
            const chosenPreset = this.options.options.presets.find(preset => preset.presetName == presetName);
            if (chosenPreset === undefined) {
                console.error(`Cannot find requested presetName: ${presetName}`);
                return;
            }

            const packsOut = this.renderPackPreset(this.options.packs, chosenPreset);

            this.getCurrentTab().querySelector('.packs').innerHTML = packsOut;

            return false;
        }

        // Render all cards in a single list (e.g.: by name)
        , renderAllCards: function (cards) {
            const title = cards.setDesc || 'All Cards';
            const allCardsHtml = my.renderCardsTitle(title + ' <span class="card-count">(' + cards.length + ')')
                + my.mainView.mainMenu.render(cards)
                + "<div>" + my.renderCards(cards) + "</div>";
            my.displayResults(this.productName, allCardsHtml);
        }

        // Render all cards grouped into sets (e.g.: by colour, rarity, etc)
        , renderAllCardSets: function (cardSets) {
            // Add setID onto each set to uniquely identify it in this screen
            cardSets.forEach((cardSet, setID) => cardSet.setID = setID);

            const summaryMenu = "<section class='menu jump'>" + cardSets.reduce((memo, cardSet) =>
                memo += "<a class='jump' href='#" + my.friendly_url(cardSet.setDesc) + "-" + cardSet.setID + "'>" + cardSet.setDesc + "<span class='card-count'> (" + cardSet.length + ")</a>"
                , '') + "</section>";
            const cardCount = my.CountCardsInSets(cardSets);
            const allCardsHtml = my.renderCardsTitle('All Cards <span class="card-count">(' + cardCount + ')')
                + my.mainView.mainMenu.render(cardSets)
                + summaryMenu
                + "<div>" + my.renderCardSets(cardSets) + "</div>";
            my.displayResults(this.productName, allCardsHtml);
        }

        // Render top-level sets (e.g.: a bunch of card packs)
        , renderCardSets: function (cardSets) {
            let title = '';
            if (my.hasDrawForCurrentProduct()) {
                title += "<strong title='Saved on " + (new Date(my.draw.timestamp)) + "'>Saved Draw:</strong> " + cardSets.length + " Sets Recreated";
            }
            else {
                title += cardSets.length + ' Sets Generated';
            }
            if (cardSets.length == 1) {
                title = cardSets[0].setDesc;
            }
            let caveats = '';
            if (this.options.hasOwnProperty('caveats')) {
                this.options.caveats.forEach(caveat => caveats += "<div class='caveat'>" + caveat + "</div>");
            }
            const cardCount = my.CountCardsInSets(cardSets);
            const allCardsHtml = my.renderCardsTitle(title + ' - <span class="card-count">' + cardCount + ' cards')
                + my.mainView.mainMenu.render(cardSets)
                + caveats
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
                    case my.sortOrders.faction.sort: return this.sortAllByFaction;
                    case my.sortOrders.college.sort: return this.sortAllByCollege;
                    case my.sortOrders.family.sort: return this.sortAllByFamily;
                    case my.sortOrders.set.sort: return this.sortAllBySets;
                }
            }
            return undefined;
        }

        // These all exist (as mostly pass-throughs) becuase we're using this.events which binds to function names on this
        , sortAllByNothing: function () {
            const cards = my.sortAllByNothing(this.allCards);
            this.renderAllCards(cards);
            return false;
        }

        , sortAllByTitle: function () {
            const cards = my.sortAllByTitle(this.allCards);
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

        , sortAllByFaction: function () {
            this.sortedSets = my.sortAllByFaction(this.allCards);
            this.renderAllCardSets(this.sortedSets);
            return false;
        }

        , sortAllByCollege: function () {
            this.sortedSets = my.sortAllByCollege(this.allCards);
            this.renderAllCardSets(this.sortedSets);
            return false;
        }

        , sortAllByFamily: function () {
            this.sortedSets = my.sortAllByFamily(this.allCards);
            this.renderAllCardSets(this.sortedSets);
            return false;
        }

        , sortAllBySets: function () {
            // Initial generated sets will already be 'by set'
            this.sortedSets = this.generatedSets.slice(); // clone array
            this.sortedSets.forEach((sortedSet, index) => sortedSet.sortOrder = my.sortOrders.order);
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
            const setID = events.target.getAttribute('data-setid');
            let sortedCards = my.sortByTitle(this.sortedSets[setID]);
            sortedCards.setDesc = this.sortedSets[setID].setDesc; // add the desc back
            sortedCards.sortOrder = my.sortOrders.name;
            my.renderSetUpdate(this.productName, setID, sortedCards, this.sortedSets);
            return false;
        }

        , sortByColour: function (events) {
            const setID = events.target.getAttribute('data-setid');
            let sortedCards = my.sortByColour(this.sortedSets[setID]);
            sortedCards.setDesc = this.sortedSets[setID].setDesc; // add the desc back
            sortedCards.sortOrder = my.sortOrders.colour;
            my.renderSetUpdate(this.productName, setID, sortedCards, this.sortedSets);
            return false;
        }

        , sortByRarity: function (events) {
            const setID = events.target.getAttribute('data-setid');
            let sortedCards = my.sortByRarity(this.sortedSets[setID]);
            sortedCards.setDesc = this.sortedSets[setID].setDesc; // add the desc back
            sortedCards.sortOrder = my.sortOrders.rarity;
            my.renderSetUpdate(this.productName, setID, sortedCards, this.sortedSets);
            return false;
        }

        , sortByCost: function (events) {
            const setID = events.target.getAttribute('data-setid');
            let sortedCards = my.sortByCost(this.sortedSets[setID]);
            sortedCards.setDesc = this.sortedSets[setID].setDesc; // add the desc back
            sortedCards.sortOrder = my.sortOrders.cost;
            my.renderSetUpdate(this.productName, setID, sortedCards, this.sortedSets);
            return false;
        }

        , sortByType: function (events) {
            const setID = events.target.getAttribute('data-setid');
            let sortedCards = my.sortByType(this.sortedSets[setID]);
            sortedCards.setDesc = this.sortedSets[setID].setDesc; // add the desc back
            sortedCards.sortOrder = my.sortOrders.type;
            my.renderSetUpdate(this.productName, setID, sortedCards, this.sortedSets);
            return false;
        }

        , sortByGuild: function (events) {
            const setID = events.target.getAttribute('data-setid');
            let sortedCards = my.sortByGuild(this.sortedSets[setID]);
            sortedCards.setDesc = this.sortedSets[setID].setDesc; // add the desc back
            sortedCards.sortOrder = my.sortOrders.guild;
            my.renderSetUpdate(this.productName, setID, sortedCards, this.sortedSets);
            return false;
        }

        , sortByClan: function (events) {
            const setID = events.target.getAttribute('data-setid');
            let sortedCards = my.sortByClan(this.sortedSets[setID]);
            sortedCards.setDesc = this.sortedSets[setID].setDesc; // add the desc back
            sortedCards.sortOrder = my.sortOrders.clan;
            my.renderSetUpdate(this.productName, setID, sortedCards, this.sortedSets);
            return false;
        }

        , sortByFaction: function (events) {
            const setID = events.target.getAttribute('data-setid');
            let sortedCards = my.sortByFaction(this.sortedSets[setID]);
            sortedCards.setDesc = this.sortedSets[setID].setDesc; // add the desc back
            sortedCards.sortOrder = my.sortOrders.faction;
            my.renderSetUpdate(this.productName, setID, sortedCards, this.sortedSets);
            return false;
        }

        , sortByCollege: function (events) {
            const setID = events.target.getAttribute('data-setid');
            let sortedCards = my.sortByCollege(this.sortedSets[setID]);
            sortedCards.setDesc = this.sortedSets[setID].setDesc; // add the desc back
            sortedCards.sortOrder = my.sortOrders.college;
            my.renderSetUpdate(this.productName, setID, sortedCards, this.sortedSets);
            return false;
        }

        , sortByFamily: function (events) {
            const setID = events.target.getAttribute('data-setid');
            let sortedCards = my.sortByFamily(this.sortedSets[setID]);
            sortedCards.setDesc = this.sortedSets[setID].setDesc; // add the desc back
            sortedCards.sortOrder = my.sortOrders.family;
            my.renderSetUpdate(this.productName, setID, sortedCards, this.sortedSets);
            return false;
        }

        , sortSetByOpenedOrder: function (events) {
            const setID = events.target.getAttribute('data-setid');
            this.sortedSets[setID] = this.generatedSets[setID].slice(); // array clone
            this.sortedSets[setID].setDesc = this.generatedSets[setID].setDesc; // add the desc back
            this.sortedSets[setID].sortOrder = my.sortOrders.order;
            my.renderSetUpdate(this.productName, setID, this.sortedSets[setID], this.sortedSets);
            return false;
        }

        // OPTIONS - Input templates (dropdowns)  -----------------------------------------------------------------------------------------------

        // Render an input template (text box for count, drop-down for pack).
        // If no booster and boosterIndex provided, renders a template version for use in dynamic js addition.
        , renderInput: function (packsInDropdown, inputSettings, boosterIndex) {
            // If no inputSettings provided, we're creating an empty template
            let htmlOut = (inputSettings) ? "<div class='booster-input'>" : "<div class='booster-input-template' style='display:none'>";

            // Each input gets a unique ID so we know which was clicked later
            const boosterIndex2 = boosterIndex ? (boosterIndex + 1) : "template";

            // Each input has a count next to it (defaults to 1 if not supplied by inputSettings)
            const inputElId = "booster-count-" + boosterIndex2;
            const boosterCount = inputSettings ? inputSettings.count : 1;
            htmlOut += "<input id='" + inputElId + "' type='number' min='0' max='99' value='" + boosterCount + "'>";

            // Render the dropdown containing all available packs
            htmlOut += "<select id='booster-" + boosterIndex2 + "' data-count-el='" + inputElId + "'>";

            // If randomDefaultPackName is specified, choose one and use that in place of defaultPackName
            if (inputSettings && inputSettings.hasOwnProperty('randomDefaultPackName') && Array.isArray(inputSettings.randomDefaultPackName)) {
                // If pack names were specified, choose one of those.
                if (inputSettings.randomDefaultPackName.length > 0) {
                    inputSettings.defaultPackName = inputSettings.randomDefaultPackName[Math.floor(Math.random() * inputSettings.randomDefaultPackName.length)];
                }
                // Otherwise choose a random one from all available packs.
                else {
                    inputSettings.defaultPackName = packsInDropdown[Math.floor(Math.random() * packsInDropdown.length)];
                }
            }
            packsInDropdown.forEach(packName => {
                let selected = '';

                // If we were passed the actual set of packs, dig one level deeper to get the pack name
                // otherwise we've just been passed a simple packname/packdesc array from the UI
                const packName2 = packName.packName ? packName.packName : packName;

                // Set the default pack showing in the drop-down if provided
                if (inputSettings && packName2 == inputSettings.defaultPackName) {
                    selected = ' selected';
                }

                const pack = my.getPack(packName2);
                const packDesc = (pack === undefined) ? console.error(`ERROR: Missing packName: ${packName2}`) : pack.packDesc;

                htmlOut += "<option value='" + packName2 + "'" + selected + ">" + packDesc + "</option>";
            });
            htmlOut += "</select>";
            htmlOut += "<button class='remove-input' title='Remove Booster'>-</button>";
            htmlOut += "</div>";

            return htmlOut;
        }

        , addBooster: function () {
            //let html = $('#boosters .booster-input-template').html();

            //let boosterCount = $('#boosters .booster-input').length + 1;
            //while ($('#boosters .booster-' + boosterCount).length > 0) {
            //    boosterCount++;
            //}

            //html = html.replace(/booster-count-template/g, 'booster-count-' + boosterCount)
            //    .replace(/booster-template/g, 'booster-' + boosterCount);
            //html = "<div class='booster-input'>" + html + "</div>";

            //$(html).insertBefore(this.$productTab.find('#boosters .booster-input-template'));
            let html = document.querySelector('#boosters .booster-input-template').innerHTML;

            let boosterCount = document.querySelectorAll('#boosters .booster-input').length + 1;
            while (document.querySelector('#boosters .booster-' + boosterCount)) {
                boosterCount++;
            }

            html = html.replace(/booster-count-template/g, 'booster-count-' + boosterCount)
                .replace(/booster-template/g, 'booster-' + boosterCount);
            html = "<div class='booster-input'>" + html + "</div>";

            this.getCurrentTab().querySelector('#boosters .booster-input-template').insertAdjacentHTML('beforebegin', html);
        }

        , removeBooster: function (event) {
            event.target.parentNode.parentNode.removeChild(event.target.parentNode);
        }

        , getPacksFromInput: function () {
            let packs = [];

            // Convert the pack option elements into an array of set names to be generated
            const topThis = document.querySelector('#product-content section.active');
            const packEls = topThis.querySelectorAll('.options .booster-input select');
            Array.from(packEls).forEach(el => {
                let boosterCount = 1;
                const boosterCountEl = topThis.querySelector('#' + el.getAttribute('data-count-el'));
                if (boosterCountEl === null) {
                    console.warn(`Missing booster count (data-count-el) for ${el.id}`);
                }
                else {
                    boosterCount = boosterCountEl.value;
                }
                const pack = { count: boosterCount, packName: el.value };
                packs.push(pack);
            });

            return packs;
        }

        , transformCard: function (event) {
            event.target.parentNode.classList.toggle('flipped');
            return false;
        }
    });

    return my;
}(mtgGen || {}));


// --------------------------------------------------------------------------------------------------------------------------------
// Save Draw module 
// --------------------------------------------------------------------------------------------------------------------------------
var mtgGen = (function (my) {
    'use strict';

    var SaveDrawView = Backbone.View.extend({
        el: "body"

        , initialize: function () {
            this.el.addEventListener('click', (e) => { if (e.target.classList.contains('save-draw')) { this.saveDraw(e); } });

            window.addEventListener('ready', e => {
                my.mainView.mainMenu.addMenuItem("saveDraw", 99, function () {
                    // If it's a generated view or there's already a draw saved for the current product, 
                    // don't show the Save Draw button
                    if (!my.mainView.currentView.isGenerated || my.hasDrawForCurrentProduct()) {
                        return "";
                    }
                    return '<a href="#save-draw" class="button save-draw" data-save-draw="all" title="Save/Share your draw">Save Draw</a>'
                });
            }, false);

            window.addEventListener('cardSetsGenerated', e => {
                // Erase out storage of the last draw once a new one has been created.
                // It will be re-saved when the user clicks Save Draw again.
                my.mainView.currentView.saveDrawResults = undefined;
            }, false);
        }

        , saveDraw: function (event) {
            //$.post("/[set]/SaveDraw", { name: "John", time: "2pm" })
            // JSON doesn't support my odd properties-on-an-array format (oops), so let's convert to something that JSON can handle
            // And for each card, we only need the set|cardNum as a unique composite key
            let drawData = {
                generatorVersion: my.version,
                drawVersion: '1.0',
                useCount: 1,
                productName: my.mainView.currentView.options.originalProductName,
                sets: []
            }
            my.mainView.currentView.generatedSets.forEach(generatedSet => {
                const set = {
                    mtgenIds: generatedSet.map(generatedSet => generatedSet.mtgenId),
                    setName: generatedSet.setName,
                    sortOrder: generatedSet.sortOrder.sort,
                    packVersion: generatedSet.packVersion || '1.0'
                };
                drawData.sets.push(set);
            });

            if (my.mainView.currentView.saveDrawResults !== undefined) {
                displayDrawResults(my.mainView.currentView.saveDrawResults);
            }
            else {
                document.querySelector('#save-draw input').value = 'Loading...';
                fetch(`/api/${my.setCode}/draws`, {
                    method: "POST",
                    headers: new Headers({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify(drawData)
                })
                    .then(response => {
                        if (response.ok) { return response.json(); }
                        my.throwTerminalError('Save draw failed.');
                    })
                    // e.g. return: { "drawId": "m09mJw", "url": "ogw?draw=m09mJw" }
                    .then(drawResults => displayDrawResults(drawResults));
            }

            window.modal.setContent(document.querySelector('.save-draw.modal').outerHTML);

            window.modal.open();

            window.dispatchEvent(new CustomEvent('drawSaved', { detail: { setCode: my.setCode } })); // triggers google analytics tracking event

            // no 'return false;' so fancybox can trigger afterward
        }

        , render: function () {
            this.el.insertAdjacentHTML('beforeend', "<div style='display: none'>"
                + "<aside id='save-draw' class='modal save-draw'>"
                + "<h2>Save or Share Your Draw</h2>"
                + "<section>"
                + "<p>Bookmark this page or copy and save/share the following link:</p>"
                + "<p><input type='text' /></p>"
                + "</section class='export-set'>"
                + "</aside>"
                + "</div>");
            return this;
        }
    });

    my.initViews.push(new SaveDrawView()); // Hook this module into main rendering view

    function displayDrawResults(drawData) {
        history.pushState({ setCode: my.setCode, drawId: drawData.drawId },
            my.set.name + " Draw", drawData.url); // Change the url to match the saved draw
        my.mainView.currentView.saveDrawResults = drawData; // Save it so we don't regenerate it

        // Display it
        const saveDrawInput = document.querySelector("#save-draw input");
        saveDrawInput.value = window.location.href
        saveDrawInput.select();
        saveDrawInput.focus();
    }

    return my; // END Save Draw module
}(mtgGen || {}));

// --------------------------------------------------------------------------------------------------------------------------------
// Card Set Export module 
// --------------------------------------------------------------------------------------------------------------------------------
var mtgGen = (function (my) {
    'use strict';

    var ExportView = Backbone.View.extend({
        el: "body"

        , initialize: function () {
            this.el.addEventListener('click', (e) => { if (e.target.classList.contains('export')) { this.showExport(e); } });

            window.addEventListener('ready', e => {
                my.mainView.mainMenu.addMenuItem("export", 99, () => '<a href="#exporter" class="button export" data-export="all">Export</a>');
                my.mainView.setMenu.addMenuItem("export", 99, () => '<a href="#exporter" class="button export" data-export="set">Export</a>');
            }, false);
        }

        , showExport: function (event) {
            const exportType = event.target.getAttribute('data-export');
            if (exportType == 'all') {
                addExportableTextFormats(my.mainView.currentView.generatedSets);
            }
            else {
                const setID = event.target.closest('.set').getAttribute('data-setid');
                let sets = [];
                if (my.mainView.currentView.sortedSets[setID]) {
                    sets.push(my.mainView.currentView.sortedSets[setID]);
                }
                else {
                    sets.push(my.mainView.currentView.generatedSets[setID]);
                }
                addExportableTextFormats(sets);
            }

            window.modal.setContent(document.querySelector('.exporter.modal').outerHTML);

            // Display the first format (dec: Cockatrice) for initial display
            chooseExportFormat('dec');

            window.modal.open();

            window.dispatchEvent(new CustomEvent('exporting', { detail: { setCode: my.setCode } })); // triggers google analytics tracking event
            // No 'return false;' so model plugin can trigger afterward
        }

        , events: {
            "click .export-set a.button": "changeExportFormat"
        }

        , render: function () {
            this.el.insertAdjacentHTML('beforeend', "<div style='display: none'>"
                + "<aside id='exporter' class='modal exporter'>"
                + "<h2>Export Your Boosters</h2>"
                + "<section class='export-set'>"
                + "<p>A variety of programs allow you to import cards in a certain format. Choose your format and copy &amp; paste the result or click Download to get a file.</p>"
                + "<ul>"
                + "<li><a href='#' class='button export-dec active' data-export-type='dec'><strong>.dec</strong> - Cockatrice, Apprentice</a></li>"
                + "<li><a href='#' class='button export-txt' data-export-type='txt'><strong>.txt</strong> - Magic Online</a></li>"
                + "<li><a href='#' class='button export-mtga' data-export-type='mtga'><strong>.mtga</strong> - MtG Arena</a></li>"
                + "<li><a href='#' class='button export-mwdeck' data-export-type='mwdeck'><strong>.mwdeck</strong> - Magic Workstation</a></li>"
                + "<li><a href='#' class='button export-cod' data-export-type='cod'><strong>.cod</strong> - Cockatrice</a></li>"
                + "<li><a href='#' class='button export-coll' data-export-type='coll'><strong>.coll</strong> - Decked Builder</a></li>"
                + "<li><a href='#' class='button export-frog' data-export-type='frog'><strong>.frog</strong> - Frogtown</a></li>"
                + "<li><a href='#' class='button export-deckstats' data-export-type='deckstats'><strong>.deckstats</strong> - deckstats</a></li>"
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

        // Toggle between export formats
        , changeExportFormat: function (e) {
            const exportType = e.target.getAttribute('data-export-type').toLowerCase();
            chooseExportFormat(exportType);
            return false;
        }

    });

    my.initViews.push(new ExportView()); // Hook this module into main rendering view

    let exports = {}; // All exported deck formats are kept within here

    function addExportableTextFormats(generatedSets) {
        // It's the same list for all formats
        const allCards = getAllDeckBuildingGeneratedCards(generatedSets);
        const countedCards = getUniqueCountedSortedCardSet(allCards);

        const attrib = 'Created by MtG Generator: ' + window.location.href.replace('index.html', '').replace('#', '');

        // Store the exports so we can do various things with them later
        document.querySelector('.exporter.modal .card-count').textContent = `${allCards.length} cards total, ${countedCards.length} unique`;

        exports.dec = renderDecFormat(countedCards, attrib);
        exports.txt = renderTxtFormat(countedCards, attrib);
        exports.mtga = renderMtgaFormat(countedCards, attrib);
        exports.mwdeck = renderMwDeckFormat(null, countedCards, attrib);
        exports.cod = renderCodFormat(countedCards, attrib);
        exports.coll = renderCollFormat(countedCards, attrib);
        exports.frog = renderFrogtownFormat(countedCards, attrib);
        exports.deckstats = renderDeckstatsDeckFormat(null, countedCards, attrib);
    }

    function chooseExportFormat(exportType) {
        var allButtons = document.querySelectorAll('.exporter.modal .export-set a.button');
        Array.from(allButtons).forEach(b => b.classList.remove('active'));
        document.querySelector('.exporter.modal .export-set a.export-' + exportType).classList.add('active');

        document.querySelector('.exporter.modal textarea').value = exports[exportType];
        setLinkToDownloadFile('.exporter.modal .export-detail a.export-download', exportType);
    }

    function setLinkToDownloadFile(linkSelector, exportType) {
        const encodedContent = btoa(exports[exportType]);
        document.querySelector(linkSelector).setAttribute('href', 'data:text/octet-stream;base64,' + encodedContent);
        document.querySelector(linkSelector).setAttribute('download', `mtg-generator-${my.set.slug}-prerelease.${exportType}`); // 'download' attr is Chrome/FF-only to set download filename
    }

    function getAllDeckBuildingGeneratedCards(cardSets) {
        const cards = cardSets.reduce((cards, cardSet) => cards.concat(cardSet.map(card => card)), []).filter(card => card.usableForDeckBuilding);
        return cards;
    }

    function getUniqueCountedSortedCardSet(cards) {
        const countedCards = cards.reduce((countedCards, card) => {
            const matchTitle = card.matchTitle;
            card.exportTitle = card.title.replace("’", "'"); // ’ messes up cockatrice
            if (card.cardBack) { card.exportTitle += ' // ' + card.cardBack.title.replace("’", "'"); }
            if (countedCards.has(matchTitle)) {
                let existingCard = countedCards.get(matchTitle);
                existingCard.count++;
                countedCards.set(matchTitle, existingCard);
            } else {
                card.count = 1;
                countedCards.set(matchTitle, card);
            }
            return countedCards;
        }, new Map());

        // Convert associative array to numeric array
        const cardList = [...countedCards.values()].sort((a, b) => my.sortBy('matchTitle', a, b));

        return cardList;
    }

    // All 'cards' arguments below should be a list of unique, counted, sorted cards

    function _getCardSetName(card) {
        // Checking the set because I didn't add all related sets in sets.json. e.g.: BRO includes BRR cards, but that set isn't in sets.json.
        // I COULD add them all but I'm lazy;)
        // Will default to just the set code if the set name is missing.
        const setCode = card.set.toUpperCase();
        const set = my.sets[setCode];
        const setName = set?.name ?? setCode;
        return setName;
    }

    // .dec: used by Cockatrice, Apprentice
    // sample (under ".dec File Format"): http://www.deckedbuilder.com/faq.html
    function renderDecFormat(cards, attrib) {
        const output = '// ' + attrib + '\r\n' + cards.reduce((cardOutput, card) =>
            cardOutput += card.count + ' ' + card.exportTitle + '\r\n', '');
        return output;
    }

    // .coll: used by used by Decked Builder
    // sample (under ".coll File Format"): http://www.deckedbuilder.com/faq.html
    // No sideboard option as they're not decks; they're card collections.
    function renderCollFormat(cards, attrib) {
        const output = '// ' + attrib + '\r\n' + cards.reduce((cardOutput, card) =>
            cardOutput += card.count + ' ' + card.exportTitle + ' [' + _getCardSetName(card) + ']\r\n', '');
        return output;
    }

    // .txt: used by used by Magic Online
    // sample: http://archive.wizards.com/Magic/magazine/article.aspx?x=mtgcom/arcana/678
    function renderTxtFormat(cards, attrib) {
        const output = 'Sideboard\r\n' + _.reduce(cards, function (memo, card) {
            const cardtitle = card.exportTitle.replace(' // ', '/'); // Apparently Magic Online doesn't import it's own magic.wizards.com // format for split cards!
            return memo += card.count + ' ' + cardtitle + '\r\n';
        }, '');
        return output;
    }

    // .mtga: used by Magic the Gathering: Arena
    // Format explanation: https://draftsim.com/mtg-arena-import-deck/
    // Format is plain list, number of cards at start, DFCs just list first face, can specify set but then also need collector number, e.g.: 1 Mountain (MID) 274
    function renderMtgaFormat(cards, attrib) {
        const output = '// ' + attrib 
            + ' -- Import to Magic the Gathering: Arena by selecting everything in this file and copying it to your clipboard. Within MtG: Arena, go to your decks and click Import.\r\n'
            + cards.reduce((cardOutput, card) =>
                cardOutput += card.count + ' ' + card.exportTitle.split(' // ')[0] + '\r\n', '');
        return output;
    }

    // .cod: used by Cockatrice
    // sample: http://mtgstudio.uservoice.com/forums/16948-mtg-studio-suggestions/suggestions/2675891-support-cockatrice-deck-format-
    function renderCodFormat(cards, attrib) {
        const output = '<?xml version="1.0" encoding="UTF-8"?>\r\n'
            + '\t<cockatrice_deck version="1">\r\n'
            + '\t<deckname>' + my.set.name + ' Prerelease</deckname>\r\n'
            + '\t<comments>' + attrib + ' Prerelease</comments>\r\n'
            + '\t<zone name="main">\r\n'
            + '\t</zone>\r\n'
            + '\t<zone name="side">\r\n'
            + cards.reduce((cardOutput, card) =>
                cardOutput += '\t\t<card number="' + card.count + '" name="' + card.exportTitle.replace('&', '&amp;') + '"/>\r\n', '')
            + '\t</zone>\r\n'
            + '</cockatrice_deck>';
        return output;
    }

    // .mwDeck: used by Magic Workstation
    // & replaced with / in card title otherwise MWS won't import
    // sample: https://code.google.com/p/deckprinter/source/browse/trunk/downloaded.mwdeck?spec=svn34&r=34
    function renderMwDeckFormat(cards, sbCards, attrib) {
        let output = `// ${attrib}\r\n`;
        let prefix = '    ';
        if (cards !== null && cards.length > 0) {
            output += cards.reduce((cardOutput, card) =>
                cardOutput += prefix + card.count + ' [' + card.set.toUpperCase() + '] ' + card.exportTitle.replace(' & ', '/') + '\r\n',
                '');
        }
        if (sbCards !== null && sbCards.length > 0) {
            prefix = 'SB: ';
            output += sbCards.reduce((cardOutput, card) => cardOutput += prefix + card.count + ' [' + card.set.toUpperCase() + '] ' + card.exportTitle.replace(' & ', '/') + '\r\n',
                '// Sideboard:\r\n');
        }
        return output;
    }

    // .frog: used by used by Frogtown
    // Requsted by Gavin R. Frogtown site: https://www.frogtown.me/
    // No sideboard option as they're not decks; they're card collections.
    function renderFrogtownFormat(cards, attrib) {
        const output = '// ' + attrib + '\r\n' + cards.reduce((cardOutput, card) =>
            cardOutput += card.count + ' ' + card.exportTitle + ' [' + card.set.toUpperCase() + ']\r\n', '');
        return output;
    }

    // .ds: used by deckstats.net
    // & replaced with / in card title otherwise MWS won't import
    // format help: https://deckstats.net/deckbuilder/en/ - Paste/upload a deck list - Formatting Help
    function renderDeckstatsDeckFormat(cards, sbCards, attrib) {
        let output = `// ${attrib}\r\n`;
        let prefix = '    ';
        if (cards !== null && cards.length > 0) {
            output += cards.reduce((cardOutput, card) => {
                const exportTitle = card.exportTitle.replace(' (', ' // ').replace(') ', ' // ').replace('(', '').replace(')', '').replace(' & ', '/');
                return cardOutput += prefix + card.count + ' [' + card.set.toUpperCase() + '] ' + exportTitle + '\r\n';
            },
                '');
        }
        if (sbCards !== null && sbCards.length > 0) {
            prefix = '';
            output += sbCards.reduce((cardOutput, card) => {
                const exportTitle = card.exportTitle.replace(' (', ' // ').replace(') ', ' // ').replace('(', '').replace(')', '').replace(' & ', '/');
                return cardOutput += prefix + card.count + ' [' + card.set.toUpperCase() + '] ' + exportTitle + '\r\n';
            },
                '// Sideboard:\r\n');
        }
        return output;
    }

    return my; // END Card Export module
}(mtgGen || {}));
