/*

Checks all images for a file, set, or all sets.
This will tell you if there are broken links where old images need to be updated/replaced/reimported from elsewhere.

20210714: Created.

*/
class ImageChecker {
    #sets = [];
    #validatedImageCache = {};

    // PUBLIC METHODS ------------------------------------------------------------------------------------

    // Checks every set.
    // startingFromSetCode: if supplied, will skip sets until it reaches this one, then will continue from there
    async checkImagesForAllSets(startingFromSetCode) {
        this.#dispatchEvent("processing-started", "Procesing started for all sets");

        const sets = await this.#getAllSets();

        const startingFromSet = startingFromSetCode ? await this.#getSet(startingFromSetCode) : null;
        let processSets = startingFromSet === null;

        let setCount = 0, processedCount = 0, skippedCount = 0;
        for (const set of sets) {
            setCount++;
            if (processSets == false) {
                if (set.code == startingFromSet.code) {
                    processSets = true;
                }
            }
            if (processSets) {
                this.#dispatchEvent("processing-started", `Processing set ${setCount} / ${sets.length} - '${set.code}' : ${set.name} (${set.releaseDate})`);
                if (set.generatorCreatedDate === undefined || set.generatorCreatedDate == 'n/a') {
                    this.#dispatchEvent('processing', `<br/><strong>Set ${set.code} exists in sets.json but has no generatorCreatedDate; skipping.</strong>`);
                    skippedCount++;
                }
                else {
                    await this.#checkAllCardsInSet(set);
                    processedCount++;

                    this.#outputCompletionAndErrors(set);
                }
            }
            else {
                this.#dispatchEvent("processing-started", `Skipping set ${setCount} / ${sets.length} - '${set.code}' : ${set.name} (${set.releaseDate})`);
                skippedCount++;
            }
        }

        const totalErrorCount = this.#sets.reduce((acc, set) => { return acc + set.errors.length; }, 0);

        this.#dispatchEvent('processing-complete', `<strong style='color:green'>Processing complete.</strong> Processed ${setCount} sets: ${skippedCount} skipped, ${processedCount} processed, ${totalErrorCount} errors across all sets.` );
    }

    async checkImagesForSet(setCode) {
        this.#dispatchEvent("processing-started", `Processing started for set code '${setCode}'`);

        const set = await this.#getSet(setCode);

        await this.#checkAllCardsInSet(set);

        this.#outputCompletionAndErrors(set);
    }

    // Takes a set and file path and checks all images in that file.
    // e.g.: dgm/cardsMain.json
    async checkImagesInFile(setAndFilePath) {
        this.#dispatchEvent("processing-started", `Processing started for set and file path '${setAndFilePath}'`);

        // Parse and validate set/path.
        const pathParts = setAndFilePath.split('/');
        if (pathParts.length < 2) {
            this.#throwErrorAndStop(`Invalid set path '${setAndFilePath}'. Should be similar to: dgm/cardsMain.json`);
        }

        const setCode = pathParts[0];
        const cardFileName = pathParts[1];

        // Get set.
        const set = await this.#getSet(setCode);

        this.#dispatchEvent('processing', `<br/><strong>Found set ${set.code}: ${set.name}</strong>`);

        // Get specified card file and check all cards within.
        await this.#checkAllCardsInCardFile(set, cardFileName);

        this.#outputCompletionAndErrors(set, cardFileName);
    }


    //// PRIVATE METHODS ------------------------------------------------------------------------------------

