/*
Generates card generation statements from input websites.
Typically used for tokens, land, and other cards listed on the wotc site in articles where the cards are missing titles.

Takes a specific text pattern as input to indicate which images we want and what they are.

3-Jun-2017: Now accepts x15 to skip 15 cards, upgraded to be more promise-centric, and showed critical errors on the web page.
27-Feb-2017: Pulled out of card-data-importer.js

Relies on methods within card-data-importer.js
*/
class CardExceptionGenerator extends CardDataImporter {

    // PUBLIC METHODS ------------------------------------------------------------------------------------

    loadImagesAndGenerateExceptions({ cardImageUrl, startingCardNum, requiredImageWidth,
        requiredImageHeight, cardPattern, setCode }) {

        return new Promise(resolve => {
            if (!cardImageUrl) { throw new Error("No card image url supplied. Cannot continue."); }
            if (!cardPattern) { throw new Error("No card pattern supplied. Cannot continue."); }

            window.dispatchEvent(new Event('data-loading'));

            return this._fetchHtml(cardImageUrl)
                .then(imageData => {
                    window.dispatchEvent(new Event('data-loaded'));
                    return this._getCardImagesFromWotcArticle(imageData, requiredImageWidth, requiredImageHeight);
                })
                .then(cardImages => { return this._createOutputCards(setCode, cardImages, startingCardNum, cardPattern); })
                .then(({ cards, skippedCards }) => {
                    const outputLogPromise = this._createOutputLog(cards, skippedCards);
                    const settings = {
                        "setCode": setCode,
                        "cardImageUrl": cardImageUrl,
                        "requiredImageWidth": requiredImageWidth,
                        "requiredImageHeight": requiredImageHeight,
                        "startingCardNum": startingCardNum,
                        "cardPattern": cardPattern
                    };
                    const finalDataPromise = this._createFinalJsonOutput(settings, cards);
                    resolve(Promise.all([outputLogPromise, finalDataPromise]));
                });
        });
    }

    // PRIVATE METHODS ------------------------------------------------------------------------------------

    _getLandTypeFromCode(code) {
        switch (code.toLowerCase()) {
            case "w": return "Plains";
            case "u": return "Island";
            case "b": return "Swamp";
            case "r": return "Mountain";
            case "g": return "Forest";
            default: return `Unknown type: ${code} -- should be one of: w u r b g`;
        }
    }

    _createOutputCards(setCode, cardImages, startingCardNum, cardPattern) {
        return new Promise(resolve => {
            // Parse the card pattern into an array.
            const overrideItems = cardPattern.replace(/(?:\r\n|\r|\n)/g, ',');
            const initialCardPatterns = overrideItems.trim().split(',');

            // Any x# pattern means "skip # cards" so we'll expand it into the correct number of entries.
            const cardPatterns = initialCardPatterns.reduce((acc, pattern) => {
                const skipMany = /^x([0-9]{1,3})?$/gi.exec(pattern);
                if (skipMany) {
                    return acc.concat([...'x'.repeat(skipMany[1])]);
                }
                else {
                    acc.push(pattern);
                    return acc;
                }
            }, []);

            // Create land cards out of each image
            let cards = new Map();
            const skippedCards = [];
            let cardNum = startingCardNum;
            const hasFixedCardNums = cardNum !== undefined && cardNum !== "";
            let cardPatternIndex = 0;
            cards.areLand = false;
            cards.areTokens = false;
            let noMorePatterns = false;

            cardImages.forEach((image, index) => {
                const card = { set: setCode };

                Object.assign(card, image); // src, height, width, imageSource

                // If overrides exist, use the entire pattern given, e.g.: w250,u251,b252,r253,g254 etc -- or x to skip a card
                let skipCard = false;
                if (cardPatterns.length <= cardPatternIndex) {
                    card.title = "Ran out of Card Pattern entries";
                    noMorePatterns = true;
                }
                else {
                    // Determine the type of pattern.
                    const pattern = cardPatterns[cardPatternIndex].trim();

                    // x = skip a card
                    const skip = pattern === 'x';
                    const add = /a([0-9]{3})/gi.exec(pattern);
                    if (skip) {
                        skipCard = true;
                        card.skippedCardIndex = index;
                        skippedCards.push(card);
                    }
                    // a = add the card using just the image/number
                    else if (add) {
                        card.title = 'TitlePlaceholder';
                        if (add[1]) {
                            card.num = add[1];
                        }
                    }
                    else {
                        // e.g.: g107, or just g (and it will then use the default starting number)
                        const land = /^([w|u|g|b|r])([0-9]{3})?$/gi.exec(pattern);
                        if (land) {
                            card.title = this._getLandTypeFromCode(land[1]);
                            card.num = land[2];
                            cards.areLand = true;
                        }
                        else {
                            // e.g.: 007|c|Token Artifact Creature|Thopter, or without the 007 and it'll use default starting number
                            const cardPattern = /^([0-9]{3})?\|?(.)\|(.*)$/gi.exec(pattern);
                            if (!cardPattern) {
                                card.title = `Unknown pattern: ${pattern}`;
                            }
                            else {
                                card.num = cardPattern[1];
                                card.colour = cardPattern[2];
                                var cardNames = cardPattern[3].split('|');
                                card.type = cardNames[0];
                                card.title = cardNames[1];
                                card.subtype = cardNames[1].replace(" Emblem", "");
                                if (cardNames[2]) {
                                    card.subtype = cardNames[2];
                                }
                                // ** make sure it all works for lands
                            }
                            cards.areTokens = true;
                        }
                    }
                }
                cardPatternIndex++;

                if (!skipCard && !noMorePatterns) {
                    card.matchTitle = mtgGen.createMatchTitle(card.title);

                    if (hasFixedCardNums) {
                        card.num = cardNum++;
                    }

                    cards = this._addCardToCards(cards, card);
                }
            });

            resolve({cards, skippedCards});
        });
    }

