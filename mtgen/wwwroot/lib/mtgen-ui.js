/*
MtGenerator UI class v1.0

Author: Cam Marsollier cam.marsollier@gmail.com

9-Jan-2018: Created.
*/

class MtgenUI {
    constructor(dataApi, queryApi) {
        // If missing any essentials, abort
        if (dataApi == null) { throw new Error(`Missing dataApi (from mtgen-data.js). Cannot continue.`); }
        this._dataApi = dataApi;

        if (queryApi == null) { throw new Error(`Missing queryApi (from mtgen-query.js). Cannot continue.`); }
        this._queryApi = queryApi;

        this._mainEl = document.querySelector('main'); // The main element within which all content will be rendered.

        this.version = "v1.0.0";

        //TODO: these may be closer to queries
        this.exports = {};
    }

    async renderUI() {
        this._mainEl.innerHTML =
            `<section id='products'></section>
             <section id='product-content'></section>
             <div class='back-to-top'><a class='button top' href='#'>Back to top</a></div>`;

        this._productsEl = this._mainEl.querySelector('#products');
        this._productContentEl = this._mainEl.querySelector('#product-content');
        this._currentProductContentEl; // will be filled by _renderCurrentProduct()

        this._renderProductTabs(this._dataApi.products);
        this._renderProductContentPlaceholders(this._dataApi.products);

        // We will already have results by this point if we loaded a draw.
        if (this._dataApi.currentProduct.results !== undefined) {
            await this._renderCurrentProductResults();
        }
        else {
            await this._renderCurrentProduct();
        }
        //// If there is only one Product view, hide it the tab button (we need to render it so it will auto-execute the main Product)
        //if (Object.keys(this.ProductViews).length < 2) {
        //    document.querySelector('#products>a.button').style.display = 'none';
        //}

        //// If specified, auto-showTab the startup product from the Draw (if there is one),
        //// if not check if one is specified in the normal startup data.
        //if (my.hasDraw() && my.draw.productName && this.ProductViews[my.draw.productName] !== undefined) {
        //    this.ProductViews[my.draw.productName].showTab();
        //}
        //else if (my.startProductName) {
        //    this.ProductViews[my.startProductName].showTab();
        //}
        // React to global events like clicking a tab or changing an option.
        // This is done globally instead of with handlers on individual elements because
        // the UI is generated dynamically and there could be thousands of elements with handlers.
        document.addEventListener('click', async e => {
            if (e.target.classList.contains('button') || e.target.tagName === 'BUTTON') {
                await this._handleButtonClick(e, e.target);
            }
        });
        document.addEventListener('change', async e => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                await this._handleInputChange(e, e.target);
            }
        });
        document.addEventListener('drawSaved', async e => await this._handleDrawSaved(e));
    }

    async _handleButtonClick(e, el) {
        if (el.classList.contains('sort-all')) {
            await this._handleSortAllByButtonClick(el, el.dataset.sort);
            e.preventDefault();
        }
        else if (el.classList.contains('sort-set')) {
            const setEl = el.closest('section[data-setid]');
            await this._handleSortSetByButtonClick(el, el.dataset.sort, setEl.dataset.setid);
            e.preventDefault();
        }
        else if (el.classList.contains('generate')) {
            await this._renderCurrentProductFromOptions();
            e.preventDefault();
        }
        else if (el.classList.contains('remove-input')) {
            //TODONEXT: I feel that this should modify the actual data which should then be re-rendered.. keep the state and display separate.
            const selectedBoosterIndex = el.parentNode.dataset.index;
            this._dataApi.currentProduct.currentSettings.packs.splice(selectedBoosterIndex, 1);
            el.parentNode.remove();
            await this._renumberInputBoosters(this._currentProductContentEl);
            e.preventDefault();
        }
        else if (el.classList.contains('add-booster')) {
            //TODONEXT: I feel that this should modify the actual data which should then be re-rendered.. keep the state and display separate.
            this._dataApi.currentProduct.currentSettings.packs.push({ count: 1, packName: this._dataApi.currentProduct.packs[0].packName });
            const boosterInputHtml = await this._renderBoosterInput({ defaultPackName: this._dataApi.currentProduct.packs[0].packName, count: 1 }, 0);
            const boosterInputEl = document.createElement('div');
            const endButton = this._currentProductContentEl.querySelector('section.options button.add-booster');
            endButton.before(boosterInputEl);
            boosterInputEl.outerHTML = boosterInputHtml;
            await this._renumberInputBoosters(this._currentProductContentEl);
            e.preventDefault();
        }
        else if (el.classList.contains('option-preset')) {
            await this._handleChooseOptionPreset(el, el.dataset.preset);
            e.preventDefault();
        }
        else if (el.classList.contains('save-draw')) {
            await this._saveDraw(e);
            e.preventDefault();
        }
        else if (el.classList.contains('export')) {
            await this._handleShowExportCurrentProduct(e);
            e.preventDefault();
        }
        // Change export formats.
        else if (el.classList.contains('change-export-type')) {
            const exportType = el.dataset.exportType;
            await this._chooseExportFormat(exportType);
            e.preventDefault();
        }
    }

    async _renumberInputBoosters(productContentEl) {
        const boosterInputs = this._currentProductContentEl.querySelectorAll('section.options .booster-input');
        boosterInputs.forEach((el, index) => el.dataset['index'] = index);
    }

    async _handleChooseOptionPreset(el, optionPreset) {
        this._dataApi.currentProduct.currentSettings.optionPresetName = optionPreset;
        var activeButtons = this._currentProductContentEl.querySelectorAll('section.options .button.option-preset.active');
        activeButtons.forEach(el => el.classList.remove('active'));
        el.classList.add('active');
        await this._renderCurrentProduct();
    }

    async _handleInputChange(e, el) {
        if (el.classList.contains(`booster-count`)) {
            const selectedBoosterIndex = el.parentNode.dataset.index;
            this._dataApi.currentProduct.currentSettings.packs[selectedBoosterIndex].count = el.value;
            e.preventDefault();
        }
        else if (el.classList.contains(`booster-packName`)) {
            const selectedBoosterIndex = el.parentNode.dataset.index;
            this._dataApi.currentProduct.currentSettings.packs[selectedBoosterIndex].packName = el.value;
            e.preventDefault();
        }
    }

    async _handleSortAllByButtonClick(el, sortName) {
        const sortedResults = await this._queryApi.sortAllBy(this._dataApi.currentProduct.originalResults, sortName);
        this._dataApi.currentProduct.results = sortedResults;
        await this._renderCurrentProductResults();
    }

    async _handleSortSetByButtonClick(el, sortName, setId) {
        const sortedSet = await this._queryApi.sortBy(this._dataApi.currentProduct.results[setId], sortName);
        this._dataApi.currentProduct.results[setId] = sortedSet;

        // Re-render and replace only this set's section.
        var el = this._currentProductContentEl.querySelector(`section[data-setid="${setId}"]`);
        el.innerHTML = this._renderCardSet(this._dataApi.currentProduct.results[setId], setId);
    }

    async _getSortAllByClassNames() { return Object.keys(MtgenQuery.sortOrders); }

    async _renderProductTabs(products) {
        if (products.length === 0) { return; }

        // Render one tab per product
        const productTabsHtml = [...products.values()].reduce((htmlOut, product) => {
            if (product.isVisible == undefined || product.isVisible == true) {
                htmlOut += `<a data-product-name='${product.productName}' href='#' id='show-product-${product.productName}' class='button'>${product.productDesc}</a>`;
            }
            return htmlOut;
        }, '');

        this._productsEl.innerHTML = productTabsHtml;

        // Switch products when user clicks product tab
        this._productsEl.addEventListener('click', e => {
            if (e.target.dataset.productName) {
                this._dataApi.currentProductName = e.target.dataset.productName;
                this._renderCurrentProduct();
            }
        });
    }

    async _renderProductContentPlaceholders(products) {
        if (products.length === 0) { return; }

        const productContentHtml = [...products.values()].reduce((htmlOut, product) => {
            if (product.isVisible == undefined || product.isVisible == true) {
                htmlOut += `<section class='product-${product.productName}'><section class='options'></section><section class='result'></section></section>`;
            }
            return htmlOut;
        }, '');

        this._productContentEl.innerHTML = productContentHtml;
    }

    async _renderCurrentProductFromOptions() {
        this._dataApi.currentProduct.originalResults = await this._queryApi.generateCardSetsFromPacks(this._dataApi.currentProduct.currentSettings.packs);
        const sortedResults = await this._queryApi.sortAllBy(this._dataApi.currentProduct.originalResults, this._dataApi.currentProduct.initialSort);
        this._dataApi.currentProduct.results = sortedResults;
        await this._renderCurrentProductResults();
    }

    async _renderCurrentProductFromDraw() {
        this._dataApi.currentProduct.originalResults = await this._queryApi.generateCardSetsFromDraw(this._dataApi.currentProduct.draw);
        this._dataApi.currentProduct.results = this._dataApi.currentProduct.originalResults;
        this._dataApi.currentProduct.results.sortOrder = MtgenQuery.sortOrders.set;
        await this._renderCurrentProductResults();
    }

    async _renderCurrentProduct() {
        //TODO: change this to SetCurrentProduct which may call render.. or changing the current product will raise an event, and when the product changes this renders it
        // Highlight active tab
        Array.from(this._productsEl.querySelectorAll('.button')).forEach(n => n.classList.remove('active'));
        this._productsEl.querySelector('#show-product-' + this._dataApi.currentProductName).classList.add('active');

        // Highlight active content
        Array.from(this._productContentEl.querySelectorAll('#product-content > section')).forEach(n => n.classList.remove('active'));
        this._currentProductContentEl = this._productContentEl.querySelector('.product-' + this._dataApi.currentProductName);
        this._currentProductContentEl.classList.add('active');

        // TODO: combine the saved deck options and the default options...
        this._renderCurrentProductOptions();

        // If there is a draw, render the saved draw results.
        if (this._dataApi.currentProduct.draw !== undefined) {
            await this._renderCurrentProductFromDraw();
        }
        // If there are no options, auto-generate the product results.
        else if (this._dataApi.currentProduct.options === undefined && this._dataApi.currentProduct.originalResults === undefined) {
            // TODONEXT: check all sets (done up to invasion block)
            await this._renderCurrentProductFromOptions();
        }

        // Tells the UI a set of cards was rendered. Used to trigger modal event listeners and Holder.run().
        document.dispatchEvent(new CustomEvent('resultsRendered'));
    }

    _renderBoosterInput(optionPack, index) {
        const optionValues = this._dataApi.currentProduct.packs.reduce((htmlOut, pack) => {
            return htmlOut += `<option value='${pack.packName}'${pack.packName === optionPack.packName ? ' selected' : ''}>${pack.packDesc}</option>`
        }, '');

        const boosterInput =
            `<div class='booster-input' data-index='${index}'>
                <input class='booster-count' type='number' min='0' max='99' value='${optionPack.count}'>
                <select class='booster-packName'>
                    ${optionValues}
                </select>
                <button class='remove-input' title='Remove Booster'>-</button>
             </div>`;

        return boosterInput;
    }

    async _renderCurrentProductOptions() {
        if (this._dataApi.currentProduct.options === undefined) { return; }

        let presets = '';
        if (this._dataApi.currentProduct.options.presets && this._dataApi.currentProduct.options.presets.length > 1) {
            presets = this._dataApi.currentProduct.options.presets.map(p => {
                const activeClass = this._dataApi.currentProduct.currentSettings.optionPresetName === p.presetName ? ' active' : '';
                return `<a href='#' class='button option-preset${activeClass}' data-preset='${p.presetName}'>${p.presetDesc}</a>`;
            }).join('');
        }

        const boosterInputs = this._dataApi.currentProduct.currentSettings.packs.reduce((htmlOut, pack, index) => {
            htmlOut += this._renderBoosterInput(pack, index);
            return htmlOut;
        }, '');

        const optionsHtml =
            `<div class='presets'>${presets}</div>
             <div class='packs'>
                 <section id='boosters'>
                     ${boosterInputs}
                    <button class='add-booster'>Add Booster</button>
                 </div>
                 <button type='submit' class='generate'>Generate my sets!</button>
             </div>`;

        this._currentProductContentEl.querySelector('section.options').innerHTML = optionsHtml;
    }

    // All results should be rendered through this function
    _displayResults(productName, html) {
        this._productContentEl.querySelector(`.product-${productName} .result`).innerHTML = html;
    }

    async _renderCurrentProductResults() {
        const product = this._dataApi.currentProduct;
        const packDesc = (product.packs.length && product.packs.length === 1) ? product.packs[0].packDesc : undefined;
        const title = packDesc || product.setDesc || 'All Cards';
        const areResultsGrouped = product.results.length !== undefined && product.results[0].length !== undefined;
        const areSortedByGeneratedSet = areResultsGrouped && product.results.sortOrder.sort === 'set';
        let allCardsHtml = '';

        if (areSortedByGeneratedSet) {
            if (product.draw !== undefined) {
                allCardsHtml += this._renderDrawSetsTitle(product.draw, product.results.length, product.originalResults.totalLength);
            } else {
                allCardsHtml += this._renderSetsTitle(product.results.length, product.originalResults.totalLength);
            }
        }
        else {
            allCardsHtml += this._renderCardsTitle(title, product.originalResults.totalLength)
        }

        allCardsHtml += this._renderTopMenu(product.results, 'all');

        // We want jump menus if the cards are grouped. Except for the inital "Generated Sets" grouping.
        if (!areSortedByGeneratedSet) {
            allCardsHtml += this._renderTopJumpMenu(product.results)
        }

        allCardsHtml += '<div>';

        // If this product is grouped, render the groups (sets)
        if (areResultsGrouped) {
            product.results.forEach((result, index) => {
                allCardsHtml += this._renderCardSet(result, index, product.results);
            });
        }
        // Otherwise it's just a single array of cards (probably with a top-level sort of Name)
        else {
            allCardsHtml += `<section id='${this._friendlyUrl(product.productDesc)}-0' class='set' data-setid='0'>${this._renderCards(product.results)}</section>`;
        }
        allCardsHtml += '</div>';
        this._displayResults(product.productName, allCardsHtml);
    }

    _renderCardSet(cardSet, setIndex) {
        return `<section id='${this._friendlyUrl(cardSet.setDesc)}-${setIndex}' class='set' data-setid='${setIndex}'>`
            + this._renderCardsTitle(cardSet.setDesc, cardSet.length)
            + this._renderTopMenu(cardSet, 'set')
            + this._renderCards(cardSet)
            + `</section >`;
    }

    // General rendering functions
    _renderCardsTitle(title, cardCount) { return `<h2>${title} <span class='card-count'>(${cardCount})<a href="#" class="button top">[ Top ]</a></span></h2>`; }
    _renderSetsTitle(setCount, cardCount) { return `<h2>${setCount} Sets Generated - <span class='card-count'>${cardCount} cards<a href="#" class="button top">[ Top ]</a></span></h2>`; }
    _renderDrawSetsTitle(draw, setCount, cardCount) { return `<h2><strong title='Saved on ${new Date(draw.timestamp)}'>Saved Draw:</strong> ${setCount} Sets - <span class='card-count'>${cardCount} cards<a href="#" class="button top">[ Top ]</a></span></h2>`; }

    _renderTopMenu(results, allOrSet) {
        let menuItems = [];
        menuItems.push(this._renderTopMenuItem(MtgenQuery.sortOrders.name, results, allOrSet));
        menuItems.push(this._renderTopMenuItem(MtgenQuery.sortOrders.colour, results, allOrSet));
        menuItems.push(this._renderTopMenuItem(MtgenQuery.sortOrders.rarity, results, allOrSet));
        menuItems.push(this._renderTopMenuItem(MtgenQuery.sortOrders.cost, results, allOrSet));
        menuItems.push(this._renderTopMenuItem(MtgenQuery.sortOrders.type, results, allOrSet));
        if (this._dataApi.cardsMetaData.hasGuilds) {
            menuItems.push(this._renderTopMenuItem(MtgenQuery.sortOrders.guild, results, allOrSet));
        }
        if (this._dataApi.cardsMetaData.hasClans) {
            menuItems.push(this._renderTopMenuItem(MtgenQuery.sortOrders.clan, results, allOrSet));
        }
        if (this._dataApi.cardsMetaData.hasFactions) {
            menuItems.push(this._renderTopMenuItem(MtgenQuery.sortOrders.faction, results, allOrSet));
        }
        if (this._dataApi.currentProduct.isGenerated) {
            if (allOrSet === 'all') {
                menuItems.push(this._renderTopMenuItem(MtgenQuery.sortOrders.set, results, allOrSet));
                // Only render the Saved Draw button if it's the very top menu, the current product is generated, and we aren't already displaying a draw.
                if (this._dataApi.currentProduct.draw === undefined) {
                    menuItems.push(`<a href='#save-draw' class='button save-draw' data-export='${allOrSet}' title='Save/Share your draw'>Save Draw</a>`);
                }
            }
            else if (this._dataApi.currentProduct.results.sortOrder.sort === 'set') {
                // Only render the "Opened Order" sub-menu item if the top-level sort is by Set.
                menuItems.push(this._renderTopMenuItem(MtgenQuery.sortOrders.order, results, allOrSet));
            }
        }

        menuItems.push(`<a href='#exporter' class='button export' data-export='${allOrSet}'>Export</a>`);

        return `<section class='menu'><label>Sort ${allOrSet} by</label>${menuItems.join('')}</section>`;
    }

    _renderTopMenuItem(sortItem, cardList, allOrSet) {
        // For sets, if the parent sort is by X, don't render the sort option for X.
        if (allOrSet === 'set' && sortItem.sort === cardList.parent.sortOrder.sort) {
            return '';
        }
        const activeClass = (sortItem.sort === cardList.sortOrder.sort) ? 'active ' : '';
        const sortName = sortItem.sortName || this._uppercaseFirstLetter(sortItem.sort);
        return `<a href='#' class='button ${activeClass}sort-${allOrSet}' data-sort='${sortItem.sort}'>${sortName}</a>`;
    }

    _uppercaseFirstLetter(string) { return string.charAt(0).toUpperCase() + string.slice(1); }

    _renderTopJumpMenu(results) {
        if (results.length === undefined || results[0].length === undefined) { return ''; } // Jump menu not needed if there are no sub-groupings (ie sorted by name)
        const menuItems = results.reduce((menuItems, result, index) => {
            return menuItems.concat(`<a class='jump' href='#${this._friendlyUrl(result.setDesc)}-${index}'>${result.setDesc}<span class='card-count'> (${result.length})</span></a>`);
        }, []);
        return `<section class="menu jump">${menuItems.join('')}</section>`;
    }

    _renderCards(cards) {
        const htmlOut = cards.map(card => {
            let foilClass = '', doubleFaceClass = '', aStart = '', aEnd = '';
            let title = card.title;

            let cardImageHtml = this._renderCardImage(card);
            if (card.cardBack !== undefined) {
                cardImageHtml += this._renderCardImage(card.cardBack);
                title += '/' + card.cardBack.title;
                doubleFaceClass = ' doubleface';
            }
            else if (card.cardFront !== undefined) {
                cardImageHtml += this._renderCardImage(card.cardFront);
                title += '/' + card.cardFront.title;
                doubleFaceClass = ' doubleface';
            }
            const deckClass = card.inDeck === true ? ' moved-to-deck' : '';

            if (card.foil) {
                foilClass = ' foil';
                title += ' - Foil';
            }
            if (card.hasOwnProperty("src_large")) {
                aStart = "<a href='" + card.src_large + "' title='" + title + "'>";
                aEnd = "</a>";
            }

            const includedReason = (card.includedReason !== undefined) ? `<em class='reason'>(${card.includedReason})</em>` : '';
            return `<span class='card${foilClass}${doubleFaceClass}${deckClass}' data-mtgenid='${card.mtgenId}' title='${title}'>${aStart}${cardImageHtml}<em class='title'>${title}</em>${includedReason}${aEnd}</span>`;
        });
        return htmlOut.join('');
    }

    _renderCardImage(card) {
        const foilClass = card.foil ? ' foil' : '';
        const title = card.title + (card.foil ? ' - Foil' : '');

        const htmlOut = `<img data-usable-for-deck-building="${card.usableForDeckBuilding}" src="${card.src}" alt="${title}" title="${title}" width="${(card.width || 265)}" height="${(card.height || 370)}" />`;

        return htmlOut;
    }

    // Save Draw functions -----------------------------------------------------------------------------------------------------------------------------
    async _saveDraw(e) {
        document.modal.setContent(document.getElementById('save-draw-template').innerHTML);
        const saveDrawModalInput = document.querySelector(".save-draw.modal input");

        //TODONEXT: clear out draw for current product on cardSetsGenerated; we're no longer displaying the saved draw, so get rid of it

        saveDrawModalInput.value = 'Loading...';
        document.modal.open();
        await this._dataApi.saveDraw()
            .catch(error => {
                saveDrawModalInput.value = 'Save draw failed!';
                saveDrawModalInput.style.color = 'red';
            });
        // Saving the draw will raise the drawSaved event, handled below.
    }

    async _handleDrawSaved(e) {
        const drawData = e.detail.drawData;
        // Change the url to match the saved draw
        history.pushState({ setCode: drawData.setCode, drawId: drawData.drawId }, this._dataApi.set.name + ' Draw', drawData.url);

        this._displayDrawModalInfo();

        //TODO: fix so the UI is rendered in reaction to the data, not directly like this

        // Redisplay the top header as a saved draw header.
        const currentProduct = this._dataApi.currentProduct;
        const setTitleEl = this._currentProductContentEl.querySelector('h2');
        setTitleEl.outerHTML = this._renderDrawSetsTitle(currentProduct.draw, currentProduct.results.length, currentProduct.originalResults.totalLength);

        // Delete the Save Draw button.
        const saveDrawButton = this._currentProductContentEl.querySelector('.button.save-draw');
        saveDrawButton.parentNode.removeChild(saveDrawButton);
    }

    async _displayDrawModalInfo() {
        // Display the url for easy copying/sharing.
        const saveDrawModalInput = document.querySelector(".save-draw.modal input");
        saveDrawModalInput.value = window.location.href;
        saveDrawModalInput.select();
        saveDrawModalInput.focus();
    }

    // Export functions --------------------------------------------------------------------------------------------------------------------------------

    async _handleShowExportCurrentProduct(e) {
        document.modal.setContent(document.getElementById('exporter-template').innerHTML);
        const exportType = e.target.getAttribute('data-export');
        if (exportType == 'all') {
            await this._addExportableTextFormats(this._dataApi.currentProduct.originalResults);
        }
        else {
            const setId = e.target.closest('.set').getAttribute('data-setid');
            const sets = [this._dataApi.currentProduct.results[setId]];
            await this._addExportableTextFormats(sets);
        }

        // Display the first format (dec: Cockatrice) for initial display
        await this._chooseExportFormat('dec');

        document.modal.open();

        document.dispatchEvent(new CustomEvent('exporting', { detail: { setCode: this._dataApi.set.code } })); // triggers google analytics tracking event
        // No 'return false;' so model plugin can trigger afterward
    }

    async _addExportableTextFormats(generatedSets) {
        // It's the same list for all formats
        const allCards = await this._queryApi.getAllValidExportableCards(generatedSets);
        const countedCards = await this._queryApi.getUniqueCountedSortedCardSet(allCards);

        const attrib = 'Created by MtG Generator: ' + window.location.href.replace('index.html', '').replace('#', '');

        // Store the exports so we can do various things with them later
        document.querySelector('.exporter.modal .card-count').textContent = `${allCards.length} cards total, ${countedCards.length} unique`;

        this.exports.dec = await this._renderDecFormat(countedCards, attrib);
        this.exports.txt = await this._renderTxtFormat(countedCards, attrib);
        this.exports.mwdeck = await this._renderMwDeckFormat(null, countedCards, attrib);
        this.exports.cod = await this._renderCodFormat(countedCards, attrib);
        this.exports.coll = await this._renderCollFormat(countedCards, attrib);
    }

    // All 'cards' arguments below should be a list of unique, counted, sorted cards

    // .dec: used by Cockatrice, Apprentice
    // sample (under ".dec File Format"): http://www.deckedbuilder.com/faq.html
    async _renderDecFormat(cards, attrib) {
        const output = '// ' + attrib + '\r\n' + cards.reduce((cardOutput, card) =>
            cardOutput += card.count + ' ' + card.title + '\r\n', '');
        return output;
    }

    // .coll: used by used by Decked Builder
    // sample (under ".coll File Format"): http://www.deckedbuilder.com/faq.html
    // No sideboard option as they're not decks; they're card collections.
    async _renderCollFormat(cards, attrib) {
        const output = '// ' + attrib + '\r\n' + cards.reduce((cardOutput, card) =>
            cardOutput += card.count + ' ' + card.title + ' [' + this._dataApi.set.name + ']\r\n', '');
        return output;
    }

    // .txt: used by used by Magic Online
    // sample: http://archive.wizards.com/Magic/magazine/article.aspx?x=mtgcom/arcana/678
    async _renderTxtFormat(cards, attrib) {
        const output = 'Sideboard\r\n' + cards.reduce((memo, card) => {
            const cardTitle = card.title.replace(' // ', '/'); // Apparently Magic Online doesn't import it's own magic.wizards.com // format for split cards!
            return memo += card.count + ' ' + cardTitle + '\r\n';
        }, '');
        return output;
    }

    // .cod: used by Cockatrice
    // sample: http://mtgstudio.uservoice.com/forums/16948-mtg-studio-suggestions/suggestions/2675891-support-cockatrice-deck-format-
    async _renderCodFormat(cards, attrib) {
        const output = '<?xml version="1.0" encoding="UTF-8"?>\r\n'
            + '\t<cockatrice_deck version="1">\r\n'
            + '\t<deckname>' + this._dataApi.set.name + ' Prerelease</deckname>\r\n'
            + '\t<comments>' + attrib + ' Prerelease</comments>\r\n'
            + '\t<zone name="main">\r\n'
            + '\t</zone>\r\n'
            + '\t<zone name="side">\r\n'
            + cards.reduce((cardOutput, card) =>
                cardOutput += '\t\t<card number="' + card.count + '" name="' + card.title.replace('&', '&amp;') + '"/>\r\n', '')
            + '\t</zone>\r\n'
            + '</cockatrice_deck>';
        return output;
    }

    // .mwDeck: used by Magic Workstation
    // & replaced with / in card title otherwise MWS won't import
    // sample: https://code.google.com/p/deckprinter/source/browse/trunk/downloaded.mwdeck?spec=svn34&r=34
    async _renderMwDeckFormat(cards, sbCards, attrib) {
        let output = `// ${attrib}\r\n`;
        let prefix = '    ';
        if (cards !== null && cards.length > 0) {
            output += cards.reduce((cardOutput, card) =>
                cardOutput += prefix + card.count + ' [' + card.set.toUpperCase() + '] ' + card.title.replace(' & ', '/') + '\r\n',
                '');
        }
        if (sbCards !== null && sbCards.length > 0) {
            prefix = 'SB: ';
            output += sbCards.reduce((cardOutput, card) => cardOutput += prefix + card.count + ' [' + card.set.toUpperCase() + '] ' + card.title.replace(' & ', '/') + '\r\n',
                '// Sideboard:\r\n');
        }
        return output;
    }

    async _chooseExportFormat(exportType) {
        const allButtons = document.querySelectorAll('.exporter.modal .export-set a.button');
        Array.from(allButtons).forEach(b => b.classList.remove('active'));
        document.querySelector(`.export-set a[data-export-type=${exportType}]`).classList.add('active');

        document.querySelector('.exporter.modal textarea').value = this.exports[exportType];
        this._setLinkToDownloadFile('.exporter.modal .export-detail a.export-download', exportType);
    }

    async _setLinkToDownloadFile(linkSelector, exportType) {
        const utf8encodedContent = strToUTF8Arr(this.exports[exportType]);
        const encodedContent = base64EncArr(utf8encodedContent);
        document.querySelector(linkSelector).setAttribute('href', 'data:text/octet-stream;base64,' + encodedContent);
        document.querySelector(linkSelector).setAttribute('download', `mtg-generator-${this._dataApi.set.slug}-prerelease.${exportType}`); // 'download' attr is Chrome/FF-only to set download filename
    }

    // Support functions --------------------------------------------------------------------------------------------------------------------------------

    // from: http://guegue.net/friendlyURL_JS
    _friendlyUrl(str, max) {
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

    async getQuerystringParamByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        const regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }
}