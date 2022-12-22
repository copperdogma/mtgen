/*
Generates an output mtgen deck in packs.json format.

Will attempt to iterate over the entire target page and extract all decks found.

Input:
    pack-name: The name used in packs.json/packs/packName. Can use {{title}} token to use the title (hopefully) found by the importer.
    pack-desc: The name used in packs.json/packs/packDesc. Can use {{title}} token to use the title (hopefully) found by the importer.
    url-deck-data: The URL to the web page containing the deck list(s) to be imported. e.g.: https://magic.wizards.com/en/news/feature/jumpstart-2022-booster-themes-and-card-lists
    json-def-name: The def name to query against in packs.json/packs/cards/query. e.g.: j22-main
    min-card-count: Will throw warning if this threshold is not met.
    allow-list-cards-json: (optional) If supplied, will check all card names in the deck against these cards, throwing warnings for all that don't match. e.g.: http://mtgen.net/j22/cardsMain.json


20221213: Created.

20221213 Data example from: https://magic.wizards.com/en/news/feature/jumpstart-2022-booster-themes-and-card-lists

<deck-list data-id="5XedlhLtTKjqgRtqsEaZeJ" deck-title="Vehicles" format="Limited">
<main-deck>
1 Lita, Mechanical Engineer
1 Peacewalker Colossus
1 Hotshot Mechanic
1 Imperial Recovery Unit
1 Aethershield Artificer
1 Aerial Modification
1 Kitsune Ace
1 Sanctum Gargoyle
1 Built to Last
1 Caught in the Brights
1 Giant Ox
1 Aradara Express
1 Thriving Heath
7 Plains
</main-deck>
</deck-list>
<hr />

<p class="rtecenter"><img alt="Knights Theme" src="https://media.wizards.com/2022/j22/en_95R9cA3QOc.png" /></p>

<deck-list data-id="7yPztBZ5KabvuRIqkM5EBg" deck-title="Knights" format="Limited">
<main-deck>
1 The Circle of Loyalty
1 Balan, Wandering Knight
1 Danitha Capashen, Paragon
1 Kwende, Pride of Femeref
1 Syr Alin, the Lion's Claw
1 Hero's Blade
1 Chains of Custody
1 Order of the Golden Cricket
1 Shining Armor
1 Jousting Lance
1 Benalish Honor Guard
1 Skyhunter Prowler
1 Thriving Heath
7 Plains
</main-deck>
</deck-list>
<hr />

<p class="rtecenter"><img alt="Constellation Theme" src="https://media.wizards.com/2022/j22/en_b2TEbv8hWw.png" /></p>
</deck-list>

 */
class DeckImporter {

    // PUBLIC METHODS ------------------------------------------------------------------------------------

    async loadAndProcessAllFiles({ deckDataUrl, packName, packDesc, jsonDefName, minCardCount, allowListCardsJsonUrl, preQuery, postQuery }) {
        deckDataUrl = deckDataUrl ? deckDataUrl.trim() : '';
        packName = packName ? packName.trim() : '';
        packDesc = packDesc ? packDesc.trim() : '';
        jsonDefName = jsonDefName ? jsonDefName.trim() : '';
        minCardCount = minCardCount ? minCardCount.trim() : '';
        allowListCardsJsonUrl = allowListCardsJsonUrl ? allowListCardsJsonUrl.trim() : '';
        preQuery = preQuery ? preQuery.trim() : '';
        postQuery = postQuery ? postQuery.trim() : '';

        if (deckDataUrl.length < 1) { alert('ERROR: deckDataUrl required'); }

        this._clearConsole();

        // We need deck data and we'll fetch the allow-list of cardsJsonUrl if it was supplied.
        const deckDataPromise = this._fetchHtml(deckDataUrl);
        const allowListCardsJsonUrlPromise = (allowListCardsJsonUrl.length > 1) ? this._fetchHtml(allowListCardsJsonUrl) : null;

        window.dispatchEvent(new Event('data-loading'));

        // Get all data.
        let htmlDeckData, jsonAllowListCards;
        try {
            [htmlDeckData, jsonAllowListCards] = await Promise.all([deckDataPromise, allowListCardsJsonUrlPromise]);
        }
        catch (err) {
            alert(`ERROR: failed to retrieve data from a source: ${err.message}`);
        }

        // The first result is essential
        const htmlDecks = {
            data: htmlDeckData,
            urlSource: deckDataUrl
        };

        const jsonAllowList = {
            data: JSON.parse(jsonAllowListCards),
            urlSource: allowListCardsJsonUrl
        };

        window.dispatchEvent(new Event('data-loaded'));


        // Parse deck data into decks
        const decks = await this._parseDecks(htmlDecks.data, htmlDecks.urlSource, packName, packDesc, jsonDefName, jsonAllowList.data, jsonAllowList.urlSource);

        const outputLog = await this._createOutputLog(decks, minCardCount, jsonAllowList.data, preQuery, postQuery);
        const finalData = await this._createFinalJsonOutput(decks, htmlDecks.urlSource, preQuery, postQuery);

        return [outputLog, finalData];
    }


