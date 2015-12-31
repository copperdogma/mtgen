/*
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

        if (my.cardDataUrl === undefined || my.cardDataUrl.length < 1) {
            alert("ERROR: No card data url supplied. Cannot continue.");
            return;
        }

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
        var initialCardDataCount = mainOut.length;

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
        var exceptionsResults = my.api.applyExceptions(mainOut, jsonExceptions.data);
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
                $.each(missingSecondaryImageDataEntry, function (index, value) {
                    var comment = "";
                    if (value._comment) {
                        comment = "<em> - " + value._comment + "</em>";
                    }
                    out += "<li style='color:red'>" + value.title + comment + "</li>";
                });
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
                $.each(unusedImages, function (index, image) {
                    out += "<li style='color:red'>" + image.title + "</li>";
                });
                out += "</ul>";
            }
        }

        var cardsWithPlaceholderImages = $.grep(mainOut, function (card, index) { return card.imageSource === "placeholder"; });
        if (cardsWithPlaceholderImages.length > 0) {
            out += "<p>The following cards have no primary images or images supplied from your image source, so an image was created using <a href='http://placehold.it/' target='_blank'>placehold.it</a>:</p><ul>";
            $.each(cardsWithPlaceholderImages, function (index, value) {
                out += "<li style='color:red'>" + value.title + "</li>";
            });
            out += "</ul>";
        }

        var exceptions = exceptionsResults.exceptions;
        var hasExceptions = (exceptions !== undefined && exceptions !== null && exceptions.length > 0);
        if (!hasExceptions) {
            out += "<p>No exceptions provided.</p>";
        }
        else {
            out += "<p>The supplied exceptions were processed as follows:</p><ul>";
            exceptions.forEach(function (exception, index) {
                if (exception.result === undefined || exception.result === null) {
                    exception.result = { success: false, error: "PROCESSING FAILURE: no result given at all for this exception!" };
                }
                if (exception.comment === true) {
                    out += "<li style='color: gray'>#" + (index+1) + ": Comment; ignored.</li>";
                }
                else if (exception.result.success === true) {
                    if (exception.result.affectedCards > 0) {
                        out += "<li style='color: green'>#" + (index + 1) + ": ";
                    }
                    else {
                        out += "<li style='color: DarkGoldenrod'>#" + (index + 1) + ": ";
                    }
                    if (exception.add === true) {
                        out += 'Added new card: ' + exception.newValues.title;
                    }
                    else if (exception.delete === true) {
                        var deletedCards = _.sortBy(exception.result.deletedCards, "title");
                        out += 'Deleted ' + deletedCards.length + " cards via query: " + exception.where;
                        if (deletedCards.length > 0) {
                            out += "<ul>";
                            deletedCards.forEach(function (card) { out += "<li>" + card.title + "</li>"; });
                            out += "</ul>";
                        }
                    }
                    else {
                        var modifiedCards = _.sortBy(exception.result.modifiedCards, "title");
                        out += 'Modified ' + modifiedCards.length + " cards via query: " + exception.where + "<br/>";
                        out += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;New values: ' + JSON.stringify(exception.newValues);
                        if (modifiedCards.length > 0) {
                            out += "<ul>";
                            modifiedCards.forEach(function (card) { out += "<li>" + card.title + "</li>"; });
                            out += "</ul>";
                        }
                    }
                }
                else {
                    out += "<li style='color: red'>#" + (index+1) + ": " + exception.result.error;
                }
                out += "</li>";
            });
            out += "</ul>";
        }

        my.trigger('log-complete', out);

        // Final JSON output -------------------------------------------------------------------------------------------------

        // clean our temporary data out of the final card data
        $(mainOut).each(function (index, card) {
            delete card.matchTitle;
            delete card.srcOriginal;
            delete card.imageSourceOriginal;
            delete card.fixedViaException;
            delete card.imageSource;
        });

        var jsonMainStr = JSON.stringify(mainOut, null, ' ');

        my.trigger('data-processing-complete', jsonMainStr, initialCardDataCount, imageDataCount, mainOut.length);
    }

    function addMatchTitles(itemArray) {
        if (itemArray !== undefined) {
            $.each(itemArray, function (index, item) {
                if (item.hasOwnProperty('title')) {
                    item.matchTitle = mtgGen.createMatchTitle(item.title);
                }
            });
        }
        return itemArray;
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
        if (card.hasOwnProperty('type') && card.type.length > 0 && card.type.trim().toLowerCase() === "land") {
            return mtgGen.colours.land.code;
        }

        // derived from casting cost
        var cardColours = card.cost.toLowerCase().replace(/{|[0-9]/g, "").replace(/}/g, " ").trim().replace(/ /g, '').split("");
        var arrayUnique = function (a) {
            return a.reduce(function (p, c) {
                if (p.indexOf(c) < 0) p.push(c);
                return p;
            }, []);
        };
        var uniqueColours = arrayUnique(cardColours);
        var uniqueColoursString = uniqueColours.join('');

        var colourCount = 0;
        var uniqueColourIndex = 0; // used only if the card ends up being single colour
        var uniqueColourType = ""; // used only if the card ends up being single colour
        if (uniqueColoursString.indexOf('w') > -1) { colourCount++; uniqueColourIndex = 1; uniqueColourType = "w"; }
        if (uniqueColoursString.indexOf('u') > -1) { colourCount++; uniqueColourIndex = 2; uniqueColourType = "u"; }
        if (uniqueColoursString.indexOf('b') > -1) { colourCount++; uniqueColourIndex = 3; uniqueColourType = "b"; }
        if (uniqueColoursString.indexOf('r') > -1) { colourCount++; uniqueColourIndex = 4; uniqueColourType = "r"; }
        if (uniqueColoursString.indexOf('g') > -1) { colourCount++; uniqueColourIndex = 5; uniqueColourType = "g"; }

        // colourTypes from GatheringMagic:
        //	w = white
        //	u = blue
        //	b = black
        //	r = red
        //	g = green
        //	m = multi-colour
        //	c = colourless
        var finalColour = '';
        switch (colourCount) {
            case 0:
                // colourless - determine sub-type
                if (card.colour == 'c') {
                    var cardType = card.type.toLowerCase();
                    // manually determine colour because GM didn't do it
                    if (cardType.indexOf('artifact') > -1) {
                        finalColour = mtgGen.colours.artifact.code;
                    }
                    else if (cardType.indexOf('land') > -1) {
                        finalColour = mtgGen.colours.land.code;
                    }
                    else {
                        console.log('Could not identify colour from GM "' + card.colour + '" on card: ' + card.title + '. Set to Other Colourless. Usually check the type (which we have already checked to be not artifact or land): ' + card.type);
                        finalColour = mtgGen.colours.colorless.code;
                    }
                }
                else {
                    var nativeCardColour = '';
                    if (card.hasOwnProperty('colour')) {
                        nativeCardColour = card.colour;
                    }
                    else if (card.hasOwnProperty('color')) {
                        nativeCardColour = card.color; // I made this one up.. does anything have this?
                    }
                    else if (card.hasOwnProperty('colorIdentity') && card.colorIdentity.length > 0) {
                        nativeCardColour = card.colorIdentity[0].toLowerCase(); // mtgjson if casting cost is 0
                    }
                    finalColour = getColourByCode(nativeCardColour).code; // should result in a, l, o, or ?
                }
                break;
            case 1: // single-colour, as determined above
                finalColour = uniqueColourType;
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
        var cards = [];

        // Determine from where the card data was sourced and therefore the parser needed.
        var lowercaseCardDataUrlSource = cardDataUrlSource.toLowerCase();
        if (lowercaseCardDataUrlSource.indexOf('mtgsalvation.com') > -1) {
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

        // Add card indicies for later use in queries.
        cards.forEach(function (card, index) { card.index = index; });

        return cards;
    }

    function getCardsFromMtgSalvationData(rawCardData, setCode) {
        var cards = [];

        // get all MtgS cards
        var $html = $("<html/>").html(rawCardData);
        var $cards = $html.find('.t-spoiler-wrapper');
        if ($cards.length === 0) {
            alert("No cards from MtG Salvation cards found. Note that you CANNOT run this thing locally. It won't work. It needs to run through the proxy to work.");
        }
        $.each($cards, function (index, el) {
            var card = {};
            el = $(el);

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
                $.each(colour[0].classList, function (index, className) {
                    if (className.indexOf('card-color-') > -1) {
                        var cardColour = className.replace('card-color-', '');
                        if (cardColour.length > 0) {
                            card.colour = cardColour[0].toLowerCase();
                        }
                    }
                });
            }

            // derived from casting cost
            card.colour = getCardColourFromCard(card);

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

            cards.push(card);
        });

        return cards;
    }

    function getCardsFromGatheringMagicData(rawCardData, setCode) {
        var cards = [];

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

            cards.push(card);
        });

        return cards;
    }

    function getCardsFromMtgJsonData(rawCardData, setCode) {
        var cards = [];

        rawCardData = JSON.parse(rawCardData);

        if (rawCardData === undefined || !rawCardData.hasOwnProperty('cards')) {
            alert("Missing card data from mtgjson.com. Note that you CANNOT run this thing locally. It won't work. It needs to run through the proxy to work.");
        }
        if (rawCardData.cards.length < 1) {
            alert("No cards from mtgjson.com found. Note that you CANNOT run this thing locally. It won't work. It needs to run through the proxy to work.");
        }

        // add each card, converting from mtgjson.com's format to our own
        $.each(rawCardData.cards, function (index, card) {
            //console.log('converting: ' + card.name);
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
            if (card.hasOwnProperty('watermark') && (card.set === 'som' || card.set === 'mbs' || card.set === 'nph')) {
                card.faction = card.watermark;
            }

            cards.push(card);
        });

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

        finalImages.forEach(function (image) {
            image.imageSource = "wotc-spoilers";
        });

        return finalImages;
    }

    function getImagesFromWotcArchive(rawHtmlImageData) {
        var image;
        var finalImages = [];

        var $images = $(rawHtmlImageData);

        var $rawimages = $images.find('.article-image');
        if ($rawimages.length > 0) {
            var $imageContainer, $cardTitle;
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

        finalImages.forEach(function (image) {
            image.imageSource = "wotc-archive";
        });

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
        $.each(rawImageData.cards, function (index, card) {
            image = {};
            image.title = card.name;
            image.matchTitle = mtgGen.createMatchTitle(image.title);
            image.src = "http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=" + card.multiverseid + "&type=card";
            image.imageSource = "mtgjson";
            finalImages[image.matchTitle] = image;
        });

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

        $.each(rawImageData, function (index, card) {
            image = {};
            image.title = card.title;
            image.matchTitle = mtgGen.createMatchTitle(image.title);
            image.src = card.src;
            image.imageSource = "cardsMain.json";
            finalImages[image.matchTitle] = image;
        });

        return finalImages;
    }

    function applyExceptions(cards, exceptions) {
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
        if (exceptions !== undefined && exceptions !== null) {
            exceptions.forEach(function (exception, index) {
                if (exception._comments !== undefined && Object.keys(exception).length === 1) {
                    exception.comment = true;
                    return; // just a comment node; ignore
                }

                exception.result = { index: index, success: true };

                if (exception.add === true) {
                    if (exception.newValues === undefined) {
                        exception.result.success = false;
                        exception.result.error = "add=true but missing required newValues {}; cannot continue processing this exception";
                        return;
                    }
                    if (exception.newValues.title === undefined || exception.newValues.title.length < 1) {
                        exception.result.success = false;
                        exception.result.error = "add=true but missing required newValues.title; cannot continue processing this exception";
                        return;
                    }

                    // add all Exception properties into the card
                    var card = {};
                    _.extend(card, exception.newValues);
                    exception.result.affectedCards = 1;
                    console.log('Added new card: ' + exception.newValues.title);
                    card.matchTitle = mtgGen.createMatchTitle(card.title);

                    card.addedViaException = exception;

                    cards.push(card);

                    // Rebuild indices otherwise future queries will be off.
                    cards.forEach(function (card, index) { card.index = index; });

                    return;
                }

                var where = exception.where;
                if (where === undefined || where.length < 1) {
                    exception.result.success = false;
                    exception.result.error = "missing required where clause; cannot continue processing this exception";
                    return;
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
                    cards = _.difference(cards, matchingCards);
                    exception.result.deletedCards = matchingCards;
                    exception.result.affectedCards = matchingCards.length;

                    // Rebuild indices otherwise future queries will be off.
                    cards.forEach(function (card, index) { card.index = index; });

                    return;
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
                cards = _.difference(cards, matchingCards);

                // Apply the changes to all of the matching cards.
                matchingCards.forEach(function (card) {
                    _.extend(card, exception.newValues);
                    card.matchTitle = mtgGen.createMatchTitle(card.title);
                });
                exception.result.modifiedCards = matchingCards;
                exception.result.affectedCards = matchingCards.length;

                // Add the modifed cards back in.
                cards = _.union(cards, matchingCards);
            });

            // Sort the final result so they're in the order they were originally sent in (for debugging).
            cards = _.sortBy(cards, "index");
        }

        // Return both the updated set of cards AND the modified exceptions (the latter for reporitng purposes).
        var result = {};
        result.cards = cards;
        result.exceptions = exceptions;
        return result;
    }

    function applyImagesToCards(cards, images) {
        if (images !== undefined) {
            $.each(cards, function (index, card) {
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
                    image.wasUsed = true;
                }
            });
        }

        // if no image found at all at this point, create replacement card
        $.each(cards, function (index, card) {
            if (!card.src) {
                card.imageSource = "placeholder";
                card.src = createPlaceholderCardSrc(card);
            }
        });

        return cards;
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
                url += getColourByCode(card.colour).name;
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

        applyExceptions: applyExceptions,
        applyImagesToCards: applyImagesToCards
    };

    return my;
}(cardDataImporter || {}, jQuery));
