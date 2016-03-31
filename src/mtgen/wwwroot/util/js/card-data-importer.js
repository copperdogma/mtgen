/*
8-Mar-2016: Now supports loading double-faced card data from wotc and mtgsalvation.
8-Mar-2016: getCardColourFromCard() now defaults to the existing card colour if one exists.
27-Jan-2016: Updated to add/use mtgenIds and associative arrays on "cards".
4-Jan-2016: Rewrote getCardColourFromCard() -- MUCH simpler and now uses new (as of OGW) generic (x) and colourless (c) mana types

    Typical url: http://www.mtgsalvation.com/printable-gatecrash-spoiler.html

    Typical card from Gathering Magic (defunct):
        <div class="spoiler-card w-card type-Creature subtype-Human subtype-Soldier confirmed r-common wm-orzhov num-5" "="">
            <a name="num-5"></a>
            <div class="cost"><nobr><img src="http://s3.mananation.com/images/mana/2.gif" class="mana" alt="{2}"><img src="http://s3.mananation.com/images/mana/w.gif" class="mana" alt="{W}"></nobr></div>
            <p><span class="title"><a href="http://s3.gatheringmagic.com.s3.amazonaws.com/images/sets/GTC/Basilica_Guards.jpg" class="thickbox"><img style="margin: 0px 5px 0px 0px;" src="http://s3.gatheringmagic.com/images/spoilers/pic.png" alt=""></a> <a href="http://www.coolstuffinc.com/main_viewCard.php?Card_Name=Basilica Guards&amp;viewtype=Magic%20the%20Gathering%20Cards">Basilica Guards</a></span></p>
            <div class="rarity smallertext">Com.</div>
            <p><span class="type smallertext">Creature – Human Soldier</span></p>
            <div class="text">Defender<br>
            Extort <i>(Whenever you cast a spell, you may pay {wb}. If you do, each opponent loses 1 life and you gain that much life.)</i></div>
            <div class="powtou">1/4</div>
            <div class="artist">Dan Scott</div>
            <div class="cardnum">5/249</div>
            <div class="source"><a href="http://www.wizards.com/magic/magazine/article.aspx?x=mtg/daily/feature/228">Gatecrash Mechanics</a></div>
        </div>

    Typical card from MTG Salvation (new main source):
        <div id="card-26202" class="t-spoiler-wrapper">
            <div class="card-flip-wrapper ">
                <div class="spoiler-card-text">
                    <div class="t-spoiler card-color-Colorless card-type-Creature">
                        <div class="t-spoiler-container">
                            <header class="t-spoiler-header mythic rare">
                                <h2><a class="j-search-html" href="http://www.mtgsalvation.com/cards/oath-of-the-gatewatch/26202-kozilek-the-great-distortion">Kozilek, the Great Distortion</a></h2>
                                <ul class="t-spoiler-mana">
                                    <span class="mana-icon mana-colorless-08 tip" title="8 Colorless Mana">8</span>
                                    <span class="mana-icon mana-generic tip" title="1 Colorless Mana">C</span>
                                    <span class="mana-icon mana-generic tip" title="1 Colorless Mana">C</span>
                                </ul>
                            </header>
                            <section class="t-spoiler-content">
                                <div class="t-spoiler-meta">
                                    <span class="t-spoiler-type j-search-html">Legendary Creature - Eldrazi</span>
                                    <span class="t-spoiler-rarity"><span class="mtg-set-icon mtg-set-oath-of-the-gatewatch-mythic"><img src="http://media-dominaria.cursecdn.com/avatars/thumbnails/80/954/22/14/OGW.png"></span></span>
                                </div>
                                <div class="t-spoiler-ability">
                                    <p>When you cast Kozilek, the Great Distortion, if you have fewer than seven cards in hand, draw cards equal to the difference.</p>
                                    <p></p>
                                    <p>Menace</p>
                                    <p></p>
                                    <p>Discard a card with converted mana cost X: Counter target spell with converted mana cost X.</p>
                                    <input class="j-search-val" type="hidden" value="When you cast Kozilek, the Great Distortion, if you have fewer than seven cards in hand, draw cards equal to the difference.
                                        Menace
                                        Discard a card with converted mana cost X: Counter target spell with converted mana cost X.">
                                </div>
                                <div class="t-spoiler-flavor">
                                    <p>A void as cryptic as reality itself.</p>
                                </div>
                                <div class="t-spoiler-edition">
                                    <span class="t-spoiler-artist"><p>illus. Aleksi Briclot # 4/184</p></span>
                                </div>
                            </section>
                            <footer class="t-spoiler-footer">
                                <p>
                                    <a href="http://www.mtgsalvation.com/forums/magic-fundamentals/the-rumor-mill/648035-ogw-kozilek-the-great-distortion-and-new-basic" class="tip" title="Confirmation and Discussion">C&amp;D</a>
                                    <a href="https://twitter.com/mtgfocus" class="tip" title="MTG Focus Podcast">SRC</a>
                                </p>
                                <span class="t-spoiler-stat">12/12</span>
                            </footer>
                        </div>
                    </div>
                </div>
                <div class="spoiler-card-img">
                    <a href="http://www.mtgsalvation.com/cards/oath-of-the-gatewatch/26202-kozilek-the-great-distortion" data-tooltip-disabled="true">
                        <img src="http://media-dominaria.cursecdn.com/avatars/thumbnails/80/972/200/283/635834472657386509.jpeg">
                    </a>
                </div>
            </div>
            <div class="card-show-text">
                <a class="j-show-text" data-no-img="True">Show Text</a>
            </div>
        </div>

 */