    // PRIVATE METHODS ------------------------------------------------------------------------------------

    _clearConsole() {
        console.API;
        if (typeof console._commandLineAPI !== 'undefined') {
            console.API = console._commandLineAPI; //chrome
        } else if (typeof console._inspectorCommandLineAPI !== 'undefined') {
            console.API = console._inspectorCommandLineAPI; //Safari
        } else if (typeof console.clear !== 'undefined') {
            console.API = console;
        }
        console.API.clear();
    }

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

    // Returns true if remote file exists via an html proxy, otherwise false.
    async _htmlFileExists(url) {
        const response = await fetch(`/proxy?u=${encodeURIComponent(url)}`);

        if (!response.ok) {
            console.log(`HTML file does not exist; response = ${response} for url: ${url}`);
            return false;
        }
        const text = await response.text();
        if (text.includes('error')) {
            console.log(`HTML file does not exist; response text: ${text} for url: ${url}`);
            return false;
        }

        return true;
    }

    async _parseDecks(htmlDecksData, htmlDecksUrlSource, packName, packDesc, jsonDefName, jsonAllowListData, jsonAllowListUrlSource) {
        let decks = new Map();

        const lowercaseDeckDataUrlSource = htmlDecksUrlSource.trim().toLowerCase();

        // Determine from where the deck data was sourced and therefore the parser needed.
        if (lowercaseDeckDataUrlSource.length < 1) {
            console.log("No deck data source supplied.");
        }
        else if (lowercaseDeckDataUrlSource.includes('magic.wizards.com')) {
            decks = await this._getDecksFromWotc(htmlDecksData);
        }
        else {
            throw new Error(`Deck data url unknown. Only magic.wizards.com supported. '${cardDataUrlSource}'`);
        }

        // TODO
        // - Pack Name and Pack Description have not been implemented and are ignored for now.
        // - Turn cards into card objects and retain the count, which we need at the end

        decks.forEach(deck => {
            deck.description = deck.title;
            deck.jsonDefName = jsonDefName;
        });

        // If Allow List was provided, check each card against it, recording the result.
        if (jsonAllowListData) {
            const allowListCardMap = new Map(jsonAllowListData.map(card => [mtgGen.createMatchTitle(card.title), card]));
            const allowListCardMatchTitles = [...new Set(allowListCardMap.keys())];

            decks.forEach(deck => {
                deck.cards.forEach(card => {
                    card.hasAllowListMatch = allowListCardMap.has(card.matchTitle);
                    if (!card.hasAllowListMatch) {
                        const ld = Math.floor(card.matchTitle.length / 3); // At most a third of the title's characters can be changes when matching against other titles
                        card.closestTitles = card.matchTitle.related(ld, allowListCardMatchTitles).map(match => match.s);
                        if (card.closestTitles.length > 0) {
                            card.originalTitle = card.title;
                            card.matchTitle = card.closestTitles[0];
                            card.title = allowListCardMap.get(card.matchTitle).title;
                            console.log(`No exact match found in Allow List for '${card.originalTitle}'. Changed card title to closest match: ${card.title}`)
                        }
                        else {
                            console.log(`No close matches found in Allow List for: ${card.title}`)
                        }
                    }
                });
            });
        }

        return decks;
    }

