<booster-input>
    <div class='booster-input'>
        <input id='booster-count-template' type='number' min='0' max='99' value='{ opts.pack.count }'>
        <select id='booster-template' data-count-el='booster-count-template'>
            <option each={ presetPack in opts.presetPacks } value='{ presetPack.packName }' selected={ presetPack.packName == opts.pack.defaultPackName } >{ presetPack.packDesc }</option>
        </select>
        <button class='remove-input' title='Remove Booster' onclick={ removeBooster }>-</button>
    </div>
    <script>
        //CAMKILL:
        window.boosterInputTagThis = this;

        removeBooster(e) {
            console.log('removeBooster():'); console.log(e);
        }
    </script>
</booster-input>