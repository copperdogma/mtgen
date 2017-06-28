/*
Generates an output mtgen card set in json format for use in the main app, using an importer file full of settings.

Typically the importer file (e.g. import-main.json) will specify the wotc card gallery as the image source and
the mtgsalvation spoiler page as the data source.

27-Jun-2017: Now adds .isSelected=false to all cards and flags as .isSelected=true if they were modified in an exception. This lets exception file delete all where .isSelected=false at the end.
26-Jun-2017: Added exceptions support for where='gatherer=...' to fetch individual card data from Wizards Gatherer. Switched some code from promises to async/await.
1-Mar-2017: Refactored into flattened es6 promise chains.
27-Feb-2017: Pulled card-exception-generator.js out of this file.
14-Sep-2016: Updated land importer to output new more compact format.
8-Mar-2016: Now supports loading double-faced card data from wotc and mtgsalvation.
8-Mar-2016: getCardColourFromCard() now defaults to the existing card colour if one exists.
27-Jan-2016: Updated to add/use mtgenIds and associative arrays on "cards".
4-Jan-2016: Rewrote getCardColourFromCard() -- MUCH simpler and now uses new (as of OGW) generic (x) and colourless (c) mana types

    Typical url: http://www.mtgsalvation.com/printable-gatecrash-spoiler.html

    Typical card from Gathering Magic (defunct):
        <div class="spoiler-card w-card type-Creature subtype-Humanc subtype-Soldier confirmed r-common wm-orzhov num-5" "="">
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
class CardDataImporter {

    // PUBLIC METHODS ------------------------------------------------------------------------------------

    async loadAndProcessAllFiles({ cardDataUrl, htmlCardData, imagesUrl, exceptions, setCode }) {
        setCode = setCode.trim();

        // We need 3 sets of data: card, image, and exceptions

        // If raw HTML data was provided, use that.
        const cardDataPromise = (htmlCardData && htmlCardData.trim().length > 1) ? Promise.resolve(htmlCardData) : this._fetchHtml(cardDataUrl);

        const imageDataPromise = imagesUrl ? this._fetchHtml(imagesUrl) : null;

        // Exceptions are loaded as part of the import file, so they're already in the form.
        const exceptionsDataPromise = Promise.resolve(exceptions);

        window.dispatchEvent(new Event('data-loading'));

        // Get all data, either fetched from a url or loaded directly from the form.
        let htmlData, imageData, exceptionData;
        try {
            [htmlData, imageData, exceptionData] = await Promise.all([cardDataPromise, imageDataPromise, exceptionsDataPromise]);
        }
        catch (err) {
            alert(`ERROR: failed to retrieve data from a source: ${err.message}`)
        };

        // the first result is essential
        const htmlCards = {
            data: htmlData,
            urlSource: cardDataUrl
        }
        const htmlImages = {
            data: imageData,
            urlSource: imagesUrl
        }
        const jsonExceptions = {
            data: exceptionData
        };

        window.dispatchEvent(new Event('data-loaded'));

        // Get card data -------------------------------------------------------------------------------------------------
        // All card data source come with image data that we usually want to override in the next step.
        let mainOut = this._getCardData(htmlCards.data, htmlCards.urlSource, setCode);
        mainOut.initialCardDataCount = mainOut.size;

        // Get image data -------------------------------------------------------------------------------------------------
        let mainImages = new Map();
        if (htmlImages.data) {
            mainImages = this._getImageData(htmlImages.data, htmlImages.urlSource);
        }

        // Apply Exceptions -------------------------------------------------------------------------------------------------
        if (jsonExceptions.data) {
            jsonExceptions.data = JSON.parse(jsonExceptions.data);
        }

        // Returns both the updated set of cards AND the modified exceptions (the latter for reporitng purposes).
        const exceptionsResults = await this._applyExceptions(mainOut, jsonExceptions.data, setCode);
        mainOut = exceptionsResults.cards;

        // Add images to cards -------------------------------------------------------------------------------------------------
        mainOut = this._applyImagesToCards(mainOut, mainImages);

        const cardArray = [...mainOut.values()];
        const outputLog = await this._createOutputLog(cardArray, mainImages, exceptionsResults);
        const finalData = await this._createFinalJsonOutput(cardArray, mainOut.initialCardDataCount, mainImages);

        return [outputLog, finalData];
    }

    getDownloadSettingsFileLinkAttributes(setCode, cardDataUrl, imagesUrl, exceptionsUrl, exceptions) {
        const settings = {
            "setCode": setCode,
            "cardDataUrl": cardDataUrl,
            "imagesUrl": imagesUrl,
            "exceptionsUrl": exceptionsUrl,
            "exceptions": exceptions
        };

        const settingsJson = JSON.stringify(settings, null, ' ');
        const encodedContent = btoa(settingsJson);

        const attrs = {
            "href": `data:text/octet-strea; m;base64,${encodedContent}`,
            "download": 'import-main.json' // 'download' attr is Chrome/FF-only to set download filename
        };
        return attrs;
    }

    setSettings(settings) {
        // support the old settings file format
        if (settings.cardDataUrl === undefined && settings.hasOwnProperty('gatheringMagicUrl')) {
            settings.cardDataUrl = settings.gatheringMagicUrl;
        }
        if (settings.hasOwnProperty('mtgJson')) {
            settings.cardDataUrl = settings.mtgJson;
        }
        return settings;
    }

    // PRIVATE METHODS ------------------------------------------------------------------------------------

    // Get html via a proxy, erroring if it fails or if no HTML is retrieved.
    async _fetchHtml(url) {
        const response = await fetch(`/proxy?u=${encodeURIComponent(url)}`);

        if (!response.ok) { throw Error(response.statusText); }
        const text = response.text();
        console.log(`got html from ${url}`);
        if (text === 'An error occurred while sending the request.') { throw Error(`${text} Url: ${url}`); }
        if (text === undefined || text.length === 0) { throw Error(`No HTML returned from: ${url}`); }
        return text;
    }

    async _createOutputLog(cardArray, mainImages, exceptionsResults) {
        let out = "";
        if (mainImages.size < 1) {
            out += `<p>WARNING: No image data supplied. Using any images found with card data.</p>`;
        }
        else {
            const missingSecondaryImageDataEntry = cardArray.filter(card => !card.hasOwnProperty("imageSourceOriginal"));
            if (missingSecondaryImageDataEntry.length < 1) {
                out += "<p>No parsing errors.</p>";
            }
            else {
                out += "<p>The following cards had no image data from your image source:</p><ul>";
                missingSecondaryImageDataEntry.sort(this._sortByTitle).forEach(value => {
                    const comment = value._comment ? `<em> - ${value._comment}</em>` : "";
                    out += `<li style='color:red'>${value.title + comment}</li>`;
                });
                out += "</ul>";
            }

            const unusedImages = Object.entries(mainImages).map(entry => entry[1]).filter(mainImage => !mainImage.wasUsed);
            if (unusedImages.length > 0) {
                out += "<p>The following images from your image data source did not match any cards in your card data:</p><ul>";
                unusedImages.forEach(unusedImage => out += `<li style='color:red'>${unusedImage.title}</li>`);
                out += "</ul>";
            }
        }

        const cardsWithPlaceholderImages = cardArray.filter(card => card.imageSource === "placeholder");
        if (cardsWithPlaceholderImages.length > 0) {
            out += "<p>The following cards have no primary images or images supplied from your image source, so an image was created using <a href='http://placehold.it/' target='_blank'>placehold.it</a>:</p><ul>";
            cardsWithPlaceholderImages.forEach(card => out += `<li style='color:red'>${card.title}</li>`);
            out += "</ul>";
        }

        const duplicateCards = cardArray.filter(card => card.duplicateNum !== undefined);
        if (duplicateCards.length > 0) {
            const sortedDuplicateCards = duplicateCards.sort((a, b) => this._sortBy("mtgenId", a, b));
            out += "<p>The following cards have duplicate mtgenIds:</p><ul>";
            sortedDuplicateCards.forEach(card => out += `<li style='color:DarkGoldenrod'>${card.mtgenId}: ${card.title}</li>`);
            out += "</ul>";
        }

        if (!exceptionsResults.exceptions) {
            out += "<p>No exceptions provided.</p>";
        }
        else {
            out += "<p>The supplied exceptions were processed as follows:</p><ul>";

            exceptionsResults.exceptions.forEach((exception, index) => {
                if (!exception.result) {
                    exception.result = { success: false, error: "PROCESSING FAILURE: no result given at all for this exception!" };
                }
                if (exception.comment === true) {
                    out += `<li style='color: gray'>#${(index + 1)}: Comment; ignored.</li>`;
                }
                else if (exception.result.success === true) {
                    if (exception.result.affectedCards > 0) {
                        out += `<li style='color: green'>#${(index + 1)}: `;
                    }
                    else {
                        out += `<li style='color: DarkGoldenrod'>#${(index + 1)}: `;
                    }
                    if (exception.add === true) {
                        out += `Added new card: ${exception.newValues.title}`;
                    }
                    else if (exception.delete === true) {
                        const deletedCards = [...exception.result.deletedCards.values()].sort(this._sortByTitle);
                        out += `Deleted ${deletedCards.length} cards via query: ${exception.where}`;
                        if (deletedCards.length > 20) {
                            out += "<ul>" + deletedCards.map(card => card.title).join(", ") + "</ul>";
                        }
                        else if (deletedCards.length > 0) {
                            out += "<ul>" + deletedCards.map(card => `<li>${card.title}</li>`).join('') + "</ul>";
                        }
                    }
                    else {
                        const modifiedCards = [...exception.result.modifiedCards.values()].sort(this._sortByTitle);
                        out += `Modified ${modifiedCards.length} cards via query: ${exception.where}<br/>`;
                        out += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;New values: ${JSON.stringify(exception.newValues)}`;
                        if (modifiedCards.length > 20) {
                            out += "<ul>" + modifiedCards.map(card => card.title).join(", ") + "</ul>";
                        }
                        else if (modifiedCards.length > 0) {
                            out += "<ul>" + modifiedCards.map(card => `<li>${card.title}</li>`).join('') + "</ul>";
                        }
                    }
                }
                else {
                    out += `<li style='color: red'>#${(index + 1)}: ${exception.result.error}`;
                }
                out += "</li>";
            });
            out += "</ul>";
        }
        return out;
    }

    async _createFinalJsonOutput(cardArray, initialCardDataCount, mainImages) {
        cardArray.forEach(card => {
            delete card.matchTitle;
            delete card.srcOriginal;
            delete card.imageSourceOriginal;
            delete card.fixedViaException;
            delete card.imageSource;
        });

        const jsonMainStr = JSON.stringify(cardArray, null, ' ');

        const finalData = {
            cardsMainJson: jsonMainStr,
            initialCardDataCount,
            imageDataCount: mainImages.size,
            finalCardCount: cardArray.length
        };

        return finalData;
    }

    _sortByTitle(a, b) {
        const aName = mtgGen.createMatchTitle(a.title);
        const bName = mtgGen.createMatchTitle(b.title);
        return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
    }

    _sortBy(prop, a, b) {
        const aProp = a[prop];
        const bProp = b[prop]
        return ((aProp < bProp) ? -1 : ((aProp > bProp) ? 1 : 0));
    }

    // adapted from: http://guegue.net/friendlyURL_JS
    _cardTitleUrl(str, max) {
        let out = str;
        if (max === undefined) { max = 32; }
        const a_chars = [
            ["a", /[áàâãªÁÀÂÃ]/g],
            ["e", /[éèêÉÈÊ]/g],
            ["i", /[íìîÍÌÎ]/g],
            ["o", /[òóôõºÓÒÔÕ]/g],
            ["u", /[úùûÚÙÛ]/g],
            ["c", /[çÇ]/g],
            ["n", /[Ññ]/g]
        ];

        // Replace vowel with accent without them
        a_chars.forEach(a_char => out = out.replace(a_char[1], a_char[0]));

        // first replace whitespace by +, second remove repeated + by just one,
        // third delete all chars which are not between a-z or 0-9, fourth trim the string and
        // the last step truncate the string to 32 chars
        return out.replace(/\s+/gi, '~').replace(/[^a-z0-9\~]/gi, '').replace(/\-{2,}/gi, '~').replace(/~/gi, '%20').replace(/(^\s*)|(\s*$)/gi, '').substr(0, max);
    }

    _getCardColourFromCard(card) {
        if (card.type) {
            const lowerCaseCardType = card.type.toLowerCase();
            if (lowerCaseCardType.includes("land")) { return mtgGen.colours.land.code; }
            if (lowerCaseCardType.includes("artifact")) { return mtgGen.colours.artifact.code; }
        }

        // Derived from casting cost:
        // Only keep card colours (bcgkruw), then collapse into the colour-specific counts.
        // OLDER: {} are groups around split colour {RG}
        // NEWER: () are groups around split colour (R///)
        const cardColours = card.cost.toLowerCase().replace(/[^bcgkruw]/g, ""); // Remove all but the whitelisted card colour letters.
        const uniqueColours = [...new Set(cardColours)]; // Collapse to only the unique entries.

        let finalColour = '';
        switch (uniqueColours.length) {
            case 0: // 0 unique colours = colourless
                if (card.colour !== undefined && card.colour.length === 0) {
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

    _getCardData(cardData, cardDataUrlSource, setCode) {
        let cards = new Map();

        // Determine from where the card data was sourced and therefore the parser needed.
        const lowercaseCardDataUrlSource = cardDataUrlSource.trim().toLowerCase();
        if (lowercaseCardDataUrlSource.length < 1) {
            console.log("No card data source supplied: this is used when the exceptions file is used to generate cards");
        }
        // 20160818: had to run mtgsalvation through proxy2016.top cuz it started blocking direct grabs
        else if (lowercaseCardDataUrlSource.includes('mtgsalvation.com') || lowercaseCardDataUrlSource.includes('proxy2016.top')) {
            cards = this._getCardsFromMtgSalvationData(cardData, setCode);
        }
        else if (lowercaseCardDataUrlSource.includes('gatherer.wizards.com')) {
            // This one looks the cards up dynamically as they're requested.
        }
        else if (lowercaseCardDataUrlSource.includes('mtgjson.com')) {
            cards = this._getCardsFromMtgJsonData(cardData, setCode);
        }
        else if (lowercaseCardDataUrlSource.includes('localhost') || lowercaseCardDataUrlSource.includes('mtgen.net')) {
            cards = JSON.parse(cardData); // native format -- used for upgrading the images or file format
        }
        else {
            throw new Error(`Card data url unknown. Only mtgen.net/localhost, mtgsalvation.com, gatheringmagic.com, and mtgjson.com supported. '${cardDataUrlSource}'`);
        }

        return cards;
    }

    // Fix num (and any duplicates), add mtgenId, add into the cards map.
    _addCardToCards(cards, newCard) {
        const alphabet = "abcedfghijklmnopqrstuvwxyz";
        newCard.num = newCard.num || newCard.multiverseid || newCard.id; // num is required, so ensure we have one
        newCard.mtgenId = `${newCard.set}|${newCard.num}`;
        const firstVariant = `${newCard.mtgenId}:a`;
        if (!cards.has(newCard.mtgenId) && !cards.has(firstVariant)) {
            cards.set(newCard.mtgenId, newCard);
        }
        else {
            // Duplicate cards found -- fix it!

            // Find the next available variant.
            let nextAvailableVariantNum;
            for (let i = 0; i < alphabet.length; i++) {
                const mtgenId = `${newCard.mtgenId}:${alphabet[i]}`;
                if (!cards.has(mtgenId)) {
                    nextAvailableVariantNum = i + 1;
                    break;
                }
            }

            const originalCard = cards.get(newCard.mtgenId) || cards.get(firstVariant);

            // If it's a duplicate mtgenId AND title it's the SAME card.. ditch it
            if (originalCard) {
                if (originalCard.matchTitle === newCard.matchTitle) {
                    console.log(`DUPLICATE CARD: ${newCard.title}`);
                    return cards;
                }
            }

            if (!originalCard.mtgenVariant) {
                cards.delete(originalCard.mtgenId);
                originalCard.mtgenVariant = nextAvailableVariantNum;
                originalCard.mtgenId += `:${alphabet[nextAvailableVariantNum - 1]}`;
                originalCard.duplicateNum = true;
                cards.set(originalCard.mtgenId, originalCard);
                nextAvailableVariantNum++;
            }
            newCard.mtgenVariant = nextAvailableVariantNum;
            newCard.mtgenId += `:${alphabet[nextAvailableVariantNum - 1]}`;
            newCard.duplicateNum = true;
            cards.set(newCard.mtgenId, newCard);
        }
        return cards;
    }

    // ------------------------------------------------------------------------------------------------------------------------------------------------------
    // Allows missing cards to be fetched directly from Wizards.
    async _getCardFromWizardsGatherer(cardName) {
        const lowerCaseCardName = cardName.trim().toLowerCase();
        const queryStringCardName = lowerCaseCardName.split(' ').reduce((final, curr) => `${final}+[${curr}]`, '');

        const searchHtml = await this._fetchHtml('http://gatherer.wizards.com/Pages/Search/Default.aspx?name=' + queryStringCardName);

        const parser = new DOMParser();
        const resultDoc = parser.parseFromString(searchHtml, "text/html");

        // The search could return multiple results OR the final single-card page if there's only one match.
        let cardDoc;

        // If we got multiple results, find the best entry and fetch that multiverse page.
        const cardTitleEls = resultDoc.querySelectorAll('.cardTitle a');
        if (cardTitleEls.length > 0) {
            // Find the entry with a title matching exactly our desired cardName.
            window.dispatchEvent(new CustomEvent('searching-gatherer-for-card', { detail: { cardName: cardName } }));

            console.log(`Searching for '${cardName}' in ${cardTitleEls.length} search results`);
            const matchingCardTitleEl = Array.from(cardTitleEls).find(el => el.textContent.trim().toLowerCase() === lowerCaseCardName);
            if (!matchingCardTitleEl) { throw new Error(`Cannot find card '${cardName}' from Gatherer`); }

            // Get the multiverseId for that card.
            if (matchingCardTitleEl.href === undefined) { throw new Error(`Cannot find href/multiverseId for card '${cardName}' from Gatherer`); }

            const multiverseIdParts = matchingCardTitleEl.href.split('=');
            if (multiverseIdParts.length < 2) { throw new Error(`Cannot find multiverseId for card '${cardName}' from Gatherer`); }

            const multiverseId = multiverseIdParts[1];

            // Fetch the single-card page for that multiverseId.
            const cardHtml = await this._fetchHtml('http://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=' + multiverseId);

            const parser = new DOMParser();
            cardDoc = parser.parseFromString(cardHtml, "text/html");
        }
        else {
            cardDoc = resultDoc;
        }

        const card = await this._getCardFromWizardsGathererCardDoc(cardDoc, cardName);

        return card;
    }

    async _getCardFromWizardsGathererCardDoc(cardDoc, cardName) {
        let card = {};

        const cardData = cardDoc.querySelector('.cardDetails');

        if (!cardData) { throw new Error(`Cannot find card '${cardName}' from Gatherer`); }

        const titleEl = cardData.querySelector('[id$=_nameRow] .value');
        if (!titleEl) { throw new Error(`Cannot find title for '${cardName}' card from Gatherer`); }
        card.title = titleEl.textContent.trim();
        card.matchTitle = mtgGen.createMatchTitle(card.title); // used for matching MtG Salvation vs. WotC titles and card titles vs. exception titles

        const imgEl = cardData.querySelector('.cardImage img');
        if (!imgEl) { throw new Error(`Cannot find img for '${cardName}' card from Gatherer`); }
        const imgQuerystring = imgEl.src.split('?')[1];
        card.src = `http://gatherer.wizards.com/Handlers/Image.ashx?${imgQuerystring}`;
        card.imageSource = "wizards-gatherer";

        const manaImgs = cardDoc.querySelectorAll('.manaRow .value img');
        if (manaImgs.length === 0) {
            console.log(`WARNING: Cannot find mana for '${cardName}' card from Gatherer`);
        }
        else {
            // These are stored in a set of images, one per symbol
            card.cost = Array.from(manaImgs).map(manaImg => {
                const manaType = manaImg.attributes['alt'].value.trim().toLowerCase();
                switch (manaType) {
                    case 'white': return 'W'; break;
                    case 'blue': return 'U'; break;
                    case 'red': return 'R'; break;
                    case 'black': return 'B'; break;
                    case 'green': return 'G'; break;
                    case 'multicolored': return 'M'; break;
                    case 'variable colorless': return 'C'; break;
                    default:
                        const num = parseInt(manaType, 10);
                        if (isNaN(num)) { console.log(`WARNING: unknown mana type: ${manaType}`); };
                        return manaType;
                        break;
                }
            }).join('');
        }

        const rarityEl = cardDoc.querySelector('[id$=_rarityRow] .value');
        if (!rarityEl) { throw new Error(`Cannot find rarity for '${cardName}' card from Gatherer`); }
        card.rarity = rarityEl.textContent.trim().toLowerCase();

        const typeEl = cardDoc.querySelector('[id$=_typeRow] .value');
        if (!typeEl) { throw new Error(`Cannot find type for '${cardName}' card from Gatherer`); }
        const types = typeEl.textContent.split(' — ');
        card.type = types[0].trim();
        if (types.length > 1) {
            card.subtype = types[1].trim();
        }

        // derived from casting cost
        card.colour = this._getCardColourFromCard(card);

        const ptEl = cardDoc.querySelector('[id$=_ptRow] .value');
        if (ptEl) {
            const pts = ptEl.textContent.split('/');
            if (pts.length > 1) {
                card.power = pts[0].trim();
                card.toughness = pts[1].trim();
            }
            else if (pts.length == 1) {
                card.loyalty = pts[0].trim(); // must be a planeswalker
            }
            // otherwise it's something without power/toughness|loytlty, i.e.: land, spell, etc
        }

        const cardNumEl = cardDoc.querySelector("[id$=_numberRow] .value");
        if (!cardNumEl) {
            console.log(`WARNING: Cannot find card num for '${cardName}' card from Gatherer`);
        }
        else {
            card.num = cardNumEl.textContent.trim();
        }

        return card;
    }

    // ------------------------------------------------------------------------------------------------------------------------------------------------------
    _getCardsFromMtgSalvationData(rawCardData, setCode) {
        let cards = new Map();

        // get all MtgSalvation cards
        const parser = new DOMParser();
        const cardDoc = parser.parseFromString(rawCardData, "text/html");

        const cardsData = cardDoc.querySelectorAll('.t-spoiler-wrapper');
        if (cardsData.length === 0) {
            alert("No cards from MtG Salvation cards found. Note that you CANNOT run this thing locally. It won't work. It needs to run through the proxy to work.");
        }
        cardsData.forEach(cardEl => {
            const card = { set: setCode };

            const title = cardEl.querySelector('h2');
            if (title) {
                card.title = title.textContent.trim();
                card.matchTitle = mtgGen.createMatchTitle(card.title); // used for matching MtG Salvation vs. WotC titles and card titles vs. exception titles
            }

            const img = cardEl.querySelector('.spoiler-card-img img');
            if (img) {
                card.src = img.src;
                card.imageSource = "mtg-salvation";
                // from GatheringMagic version, but don't know what this looks like under this site
                //if (el.hasClass('wm-day') || el.hasClass('wm-night')) { // Double-Faced card
                //    card.width = 536;
                //}
            }

            const mana = cardEl.querySelector('.t-spoiler-mana');
            if (mana) {
                card.cost = mana.textContent.replace(/ /g, '').replace(/\n/g, '');
            }

            const rarity = cardEl.querySelector('.t-spoiler-header');
            if (rarity) {
                if (rarity.classList.length > 1) {
                    card.rarity = rarity.classList[1][0].toLowerCase();
                }
            }

            const type = cardEl.querySelector('.t-spoiler-type');
            if (type) {
                const types = type.textContent.split(' - ');
                card.type = types[0].trim();
                if (types.length > 1) {
                    card.subtype = types[1].trim();
                }
            }

            const pt = cardEl.querySelector(".t-spoiler-stat");
            if (pt) {
                const pts = pt.textContent.split('/');
                if (pts.length > 1) {
                    card.power = pts[0].trim();
                    card.toughness = pts[1].trim();
                }
                else if (pts.length === 1) {
                    card.loyalty = pts[0].replace('[', '').replace(']', '').trim(); // must be a planeswalker
                }
                // otherwise it's something without power/toughness|loytlty, i.e.: land, spell, etc
            }

            const colour = cardEl.querySelector('.t-spoiler');
            if (colour) {
                const className = [...colour.classList].find(className => className.includes('card-color-'));
                if (className) {
                    const cardColour = className.replace('card-color-', '');
                    if (cardColour.length > 0) {
                        switch (cardColour.trim().toLowerCase()) {
                            case "white": card.colour = "w"; break;
                            case "blue": card.colour = "u"; break;
                            case "red": card.colour = "r"; break;
                            case "black": card.colour = "b"; break;
                            case "green": card.colour = "g"; break;
                            case "multicolored": card.colour = "m"; break;
                            case "hybrid": card.colour = "m"; break; // ie: the split mana symbols, eg: Burning-Tree Emissary
                            case "colorless": card.colour = "c"; break;
                            default:
                                console.log(`WARNING: unknown card colour: ${cardColour}`);
                                break;
                        }
                    }
                }
            }

            // derived from casting cost
            card.colour = this._getCardColourFromCard(card);

            const cnum = cardEl.querySelector('.t-spoiler-artist');
            if (cnum) {
                let cnums = cnum.textContent.split('#');
                if (cnums.length > 1) {
                    cnums = cnums[1].split('/');
                    card.num = cnums[0].trim().padStart(4, "0");
                }
            }

            // NOTE: haven't imported clans from this site, so I'm not sure what the format is. Old GatheringMagic version supported it.

            cards = this._addCardToCards(cards, card);
        });

        return cards;
    }

    // ------------------------------------------------------------------------------------------------------------------------------------------------------
    _getCardsFromMtgJsonData(rawCardData, setCode) {
        let cards = new Map();

        rawCardData = JSON.parse(rawCardData);

        if (rawCardData === undefined || !rawCardData.hasOwnProperty('cards')) {
            alert("Missing card data from mtgjson.com. Note that you CANNOT run this thing locally. It won't work. It needs to run through the proxy to work.");
        }
        if (rawCardData.cards.length < 1) {
            alert("No cards from mtgjson.com found. Note that you CANNOT run this thing locally. It won't work. It needs to run through the proxy to work.");
        }

        // add each card, converting from mtgjson.com's format to our own
        rawCardData.cards.forEach(card => {
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
            card.colour = this._getCardColourFromCard(card);
            card.num = card.number;
            card.src = `http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.multiverseid}&type=card`;
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

            cards = this._addCardToCards(cards, card);
        });

        return cards;
    }

    // ------------------------------------------------------------------------------------------------------------------------------------------------------
    _getImageData(imageData, imageDataUrlSource) {
        let images = new Map();

        // Determine from where the image data was sourced and therefore the parser needed.
        const lowercaseImageDataUrlSource = imageDataUrlSource.toLowerCase();
        if (lowercaseImageDataUrlSource.includes('magic.wizards.com')) {
            images = this._getImagesFromWotcSpoilers(imageData);
        }
        else if (lowercaseImageDataUrlSource.includes('archive.wizards.com')) {
            images = this._getImagesFromWotcArchive(imageData);
        }
        else if (lowercaseImageDataUrlSource.includes('mtgjson.com')) {
            images = this._getImagesFromMtgJsonData(imageData);
        }
        else if (lowercaseImageDataUrlSource.includes('cardsmain.json')) {
            images = this._getImagesFromCardsMainData(imageData);
        }
        else {
            alert(`Image data url unknown. Only magic.wizards.com, gatheringmagic.com, and cardsMain.json supported. '${htmlImages.urlSource}'`);
        }

        return images;
    }

    _getImagesFromWotcSpoilers(rawHtmlImageData) {
        const finalImages = new Map();

        const parser = new DOMParser();
        const imageDoc = parser.parseFromString(rawHtmlImageData, "text/html");

        // v6 - 20160307, soi gallery
        if (!finalImages.size) {
            const rawimages = imageDoc.querySelectorAll('#content-detail-page-of-an-article .rtecenter img, #content-detail-page-of-an-article .legacy_content img');
            rawimages.forEach(img => {
                if (img.alt.length) {
                    const image = {
                        title: img.alt.trim(),
                        src: img.src
                    };
                    image.matchTitle = mtgGen.createMatchTitle(image.title);

                    // Support for double-faced cards.
                    const parent = img.parentElement;
                    if (parent.classList.contains('side')) {
                        if (parent.classList.contains('front')) {
                            const backCard = parent.parentElement.querySelector(".side.back img");
                            if (backCard) {
                                image.matchTitleBack = mtgGen.createMatchTitle(backCard.alt);
                                image.doubleFaceCard = true;
                            }
                        }
                        else if (parent.classList.contains('back')) {
                            const frontCard = parent.parentElement.querySelector(".side.front img");
                            if (frontCard) {
                                image.matchTitleFront = mtgGen.createMatchTitle(frontCard.alt);
                                image.doubleFaceCard = true;
                            }
                        }
                    }

                    finalImages.set(image.matchTitle, image);
                }
            });
        }

        // Left in for now -- if we need them one day again, convert them to es6.
        //// v5 - 20160101, bfz gallery
        //if (finalImages.length < 1) {
        //    var $rawimages = $images.find('#content img');
        //    if ($rawimages.length > 0) {
        //        var $imageContainer, $cardTitle;
        //        for (var i = 0; i < $rawimages.length; i++) {
        //            var img = $rawimages[i];
        //            $imageContainer = $(img).parent();
        //            $cardTitle = $imageContainer.find("i");
        //            if ($cardTitle.length === 1) {
        //                image = {};
        //                image.title = $cardTitle.text().trim();
        //                image.matchTitle = mtgGen.createMatchTitle(image.title);
        //                image.src = img.src;
        //                finalImages[image.matchTitle] = image;
        //            }
        //        }
        //    }
        //}

        //// v4 - 20150305, dtk gallery -- hard to scan as anything unique is added by js
        //if (finalImages.length < 1) {
        //    var $rawimages = $images.find('#content-detail-page-of-an-article img');
        //    if ($rawimages.length > 0) {
        //        var $imageContainer, $cardTitle;
        //        $rawimages.each(function (index, img) {
        //            $imageContainer = $(img).parent();
        //            $cardTitle = $imageContainer.find("i");
        //            if ($cardTitle.length === 1) {
        //                image = {};
        //                image.title = $cardTitle.text().trim();
        //                image.matchTitle = mtgGen.createMatchTitle(image.title);
        //                image.src = img.src;
        //                finalImages[image.matchTitle] = image;
        //            }
        //        });
        //    }
        //}

        //// v3 - 20140901, ktk gallery -- hard to scan as anything unique is added by js
        //if (finalImages.length < 1) {
        //    var $rawimages = $images.find('img.noborder');
        //    if ($rawimages.length > 0) {
        //        var $imageContainer, $cardTitle;
        //        $rawimages.each(function (index, img) {
        //            $imageContainer = $(img).parent();
        //            $cardTitle = $imageContainer.find("i");
        //            if ($cardTitle.length === 1) {
        //                image = {};
        //                image.title = $cardTitle.text().trim();
        //                image.matchTitle = mtgGen.createMatchTitle(image.title);
        //                image.src = img.src;
        //                finalImages[image.matchTitle] = image;
        //            }
        //        });
        //    }
        //}

        //// v2 - 2014 site redesign, m15 gallery
        //if (finalImages.length < 1) {
        //    $rawimages = $images.find('.advanced-card-gallery-container img[alt]');
        //    if ($rawimages.length > 0) {
        //        $rawimages.each(function (index, value) {
        //            image = {};
        //            image.title = value.alt.trim();
        //            image.matchTitle = mtgGen.createMatchTitle(image.title);
        //            image.src = value.src;
        //            finalImages[image.matchTitle] = image;
        //        });
        //    }
        //}

        //// v1 - original wotc site
        //if (finalImages.length < 1) {
        //    var $rawimages = $images.find('img[alt].article-image');
        //    if ($rawimages.length > 0) {
        //        $rawimages.each(function (index, value) {
        //            image = {};
        //            image.title = value.alt.trim();
        //            image.matchTitle = mtgGen.createMatchTitle(image.title);
        //            image.src = value.src;
        //            finalImages[image.matchTitle] = image;
        //        });
        //    }
        //}

        finalImages.forEach(image => image.imageSource = "wotc-spoilers");

        return finalImages;
    }

    // 20170218: I don't think any of these pages exist anymore, so this may be useless.
    _getImagesFromWotcArchive(rawHtmlImageData) {
        const finalImages = [];

        const parser = new DOMParser();
        const imageDoc = parser.parseFromString(rawHtmlImageData, "text/html");

        const rawimages = imageDoc.querySelectorAll('.article-image');
        rawimages.forEach(img => {
            const enLoc = img.src.indexOf('/EN/');
            if (enLoc > -1) {
                const imgNum = img.src.substr(enLoc + 4, 4);
                const num = parseInt(imgNum);
                if (!isNaN(num)) {
                    const image = {};
                    image.src = img.src;
                    const thisHostStartIndex = image.src.indexOf("/mtg/images/");
                    if (thisHostStartIndex > 0) {
                        image.src = `http://archive.wizards.com${image.src.substr(thisHostStartIndex)}`;
                    }
                    image.num = num;
                    finalImages[image.num] = image;
                }
            }
        });

        finalImages.forEach(image => image.imageSource = "wotc-archive");

        return finalImages;
    }

    _getImagesFromMtgJsonData(rawImageData) {
        const finalImages = new Map()

        const imageData = JSON.parse(rawImageData);

        if (imageData === undefined || !imageData.hasOwnProperty('cards')) {
            alert("Missing card data from mtgjson.com. Note that you CANNOT run this thing locally. It won't work. It needs to run through the proxy to work.");
        }
        if (imageData.cards.length < 1) {
            alert("No cards from mtgjson.com found. Note that you CANNOT run this thing locally. It won't work. It needs to run through the proxy to work.");
        }

        // add each card, converting from mtgjson.com's format to our own
        imageData.cards.forEach(card => {
            const image = {};
            image.title = card.name;
            image.matchTitle = mtgGen.createMatchTitle(image.title);
            image.src = `http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.multiverseid}&type=card`;
            image.imageSource = "mtgjson";
            finalImages.set(image.matchTitle, image);
        });

        return finalImages;
    }

    _getImagesFromCardsMainData(rawImageData) {
        const finalImages = new Map();

        const imageData = JSON.parse(rawImageData);

        if (imageData === undefined) {
            alert("Missing image data from cardsMain.json. Note that you CANNOT run this thing locally. It won't work. It needs to run through the proxy to work.");
            return finalImages;
        }
        if (imageData.length < 1) {
            alert("No images from mtgjson.com found. Note that you CANNOT run this thing locally. It won't work. It needs to run through the proxy to work.");
            return finalImages;
        }

        imageData.forEach(card => {
            const image = {};
            image.title = card.title;
            image.matchTitle = mtgGen.createMatchTitle(image.title);
            image.src = card.src;
            image.imageSource = "cardsMain.json";
            finalImages.set(image.matchTitle, image);
        });

        return finalImages;
    }

    _preloadImage(path) {
        return new Promise((resolve, reject) => {
            // Create a new image from JavaScript
            const image = new Image();
            // Bind an event listener on the load to call the `resolve` function
            image.onload = resolve;
            // If the image fails to be downloaded, we don't want the whole system
            // to collapse so we `resolve` instead of `reject`, even on error
            image.onerror = resolve;
            // Apply the path as `src` to the image so that the browser fetches it
            image.src = path;
        });
    }

    //CAMKILL: replaced with async version below
    //_getCardImagesFromWotcArticle(rawHtmlImageData, requiredImageWidth, requiredImageHeight) {
    //    return new Promise(resolve => {
    //        let finalImages = [];

    //        const parser = new DOMParser();
    //        const imageDoc = parser.parseFromString(rawHtmlImageData, "text/html");

    //        // v1 - 20150914, bfz gallery -- hard to scan as anything unique is added by js
    //        const content = imageDoc.querySelector('#content');
    //        const rawImages = imageDoc.querySelectorAll('#content img');
    //        if (rawImages) {
    //            // Preload the images so we get the heights and widths.
    //            // This wasn't necessary under jQuery because I assume it rendered the HTML hidden in the browser.
    //            const imagePromises = [...rawImages].map(rawImage => this._preloadImage(rawImage.src));
    //            Promise.all(imagePromises)
    //                .then(images => {
    //                    const requiredImageHeightInt = parseInt(requiredImageHeight, 10);
    //                    const requiredImageWidthInt = parseInt(requiredImageWidth, 10);
    //                    images.forEach(event => {
    //                        const img = event.target;
    //                        if (!isNaN(requiredImageHeightInt) && requiredImageHeightInt !== img.height) { return true; }
    //                        if (!isNaN(requiredImageWidthInt) && requiredImageWidthInt !== img.width) { return true; }
    //                        const image = {};
    //                        image.src = img.src;
    //                        image.height = img.height;
    //                        image.width = img.width;
    //                        image.imageSource = "wotc-article";
    //                        finalImages.push(image);
    //                    });

    //                    resolve(finalImages);
    //                })
    //                .catch(err => alert(`ERROR: failed to retrieve image: ${err.message}`));
    //        }
    //    });
    //}

    async _getCardImagesFromWotcArticle(rawHtmlImageData, requiredImageWidth, requiredImageHeight) {
        const parser = new DOMParser();
        const imageDoc = parser.parseFromString(rawHtmlImageData, "text/html");

        // v1 - 20150914, bfz gallery -- hard to scan as anything unique is added by js
        const content = imageDoc.querySelector('#content');
        const rawImages = imageDoc.querySelectorAll('#content img');
        if (rawImages) {
            // Preload the images so we get the heights and widths.
            // This wasn't necessary under jQuery because I assume it rendered the HTML hidden in the browser.
            const imagePromises = [...rawImages].map(rawImage => this._preloadImage(rawImage.src));
            let images;
            try {
                images = await Promise.all(imagePromises);
            }
            catch (err) { alert(`ERROR: failed to retrieve image: ${err.message}`); }

            let finalImages = []
            const requiredImageHeightInt = parseInt(requiredImageHeight, 10);
            const requiredImageWidthInt = parseInt(requiredImageWidth, 10);
            images.forEach(event => {
                const img = event.target;
                if (!isNaN(requiredImageHeightInt) && requiredImageHeightInt !== img.height) { return true; }
                if (!isNaN(requiredImageWidthInt) && requiredImageWidthInt !== img.width) { return true; }
                const image = {};
                image.src = img.src;
                image.height = img.height;
                image.width = img.width;
                image.imageSource = "wotc-article";
                finalImages.push(image);
            });

            return finalImages;
        }
    }

    _createCardViaException(card, exception, setCode) {
        // add all Exception properties into the card
        Object.assign(card, exception.newValues);
        exception.result.affectedCards = 1;

        // Replace any 'reference' properties with the current card values,
        // e.g.: "originalTitle": "{{title}}",
        const replacementTokenRegex = /{{(.*?)}}/g;
        const replacementReferenceValues = {};
        Object.entries(card).forEach(entry => {
            const propName = entry[0];
            const propValue = entry[1];
            let token;
            while ((token = replacementTokenRegex.exec(propValue)) !== null) {
                const tokenPropName = token[1];
                let newPropValue;
                if (card[tokenPropName] !== undefined) {
                    newPropValue = newPropValue.replace(token[0], card[tokenPropName]);
                }
                else if (tokenPropName === 'setCode') {
                    newPropValue = setCode;
                }
                card[propName] = newPropValue;
            }
        });

        // Apply new values from exception.
        Object.assign(card, replacementReferenceValues);

        card.matchTitle = mtgGen.createMatchTitle(card.title);

        card.addedViaException = true;

        return card;
    }

    _mapToObject(map) {
        let obj = Object.create(null);
        for (let [k, v] of map) {
            // We don’t escape the key '__proto__'
            // which can cause problems on older engines
            obj[k] = v;
        }
        return obj;
    }

    _objectToMap(obj) {
        let map = new Map();
        for (let k of Object.keys(obj)) {
            map.set(k, obj[k]);
        }
        return map;
    }

    async _applyExceptions(cards, exceptions, setCode) {
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
        //      _comment: "This will fetch the card data directly from Wizards Gatherer and then modify it",
        //      where: "gatherer='Serra Angel'",
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
        //    "add": true,
        //    "newValues": {
        //        "title": "Black Vise",
        //        "src": "http://media.wizards.com/2016/c1lRLirbrl_AER/en_L1UZqii5Ve.png",
        //        "cost": "1",
        //        "type": "Artifact",
        //        "colour": "a",
        //        "num": "032"
        //    }
        //  }

        // Set all cards to have .isSelected=false (which will be removed at the end).
        // This allows the exception file to include { delete: true, where: isSelected=false},
        // i.e.: delete all cards I didn't touch. This is a very common use case where
        // specialized subsets of cards from a large card data set (like the promos out of the main cards)
        // need to be plucked out, but it's hard to say "delete everything I didn't select".
        cards.forEach(c => c.isSelected = false);

        let index = 0;
        for (const exception of exceptions) {
            if (Object.keys(exception).length === 1 && (exception._comments || exception._comment)) {
                exception.comment = true;
                continue; // just a comment node; ignore
            }

            exception.result = { index: index, success: true };

            if (exception.add === true) {
                if (!exception.newValues) {
                    exception.result.success = false;
                    exception.result.error = "add=true but missing required newValues {}; cannot continue processing this exception";
                    continue;
                }
                if (!exception.newValues.title) {
                    exception.result.success = false;
                    exception.result.error = "add=true but missing required newValues.title; cannot continue processing this exception";
                    continue;
                }

                console.log(`Adding new card: ${exception.newValues.title}`);

                const card = this._createCardViaException({}, exception, setCode);

                cards = this._addCardToCards(cards, card);

                continue;
            }

            if (exception.where === undefined) {
                exception.result.success = false;
                exception.result.error = "missing required where clause; cannot continue processing this exception";
                continue;
            }

            const cardsObj = this._mapToObject(cards);

            // If it's a Wizards Gatherer search, do that.
            let matchingCardsObj;
            const gathererTitle = exception.where.match(/^\s*gatherer\s*=\s*'([^']*)'?\s*$/);
            if (gathererTitle) {
                try {
                    matchingCardsObj = [await this._getCardFromWizardsGatherer(gathererTitle[1])];
                }
                catch (e) {
                    exception.result.success = false;
                    exception.result.error = e.message;
                    console.log(e);
                    continue;
                }
            }
            else {
                // Add the from[*] the query engine expects.
                // The card importer works on a single set at a time, so from[*] is always implied,
                // but we don't require it in the import json for convenience.
                let where = exception.where.trim();
                if (!where.toLowerCase().includes("from[")) {
                    where = `from[*]?${where}`;
                }

                matchingCardsObj = mtgGen.executeQuery(cardsObj, null, where);
            }
            const matchingCards = this._objectToMap(matchingCardsObj);
            const matchingCardArray = [...matchingCards.values()];

            // If it's a Delete exception, delete any cards matching the query.
            if (exception.delete === true) {
                matchingCardArray.forEach(matchingCard => {
                    if (matchingCard) { cards.delete(matchingCard.mtgenId); }
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
            matchingCardArray.forEach(matchingCard => {
                if (matchingCard) { cards.delete(matchingCard.mtgenId); }
            });

            // If there were no matching cards for this update, try to get those cards from Gatherer.
            // This was basically built for Masterpiece cards that may be reprints of old cards.

            // TODO: This does NOT work. getCardFromWizardsGatherer is async, completely messing up this loop.
            //       Try again in six months when es2017 is out.
            //// Get a list of all title queries that didn't match anything.
            //// TODO: Refactor mtg-generator.lib.js/executeSimpleQuery() to PARSE out the query and execute separately.
            ////       Then, here, I can use it to parse the where and easily determine if it's a title query and the matchtitle.
            //var unmatchedTitles = [];
            //if (exception.result.success === true && matchingCards.length === 0 && exception.where.indexOf("title=") > -1) {
            //    var titleMatch = /title=['"](.*)/i.exec(exception.where);
            //    if (titleMatch.length < 2 || titleMatch[1].trim().length === 0) {
            //        console.warn("WARNING: Could not find card but where clause title is not in recognizable format: " + exception.where);
            //    }
            //    else {
            //        var matchTitle = mtgGen.createMatchTitle(titleMatch[1]);
            //        unmatchedTitles.push(matchTitle);
            //        getCardFromWizardsGatherer(matchTitle, setCode)
            //            .then(function (card) {
            //                var newCard = createCardViaException(card, exception, setCode);
            //                cards = addCardToCards(cards, newCard);
            //                console.log("Could not find card in original data, so fetched it from Wizards' Gatherer: " + matchTitle);;
            //            })
            //            .catch(function (err) {
            //                console.warn(`WARNING: could not retrieve card '${matchTitle}' from Wizards' Gatherer: ${err} `);
            //            });
            //        console.warn("Could not find card; going to search for title = " + matchTitle);
            //    }
            //}

            const replacementTokenRegex = /{{(.*?)}}/g;

            // Apply the changes to all of the matching cards.
            matchingCardArray.forEach(card => {
                // Replace any 'reference' properties with the current card values,
                // e.g.: "originalTitle": "{{title}}",
                // TODO: this code is repeated twice.. make it into a function
                const replacementReferenceValues = {};
                for (let prop in exception.newValues) {
                    const propValue = exception.newValues[prop];
                    let newPropValue = propValue;
                    let token;
                    while ((token = replacementTokenRegex.exec(propValue)) !== null) {
                        const propName = token[1];
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
                Object.assign(card, exception.newValues);
                Object.assign(card, replacementReferenceValues);

                card.matchTitle = mtgGen.createMatchTitle(card.title);

                // Mark it as .isSelected=true to allow the exceptions file to delete all that WEREN'T selected.
                card.isSelected = true;
            });
            exception.result.modifiedCards = matchingCards;
            exception.result.affectedCards = matchingCards.length;

            // Add the modified cards back in.
            matchingCardArray.forEach(matchingCard => cards = this._addCardToCards(cards, matchingCard));

            index++;
        }

        // Remove our temporary .isSelected property.
        cards.forEach(c => delete c.isSelected);

        // Return both the updated set of cards AND the modified exceptions (the latter for reporitng purposes).
        const result = { cards, exceptions };

        return result;
    }

    _applyImagesToCards(cards, images) {
        const cardArray = [...cards.values()];

        if (images) {
            // Indexed for double-faced cards.
            const cardsByMatchTitle = new Map();
            cardArray.forEach(card => cardsByMatchTitle.set(card.matchTitle, card));

            cardArray.forEach(card => {
                // images[card.num]: archive.wizards.com images have no titles; they're indexed by image
                const image = images.get(card.matchTitle) || images.get(card.num);

                if (!image) { return; }

                card.srcOriginal = card.src;
                card.imageSourceOriginal = card.src;
                card.src = image.src;
                card.imageSource = image.imageSource;

                // Properties for double-sided images
                if (image.doubleFaceCard) { card.doubleFaceCard = image.doubleFaceCard; }
                if (image.matchTitleFront) {
                    const cardFront = cardsByMatchTitle.get(image.matchTitleFront);
                    if (cardFront) {
                        card.mtgenIdFront = cardFront.mtgenId;
                        card.doubleFaceBackCard = true;
                    }
                }
                if (image.matchTitleBack) {
                    const cardBack = cardsByMatchTitle.get(image.matchTitleBack);
                    if (cardBack) {
                        card.mtgenIdBack = cardBack.mtgenId;
                        card.doubleFaceFrontCard = true;
                    }
                }

                image.wasUsed = true;
            });
        }

        // if no image found at all at this point, create replacement card
        cardArray.forEach(card => {
            if (!card.src) {
                card.imageSource = "placeholder";
                card.src = this._createPlaceholderCardSrc(card);
            }
            cards.set(card.mtgenId, card);
        });

        return cards;
    }

    _createPlaceholderCardSrc(card) {
        let cardBgColour = "cccccc";
        let cardTextColour = "969696";
        switch (card.colour) {
            case 'w': cardBgColour = 'e9e5da'; break;
            case 'u': cardBgColour = 'cddfed'; break;
            case 'b': cardBgColour = '000000'; cardTextColour = 'ffffff'; break;
            case 'r': cardBgColour = 'f6d1be'; break;
            case 'g': cardBgColour = 'c7d4ca'; break;
        }
        return `holder.js/265x370?bg=${cardBgColour}&fg=${cardTextColour}&text=${this._cardTitleUrl(card.title, 500)}`;
    }
}