var cardDataImporter = (function (my, $) {
    'use strict';

    // Event handling via Backbone: http://documentcloud.github.io/backbone/
    _.extend(my, Backbone.Events);

    my.loadAndProcessAllFiles = function (options) {
        // Import options into instance variables
        //$.each(options, function (value, key) {
        //    my[key] = value;
        //});
        _.extend(my, options);

        // load all files and don't continue until all are loaded
        var promises = [];

        promises.push($.get('/proxy?u=' + encodeURIComponent(my.cardDataUrl)));

        // it's hard to parse the results unless they're all there, so we'll force something to be loaded for each even if it's missing
        if (my.imagesUrl !== undefined && my.imagesUrl.length > 0) {
            promises.push($.get('/proxy?u=' + encodeURIComponent(my.imagesUrl)));
        }
        else {
            promises.push($.get('/proxy?u=http://copper-dog.com/'));
        }

        if (my.exceptionsUrl !== undefined && my.exceptionsUrl.length > 0) {
            promises.push($.get('/proxy?u=' + encodeURIComponent(my.exceptionsUrl)));
        }
        else {
            promises.push($.get('/proxy?u=http://copper-dog.com/'));
        }

        my.trigger('data-loading');

        $.when.apply($, promises).done(function () {
            // the first result is essential
            var htmlCards = {
                data: arguments[0][0],
                urlSource: my.cardDataUrl
            }
            if (isBadResponse(htmlCards.data)) {
                alert("ERROR: No data retrieved from " + my.cardDataUrl + ". Response:" + htmlCards);
                return;
            }

            var htmlImages = {
                data: arguments[1][0],
                urlSource: my.imagesUrl
            }
            if (isBadResponse(htmlImages.data)) {
                htmlImages.data = undefined; // this is okay -- it'll just default to using all images form cards-data (GM or cardsMain.json)
            }

            var jsonExceptions = {
                data: arguments[2][0],
                urlSource: my.exceptionsUrl
            }
            if (isBadResponse(jsonExceptions.data)) {
                jsonExceptions.data = undefined; // this is okay -- it's optional
            }

            var setCode = my.setCode.trim();

            my.trigger('data-loaded');

            setTimeout(function () { createOutputJson(setCode, htmlCards, htmlImages, jsonExceptions); }, 100); // delay to let ui render
        });

    }

    function createOutputJson(setCode, htmlCards, htmlImages, jsonExceptions) {
        // Get card data -------------------------------------------------------------------------------------------------
        // All card data source come with image data that we usually want to override in the next step.
        var mainOut = my.api.getCardData(htmlCards.data, htmlCards.urlSource, setCode);
        var initialCardDataCount = Object.keys(mainOut).length;

        // Get image data -------------------------------------------------------------------------------------------------
        var imageDataCount = 0;
        if (htmlImages.data !== undefined) {
            var mainImages = my.api.getImageData(htmlImages.data, htmlImages.urlSource);
            imageDataCount = Object.size(mainImages);
        }

        // Apply Exceptions -------------------------------------------------------------------------------------------------
        if (jsonExceptions.data !== undefined) {
            jsonExceptions.data = JSON.parse(jsonExceptions.data);
        }

        // Returns both the updated set of cards AND the modified exceptions (the latter for reporitng purposes).
        var exceptionsResults = my.api.applyExceptions(mainOut, jsonExceptions.data, setCode);
        mainOut = exceptionsResults.cards;

        // Add images to cards -------------------------------------------------------------------------------------------------
        mainOut = my.api.applyImagesToCards(mainOut, mainImages);

        // Reporting -------------------------------------------------------------------------------------------------

        var out = "";
        if (imageDataCount < 1) {
            out += "<p>WARNING: No image data supplied. Using any images found with card data: " + htmlCards.urlSource + "</p>";
        }
        else {
            var missingSecondaryImageDataEntry = $.grep(mainOut, function (card, index) { return !card.hasOwnProperty("imageSourceOriginal"); });
            if (missingSecondaryImageDataEntry.length < 1) {
                out += "<p>No parsing errors.</p>";
            }
            else {
                out += "<p>The following cards had no image data from your image source:</p><ul>";
                missingSecondaryImageDataEntry = missingSecondaryImageDataEntry.sort(sortByTitle);
                for (var i = 0; i < missingSecondaryImageDataEntry.length; i++) {
                    var value = missingSecondaryImageDataEntry[i];
                    var comment = "";
                    if (value._comment) {
                        comment = "<em> - " + value._comment + "</em>";
                    }
                    out += "<li style='color:red'>" + value.title + comment + "</li>";
                }
                out += "</ul>";
            }

            var unusedImages = [];
            var key;
            for (key in mainImages) {
                if (mainImages.hasOwnProperty(key)) {
                    if (!mainImages[key].wasUsed) {
                        unusedImages.push(mainImages[key]);
                    }
                }
            }
            if (unusedImages.length > 0) {
                out += "<p>The following images from your image data source did not match any cards in your card data:</p><ul>";
                for (var i = 0; i < unusedImages.length; i++) {
                    out += "<li style='color:red'>" + unusedImages[i].title + "</li>";
                }
                out += "</ul>";
            }
        }

        var cardsWithPlaceholderImages = _.filter(mainOut, function (card) { return card.imageSource === "placeholder"; });
        if (cardsWithPlaceholderImages.length > 0) {
            out += "<p>The following cards have no primary images or images supplied from your image source, so an image was created using <a href='http://placehold.it/' target='_blank'>placehold.it</a>:</p><ul>";
            for (var i = 0; i < cardsWithPlaceholderImages.length; i++) {
                out += "<li style='color:red'>" + cardsWithPlaceholderImages[i].title + "</li>";
            }
            out += "</ul>";
        }

        var duplicateCards = _.filter(mainOut, function (card) { return card.duplicateNum !== undefined; });
        if (duplicateCards.length > 0) {
            var sortedDuplicateCards = _.sortBy(duplicateCards, "mtgenId");
            out += "<p>The following cards have duplicate mtgenIds:</p><ul>";
            for (var i = 0; i < sortedDuplicateCards.length; i++) {
                out += "<li style='color:DarkGoldenrod'>" + sortedDuplicateCards[i].mtgenId + ": " + sortedDuplicateCards[i].title + "</li>";
            }
            out += "</ul>";
        }

        var exceptions = exceptionsResults.exceptions;
        var hasExceptions = (exceptions !== undefined && exceptions !== null && exceptions.length > 0);
        if (!hasExceptions) {
            out += "<p>No exceptions provided.</p>";
        }
        else {
            out += "<p>The supplied exceptions were processed as follows:</p><ul>";

            for (var i = 0; i < exceptions.length; i++) {
                var exception = exceptions[i];
                if (exception.result === undefined || exception.result === null) {
                    exception.result = { success: false, error: "PROCESSING FAILURE: no result given at all for this exception!" };
                }
                if (exception.comment === true) {
                    out += "<li style='color: gray'>#" + (i + 1) + ": Comment; ignored.</li>";
                }
                else if (exception.result.success === true) {
                    if (exception.result.affectedCards > 0) {
                        out += "<li style='color: green'>#" + (i + 1) + ": ";
                    }
                    else {
                        out += "<li style='color: DarkGoldenrod'>#" + (i + 1) + ": ";
                    }
                    if (exception.add === true) {
                        out += 'Added new card: ' + exception.newValues.title;
                    }
                    else if (exception.delete === true) {
                        var deletedCards = _.sortBy(exception.result.deletedCards, "title");
                        out += 'Deleted ' + deletedCards.length + " cards via query: " + exception.where;
                        if (deletedCards.length > 20) {
                            out += "<ul>";
                            out += _.pluck(deletedCards, "title").join(", ");
                            out += "</ul>";
                        }
                        else if (deletedCards.length > 0) {
                            out += "<ul>";
                            for (var j = 0; deletedCards.length < j; j++) { out += "<li>" + deletedCards[j].title + "</li>"; }
                            out += "</ul>";
                        }
                    }
                    else {
                        var modifiedCards = _.sortBy(exception.result.modifiedCards, "title");
                        out += 'Modified ' + modifiedCards.length + " cards via query: " + exception.where + "<br/>";
                        out += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;New values: ' + JSON.stringify(exception.newValues);
                        if (modifiedCards.length > 20) {
                            out += "<ul>";
                            out += _.pluck(modifiedCards, "title").join(", ");
                            out += "</ul>";
                        }
                        else if (modifiedCards.length > 0) {
                            out += "<ul>";
                            for (var j = 0; modifiedCards.length < j; j++) { out += "<li>" + modifiedCards[j].title + "</li>"; }
                            out += "</ul>";
                        }
                    }
                }
                else {
                    out += "<li style='color: red'>#" + (i + 1) + ": " + exception.result.error;
                }
                out += "</li>";
            }
            out += "</ul>";
        }

        my.trigger('log-complete', out);

        // Final JSON output -------------------------------------------------------------------------------------------------

        // clean our temporary data out of the final card data
        //for (var i = 0; i < mainOut.length; i++) {
        var finalOut = [];
        _.each(mainOut, function (card) {
            delete card.matchTitle;
            delete card.srcOriginal;
            delete card.imageSourceOriginal;
            delete card.fixedViaException;
            delete card.imageSource;
            finalOut.push(card);
        });

        var jsonMainStr = JSON.stringify(finalOut, null, ' ');

        my.trigger('data-processing-complete', jsonMainStr, initialCardDataCount, imageDataCount, finalOut.length);
    }

    function sortByTitle(a, b) {
        var aName = mtgGen.createMatchTitle(a.title);
        var bName = mtgGen.createMatchTitle(b.title);
        return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
    }

    function isBadResponse(response) {
        if (response == null) { return true; }
        if (response.hasOwnProperty('cards')) { return false; }
        //if (!response.indexOf) { return true; } // not sure what this was ever testing for
        if (response.indexOf('ERROR') == 0 || response.indexOf('HTTP/1.1 301') == 0) { return true; }
        if (response.indexOf("The resource you are looking for has been removed, had its name changed, or is temporarily unavailable.") > -1) { return true; }
        if (response.indexOf('CopperDog - Design::Web::Programming') > -1) { return true; } // we load copper-dog.com if there's a blank entry
        if (response.indexOf("404 Not Found") > -1) { return true; }
        return false;
    }

    //from: http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
    // example usage
    //	pad(10, 4);      // 0010
    //	pad(9, 4);       // 0009
    //	pad(123, 4);     // 0123
    //	pad(10, 4, '-'); // --10
    function pad(n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }

    // adapted from: http://guegue.net/friendlyURL_JS
    function cardTitleUrl(str, max) {
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
        // first replace whitespace by +, second remove repeated + by just one,
        // third delete all chars which are not between a-z or 0-9, fourth trim the string and
        // the last step truncate the string to 32 chars
        return str.replace(/\s+/gi, '~').replace(/[^a-z0-9\~]/gi, '').replace(/\-{2,}/gi, '~').replace(/~/gi, '%20').replace(/(^\s*)|(\s*$)/gi, '').substr(0, max);
    }

    function getCardColourFromCard(card) {
        if (card.type !== undefined) {
            if (card.type.toLowerCase().indexOf("land") > -1) { return mtgGen.colours.land.code; }
            if (card.type.toLowerCase().indexOf("artifact") > -1) { return mtgGen.colours.artifact.code; }
        }

        // Derived from casting cost:
        // Only keep card colours (bcgkruw), then collapse into the colour-specific counts.
        // OLDER: {} are groups around split colour {RG}
        // NEWER: () are groups around split colour (R///)
        var cardColours = card.cost.toLowerCase().replace(/[^bcgkruw]/g, "").split("");
        var uniqueColours = _.toArray(_.countBy(cardColours, function (colour) { return colour; }));

        var finalColour = '';
        switch (uniqueColours.length) {
            case 0: // 0 unique colours = colourless
                if (card.colour.length === 0) {
                    finalColour = mtgGen.colours.generic.code;
                }
                else {
                    finalColour = card.colour;
                }
                break;
            case 1: // single-colour, as determined above
                finalColour = cardColours[0];
                break;
            default: // multi-colour
                finalColour = mtgGen.colours.multicolour.code;
                break;
        }
        return finalColour;
    }

    my.getDownloadSettingsFileLinkAttributes = function (setCode, cardDataUrl, imagesUrl, exceptionsUrl) {
        var settings = {
            "setCode": setCode,
            "cardDataUrl": cardDataUrl,
            "imagesUrl": imagesUrl,
            "exceptionsUrl": exceptionsUrl
        }

        var settingsJson = JSON.stringify(settings, null, ' ');
        var encodedContent = $.base64.encode(settingsJson);

        var attrs = {
            "href": 'data:text/octet-strea; m;base64,' + encodedContent,
            "download": 'import-settings.json' // 'download' attr is Chrome/FF-only to set download filename
        }
        return attrs;
    }

    my.setSettings = function (settings) {
        // support the old settings file format
        if (settings.cardDataUrl === undefined && settings.hasOwnProperty('gatheringMagicUrl')) {
            settings.cardDataUrl = settings.gatheringMagicUrl;
        }
        if (settings.hasOwnProperty('mtgJson')) {
            settings.cardDataUrl = settings.mtgJson;
        }
        return settings;
    }

    function getCardData(cardData, cardDataUrlSource, setCode) {
        var cards = {};

        // Determine from where the card data was sourced and therefore the parser needed.
        var lowercaseCardDataUrlSource = cardDataUrlSource.trim().toLowerCase();
        if (lowercaseCardDataUrlSource.length < 1) {
            console.log("No card data source supplied: this is used when the exceptions file is used to generate cards");
        }
        else if (lowercaseCardDataUrlSource.indexOf('mtgsalvation.com') > -1) {
            cards = my.api.getCardsFromMtgSalvationData(cardData, setCode);
        }
        else if (lowercaseCardDataUrlSource.indexOf('gatheringmagic.com') > -1) {
            cards = my.api.getCardsFromGatheringMagicData(cardData, setCode);
        }
        else if (lowercaseCardDataUrlSource.indexOf('mtgjson.com') > -1) {
            cards = my.api.getCardsFromMtgJsonData(cardData, setCode);
        }
        else if (lowercaseCardDataUrlSource.indexOf('localhost') > -1 || lowercaseCardDataUrlSource.indexOf('mtgen.net') > -1) {
            cards = JSON.parse(cardData); // native format -- used for upgrading the images or file format
        }
        else {
            throw new Error("Card data url unknown. Only mtgen.net/localhost, mtgsalvation.com, gatheringmagic.com, and mtgjson.com supported. '" + cardDataUrlSource + "'");
        }

        return cards;
    }

    // Fix num (and any duplicates), add mtgenId, add into the cards object.
    function addCardToCards(cards, newCard) {
        var alphabet = "abcedfghijklmnopqrstuvwxyz";
        newCard.num = newCard.num || newCard.multiverseid || newCard.id; // num is required, so ensure we have one
        newCard.mtgenId = newCard.set + "|" + newCard.num;
        var firstVariant = newCard.mtgenId + ":a";
        if (cards[newCard.mtgenId] === undefined && cards[firstVariant] === undefined) {
            cards[newCard.mtgenId] = newCard;
        }
        else {
            // Duplicate cards found -- fix it!

            // Find the next available variant.
            var nextAvailableVariantMtgenId;
            var nextAvailableVariantNum;
            for (var i = 0; i < alphabet.length; i++) {
                var mtgenId = newCard.mtgenId + ":" + alphabet[i];
                if (cards[mtgenId] === undefined) {
                    nextAvailableVariantNum = i + 1;
                    break;
                }
            }

            var originalCard = cards[newCard.mtgenId] || cards[firstVariant];

            // If it's a duplicate mtgenId AND title it's the SAME card.. ditch it
            if (originalCard !== undefined) {
                if (originalCard.matchTitle === newCard.matchTitle) {
                    return cards;
                    console.log("DUPLICATE CARD: " + newCard.title);
                }
            }

            if (originalCard.mtgenVariant === undefined) {
                delete cards[originalCard.mtgenId];
                originalCard.mtgenVariant = nextAvailableVariantNum;
                originalCard.mtgenId += ":" + alphabet[nextAvailableVariantNum - 1];
                originalCard.duplicateNum = true;
                cards[originalCard.mtgenId] = originalCard;
                nextAvailableVariantNum++;
            }
            newCard.mtgenVariant = nextAvailableVariantNum;
            newCard.mtgenId += ":" + alphabet[nextAvailableVariantNum - 1];
            newCard.duplicateNum = true;
            cards[newCard.mtgenId] = newCard;

            //var originalCard = cards[newCard.mtgenId];
            //var mtgenVariant = 1;
            //if (originalCard.mtgenVariant === undefined) {
            //    delete cards[originalCard.mtgenId];
            //    originalCard.mtgenVariant = mtgenVariant;
            //    originalCard.mtgenId += ":" + alphabet[mtgenVariant - 1];
            //    originalCard.duplicateNum = true;
            //    cards[originalCard.mtgenId] = originalCard;
            //    mtgenVariant++
            //}
            //else {
            //    mtgenVariant = originalCard.mtgenVariant + 1;
            //}
            //newCard.mtgenVariant = mtgenVariant;
            //newCard.mtgenId += ":" + alphabet[mtgenVariant - 1];
            //newCard.duplicateNum = true;
            //cards[newCard.mtgenId] = newCard;
        }
        return cards;
    }

    function getCardsFromMtgSalvationData(rawCardData, setCode) {
        var cards = {};

        // get all MtgS cards
        var $html = $("<html/>").html(rawCardData);
        var $cards = $html.find('.t-spoiler-wrapper');
        if ($cards.length === 0) {
            alert("No cards from MtG Salvation cards found. Note that you CANNOT run this thing locally. It won't work. It needs to run through the proxy to work.");
        }
        for (var i = 0; i < $cards.length; i++) {
            var card = {};
            var el = $($cards[i]);

            var title = el.find('h2');
            if (title.length > 0) {
                card.title = title[0].textContent.trim();
                card.matchTitle = mtgGen.createMatchTitle(card.title); // used for matching MtG Salvation vs. WotC titles and card titles vs. exception titles
            }

            var img = el.find('.spoiler-card-img img');
            if (img.length > 0) {
                card.src = img[0].src;
                card.imageSource = "mtg-salvation";
                // from GatheringMagic version, but don't know what this looks like under this site
                //if (el.hasClass('wm-day') || el.hasClass('wm-night')) { // Double-Faced card
                //    card.width = 536;
                //}
            }

            card.set = setCode;

            var mana = el.find('.t-spoiler-mana');
            if (mana.length > 0) {
                card.cost = mana[0].textContent.replace(/ /g, '').replace(/\n/g, '');
            }

            var rarity = el.find('.t-spoiler-header');
            if (rarity.length > 0) {
                if (rarity[0].classList.length > 1) {
                    card.rarity = rarity[0].classList[1][0].toLowerCase();
                }
            }

            var type = el.find('.t-spoiler-type');
            if (type.length > 0) {
                var types = type[0].textContent.split(' - ');
                card.type = types[0].trim();
                if (types.length > 1) {
                    card.subtype = types[1].trim();
                }
            }

            var pt = el.find(".t-spoiler-stat");
            if (pt.length > 0) {
                var pts = pt[0].textContent.split('/');
                if (pts.length > 1) {
                    card.power = pts[0].trim();
                    card.toughness = pts[1].trim();
                }
                else if (pts.length == 1) {
                    card.loyalty = pts[0].replace('[', '').replace(']', '').trim(); // must be a planeswalker
                }
                // otherwise it's something without power/toughness|loytlty, i.e.: land, spell, etc
            }

            var colour = el.find('.t-spoiler');
            if (colour.length > 0) {
                for (var j = 0; j < colour[0].classList.length; j++) {
                    var className = colour[0].classList[j];
                    if (className.indexOf('card-color-') > -1) {
                        var cardColour = className.replace('card-color-', '');
                        if (cardColour.length > 0) {
                            switch (cardColour.trim().toLowerCase()) {
                                case "white": card.colour = "w"; break;
                                case "blue": card.colour = "u"; break;
                                case "red": card.colour = "r"; break;
                                case "black": card.colour = "b"; break;
                                case "green": card.colour = "g"; break;
                                case "multicolored": card.colour = "m"; break;
                                case "colorless": card.colour = "c"; break;
                                default:
                                    console.log("WARNING: unknown card colour: " + cardColour);
                                    break;
                            }
                        }
                    }
                }
            }

            // derived from casting cost
            card.colour = getCardColourFromCard(card);
            //console.log(card.colour + ": " + card.cost + ": " + card.type + ": " + card.subtype + ": " + card.title);

            var cnum = el.find('.t-spoiler-artist');
            if (cnum.length > 0) {
                var cnums = cnum[0].textContent.split('#');
                if (cnums.length > 1) {
                    cnums = cnums[1].split('/');
                    card.num = pad(cnums[0].trim(), 3);
                }
            }

            // from GatheringMagic version, but don't know what this looks like under this site
            //// if it has a guild or clan, save that
            //$(el[0].classList).each(function (index, value) {
            //    if (value.indexOf('wm-') == 0) {
            //        if (guildClanType === undefined) {
            //            switch (setCode.toLowerCase()) {
            //                case "rtr": // Guilds: Return to Ravniva, Gatecrash, Dragon's Maze
            //                case "gtc":
            //                case "dgm":
            //                    guildClanType = "guild";
            //                    break;

            //                case "ktk": // Clans: Khans of Tarkir, Fate Reforged, Dragons of Tarkir
            //                case "frf":
            //                case "dtk":
            //                    guildClanType = "clan";
            //                    break;
            //            }
            //        }
            //        if (guildClanType !== undefined) {
            //            card[guildClanType] = value.replace('wm-', '').replace('//', '/');
            //        }
            //        else {
            //            console.log("WARNING: found wm-* class data in GM HTML but set code doesn't belong to anything with guilds/clans.");
            //        }
            //    }
            //});

            cards = addCardToCards(cards, card);
        }

        return cards;
    }

    // 20160101: defunct as of Battle for Zendikar -- they now post everything to Facebook. Switching to MTG Salvation.
    function getCardsFromGatheringMagicData(rawCardData, setCode) {
        var cards = {};

        // get all GM cards (or at least the mtgJson cards have to exist)
        var $html = $(rawCardData);
        var $cards = $html.find('.spoiler-card');
        if ($cards.length === 0) {
            alert("No cards from Gathering Magic found. Note that you CANNOT run this thing locally. It won't work. It needs to run through the proxy to work.");
        }
        $.each($cards, function (index, el) {
            var card = {};
            el = $(el);

            var title = el.find('.title');
            if (title.length > 0) {
                card.title = title[0].textContent.trim();
                card.matchTitle = mtgGen.createMatchTitle(card.title); // used for matching Gathering Magic vs. WotC titles and card titles vs. exception titles
                var img = $(title).find('.thickbox');
                if (img.length > 0) {
                    card.src = img[0].href;
                    card.imageSource = "gatheringmagic";
                    if (el.hasClass('wm-day') || el.hasClass('wm-night')) { // Double-Faced card
                        card.width = 536;
                    }
                }
            }

            card.set = setCode;

            card.cost = "";
            el.find('.cost img').each(function (index, value) {
                card.cost += $(value).attr('alt');
            });

            var rarity = el.find('.rarity');
            if (rarity.length > 0) {
                card.rarity = rarity[0].textContent[0].toLowerCase();
            }

            var type = el.find('.type');
            if (type.length > 0) {
                var types = type[0].textContent.split(' – ');
                card.type = types[0].trim();
                if (types.length > 1) {
                    card.subtype = types[1].trim();
                }
            }

            var pt = el.find('.powtou');
            if (pt.length > 0) {
                var pts = pt[0].textContent.split('/');
                if (pts.length > 1) {
                    card.power = pts[0].trim();
                    card.toughness = pts[1].trim();
                }
                else if (pts.length == 1) {
                    card.loyalty = pts[0].replace('[', '').replace(']', '').trim(); // must be a planeswalker
                }
                // otherwise it's something without power/toughness|loytlty, i.e.: land, spell, etc
            }

            if (el[0].classList.length > 1) {
                card.colour = el[0].classList[1][0];
            }

            // derived from casting cost
            card.colour = getCardColourFromCard(card);

            var cnum = el.find('.cardnum');
            if (cnum.length > 0) {
                var cnums = cnum[0].textContent.split('/');
                if (cnums.length > 1) {
                    card.num = pad(cnums[0].trim(), 3);
                }
            }

            // if it has a guild or clan, save that
            $(el[0].classList).each(function (index, value) {
                if (value.indexOf('wm-') == 0) {
                    if (guildClanType === undefined) {
                        switch (setCode.toLowerCase()) {
                            case "rtr": // Guilds: Return to Ravniva, Gatecrash, Dragon's Maze
                            case "gtc":
                            case "dgm":
                                guildClanType = "guild";
                                break;

                            case "ktk": // Clans: Khans of Tarkir, Fate Reforged, Dragons of Tarkir
                            case "frf":
                            case "dtk":
                                guildClanType = "clan";
                                break;
                        }
                    }
                    if (guildClanType !== undefined) {
                        card[guildClanType] = value.replace('wm-', '').replace('//', '/');
                    }
                    else {
                        console.log("WARNING: found wm-* class data in GM HTML but set code doesn't belong to anything with guilds/clans.");
                    }
                }
            });

            cards = addCardToCards(cards, card);
        });

        return cards;
    }

    function getCardsFromMtgJsonData(rawCardData, setCode) {
        var cards = {};

        rawCardData = JSON.parse(rawCardData);

        if (rawCardData === undefined || !rawCardData.hasOwnProperty('cards')) {
            alert("Missing card data from mtgjson.com. Note that you CANNOT run this thing locally. It won't work. It needs to run through the proxy to work.");
        }
        if (rawCardData.cards.length < 1) {
            alert("No cards from mtgjson.com found. Note that you CANNOT run this thing locally. It won't work. It needs to run through the proxy to work.");
        }

        // add each card, converting from mtgjson.com's format to our own
        for (var i = 0; i < rawCardData.cards.length; i++) {
            //console.log('converting: ' + card.name);
            var card = rawCardData.cards[i];

            card.title = card.name;
            card.matchTitle = mtgGen.createMatchTitle(card.title); // used for matching Gathering Magic vs. WotC titles and card titles vs. exception titles
            card.set = setCode;
            card.cost = card.manaCost || '';
            card.rarity = card.rarity.substr(0, 1).toLowerCase();
            if (card.hasOwnProperty("types") && card.types.length > 0) {
                card.type = card.types[0];
            }
            else {
                card.type = card.type;
            }
            if (card.hasOwnProperty('subTypes') && card.subTypes.length > 0) {
                card.subtype = card.subtypes[0];
            }
            card.colour = getCardColourFromCard(card);
            card.num = card.number;
            card.src = "http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=" + card.multiverseid + "&type=card";
            card.imageSource = "mtgJson";

            // Adjust some of mtgJSON's format to our own:
            // Change their type from Land to Basic Land
            if (card.matchTitle === 'plains' || card.matchTitle === 'forest' || card.matchTitle === 'swamp' || card.matchTitle === 'island' || card.matchTitle === 'mountain') {
                card.type = "Basic Land";
                card.colour = "l";
            }
            if (card.hasOwnProperty('layout') && card.layout === 'token') {
                card.token = true;
            }
            if (card.hasOwnProperty('type') && card.type === 'Land') {
                card.colour = "l";
            }
            if (card.hasOwnProperty('type') && card.type === 'Artifact') {
                card.colour = "a";
                card.sorder = 17;
                card.colourless = true;
            }
            if (card.hasOwnProperty('watermark')) {
                switch (card.set) {
                    case "som":
                    case "mbs":
                    case "nph":
                        card.faction = card.watermark;
                        break;
                    case "rav":
                    case "gpt":
                    case "dis":
                    case "rtr":
                    case "gtc":
                    case "dgm":
                        card.guild = card.watermark;
                        break;
                    case "ktk":
                    case "frf":
                    case "dtk":
                        card.clan = card.watermark;
                        break;
                }
            }

            cards = addCardToCards(cards, card);
        }

        return cards;
    }

    function getImageData(imageData, imageDataUrlSource) {
        var images = [];

        // Determine from where the image data was sourced and therefore the parser needed.
        var lowercaseImageDataUrlSource = imageDataUrlSource.toLowerCase();
        if (lowercaseImageDataUrlSource.indexOf('magic.wizards.com') > -1) {
            images = getImagesFromWotcSpoilers(imageData);
        }
        else if (lowercaseImageDataUrlSource.indexOf('archive.wizards.com') > -1) {
            images = getImagesFromWotcArchive(imageData);
        }
        else if (lowercaseImageDataUrlSource.indexOf('mtgjson.com') > -1) {
            images = getImagesFromMtgJsonData(imageData);
        }
        else if (lowercaseImageDataUrlSource.indexOf('cardsmain.json') > -1) {
            images = getImagesFromCardsMainData(imageData);
        }
        else {
            alert("Image data url unknown. Only magic.wizards.com, gatheringmagic.com, and cardsMain.json supported. '" + htmlImages.urlSource + "'");
        }

        return images;
    }

    function getImagesFromWotcSpoilers(rawHtmlImageData) {
        var image;
        var finalImages = [];

        var $images = $(rawHtmlImageData);

        // v6 - 20160307, soi gallery
        if (finalImages.length < 1) {
            var $rawimages = $images.find('#content-detail-page-of-an-article .rtecenter img');
            if ($rawimages.length > 0) {
                var $imageContainer;
                for (var i = 0; i < $rawimages.length; i++) {
                    var img = $rawimages[i];
                    if (img.alt.length > 0) {
                        image = {};
                        image.title = img.alt.trim();
                        image.matchTitle = mtgGen.createMatchTitle(image.title);
                        image.src = img.src;

                        // Support for double-faced cards.
                        var $parent = $($rawimages[i]).parent();
                        if ($parent.hasClass('side')) {
                            if ($parent.hasClass('front')) {
                                var $backCard = $parent.parent().find(".side.back img");
                                if ($backCard.length > 0) {
                                    image.matchTitleBack = mtgGen.createMatchTitle($backCard[0].alt);
                                    image.doubleFaceCard = true;
                                }
                            }
                            else if ($parent.hasClass('back')) {
                                var $frontCard = $parent.parent().find(".side.front img");
                                if ($frontCard.length > 0) {
                                    image.matchTitleFront = mtgGen.createMatchTitle($frontCard[0].alt);
                                    image.doubleFaceCard = true;
                                }
                            }
                        }

                        finalImages[image.matchTitle] = image;
                    }
                }
            }
        }

        // v5 - 20160101, bfz gallery
        if (finalImages.length < 1) {
            var $rawimages = $images.find('#content img');
            if ($rawimages.length > 0) {
                var $imageContainer, $cardTitle;
                for (var i = 0; i < $rawimages.length; i++) {
                    var img = $rawimages[i];
                    $imageContainer = $(img).parent();
                    $cardTitle = $imageContainer.find("i");
                    if ($cardTitle.length === 1) {
                        image = {};
                        image.title = $cardTitle.text().trim();
                        image.matchTitle = mtgGen.createMatchTitle(image.title);
                        image.src = img.src;
                        finalImages[image.matchTitle] = image;
                    }
                }
            }
        }

        // v4 - 20150305, dtk gallery -- hard to scan as anything unique is added by js
        if (finalImages.length < 1) {
            var $rawimages = $images.find('#content-detail-page-of-an-article img');
            if ($rawimages.length > 0) {
                var $imageContainer, $cardTitle;
                $rawimages.each(function (index, img) {
                    $imageContainer = $(img).parent();
                    $cardTitle = $imageContainer.find("i");
                    if ($cardTitle.length === 1) {
                        image = {};
                        image.title = $cardTitle.text().trim();
                        image.matchTitle = mtgGen.createMatchTitle(image.title);
                        image.src = img.src;
                        finalImages[image.matchTitle] = image;
                    }
                });
            }
        }

        // v3 - 20140901, ktk gallery -- hard to scan as anything unique is added by js
        if (finalImages.length < 1) {
            var $rawimages = $images.find('img.noborder');
            if ($rawimages.length > 0) {
                var $imageContainer, $cardTitle;
                $rawimages.each(function (index, img) {
                    $imageContainer = $(img).parent();
                    $cardTitle = $imageContainer.find("i");
                    if ($cardTitle.length === 1) {
                        image = {};
                        image.title = $cardTitle.text().trim();
                        image.matchTitle = mtgGen.createMatchTitle(image.title);
                        image.src = img.src;
                        finalImages[image.matchTitle] = image;
                    }
                });
            }
        }

        // v2 - 2014 site redesign, m15 gallery
        if (finalImages.length < 1) {
            $rawimages = $images.find('.advanced-card-gallery-container img[alt]');
            if ($rawimages.length > 0) {
                $rawimages.each(function (index, value) {
                    image = {};
                    image.title = value.alt.trim();
                    image.matchTitle = mtgGen.createMatchTitle(image.title);
                    image.src = value.src;
                    finalImages[image.matchTitle] = image;
                });
            }
        }

        // v1 - original wotc site
        if (finalImages.length < 1) {
            var $rawimages = $images.find('img[alt].article-image');
            if ($rawimages.length > 0) {
                $rawimages.each(function (index, value) {
                    image = {};
                    image.title = value.alt.trim();
                    image.matchTitle = mtgGen.createMatchTitle(image.title);
                    image.src = value.src;
                    finalImages[image.matchTitle] = image;
                });
            }
        }

        for (var i = 0; i < finalImages.length; i++) { finalImages[i].imageSource = "wotc-spoilers"; }

        return finalImages;
    }

    function getImagesFromWotcArchive(rawHtmlImageData) {
        var image;
        var finalImages = [];

        var $images = $(rawHtmlImageData);

        var $rawimages = $images.find('.article-image');
        if ($rawimages.length > 0) {
            var $imageContainer, $cardTitle;
            //TODO: rewrite as for loop for performance
            $rawimages.each(function (index, img) {
                var enLoc = img.src.indexOf('/EN/');
                if (enLoc > -1) {
                    var imgNum = img.src.substr(enLoc + 4, 4);
                    var num = parseInt(imgNum);
                    if (!isNaN(num)) {
                        image = {};
                        image.src = img.src;
                        var thisHostStartIndex = image.src.indexOf("/mtg/images/");
                        if (thisHostStartIndex > 0) {
                            image.src = "http://archive.wizards.com" + image.src.substr(thisHostStartIndex);
                        }
                        image.num = num;
                        finalImages[image.num] = image;
                    }
                }
            });
        }

        for (var i = 0; i < finalImages.length; i++) { finalImages[i].imageSource = "wotc-archive"; }

        return finalImages;
    }

    function getImagesFromMtgJsonData(rawImageData) {
        var image;
        var finalImages = [];

        if (rawImageData === undefined || !rawImageData.hasOwnProperty('cards')) {
            alert("Missing image data from mtgjson.com. Note that you CANNOT run this thing locally. It won't work. It needs to run through the proxy to work.");
        }
        if (rawImageData.cards.length < 1) {
            alert("No images from mtgjson.com found. Note that you CANNOT run this thing locally. It won't work. It needs to run through the proxy to work.");
        }

        // add each card, converting from mtgjson.com's format to our own
        for (var i = 0; i < rawImageData.cards.length; i++) {
            var card = rawImageData.cards[i];
            image = {};
            image.title = card.name;
            image.matchTitle = mtgGen.createMatchTitle(image.title);
            image.src = "http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=" + card.multiverseid + "&type=card";
            image.imageSource = "mtgjson";
            finalImages[image.matchTitle] = image;
        }

        return finalImages;
    }

    function getImagesFromCardsMainData(rawImageData) {
        var image;
        var finalImages = [];

        if (rawImageData === undefined) {
            alert("Missing image data from cardsMain.json. Note that you CANNOT run this thing locally. It won't work. It needs to run through the proxy to work.");
            return finalImages;
        }
        if (rawImageData.length < 1) {
            alert("No images from mtgjson.com found. Note that you CANNOT run this thing locally. It won't work. It needs to run through the proxy to work.");
            return finalImages;
        }

        for (var i = 0; i < rawImageData.cards.length; i++) {
            var card = rawImageData.cards[i];
            image = {};
            image.title = card.title;
            image.matchTitle = mtgGen.createMatchTitle(image.title);
            image.src = card.src;
            image.imageSource = "cardsMain.json";
            finalImages[image.matchTitle] = image;
        }

        return finalImages;
    }

    function getLandImagesFromWotcArticle(rawHtmlImageData, requiredImageWidth, requiredImageHeight) {
        var image;
        var finalImages = [];

        var $images = $(rawHtmlImageData);

        // v1 - 20150914, bfz gallery -- hard to scan as anything unique is added by js
        if (finalImages.length < 1) {
            var $rawimages = $images.find('#content img');
            if ($rawimages.length > 0) {
                var $imageContainer, $cardTitle;
                var requiredImageHeightInt = parseInt(requiredImageHeight, 10);
                var requiredImageWidthInt = parseInt(requiredImageWidth, 10);
                $rawimages.each(function (index, img) {
                    if (!isNaN(requiredImageHeightInt) && requiredImageHeightInt !== img.height) return true;
                    if (!isNaN(requiredImageWidthInt) && requiredImageWidthInt !== img.width) return true;
                    image = {};
                    image.src = img.src;
                    image.height = img.height;
                    image.width = img.width;
                    finalImages.push(image);
                });
            }
        }

        $.each(finalImages, function (image, index) {
            image.imageSource = "wotc-article";
        });

        return finalImages;
    }

    function applyExceptions(cards, exceptions, setCode) {
        // Example:
        //  {
        //      where: "rarity=(mr|r)",
        //      delete: true
        //  },
        //  {
        //      where: "title='Serra Angel'",
        //      newValues {
        //          title: "Sengir Angel",
        //          rarity: "mr"
        //      }
        //  },
        //  {
        //      where: "rarity='r'",
        //      newValues {
        //          rarity: "u"
        //      }
        //  },
        //  {
        //      HMMM... what does it look like when I ADD a card? Maybe it's the one time there is no where...
        //      add: true,
        //      newValues: {
        //          title: "New Card Title",
        //          src: "src here",
        //          etc: "etc"
        //      }
        //  },
        //  }
        var cardNumsChanged = false;
        if (exceptions !== undefined && exceptions !== null) {
            for (var i = 0; i < exceptions.length; i++) {
                var exception = exceptions[i];

                if (Object.keys(exception).length === 1
                    && (exception._comments !== undefined || exception._comment !== undefined)) {
                    exception.comment = true;
                    continue; // just a comment node; ignore
                }

                exception.result = { index: i, success: true };

                if (exception.add === true) {
                    if (exception.newValues === undefined) {
                        exception.result.success = false;
                        exception.result.error = "add=true but missing required newValues {}; cannot continue processing this exception";
                        continue;
                    }
                    if (exception.newValues.title === undefined || exception.newValues.title.length < 1) {
                        exception.result.success = false;
                        exception.result.error = "add=true but missing required newValues.title; cannot continue processing this exception";
                        continue;
                    }

                    // add all Exception properties into the card
                    var card = {};
                    _.extend(card, exception.newValues);
                    exception.result.affectedCards = 1;
                    console.log('Added new card: ' + exception.newValues.title);

                    // Replace any 'reference' properties with the current card values,
                    // e.g.: "originalTitle": "{{title}}",
                    var replacementTokenRegex = /{{(.*?)}}/g;
                    var replacementReferenceValues = {};
                    for (var prop in exception.newValues) {
                        var propValue = exception.newValues[prop];
                        var newPropValue = propValue;
                        var token;
                        while ((token = replacementTokenRegex.exec(propValue)) !== null) {
                            var propName = token[1];
                            if (card[propName] !== undefined) {
                                newPropValue = newPropValue.replace(token[0], card[propName]);
                            }
                            else if (propName === 'setCode') {
                                newPropValue = setCode;
                            }
                        }
                        //exception.newValues[prop] = newPropValue;
                        replacementReferenceValues[prop] = newPropValue;
                    }

                    // Apply new values from exception.
                    _.extend(card, replacementReferenceValues);

                    card.matchTitle = mtgGen.createMatchTitle(card.title);

                    card.addedViaException = true;

                    cards = addCardToCards(cards, card);

                    continue;
                }

                var where = exception.where;
                if (where === undefined) {
                    exception.result.success = false;
                    exception.result.error = "missing required where clause; cannot continue processing this exception";
                    continue;
                }

                // Add the from[*] the query engine expects.
                // The card importer works on a single set at a time, so from[*] is always implied,
                // but we don't require it in the import json for convenience.
                var where = where.trim();
                if (where.toLowerCase().indexOf("from[") < 0) {
                    where = "from[*]?" + where;
                }

                var matchingCards = mtgGen.executeQuery(cards, null, where);

                // If it's a Delete exception, delete any cards matching the query.
                if (exception.delete === true) {
                    _.each(matchingCards, function (matchingCard) {
                        delete cards[matchingCard.mtgenId];
                    });
                    exception.result.deletedCards = matchingCards;
                    exception.result.affectedCards = matchingCards.length;

                    continue;
                }

                // Otherwise it's an Update exception; apply the changes.

                // Record all exceptions that weren't useful so we can clean up the exceptions file.
                // REWRITE THIS:
                //$.each(ex.newValues, function (prop, newVal) {
                //    if (card.hasOwnProperty(prop) && card[prop] === newVal) {
                //        console.log('Exception property already exists on card:' + card.matchTitle);
                //        if (!ex.hasOwnProperty("redundantValues")) {
                //            ex.redundantValues = {};
                //        }
                //        ex.redundantValues[prop] = newVal;
                //    }
                //});

                // Remove all of the matching cards -- we'll add them back after we modify them.
                _.each(matchingCards, function (matchingCard) {
                    delete cards[matchingCard.mtgenId];
                });

                var replacementTokenRegex = /{{(.*?)}}/g;

                // Apply the changes to all of the matching cards.
                for (var j = 0; j < matchingCards.length; j++) {
                    var card = matchingCards[j];
                    // Replace any 'reference' properties with the current card values,
                    // e.g.: "originalTitle": "{{title}}",
                    var replacementReferenceValues = {};
                    for (var prop in exception.newValues) {
                        var propValue = exception.newValues[prop];
                        var newPropValue = propValue;
                        var token;
                        while ((token = replacementTokenRegex.exec(propValue)) !== null) {
                            var propName = token[1];
                            if (card[propName] !== undefined) {
                                newPropValue = newPropValue.replace(token[0], card[propName]);
                            }
                            else if (propName === 'setCode') {
                                newPropValue = setCode;
                            }
                        }
                        //exception.newValues[prop] = newPropValue;
                        replacementReferenceValues[prop] = newPropValue;
                    }

                    // Apply new values from exception.
                    _.extend(card, exception.newValues);
                    _.extend(card, replacementReferenceValues);

                    card.matchTitle = mtgGen.createMatchTitle(card.title);
                };
                exception.result.modifiedCards = matchingCards;
                exception.result.affectedCards = matchingCards.length;

                // Add the modified cards back in.
                _.each(matchingCards, function (matchingCard) {
                    cards = addCardToCards(cards, matchingCard);
                });
            }
        }

        // Sort the final result so they're in the order they were originally sent in (for debugging).
        cards = _.sortBy(cards, "index");

        // Return both the updated set of cards AND the modified exceptions (the latter for reporitng purposes).
        var result = {};
        result.cards = cards;

        result.exceptions = exceptions;
        return result;
    }

    function applyImagesToCards(cards, images) {
        if (images !== undefined) {
            // Indexed for double-faced cards.
            var cardsByMatchTitle = {};
            _.each(cards, function (card) {
                cardsByMatchTitle[card.matchTitle] = card;
            });

            _.each(cards, function (card) {
                var image = images[card.matchTitle];

                // archive.wizards.com images have no titles; they're indexed by image
                if (image === undefined) {
                    image = images[card.num];
                }

                if (image !== undefined) {
                    card.srcOriginal = card.src;
                    card.imageSourceOriginal = card.src;
                    card.src = image.src;
                    card.imageSource = image.imageSource;

                    // Properties for double-sided images
                    if (image.doubleFaceCard !== undefined) { card.doubleFaceCard = image.doubleFaceCard; }
                    if (image.matchTitleFront !== undefined) {
                        var cardFront = cardsByMatchTitle[image.matchTitleFront];
                        if (cardFront !== undefined) {
                            card.mtgenIdFront = cardFront.mtgenId;
                            card.doubleFaceBackCard = true;
                        }
                    }
                    if (image.matchTitleBack !== undefined) {
                        var cardBack = cardsByMatchTitle[image.matchTitleBack];
                        if (cardBack !== undefined) {
                            card.mtgenIdBack = cardBack.mtgenId;
                            card.doubleFaceFrontCard = true;
                        }
                    }

                    image.wasUsed = true;
                }
            });
        }

        // if no image found at all at this point, create replacement card
        _.each(cards, function (card) {
            if (!card.src) {
                card.imageSource = "placeholder";
                card.src = createPlaceholderCardSrc(card);
            }
        });

        return cards;
    }

    // Land files -------------------------------------------------------------------------------------------

    my.loadAndProcessLandFile = function (options) {
        // Import options into instance variables
        //$.each(options, function (value, key) {
        //    my[key] = value;
        //});
        $.extend(my, options);

        if (my.landDataUrl === undefined || my.landDataUrl.length < 1) {
            alert("ERROR: No land data url supplied. Cannot continue.");
            return;
        }

        // load all files and don't continue until all are loaded
        var promises = [];

        $.ajaxSetup({ timeout: 5000 });

        //CAMKILL:promises.push($.get('ba-simple-proxy.php?mode=native&url=' + my.landDataUrl));
        promises.push($.get('/proxy?u=' + encodeURIComponent(my.landDataUrl)));

        my.trigger('data-loading');

        $.when.apply($, promises).done(function (data) {
            // the first result is essential
            var landImages = {
                //data: arguments[0][0],
                data: data,
                urlSource: my.landDataUrl
            }
            if (isBadResponse(landImages.data)) {
                alert("ERROR: No data retrieved from " + my.cardDataUrl + ". Response:" + landImages);
                return;
            }

            var setCode = my.setCode.trim();

            my.trigger('data-loaded');

            setTimeout(function () {
                createLandOutputJson(setCode, landImages, my.requiredImageWidth, my.requiredImageHeight, my.startingCardNum, my.numLandPerType, my.landOrder, my.landOrderOverride);
            }, 100); // delay to let ui render
        });

    }

    function getLandTypeFromCode(code) {
        switch (code) {
            case "w": return "Plains";
            case "u": return "Island";
            case "b": return "Swamp";
            case "r": return "Mountain";
            case "g": return "Forest";
            default: return "Unknown type: " + code + " -- should be one of: w u r b g";
        }
    }

    function createLandOutputJson(setCode, landImages, requiredImageWidth, requiredImageHeight, startingCardNum, numLandPerType, landOrder, landOrderOverride) {
        // Get image data -------------------------------------------------------------------------------------------------
        var landImages = my.api.getLandImagesFromWotcArticle(landImages.data, requiredImageWidth, requiredImageHeight);
        var imageDataCount = Object.size(landImages);

        // NEXT: of course the FIRST one I do is weird.. cuz it has the four out-of-order ones at the top...
        // - grab all images, make list of sizes, auto-choose most common size and call them "land"
        // - work this back in to the main importer? maybe? it would make import/export of settings easier...
        // - replace the save/load functionality

        // If land order overide specified, parse it
        var landOrderOverrides = [];
        if (landOrderOverride.trim().length > 0) {
            var overrideItems = landOrderOverride.replace(/(?:\r\n|\r|\n)/g, ',');
            landOrderOverrides = overrideItems.trim().toLowerCase().split(',');
        }

        // Create land cards out of each image
        var cards = {};
        var skippedCards = [];
        var cardNum = startingCardNum;
        var landTypeCount = 0;
        var landTypeIndex = 0;
        var landOrderLower = landOrder.toLowerCase();
        var landOrderOverrideIndex = 0;
        $.each(landImages, function (index, image) {
            var card = {};

            Object.assign(card, image); // src, height, width, imageSource

            // If overrides exist, use the entire pattern given, e.g.: w250,u251,b252,r253,g254 etc -- use x to skip a card
            var skipCard = false;
            if (landOrderOverrides.length) {
                if (landOrderOverrides.length <= landOrderOverrideIndex) {
                    card.title = "Ran out of Land Order Overrides";
                }
                else {
                    if (landOrderOverrides[landOrderOverrideIndex][0] === 'x') {
                        skipCard = true;
                        card.skippedCardIndex = index;
                        skippedCards.push(card);
                    }
                    else {
                        card.title = getLandTypeFromCode(landOrderOverrides[landOrderOverrideIndex][0]);
                        card.num = landOrderOverrides[landOrderOverrideIndex].substr(1);
                    }
                }
                landOrderOverrideIndex++;
            }
            else {
                if (landTypeCount > numLandPerType - 1) {
                    landTypeCount = 0;
                    landTypeIndex++;
                }
                card.title = getLandTypeFromCode(landOrderLower[landTypeIndex]);
                card.num = cardNum++;

                landTypeCount++;
            }

            if (!skipCard) {
                card.matchTitle = mtgGen.createMatchTitle(card.title);
                card.set = setCode;
                card.cost = "";
                card.rarity = "c";
                card.type = "Basic Land";
                card.subtype = card.title;
                card.colour = "l";

                cards = addCardToCards(cards, card);
            }
        });

        // Reporting -------------------------------------------------------------------------------------------------

        var out = "";
        var cardsLength = Object.size(cards);
        if (cardsLength < 1) {
            out += "<p>WARNING: No images found at url.</p>";
        }

        if (skippedCards.length > 0) {
            out += "<p>The following " + skippedCards.length + " cards were skipped due to 'x's in your Land Override Patterns setting:</p><ul class='skipped-cards'>";
            $.each(skippedCards, function (index, card) {
                out += "<li><img src='" + card.src + "' height='" + Math.round(card.height / 2) + "' width='" + Math.round(card.width / 2) + "' />";
                out += "<p>Card #" + (card.skippedCardIndex + 1) + "</p></li>";
            });
            out += "</ul>";
        }

        my.trigger('log-complete', out);

        // Final JSON output -------------------------------------------------------------------------------------------------

        var finalOut = [];
        _.each(cards, function (card) {
            delete card.matchTitle;
            delete card.srcOriginal;
            delete card.imageSourceOriginal;
            delete card.fixedViaException;
            delete card.imageSource;

            // Create the card as an exception.
            var exception = {
                "add": true,
                "newValues": card
            };
            finalOut.push(exception);
        });

        var jsonMainStr = JSON.stringify(finalOut, null, ' ');

        var cardsHtmlSample = '';
        _.each(cards, function (card) {
            cardsHtmlSample += "<div class='card'><img src='" + card.src + "' height='"
                + (card.height) + "' width='" + (card.width) + "' /><p>"
                + card.num + ":" + card.title + "</p></div>";
        });

        my.trigger('data-processing-complete', cardsLength, jsonMainStr, cardsHtmlSample);
    }


    function createPlaceholderCardSrc(card) {
        var cardBgColour = "cccccc";
        var cardTextColour = "969696";
        switch (card.colour) {
            case 'w': cardBgColour = 'e9e5da'; break;
            case 'u': cardBgColour = 'cddfed'; break;
            case 'b': cardBgColour = '000000'; cardTextColour = 'ffffff'; break;
            case 'r': cardBgColour = 'f6d1be'; break;
            case 'g': cardBgColour = 'c7d4ca'; break;
        }
        return "holder.js/265x370/#" + cardBgColour + ":#" + cardTextColour + "/text:" + cardTitleUrl(card.title, 500);
    }

    function createPlaceboxesCardSrc(card) {
        var cardBgColour = "cccccc";
        var cardTextColour = "969696";
        switch (card.colourType) {
            case 'w': cardBgColour = 'e9e5da'; break;
            case 'u': cardBgColour = 'cddfed'; break;
            case 'b': cardBgColour = '000000'; cardTextColour = 'ffffff'; break;
            case 'r': cardBgColour = 'f6d1be'; break;
            case 'g': cardBgColour = 'c7d4ca'; break;
        }
        return "http://placebox.es/265x370/" + cardBgColour + "/" + cardTextColour + "/" + cardTitleUrl(card.title, 500) + ",20/";
    }

    Object.size = function (obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    function createMrPurpleCardSrc(card) {
        var url = "http://magic.mrpurple.de/";
        if (card.type == 'Planeswalker') {
            url += "Planeswalker/server-side.php?Titel=" + card.title + "&Type=" + card.type;
            if (card.loyalty) { url += '&loyalty=' + card.loyalty; }
        }
        else {
            url += "Card/modern.php?style=modern.php&Titel=" + card.title + "&Type=" + card.type;
        }

        url += '&Color=';
        switch (card.colour) {
            case mtgGen.colours.multicolour:
                url += 'Multicolor';
                break;
            case mtgGen.colours.other:
            case mtgGen.colours.unknown:
                url += 'Colorless';
                break;
            default:
                url += mtgGen.getColourByCode(card.colour).name;
                break;
        }

        url += '&Rarity=' + getRarityByCode(card.rarity).name.replace("Mythic Rare", "Mythic", "gi");
        if (card.subtype) { url += '&Subtype=- ' + card.subtype; }
        if (card.power) { url += '&Power=' + card.power; }
        if (card.toughness) { url += '&Toughness=' + card.toughness; }

        if (card.cost) {
            var wCount = 0;
            var uCount = 0;
            var bCount = 0;
            var rCount = 0;
            var gCount = 0;
            var cCount = 0;
            var colourCosts = card.cost.toLowerCase().replace(/{/g, "").replace(/}/g, " ").trim().split(" ");
            for (var i in colourCosts) {
                switch (colourCosts[i]) {
                    case 'w': wCount++; break;
                    case 'u': uCount++; break;
                    case 'b': bCount++; break;
                    case 'r': rCount++; break;
                    case 'g': gCount++; break;
                    default: cCount += parseInt(colourCosts[i]); break;
                }
            }
            if (wCount > 0) { url += "&manawhite=" + wCount; }
            if (uCount > 0) { url += "&manablue=" + uCount; }
            if (bCount > 0) { url += "&manablack=" + bCount; }
            if (rCount > 0) { url += "&manared=" + rCount; }
            if (gCount > 0) { url += "&managreen=" + gCount; }
            if (cCount > 0) { url += "&manacolless=" + cCount; }
        }

        return url;
    }

    // set of internal function calls for testing purposes
    my.api = {
        createOutputJson: createOutputJson,

        getCardData: getCardData,
        getCardsFromGatheringMagicData: getCardsFromGatheringMagicData,
        getCardsFromMtgJsonData: getCardsFromMtgJsonData,

        getImageData: getImageData,
        getCardsFromMtgSalvationData: getCardsFromMtgSalvationData,
        getImagesFromMtgJsonData: getImagesFromMtgJsonData,
        getImagesFromCardsMainData: getImagesFromCardsMainData,
        getLandImagesFromWotcArticle: getLandImagesFromWotcArticle,

        applyExceptions: applyExceptions,
        applyImagesToCards: applyImagesToCards
    };

    return my;
}(cardDataImporter || {}, jQuery));