    // Get raw deck data from Wotc HTML.
    // e.g.: https://magic.wizards.com/en/news/feature/jumpstart-2022-booster-themes-and-card-lists
    async _getDecksFromWotc(rawDeckData) {
        let decks = new Map();

        // get all Wotc decks
        const parser = new DOMParser();
        const deckDoc = parser.parseFromString(rawDeckData, "text/html");

        const decksData = deckDoc.querySelectorAll('deck-list');
        if (decksData.length === 0) {
            alert("No decks from Wotc found. Note that you CANNOT run this thing locally. It won't work. It needs to run through the proxy to work.");
        }
        decksData.forEach(deckEl => {
            const deck = { cards: new Map() };

            const titleEl = deckEl.attributes["deck-title"];
            if (titleEl) {
                deck.title = titleEl.textContent.trim();
            }

            const cardsEl = deckEl.querySelector('main-deck');

            const cards = cardsEl.textContent.split('\n').map(cardText => {
                if (cardText.trim().length < 1) return null;

                const cardTextParts = cardText.split(' ');
                const cardCount = parseInt(cardTextParts[0]);
                const cardTitle = cardTextParts.slice(1).join(' ');

                const card = {
                    count: cardCount ?? 1,
                    title: cardTitle,
                    matchTitle: mtgGen.createMatchTitle(cardTitle)
                };
                return card;
            }).filter(card => card != null);;

            cards.forEach(card => deck.cards.set(card.title, card));
            deck.cardCount = Array.from(deck.cards.values()).reduce((acc, cur) => acc + cur.count, 0);

            decks.set(deck.title, deck);
        });

        return decks;
    }

    async _createOutputLog(decks, minCardCount, jsonAllowListData) {
        let out = "";
        const deckArray = Array.from(decks.values());

        // Check decks vs minCardCount
        const decksViolatingMinCardCount = deckArray.filter(deck => deck.cardCount < minCardCount);
        if (decksViolatingMinCardCount.length > 0) {
            out += `<p style='color: DarkGoldenrod'>${decksViolatingMinCardCount.length} decks have fewer cards than supplied minCardCount (${minCardCount}):</p>`;
            out += `<ul style='color: DarkGoldenrod'>`;
            decksViolatingMinCardCount.forEach(deck => {
                out += `<li>${deck.cardCount}: ${deck.title}</li>`;
            });
            out += `</ul><br/></br>`;
        }

        // Check if any cards didn't match the Allow List (if it was supplied).
        if (jsonAllowListData) {
            let cardsUnmatchedAgainstAllowList = [];
            let matchedCount = 0;
            deckArray.forEach(deck => {
                deck.cards.forEach(card => {
                    if (card.hasAllowListMatch === false) {
                        if (card.closestTitles.length > 0) {
                            cardsUnmatchedAgainstAllowList.push(`[${deck.title}] No exact match found for '${card.originalTitle}'. Changed card title to closest match: ${card.title}`);
                        }
                        else {
                            cardsUnmatchedAgainstAllowList.push(`[${deck.title}] No close matches found: ${card.title}`);
                        }
                    }
                    if (card.hasAllowListMatch === true) {
                        matchedCount++;
                    }
                });
            });
            if (matchedCount === 0) {
                out += "<p style='color: red'>NO cards matched your supplied Allow List. You sure that's the right list?</p>";
            }
            if (matchedCount > 0) {
                out += `<p style='color: green'>${matchedCount} cards matched your supplied Allow List.</p>`;
            }
            if (cardsUnmatchedAgainstAllowList.length > 0) {
                out += `<p style='color: DarkGoldenrod'>${cardsUnmatchedAgainstAllowList.length} cards didn't match your supplied Allow List:</p>`;
                out += `<ul style='color: DarkGoldenrod'>`;
                cardsUnmatchedAgainstAllowList.forEach(cardWarning => {
                    out += `<li>${cardWarning}</li>`;
                });
                out += `</ul><br/></br>`;
            }
        }

        return out;
    }


/*
    Sample packs.json output from BRO:
    {
      "_comment": "Standard Boosters were renamed to Draft Boosters as of ELD",
      "packName": "{{setCode}}-draft",
      "packDesc": "{{setName}}: Draft Booster",
      "packVersion": "1.0",
      "sources": [ "https://magic.wizards.com/en/news/feature/whats-inside-the-brothers-war-boosters" ],
      "isGenerated": true,
      "cards": [
        { "query": "take[9]>from[{{setCode}}-main]?rarity='c" },
        { "query": "take[3]>from[{{setCode}}-main]?rarity='u" },
        { "query": "from[{{setCode}}-main-and-borderless]?rarity=rarityByWeight2020(rm)" },
        { "query": "from[{{setCode}}-retro-frame-artifacts]?rarity=rarityByWeight2020(urm)" },
        { "query": "from[{{setCode}}-basic-land]" },
      ]
    },

    Sample products.json output from SNC:
    {
      "productName": "{{setCode}}-prerelease",
      "productDesc": "Prerelease",
      "sources": [ "https://magic.wizards.com/en/articles/archive/feature/innistrad-crimson-vow-prerelease-primer-2021-11-10", "https://magic.wizards.com/en/articles/archive/feature/innistrad-crimson-vow-product-overview-2021-10-28" ],
      "isGenerated": true,
      "initialSort": "set",
      "packs": [
        { "packName": "{{setCode}}-draft" },
        { "packName": "{{setCode}}-prerelease-promo-packins-brokers" },
        { "packName": "{{setCode}}-prerelease-promo-packins-cabaretti" },
        { "packName": "{{setCode}}-prerelease-promo-packins-maestros" },
        { "packName": "{{setCode}}-prerelease-promo-packins-obscura" },
        { "packName": "{{setCode}}-prerelease-promo-packins-riveteers" },
        { "packName": "{{setCode}}-prerelease-brokers-booster" },
        { "packName": "{{setCode}}-prerelease-cabaretti-booster" },
        { "packName": "{{setCode}}-prerelease-maestros-booster" },
        { "packName": "{{setCode}}-prerelease-obscura-booster" },
        { "packName": "{{setCode}}-prerelease-riveteers-booster" }
      ],
      "options": {
        "presets": [
          {
            "presetName": "{{setCode}}-prerelease-brokers-booster",
            "presetDesc": "Brokers (Green/White/Blue)",
            "default": true,
            "packs": [
              {
                "count": 1,
                "defaultPackName": "{{setCode}}-prerelease-promo-packins-brokers"
              },
              {
                "count": 1,
                "defaultPackName": "{{setCode}}-prerelease-brokers-booster"
              },
              {
                "count": 5,
                "defaultPackName": "{{setCode}}-draft"
              }
            ]
          },
          {
            "presetName": "{{setCode}}-prerelease-cabaretti-booster",
            "presetDesc": "Cabaretti (Red/Green/White)",
            "default": false,
            "packs": [
              {
                "count": 1,
                "defaultPackName": "{{setCode}}-prerelease-promo-packins-cabaretti"
              },
              {
                "count": 1,
                "defaultPackName": "{{setCode}}-prerelease-cabaretti-booster"
              },
              {
                "count": 5,
                "defaultPackName": "{{setCode}}-draft"
              }
            ]
          }
        ]
      }
    },

    */



