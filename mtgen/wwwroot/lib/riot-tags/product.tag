<product>
    <section class='options' if={ opts.product.options }>
        <div class='presets'></div>
        <div class='packs'>
            <section id='boosters' if={ opts.product.options }>
                <booster-input each={ presetPack in opts.product.options.presets[0].packs } allPacks={ opts.product.packs } presetPack={ presetPack }></booster-input>
                <div class="booster-input-template" style="display:none">
                    <input id="booster-count-template" min="0" max="99" value="1" type="number"> 
                    <select id="booster-template" data-count-el="booster-count-template"> 
                        <option value="hou-standard">Hour of Devastation: Standard Booster</option> 
                        <option value="akh-standard">Amonkhet: Standard Booster</option> 
                        <option value="hou-prerelease-promo-packins">Hour of Devastation: Prerelease Packins</option> 
                        <option value="hou-prerelease-promos">Hour of Devastation: Prerelease Promos</option> 
                    </select>
                    <button class="remove-input" title="Remove Booster">-</button> 
                </div>
                <button id='add-booster' onclick={ addBooster }>Add Booster</button>
            </section>
            <input id='generate' type='submit' value='Generate my sets!'>
        </div>
    </section>
    <section class='result'></section>

    <script>
        //CAMKILL:
        window.producttagThis = this;

        addBooster(e) {
            console.log(e);
        }
    </script>
</product>