    _createOutputLog(cards, skippedCards) {
        return new Promise(resolve => {
            let out = "";
            if (cards.size < 1) {
                out += "<p>WARNING: No images found at url.</p>";
            }

            if (skippedCards.length > 0) {
                out += `<p>The following ${skippedCards.length} cards were skipped due to 'x's in your Card Patterns setting:</p><ul class='skipped-cards'>`;
                skippedCards.forEach(card => {
                    out += `<li><img src='${card.src}' height='${Math.round(card.height / 2)}' width='${Math.round(card.width / 2)}' />`;
                    out += `<p>Card #${(card.skippedCardIndex + 1)}</p></li>`;
                });
                out += "</ul>";
            }

            resolve(out);
        });
    }

    _createFinalJsonOutput(settings, cards) {
        return new Promise(resolve => {
            const finalOut = [];

            [...cards.values()].forEach(card => {
                delete card.matchTitle;
                delete card.srcOriginal;
                delete card.imageSourceOriginal;
                delete card.fixedViaException;
                delete card.imageSource;
                delete card.mtgenId;
                if (card.height === 370) { delete card.height; }
                if (card.width === 265) { delete card.width; }

                // Create the card as an exception.
                const exception = {
                    "add": true,
                    "newValues": card
                };
                finalOut.push(exception);
            });

            // If we output anything, output the final card to apply the default values to all previous Basic Lands.
            if (finalOut.length > 0) {
                if (cards.areLand) {
                    const postCard =
                    {
                        "_comment": "Set basic land defaults for above lands so we don't have to repeat them every land",
                        "where": "title=(Plains|Island|Swamp|Mountain|Forest)",
                        "newValues": {
                            "set": "{{setCode}}",
                            "height": 370,
                            "width": 265,
                            "type": "Basic Land",
                            "subtype": "{{title}}",
                            "colour": "l",
                            "cost": "",
                            "rarity": "c",
                            "num": "{{num}}/264 L"
                        }
                    };
                    finalOut.push(postCard);
                }
                else if (cards.areTokens) {
                    const postCard =
                    {
                        "where": "",
                        "newValues": {
                            "set": "{{setCode}}",
                            "rarity": "c",
                            "num": "{{num}}/012 T",
                            "token": true,
                            "usableForDeckBuilding": false
                        }
                    };
                    finalOut.push(postCard);
                }
            }

            // Sort the final output by card num.
            finalOut.sort((a, b) => {
                const aName = mtgGen.createMatchTitle(a.newValues.num);
                const bName = mtgGen.createMatchTitle(b.newValues.num);
                return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
            });

            const preCard =
                {
                    "_comment": {
                        "generatedUsing": "card-exception-generator.html",
                        "settings": settings
                    }
                };
            finalOut.unshift(preCard);

            const jsonMainStr = JSON.stringify(finalOut, null, ' ');

            let cardsHtmlSample = '';
            [...cards.values()].forEach(card =>
                cardsHtmlSample += `<div class='card'><img src='${card.src}' height='${card.height}' width='${card.width}' /><p>${card.num}:${card.title}</p></div>`
            );

            const finalData = { 
                imageDataCount: cards.size,
                cardsJson: jsonMainStr,
                cardsHtmlSample };

            resolve(finalData);
        });
    }
}