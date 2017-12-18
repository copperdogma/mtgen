/*
MtGenerator Data class v1.0

Author: Cam Marsollier cam.marsollier@gmail.com

12-Jul-2017: Created.
*/

class MtgenData {
    constructor(setCode, setCardCount) {
        // If missing any essentials, abort
        if (setCode == null) { throw new Error(`Missing setCode. Cannot continue.`); }
        if (setCardCount == null) { throw new Error(`Missing setCardCount. Cannot continue.`); }

        this.version = "v1.0.0";

        this.setCode = setCode;
        this.setCardCount = setCardCount;
        this.setCardsLoadedCount = 0;
        this.sets = new Map();
        this.cards = new Map();
        this.products = new Map();
        this.defs = new Map();
        this.packs = new Map();

        this._currentProductName;
        this.currentProduct;
    }

    set currentProductName(name) {
        this._currentProductName = name.trim().toLowerCase();
        this.currentProduct = this.products.get(this._currentProductName);
        if (this.currentProduct === undefined) { throw new Error('Unknown product name: ' + this._currentProductName); }
    }
    get currentProductName() { return this._currentProductName; }

    async loadAll(setFile, cardFiles, packFiles, productFile) {
        window.dispatchEvent(new Event('data-loading'));

        // If missing any essentials, abort
        if (setFile == null) { throw new Error(`Missing setFile. Cannot continue.`); }
        if (cardFiles == null) { throw new Error(`Missing cardFiles. Cannot continue.`); }
        if (packFiles == null) { throw new Error(`Missing packFiles. Cannot continue.`); }
        if (productFile == null) { throw new Error(`Missing productFile. Cannot continue.`); }

        // Load all files
        const setFilePromise = this._fetchJson(setFile);

        const cardFilePromiseSet = cardFiles.map(cardFile => this._fetchJson(cardFile));
        const cardFilePromises = new Promise(resolve => resolve(Promise.all(cardFilePromiseSet)));

        const packFilePromiseSet = packFiles.map(packFile => this._fetchJson(packFile));
        const packFilePromises = new Promise(resolve => resolve(Promise.all(packFilePromiseSet)));

        const productFilePromise = this._fetchJson(productFile);

        // Load all data.
        // CAMKILL: load draw data here? could probably do it async
        var [setData, cardDataArray, packDataArray, productData]
            = await Promise.all([setFilePromise, cardFilePromises, packFilePromises, productFilePromise])
                .catch(err => { throw new Error(err.message); });

        // Process data.

        // Sets
        this.sets = setData.reduce((allSets, set) => allSets.set(set.code, set), new Map());

        // All the actual cards - from the array of individual card sets within cardDataArray
        const cardData = cardDataArray.reduce((cardSets, cardSet) => cardSets.concat(cardSet), []);
        const cardResults = this._processCardData(cardData, this.setCode);
        this.cards = cardResults.cards;
        this.cardsMetaData = cardResults.cardMetaData;

        // The card definitions and packs - from the array of individual defs/packs within packDataArray
        var packDefArray = packDataArray.reduce((defs, packData) => defs.concat(packData.defs), []);
        this.defs = packDefArray.reduce((packDefs, packDef) => packDefs.set(packDef.defName, packDef), new Map());

        var packArray = packDataArray.reduce((packs, packData) => packs.concat(packData.packs), []);
        this.packs = packArray.reduce((packs, pack) => packs.set(pack.packName, pack), new Map());

        // The products, e.g.: all cards, booster, prerelease - from productData
        this.products = productData.products.reduce((allProducts, product) => allProducts.set(product.productName, product), new Map());

        // Process each product, adding additional data elements.
        // Add the product descriptions to the product
        this.products.forEach(product => {
            product.packs.map(pack => pack.packDesc = this.packs.get(pack.packName).packDesc);

            // Create the currentSettings property, which is what the actual results will be rendered from.
            product.currentSettings = {};
            product.currentSettings.packs = [];

            // If there are no options, assume there is one of each pack.
            if (product.options === undefined) {
                product.currentSettings.packs.push(...product.packs.map(pack => ({ 'count': 1, 'packName': pack.packName })));
            }
            else {
                // Otherwise copy the default options settings.
                // TODO: handle more than one preset, probably by choosing the default preset
                product.currentSettings.packs.push(...product.options.presets[0].packs.map(pack => ({ 'count': pack.count, 'packName': pack.defaultPackName })));
            }
        });

        window.dispatchEvent(new Event('data-loaded'));
    }

