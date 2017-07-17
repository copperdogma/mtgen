<product>
    <section class='options' if={ opts.product.options }>
        <div class='presets'></div>
        <div class='packs'>
            <section id='boosters' if={ opts.product.options }>
                <div class='booster-input' each={ pack in opts.product.options.presets[0].packs }>
                    <input id='booster-count-template' type='number' min='0' max='99' value='{ pack.count }'>
                    <select id='booster-template' data-count-el='booster-count-template'>
                        <option each={ parent.opts.packs } value='{ packName }' class={ selected: packName == parent.????defaultPackName }>{ packDesc }</option>
                    </select>
                    <button class='remove-input' title='Remove Booster'>-</button>
                </div>
            </section>
            <input id='generate' type='submit' value='Generate my sets!'>
        </div>
    </section>
    <section class='result'></section>

    <script>
        //CAMKILL:
        window.producttagThis = this;
    </script>
</product>