    async _createFinalJsonOutput(decks, htmlDecksUrlSource, preQuery, postQuery) {
        let packs = [];

        const decksArray = Array.from(decks.values());

        decksArray.forEach(deck => {
            const deckTitle = mtgGen.createMatchTitle(deck.title).replace(' ', '-');
            let pack = {
                _comment: `Created by deck-importer.html on ${new Date().toJSON().slice(0, 10)}`,
                packName: `{{setCode}}-${deckTitle}`,
                packDesc: `{{setName}}: ${deck.description}`,
                packVersion: "1.0",
                sources: [htmlDecksUrlSource],
                isGenerated: true,
                cards: []
            };

            if (preQuery && preQuery.length > 0) {
                pack.cards.push({ query: preQuery.replace('{{deckTitle}}', deck.title).replace('{{deckDesc}}', deck.description)});
            }

            deck.cards.forEach(card => {
                const jsonTitle = card.title.replace("'", "’");
                if (card.count > 1) {
                    pack.cards.push({ query: `take[${card.count}]>from[{{setCode}}-main]?title='${jsonTitle}'` });
                }
                else {
                    pack.cards.push({ query: `from[{{setCode}}-main]?title='${jsonTitle}'` });
                }
            });

            if (postQuery && postQuery.length > 0) {
                pack.cards.push({ query: postQuery.replace('{{deckTitle}}', deck.title).replace('{{deckDesc}}', deck.description) });
            }

            packs.push(pack);
        });

        const packsJson = JSON.stringify(packs, null, ' ');


    /* what is initialSort? What other values are possible? */
        const packNames = packs.map(pack => pack.packName);
        const product = {
            _comment: `Created by deck-importer.html on ${new Date().toJSON().slice(0, 10)}`,
            productName: `{{setCode}}-PRODUCTNAME`,
            productDesc: `PRODUCTDESCRIPTION`,
            sources: [htmlDecksUrlSource],
            isGenerated: true,
            initialSort: "set",
            packs: packNames
        };

        const productsJson = JSON.stringify(product, null, ' ');


        const finalData = {
            packsJson: packsJson,
            productsJson: productsJson,
            deckCount: decks.size,
            totalCardCount: decksArray.reduce((acc, deck) => acc + deck.cardCount, 0)
        };

        return finalData;
    }
}