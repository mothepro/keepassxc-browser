'use strict';

const $ = function(elem) {
    return document.querySelector(elem);
};

const DEFAULT_POPUP_SIZE = '460px';
const PINNED_POPUP_SIZE = '380px';

function updateAvailableResponse(available) {
    if (available) {
        $('#update-available').show();
    }
}

async function initSettings() {
    $('#settings #options-button').addEventListener('click', () => {
        browser.runtime.openOptionsPage().then(close());
    });

    const customLoginFieldsButton = document.body.querySelector('#settings #choose-custom-login-fields-button');
    if (isFirefox()) {
        customLoginFieldsButton.id = 'choose-custom-login-fields-button-moz';
    }

    customLoginFieldsButton.addEventListener('click', async () => {
        await browser.windows.getCurrent();
        const tab = await getCurrentTab();
        await browser.runtime.getBackgroundPage();

        browser.tabs.sendMessage(tab?.id, {
            action: 'choose_credential_fields'
        });
        close();
    });
}

async function initColorTheme() {
    const colorTheme = await browser.runtime.sendMessage({
        action: 'get_color_theme'
    });

    if (colorTheme === undefined || colorTheme === 'system') {
        document.body.removeAttribute('data-color-theme');
    } else {
        document.body.setAttribute('data-color-theme', colorTheme);
    }
}

async function getLoginData() {
    const tab = getCurrentTab();
    if (!tab) {
        return [];
    }

    const logins = await browser.runtime.sendMessage({
        action: 'get_login_list'
    });

    return logins;
}

async function lockDatabase(lockSingle = true) {
    return await browser.runtime.sendMessage({
        action: 'lock_database',
        args: [ lockSingle ]
    });
}

// Show the dropdown button if protocol is supported
async function showDropdownButton(isV2) {
    const isProtocolV2 = isV2 || await browser.runtime.sendMessage({ action: 'is_protocol_v2' });
    if (isProtocolV2) {
        $('.lock-button-area')?.classList.add('btn-group');
        $('#dropdown-button')?.show();
    } else {
        $('.lock-button-area')?.classList.remove('btn-group');
        $('#dropdown-button')?.hide();
    }
}

function hideDropdownButton() {
    $('.lock-button-area')?.classList.remove('btn-group');
    $('#dropdown-button')?.hide();
}

function hideElementsOnDatabaseLock() {
    $('.credentials').hide();
    $('#database-not-opened').show();
    $('#lock-database-button').hide();
    $('#dropdown-button').hide();
    $('#btn-dismiss')?.hide();
    $('#database-error-message').textContent = tr('errorMessageDatabaseNotOpened');
}

// Sets default popup size for Chromium based browsers to prevent flash on popup open
function setDefaultPopupSize() {
    if (!isFirefox()) {
        document.body.style.width = DEFAULT_POPUP_SIZE;
    }
}

// Resizes the popup to the default size if the width is too small
function resizePopup() {
    if (document.body.offsetWidth > 0 && document.body.offsetWidth < 100) {
        document.body.style.width = isFirefox() ? PINNED_POPUP_SIZE : DEFAULT_POPUP_SIZE;
    } else {
        document.body.style.width = DEFAULT_POPUP_SIZE;
    }
}

(async () => {
    if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
        await initSettings();
    } else {
        document.addEventListener('DOMContentLoaded', initSettings);
    }

    document.addEventListener('mouseup', function(e) {
        if (!e.isTrusted) {
            return;
        }

        if (e.target.id !== 'kpxc-dropdown-item') {
            $('.kpxc-dropdown-menu')?.hide();
        }
    });

    updateAvailableResponse(await browser.runtime.sendMessage({
        action: 'update_available_keepassxc'
    }));

    $('#dropdown-button').addEventListener('click', (e) => {
        const dropdownMenu = $('.kpxc-dropdown-menu');
        if (!dropdownMenu) {
            return;
        }

        if (dropdownMenu.style.display === 'none') {
            dropdownMenu.show();
        } else {
            dropdownMenu.hide();
        }

        e.target.blur();
    });

    $('.kpxc-dropdown-item').addEventListener('click', () => {
        $('.kpxc-dropdown-menu')?.hide();
    });
})();