    // Get html via a proxy, erroring if it fails or if no HTML is retrieved.
    _fetchJson(url) {
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
    }

    _processCardData(cardData, setCode) {
        // Add card indicies and sort orders for internal use
        let meta = { hasGuilds: false, hasClans: false, hasFactions: false }; // Records metadata about the cards
        let goodCards = new Map();

        cardData.forEach(card => {
            if (!card.title) { return; }

            card.num = card.num || card.multiverseid || card.id; // num is required, so ensure we have one
            if (card.mtgenId === undefined) {
                card.mtgenId = `${card.set}|${card.num}`;
            }

            // Create a sanitized matchTitle stripped of all punctuation, special chars, etc to be used for matching
            card.matchTitle = MtgenData.createMatchTitle(card.title);

            card.colourOrder = MtgenData.getColourByCode(card.colour).sorder;
            card.rarityOrder = MtgenData.getRarityByCode(card.rarity).sorder;

            const cardType = MtgenData.getCardTypeByName(card.type);
            card.typeCode = cardType.code;
            card.typeOrder = cardType.sorder;

            if (card.guild) {
                card.guild = MtgenData.createMatchTitle(card.guild);
                card.guildOrder = MtgenData.getGuildByCode(card.guild).sorder;
                meta.hasGuilds = true;
            }

            if (card.clan) {
                card.clan = MtgenData.createMatchTitle(card.clan);
                card.clanOrder = getClanByCode(card.clan).sorder;
                meta.hasClans = true;
            }

            if (card.faction) {
                card.faction = MtgenData.createMatchTitle(card.faction);
                card.factionOrder = getFactionByCode(card.faction).sorder;
                meta.hasFactions = true;
            }

            card.ccost = MtgenData.calculateConvertedCost(card.cost);

            // Ensure defaults on some fields are set; makes querying WAY easier
            if (card.token === undefined) {
                card.token = false;
            }
            if (card.usableForDeckBuilding === undefined) {
                card.usableForDeckBuilding = true; // i.e., it IS usable unless specified
            }
            if (card.set == setCode && (card.usableForDeckBuilding === undefined || card.usableForDeckBuilding === true)) {
                this.setCardsLoadedCount++;
                window.dispatchEvent(new CustomEvent('playableCardLoaded', { detail: { setCardsLoadedCount: this.setCardsLoadedCount } }));
            }
            if (goodCards.has(card.mtgenId)) {
                console.warn(`WARNING: duplicate mtgenId: ${card.mtgenId} : ${card.title}`);
            }

            // Load up the alternate side card on double-faced cards
            if (card.mtgenIdBack !== undefined) {
                const cardBack = goodCards[card.mtgenIdBack];
                if (cardBack !== undefined) {
                    card.cardBack = cardBack;
                }
            }
            if (card.mtgenIdFront !== undefined) {
                const cardFront = goodCards[card.mtgenIdFront];
                if (cardFront !== undefined) {
                    card.cardFront = cardFront;
                }
            }

            goodCards.set(card.mtgenId, card);
        });

        // Go through all the cards again now that they're all guaranteed to have Ids.
        for (let card of goodCards.values()) {
            // Load up the alternate side card on double-faced cards
            if (card.mtgenIdBack !== undefined) {
                const cardBack = goodCards[card.mtgenIdBack];
                if (cardBack !== undefined) {
                    card.cardBack = cardBack;
                }
            }
            if (card.mtgenIdFront !== undefined) {
                const cardFront = goodCards[card.mtgenIdFront];
                if (cardFront !== undefined) {
                    card.cardFront = cardFront;
                }
            }
        }

        //TODO: Add this section from mtg-generator-lib: Make any post-load changes to the packs
        // probably has to be moved somewhere other than data, seeing as it's calling queries to generate the cards...

        return { cards: goodCards, cardMetaData: meta };
    }

