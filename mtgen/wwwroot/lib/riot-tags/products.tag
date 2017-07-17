<products>
    <section id='products' if={ products.length>1 }>
        <a each={ products } if={ isVisible == undefined || isVisible == true } data-product-name={ productName } onclick={ changeProduct }
           href='#' id='show-product-{ productName }' class={ button:true, active: (parent.opts.currentProductName == productName) }>{ productDesc }</a>
    </section>

    <hr />
    <h1>NEW CODE:</h1>
    <section id='product-content'>
        <section each={ product in products } if={ isVisible == undefined ||s isVisible == true } data-product-name={ productName } 
                    class='product-{product.productName} { (parent.opts.currentProductName == product.productName) ? "active" : "" }'>
            <product product={ product } packs={ product.packs }></product>
        </section>
    </section>

    <hr />
    <h1>ORIGINAL CODE:</h1>
    <section id='product-content'>
        <section class='product-hou-all-cards'>
            <section class='options'></section>
            <section class='result'></section>
        </section>
        <section class='product-hou-boosters'>
            <section class='options'></section>
            <section class='result'></section>
        </section>
        <section class='product-hou-prerelease active'>
            <section class='options'>
                <div class='presets'></div>
                <div class='packs'>
                    <section id='boosters'>
                        <div class='booster-input'>
                            <input id='booster-count-template' type='number' min='0' max='99' value='1'>
                            <select id='booster-template' data-count-el='booster-count-template'>
                                <option value='hou-standard'>Hour of Devastation: Standard Booster</option>
                                <option value='akh-standard'>Amonkhet: Standard Booster</option>
                                <option value='hou-prerelease-promo-packins' selected=''>Hour of Devastation: Prerelease Packins</option>
                                <option value='hou-prerelease-promos'>Hour of Devastation: Prerelease Promos</option>
                            </select>
                            <button class='remove-input' title='Remove Booster'>-</button>
                        </div>
                        <div class='booster-input'>
                            <input id='booster-count-2' type='number' min='0' max='99' value='4'>
                            <select id='booster-2' data-count-el='booster-count-2'>
                                <option value='hou-standard' selected=''>Hour of Devastation: Standard Booster</option>
                                <option value='akh-standard'>Amonkhet: Standard Booster</option>
                                <option value='hou-prerelease-promo-packins'>Hour of Devastation: Prerelease Packins</option>
                                <option value='hou-prerelease-promos'>Hour of Devastation: Prerelease Promos</option>
                            </select>
                            <button class='remove-input' title='Remove Booster'>-</button>
                        </div>
                        <div class='booster-input'>
                            <input id='booster-count-3' type='number' min='0' max='99' value='2'>
                            <select id='booster-3' data-count-el='booster-count-3'>
                                <option value='hou-standard'>Hour of Devastation: Standard Booster</option>
                                <option value='akh-standard' selected=''>Amonkhet: Standard Booster</option>
                                <option value='hou-prerelease-promo-packins'>Hour of Devastation: Prerelease Packins</option>
                                <option value='hou-prerelease-promos'>Hour of Devastation: Prerelease Promos</option>
                            </select>
                            <button class='remove-input' title='Remove Booster'>-</button>
                        </div>
                        <div class='booster-input-template' style='display:none'>
                            <input id='booster-count-template' type='number' min='0' max='99' value='1'>
                            <select id='booster-template' data-count-el='booster-count-template'>
                                <option value='hou-standard'>Hour of Devastation: Standard Booster</option>
                                <option value='akh-standard'>Amonkhet: Standard Booster</option>
                                <option value='hou-prerelease-promo-packins'>Hour of Devastation: Prerelease Packins</option>
                                <option value='hou-prerelease-promos'>Hour of Devastation: Prerelease Promos</option>
                            </select>
                            <button class='remove-input' title='Remove Booster'>-</button>
                        </div>
                        <button id='add-booster'>Add Booster</button>
                    </section>
                    <input id='generate' type='submit' value='Generate my sets!'>
                </div>
            </section>
            <section class='result'></section>
        </section>
        <section class='product-hou-promos'>
            <section class='options'></section>s
            <section class='result'></section>
        </section>
    </section>

    <div class='back-to-top'><a class='button top' href='#'>Back to top</a></div>
    <script>
        this.products = Array.from(opts.products.values());

        changeProduct = e => opts.currentProductName = e.target.dataset.productName;

        //CAMKILL:
        window.productstagThis = this;

        this.on('*', function (eventName) {
            console.info(eventName)
        });
    </script>
</products>