    async #getAllSets() {
        // Cache all the sets if it hasn't been done yet.
        if (this.#sets.length === 0) {
            this.#sets = await this.#fetchLocalJson('sets.json');
            this.#dispatchEvent('processing', `Read sets.json. Found ${this.#sets.length} sets.`)

            // Initialize cardFiles and errors properties so we're guaranteed to have them at the end for summarizing.
            this.#sets.forEach(set => {
                set.cardFiles = new Array();
                set.errors = new Array();
            });
        }

        return this.#sets;
    }

    async #getSet(setCode) {
        // Validate set code.
        if (setCode === undefined || setCode.length < 3 || setCode.length > 4) {
            this.#throwErrorAndStop(`Invalid set code '${setCode}'. Must be 3 characters, except 'con_' which is 4.`);
        }

        const sets = await this.#getAllSets();

        const setCodeFixed = setCode.trim().toUpperCase();
        const setFilter = sets.filter(set => set.code == setCodeFixed);
        if (setFilter.length === 0) {
            this.#throwErrorAndStop(`Cannot find set code '${setCode}'. See sets.json for all set codes.`);
        }

        return setFilter[0];
    }

    async #checkAllCardsInSet(set) {
        this.#dispatchEvent('processing', `<br/><strong>Starting to process set ${set.code}: ${set.name} at ${(new Date())}</strong>`);

        // Get and validate set.json for this set.
        const setFile = await this.#fetchLocalJson(`${set.code}/set.json`);
        this.#dispatchEvent('processing', `Read ${set.code} set.json file.`)

        if (setFile.cardFiles === undefined || setFile.cardFiles.length === 0) {
            this.#throwErrorAndStop(`Missing 'cardFiles' property of ${set.code}/set.json`);
        }

        this.#dispatchEvent('processing', `${set.code} set.json file has ${setFile.cardFiles.length} cardFiles: ${setFile.cardFiles.join(', ')}`)

        // Check all cards in each set files
        for (const cardFileName of setFile.cardFiles) {
            await this.#checkAllCardsInCardFile(set, cardFileName);
        }
    }

    async #checkAllCardsInCardFile(set, cardFileName) {
        this.#dispatchEvent('processing', `Processing ${set.code} cardFile: ${cardFileName}`);

        const cardFile = await this.#fetchLocalJson(`${set.code}/${cardFileName}`);
        this.#dispatchEvent('processing', `Read ${cardFile.length} cards in ${set.code} cardFile: ${cardFileName}`);

        this.#updateSetCardCount(set, cardFileName, cardFile.length);

        // Run all card checks, pushing their promises into an array so we can wait till they're all done.
        let checkCardFunctions = new Array();
        for (const card of cardFile) {
            checkCardFunctions.push(this.#checkCardImages(set, cardFileName, card));
        }

        // Wait till all card checks are done.
        await Promise.allSettled(checkCardFunctions);
    }

    #throwErrorAndStop(errorMsg) {
        this.#dispatchEvent("processing-failed", errorMsg);
        throw errorMsg;
    }

    // propPrefix is only used in the recursive case
    async #checkCardImages(set, cardFileName, card, propPrefix) {
        if (card.src) {
            await this.#checkCardImage(set, cardFileName, card, 'src', card.src, propPrefix);
        }
        if (card.src_large) {
            await this.#checkCardImage(set.code, cardFileName, card, 'src_large', card.src_large, propPrefix);
        }
        if (card.cardFaces && card.cardFaces.length > 0) {
            if (card.cardFaces[0]) {
                await this.#checkCardImages(set, cardFileName, card.cardFaces[0], 'cardFaces[0].');
            }
            if (card.cardFaces[1]) {
                await this.#checkCardImages(set, cardFileName, card.cardFaces[1], 'cardFaces[1].');
            }
            if (card.cardFaces.length > 2) {
                this.#addImageErrorToSet(set, cardFileName, 'card.cardFaces', card, `Odd: card has ${card.cardFaces.length} cardFaces. It's usually just 2.`);
            }
        }
    }

    async #checkCardImage(set, cardFileName, card, propName, url, propPrefix) {
        const propPrefix2 = propPrefix ?? '';

        if (this.#validatedImageCache[url]) {
            this.#dispatchEvent('processing', `File exists in cache (${propPrefix2}${propName}): <a href='${card.src}'>${card.src}</a>`);
            return;
        }

        const fileLoadError = await this.#getFileLoadError(card.src);
        if (fileLoadError) {
            this.#addImageErrorToSet(set, cardFileName, propName, card, fileLoadError, propPrefix2);
        }
        else {
            this.#validatedImageCache[url] = 1; // Cache that the image exists so we don't try to check again later.
            this.#dispatchEvent('processing', `File exists (${propPrefix2}${propName}): <a href='${card.src}'>${card.src}</a>`);
        }
    }

    #updateSetCardCount(set, cardFileName, cardFileCount) {
        set.cardFiles.push({ cardFileName, cardCount: cardFileCount });
    }

    // cardFileName is optional
    #outputCompletionAndErrors(set, cardFileName) {
        // imageErrors data format: { setCode, cardFileName, propName, card, error, propPrefix }

        let imageErrorText, runImageErrors;
        if (cardFileName) {
            const cardFileErrors = set.errors.filter(error => error.cardFileName == cardFileName);
            imageErrorText = cardFileErrors.reduce((acc, err) => { return acc += this.#formatImageErrorText(err); }, '');
            runImageErrors = cardFileErrors.filter(imageError => imageError.cardFileName == cardFileName);
        }
        else {
            imageErrorText = set.errors.reduce((acc, err) => { return acc += this.#formatImageErrorText(err); }, '');
            runImageErrors = set.errors;
        }

        this.#dispatchEvent('processing-complete', { set, runImageErrors, imageErrorText });
    }

    #formatImageErrorText(err) {
        return `${err.setCode}\t${err.cardFileName}\t${err.propPrefix}${err.propName}\t${err.card[err.propName]}\t${err.card.mtgenId ?? err.card.num} - ${err.card.title}\n\t${err.error}\n`;
    }

    #addImageErrorToSet(set, cardFileName, propName, card, error, propPrefix) {
        const err = { setCode: set.code, cardFileName, propName, card, error, propPrefix };
        set.errors.push(err);
        const errLog = `File error (${propPrefix}${propName}): <a href='${card[propName]}'>${card[propName]}</a><br/>&nbsp;&nbsp;&nbsp;${card.mtgenId ?? card.num} - ${card.title}<br/>&nbsp;&nbsp;&nbsp;${error}`;
        this.#dispatchEvent('processing-warning', { set, errText: this.#formatImageErrorText(err), errLog: errLog });
    }

    #dispatchEvent(eventName, msg) {
        if (msg) {
            window.dispatchEvent(new CustomEvent(eventName, { detail: msg }));
        }
        else {
            window.dispatchEvent(new CustomEvent(eventName));
        }
    }

    // Get local json via a proxy, erroring if it fails or if no HTML is retrieved.
    // Will prepend something like this to the start of whatever you pass in: https://localhost:5001/
    async #fetchLocalJson(url) {
        const baseUrl = window.origin;
        const pathUrl = baseUrl + '/' + url;

        try {
            const text = await this.#fetchText(pathUrl);
            const json = JSON.parse(text);
            console.log(`got json from ${pathUrl}`);
            return json;
        }
        catch (error) {
            this.#throwErrorAndStop(`Error retrieving json file '${pathUrl}': ${error.message}`);
        }
    }

    // Does a GET request for a file, bypassing cache.
    // Returns the text contents of the object if the GET was successful or throws an Error if there was something wrong.
    async #fetchText(fullUrl) {
        // Note that this entire approach is custom to the local proxy.
        const proxyUrl = '/proxy?u=' + encodeURIComponent(fullUrl);

        return await fetch(proxyUrl, { cache: "no-store" })
            .then(response => {
                if (response.ok) {
                    return response.text();
                }
                throw Error('Error retrieving file: ' + response.statusText);
            })
            .then(text => {
                if (text.indexOf('Server error') === 0) {
                    throw Error(`Error retrieving file '${fullUrl}': ${text}`);
                }
                return text;
            });
    }

    // Checks if a GET request works and the file exists.
    // Will not download the file.
    // Returns null if the file retrieved sucessfully or the error message if there was something wrong.
    async #getFileLoadError(fullUrl) {
        // Note that this entire approach is custom to the local proxy.
        const proxyUrl = '/proxy?u=' + encodeURIComponent(fullUrl);

        return await fetch(proxyUrl, { cache: "no-store" })
            .then(response => {
                if (response.ok) {
                    return response.text();
                }
                return response.statusText;
            })
            .then(text => {
                if (text.indexOf('Server error') === 0) {
                    return text;
                }
                return null;
            });
    }

}