    // Create a sanitized title to avoid the punctuation differences
    // Site to lookup chars: http://www.fileformat.info/info/unicode/char/search.htm
    static createMatchTitle(title) {
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

    // ------------------------------------------------------------------------------------------------------------------------------------------------
    // Card Constants/Accessors

    /*
    - all cards have a distinct colour: w,u,b,r,g,m,c,?
        - when sorting by colour we want non-deckbuilding cards in their own category at the bottom
        - we need a sortColour, with w,u,b,r,g,m,c-artifacts,c-other,c-land,non-deckbuilding,?
    */
    static get colours() {
        return {
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
            unknown: { sorder: 97, code: '?', name: 'Unknown Colour', colourless: true }
        };
    }

    static getColourByCode(code) {
        for (let colour in MtgenData.colours) {
            if (MtgenData.colours[colour].code == code) {
                return MtgenData.colours[colour];
            }
        }
        return MtgenData.colours.unknown;
    }

    static get rarities() {
        return {
            special: { sorder: 1, code: 's', name: 'Special' },
            mythic: { sorder: 2, code: 'm', name: 'Mythic Rare' },
            rare: { sorder: 3, code: 'r', name: 'Rare' },
            uncommon: { sorder: 4, code: 'u', name: 'Uncommon' },
            common: { sorder: 5, code: 'c', name: 'Common' },
            unknown: { sorder: 97, code: '?', name: 'Unknown' }
        };
    }

    static getRarityByCode(code) {
        for (let rarity in MtgenData.rarities) {
            if (MtgenData.rarities[rarity].code == code) {
                return MtgenData.rarities[rarity];
            }
        }
        return MtgenData.rarities.unknown;
    }

    // from: https://mtgjson.com/documentation.html
    static get cardTypes() {
        return {
            planeswalker: { sorder: 1, code: 'p', name: 'Planeswalker' },
            plane: { sorder: 2, code: 'n', name: 'Plane' },
            conspiracy: { sorder: 3, code: 'y', name: 'Conspiracy' },
            creature: { sorder: 4, code: 'c', name: 'Creature' },
            instant: { sorder: 5, code: 'i', name: 'Instant' },
            sorcery: { sorder: 6, code: 's', name: 'Sorcery' },
            enchantment: { sorder: 7, code: 'e', name: 'Enchantment' },
            artifact: { sorder: 8, code: 'a', name: 'Artifact' },
            land: { sorder: 9, code: 'l', name: 'Land' },
            unknown: { sorder: 97, code: '?', name: 'Unknown' }
        };
    }

    static getCardTypeByCode(code) {
        for (let cardType in MtgenData.cardTypes) {
            if (MtgenData.cardTypes[cardType].code == code) {
                return MtgenData.cardTypes[cardType];
            }
        }
        return MtgenData.cardTypes.unknown;
    }

    static getCardTypeByName(name) {
        // there may be multiple card types within the name, so we'll choose the first we find in sort order priority
        let regex;
        for (let cardType in MtgenData.cardTypes) {
            regex = new RegExp("\\b" + MtgenData.cardTypes[cardType].name + "\\b", "i");
            if (regex.test(name)) {
                return MtgenData.cardTypes[cardType];
            }
        }
        return MtgenData.cardTypes.unknown;
    }

    static get guilds() {
        return {
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
        }
    }

    static getGuildByCode(code) {
        for (let guild in MtgenData.guilds) {
            if (MtgenData.guilds[guild].code == code) {
                return MtgenData.guilds[guild];
            }
        }
        return MtgenData.guilds.unknown;
    }

    static get clans() {
        return {
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
        }
    }

    static getClanByCode(code) {
        for (let clan in MtgenData.clans) {
            if (MtgenData.clans[clan].code == code) {
                return MtgenData.clans[clan];
            }
        }
        return MtgenData.clans.unknown;
    }

    static get factions() {
        return {
            azorius: { sorder: 1, code: 'mirran', name: 'Mirran', fullName: 'Mirran' },
            izzet: { sorder: 2, code: 'phyrexian', name: 'Phyrexian', fullName: 'Phyrexian' },

            unknown: { sorder: 97, code: '?', name: 'Unknown', fullName: 'Unknown' }
        }
    }

    static getFactionByCode(code) {
        for (let faction in MtgenData.factions) {
            if (MtgenData.factions[faction].code == code) {
                return MtgenData.factions[faction];
            }
        }
        return MtgenData.factions.unknown;
    }

    static calculateConvertedCost(cost) {
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
}