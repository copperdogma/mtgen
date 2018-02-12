/*
MtGenerator Data class v1.0

Author: Cam Marsollier cam.marsollier@gmail.com

9-Jan-2018: Created.
*/

class MtgenData {
    constructor(setCode, setCardCount) {
        // If missing any essentials, abort
        if (setCode == null) { throw new Error(`Missing setCode. Cannot continue.`); }
        if (setCardCount == null) { throw new Error(`Missing setCardCount. Cannot continue.`); }

        this.version = "v1.0.0";

        this.set = {
            code: setCode.toLowerCase()
            // name and slug are filled in loadAll
        };
        this.setCardCount = setCardCount;
        this.setCardsLoadedCount = 0;
        this.sets = new Map();
        this.cards = new Map();
        this.products = new Map();
        this.defs = new Map();
        this.packs = new Map();
        //CAMKILL:this.draw = undefined; // no draw to start but we may load one immediately

        // If there's a draw it will be a child of a particular product.
        this._currentProductName;
        this.currentProduct;
    }

    //TODO: change this to currentProduct.name ?
    set currentProductName(name) {
        this._currentProductName = name.trim().toLowerCase();
        this.currentProduct = this.products.get(this._currentProductName);
        if (this.currentProduct === undefined) { throw new Error('Unknown product name: ' + this._currentProductName); }

        // Find and set the default option if available.
        if (this.currentProduct.options) {
            const defaultOptionPreset = this.currentProduct.options.presets.find(opt => opt.default === true);
            if (defaultOptionPreset) {
                this.currentProduct.currentOptionPresetName = defaultOptionPreset.presetName;
            }
        }
    }
    get currentProductName() { return this._currentProductName; }

    async loadAll(setFile, cardFiles, packFiles, productFile, drawCode) {
        document.dispatchEvent(new Event('data-loading'));

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
        var [setData, cardDataArray, packDataArray, productData]
            = await Promise.all([setFilePromise, cardFilePromises, packFilePromises, productFilePromise])
                .catch(err => { throw new Error(err.message); });

        // Process data.

        // Sets
        this.sets = setData.reduce((allSets, set) => allSets.set(set.code, set), new Map());
        this.set.name = this.sets.get(this.set.code.toUpperCase()).name;
        this.set.slug = await this._friendly_url(this.set.name);

        // All the actual cards - from the array of individual card sets within cardDataArray
        const cardData = cardDataArray.reduce((cardSets, cardSet) => cardSets.concat(cardSet), []);
        const cardResults = this._processCardData(cardData, this.set.code);
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

            // Create the currentSettings, which is what the actual results will be rendered from.

            // If there are no options, assume there is one of each pack.
            let packs = [];
            if (product.options === undefined) {
                packs.push(...product.packs.map(pack => ({ 'count': 1, 'packName': pack.packName })));
            }
            else {
                // Otherwise copy the default options settings.
                // TODO: handle more than one preset, probably by choosing the default preset
                packs.push(...product.options.presets[0].packs.map(pack => ({ 'count': pack.count, 'packName': pack.defaultPackName })));
            }

            product.currentSettings = new ProductSettings(packs, product);
        });

        // If a draw was specified, load that as well.
        if (drawCode) {
            const rawDrawData = await this._fetchJson(`/${this.set.code}/LoadDraw/${drawCode}`);
            if (rawDrawData === '') {
                console.error(`Draw code ${drawCode} specified but could not be loaded.`)
            }
            else {
                const drawData = JSON.parse(rawDrawData);

                this.currentProductName = drawData.productName;

                // Convert the draw's saved sets into product packs, to be rendered normally later.
                // Determine the sets that are to be displayed and how many of each.
                const setCounts = drawData.sets.reduce((counts, set) => {
                    counts[set.setName] = (counts[set.setName] || 0) + 1;
                    return counts;
                }, {});
                const packs = Object.entries(setCounts).map(([setName, setCount]) => { return { 'count': setCount, 'packName': setName }; });
                this.currentProduct.currentSettings.packs = packs;

                // Set the draw on the CurrentProduct. This will be picked up when the product is rendered
                // and will render out the draw results instead of rendering the normal product queries.
                this.currentProduct.draw = drawData;
            }
        }

        document.dispatchEvent(new Event('data-loaded'));
    }

    // Save the current product results as a "draw," which is persisted to the back end.
    // Returns a new unique draw Id/url that can be later used to retrieve this saved draw.
    async saveDraw() {
        //$.post("/[set]/SaveDraw", { name: "John", time: "2pm" })
        //TODO:
        // JSON doesn't support my odd properties-on-an-array format (oops), so let's convert to something that JSON can handle
        // And for each card, we only need the set|cardNum as a unique composite key
        let drawData = {
            generatorVersion: this.version,
            drawVersion: '1.1',
            useCount: 1,
            setCode: this.set.code,
            productName: this.currentProductName,
            sets: []
        };

        //TODO: it's not saving the fact the card is a foil (it never did because it's just saving mtgenIds)
        this.currentProduct.originalResults.forEach(generatedSet => {
            const set = {
                mtgenIds: generatedSet.map(generatedSet => generatedSet.mtgenId),
                setName: generatedSet.setName,
                sortOrder: generatedSet.sortOrder.sort,
                packVersion: generatedSet.packVersion || '1.0'
            };
            drawData.sets.push(set);
        });

        var drawResults = await fetch(`/${this.set.code}/SaveDraw`, {
            method: "POST",
            headers: new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }),
            body: `data=${JSON.stringify(drawData)}`
        })
            .then(response => {
                if (response.ok) { return response.json(); }
                console.error(response);
                throw Error("Save draw failed");
            })
            // e.g. return: { "drawId": "m09mJw", "url": "ogw?draw=m09mJw" }
            .then(json => { return JSON.parse(json); });

        // Save this draw against the current product.
        Object.assign(drawData, drawResults);
        this.currentProduct.draw = drawData;

        document.dispatchEvent(new CustomEvent('drawSaved', { detail: { drawData: drawData } })); // triggers UI display of draw and google analytics tracking event

        return drawResults;
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
                card.clanOrder = MtgenData.getClanByCode(card.clan).sorder;
                meta.hasClans = true;
            }

            if (card.faction) {
                card.faction = MtgenData.createMatchTitle(card.faction);
                card.factionOrder = MtgenData.getFactionByCode(card.faction).sorder;
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
                document.dispatchEvent(new CustomEvent('playableCardLoaded', { detail: { setCardsLoadedCount: this.setCardsLoadedCount } }));
            }
            if (goodCards.has(card.mtgenId)) {
                console.warn(`WARNING: duplicate mtgenId: ${card.mtgenId} : ${card.title}`);
            }

            goodCards.set(card.mtgenId, card);
        });

        // Go through all the cards again now that they're all guaranteed to have Ids.
        for (let card of goodCards.values()) {
            // Load up the alternate side card on double-faced cards
            if (card.mtgenIdBack !== undefined) {
                const cardBack = goodCards.get(card.mtgenIdBack);
                if (cardBack !== undefined) {
                    card.cardBack = cardBack;
                }
            }
            if (card.mtgenIdFront !== undefined) {
                const cardFront = goodCards.get(card.mtgenIdFront);
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
        // There may be multiple card types within the name, so we'll choose the first we find in sort order priority.
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

    // from: http://guegue.net/friendlyURL_JS
    async _friendly_url(str, max) {
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
    }
}

// The setting options used when generating this product.
// Basically the chosen packs and counts for each.
class ProductSettings {
    constructor(packs, product) {
        this.product = product;
        this.packs = packs;
        this.optionPreset = {};

        this._optionPresetName = '';
        // If there are options+presets, set the first option preset to be the default.
        if (this.product.options && this.product.options.presets) {
            const defaultPreset = this.product.options.presets.find(o => o.default);
            if (defaultPreset) {
                this.optionPresetName = defaultPreset.presetName;
            }
            else if (this.product.options.presets.length > 0) {
                this.optionPresetName = this.product.options.presets[0].presetName;
            }
        }
    }

    set optionPresetName(name) {
        this._optionPresetName = name.trim().toLowerCase();

        this.optionPreset = this.product.options.presets.find(p => p.presetName === this._optionPresetName);
        if (this.optionPreset === undefined) { throw new Error('Unknown option preset name: ' + this._optionPresetName); }

        // Set the chosen packs.
        this.packs = this.optionPreset.packs;

        // Produce the actual packs from this set of options.
        this.packs.forEach(optionPack => {
            let finalPackName = '';
            if (optionPack.hasOwnProperty('defaultPackName')) {
                const wantedPackName = optionPack.defaultPackName.trim().toLowerCase();
                const pack = this.product.packs.find(p => p.packName === wantedPackName);
                if (pack === undefined) {
                    console.log(`ERROR: Unknown defaultPackName: '${optionPack.defaultPackName}'`);
                }
                else {
                    finalPackName = wantedPackName;
                }
            }
            // If randomDefaultPackName is specified, choose one and use that in place of defaultPackName
            else if (optionPack.hasOwnProperty('randomDefaultPackName') && Array.isArray(optionPack.randomDefaultPackName)) {
                const chosenPackName = optionPack.randomDefaultPackName[Math.floor(Math.random() * optionPack.randomDefaultPackName.length)];
                const wantedPackName = chosenPackName.trim().toLowerCase();
                const pack = this.product.packs.find(p => p.packName === wantedPackName);
                if (pack === undefined) {
                    console.log(`ERROR: Unknown randomDefaultPackName: '${chosenPackName}'`);
                }
                else {
                    finalPackName = wantedPackName;
                }
            }
            else {
                console.log(`ERROR: option preset missing 'defaultPackName' or 'randomDefaultPackName'. One or the other is required.`);
            }

            // If the supposed pack name couldn't be found, use first pack name so we can continue.
            if (finalPackName === '') {
                finalPackName = this.product.packs[0].packName;
                console.log(`  Defaulting to first product packName: '${finalPackName}'.`);
            }
            optionPack.packName = finalPackName;
        });
    }
    get optionPresetName() { return this._optionPresetName; }
}